---
title: "paramiko의 배신 — native SSH CLI로 전환한 이유"
date: 2026-07-28 21:00:00 +0900
description: "FastAPI 비동기 루프에서 paramiko를 쓰다 겪은 세션 충돌을 여러 차례 땜질하다, 결국 사내 보안 접근제어가 paramiko 자체를 차단한다는 사실을 확인하고 native SSH CLI로 전면 전환한 기록"
categories: ["일감"]
tags: ["SSH", "paramiko", "asyncio", "FastAPI", "RPA", "인프라"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 4
scope: "company"
log: 116
draft: false
---

> **TL;DR** — 업무 자동화(RPA) 플랫폼 백엔드에서 SSH 라이브러리로 paramiko를 쓰다가 "No existing session" 에러를 두 번 땜질했다. 근본 원인은 코드가 아니라 사내 보안 접근제어 솔루션이 paramiko 클라이언트 자체를 차단하고 native ssh/scp만 통과시킨다는 것이었다. 결국 subprocess로 native SSH CLI를 호출하는 모듈을 새로 만들어 paramiko를 완전히 걷어냈다.

난이도 : ★★★★☆

1️⃣ `paramiko vs native SSH` 2️⃣ `run_in_executor` 3️⃣ `보안 접근제어 우회`

### ✅ 요구사항

> 선임 : RPA 스크립트 배포 플랫폼에 서버 상태 확인하는 ping 기능 있잖아 — 가끔 "No existing session" 에러 뜨면서 죽는다는 제보가 왔어  
> 나 : 재현되나요?  
> 선임 : 됨. 근데 재현만 시키지 말고 왜 이런 게 생기는지 원인부터 보자  
> 나 : 넵, 코드부터 보겠습니다

이 플랫폼은 여러 사내 서버에 SSH로 접속해서 자동화 스크립트를 동기화·배포·빌드·실행하는 역할을 한다. FastAPI 백엔드가 SSH 클라이언트로 처음 선택한 건 파이썬 생태계에서 가장 널리 쓰이는 `paramiko`였다. 문제는 이 선택이 두 단계에 걸쳐 무너졌다는 점이다.

### ✅ 1차 충돌 — asyncio 이벤트 루프에서 블로킹 라이브러리를 직접 호출

`ping_server` 엔드포인트 초기 구현은 이랬다.

```python
@router.get("/{server_id}/ping")
async def ping_server(server_id: int, db: AsyncSession = Depends(get_db)):
    ...
    t0 = time.monotonic()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(server.host, port=server.port, username=server.user,
                        password=password, timeout=10)
        return {"ok": True, "latency_ms": int((time.monotonic() - t0) * 1000)}
    finally:
        client.close()
```

`async def` 안에서 `client.connect()`를 그냥 호출하고 있다. paramiko의 `connect()`는 내부적으로 소켓 I/O를 블로킹으로 처리하는데, 이걸 이벤트 루프 안에서 직접 부르면 그 시간 동안 루프 전체가 멈춘다. 다른 요청이 몰릴 때 세션 자원 정리 타이밍이 어긋나면서 "No existing session" 이 터졌다.

1차 수정은 교과서적이었다 — 블로킹 SSH 호출을 스레드풀로 오프로드한다.

```python
loop = asyncio.get_running_loop()

def _do_ping() -> dict:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(server.host, port=server.port, username=server.user,
                        password=password, timeout=10)
        return {"ok": True, "latency_ms": int((time.monotonic() - t0) * 1000)}
    finally:
        client.close()

return await loop.run_in_executor(None, _do_ping)
```

`run_in_executor`로 `_do_ping`을 별도 스레드에서 돌리면 이벤트 루프는 그 사이 다른 요청을 처리할 수 있다. 여기까지는 맞는 방향이었다.

### ✅ 2차 충돌 — 스레드풀 자체에서 paramiko가 부딪힘

그런데 얼마 지나지 않아 같은 계열의 에러가 또 나왔다. 원인은 `run_in_executor`의 기본 스레드풀에서 여러 paramiko 세션이 동시에 뜨면서 내부 상태를 공유하듯 충돌하는 패턴이었다. 이번엔 `run_in_executor` 대신 `threading.Thread`를 직접 띄우고 `asyncio.Queue`로 결과만 받는 패턴으로 바꿨다.

```python
loop = asyncio.get_running_loop()
q: asyncio.Queue = asyncio.Queue()

def _ping_thread() -> None:
    t0 = time.monotonic()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(server.host, port=server.port, username=server.user,
                        password=password, timeout=10,
                        look_for_keys=False, allow_agent=False)
        loop.call_soon_threadsafe(q.put_nowait, {"ok": True, "host": server.host})
    except paramiko.AuthenticationException:
        loop.call_soon_threadsafe(q.put_nowait, {"error": "auth", "msg": "SSH 인증 실패"})
    except Exception as e:
        loop.call_soon_threadsafe(q.put_nowait, {"error": "conn", "msg": str(e)})
    finally:
        client.close()

threading.Thread(target=_ping_thread, daemon=True).start()
res = await q.get()
```

동시에 `look_for_keys=False, allow_agent=False`도 추가했다 — paramiko가 로컬 SSH 에이전트나 기본 키 파일을 뒤지다가 지연·오류가 생기는 걸 막기 위해서였다. 이걸로 스레드풀 충돌은 사라졌다. 하지만 이건 증상 하나를 고친 것이지, "왜 애초에 이 문제가 반복해서 터지는가"에 대한 답은 아니었다.

### ✅ 결정적 발견 — 라이브러리가 아니라 네트워크 정책이 문제였다

배포 대상 서버 중 특정 사내 통합 플랫폼 계열 장비에 SSH로 접속을 시도하는 과정에서, 접속 자체가 원천 차단되는 현상이 확인됐다. 처음엔 방화벽 설정 문제로 의심했는데, 실제로 확인해보니 원인은 따로 있었다.

**해당 장비의 보안 접근제어 솔루션이 paramiko 클라이언트의 SSH 핸드셰이크 패턴을 감지해서 연결 자체를 막고, native OpenSSH(`ssh`/`scp`) 클라이언트로 접속하면 그대로 통과시킨다**는 사실을 실측으로 확인했다. 즉 지금까지 겪은 "No existing session"이나 스레드풀 충돌은 paramiko를 잘못 써서 생긴 버그였지만, 이 장비 앞에서는 애초에 paramiko로는 연결 자체가 성립하지 않는 상황이었던 것이다. 코드를 아무리 고쳐도 이 벽은 못 넘는다.

여기서 아키텍처 결정을 다시 했다. paramiko를 더 안전하게 쓰는 방법을 찾는 대신, **SSH 통신 계층 전체를 subprocess로 native SSH CLI(`ssh`/`scp`)를 호출하는 방식으로 바꾸기로 했다.** 비밀번호 인증은 `sshpass`로 주입한다.

<!-- 이미지 제안: "FastAPI 이벤트 루프 → paramiko(보안 솔루션에 차단됨) vs → subprocess native ssh CLI(통과됨)" 대비를 보여주는 흐름도 -->

```python
# ssh_native.py — paramiko를 완전히 대체하는 신규 모듈
def run(host: str, port: int, user: str, password: str, cmd: str,
        timeout: int = 15,
        jump_host: str | None = None, jump_user: str | None = None,
        jump_password: str | None = None) -> bytes:
    """native ssh CLI로 원격 명령 실행. stdout bytes 반환."""
    args = ["sshpass", "-p", password, "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-o", f"ConnectTimeout={min(timeout, 10)}",
            *_proxy_opts(jump_host, jump_user, jump_password),
            "-p", str(port), f"{user}@{host}", cmd]
    result = subprocess.run(args, capture_output=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f"SSH error [{result.returncode}]")
    return result.stdout
```

`-o StrictHostKeyChecking=no`를 넣은 건 known_hosts에 없는 새 호스트에 처음 접속할 때 뜨는 "계속 연결하시겠습니까(yes/no)?" 대화형 프롬프트를 없애기 위해서다 — 이 프롬프트가 뜬 채로 멈추면 subprocess는 아무 응답도 못 받고 그대로 타임아웃까지 걸리기 때문에, 무인 자동화 경로에서는 필수적인 옵션이었다. 비밀번호 인증을 `sshpass`로 앞단에서 주입하는 것도 같은 이유다 — native `ssh`는 원래 비밀번호를 표준입력으로 대화형으로 받는 구조라, 그 상호작용 자체를 없애야 스크립트가 사람 개입 없이 호출할 수 있었다.

`run`/`read_file`/`write_file`/`mkdir` 네 개 함수로 기존에 paramiko의 `SSHClient`·`SFTPClient`가 하던 일을 그대로 대체했다. 라이브러리를 쓰지 않고 서브프로세스로 CLI를 직접 호출한다는 게 얼핏 덜 세련돼 보일 수 있지만, native CLI는 이미 그 보안 솔루션을 통과한다는 게 실측으로 검증된 유일한 경로였다. "더 우아한 코드"보다 "실제로 뚫리는 경로"가 우선이었다.

블로킹 subprocess 호출은 이전에 정리한 패턴 그대로 `run_in_executor`로 이벤트 루프에서 분리했다.

```python
def do_sync_server(server: Server) -> tuple[int, int]:
    def _run() -> tuple[int, int]:
        folders, file_count = _build_folders(host, port, user, password, server_id,
                                              jump_host, jump_user, jump_password)
        return len(folders), file_count

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _run)
```

subprocess 자체는 blocking이지만, 서브프로세스 실행은 OS 스케줄러가 별도 프로세스로 관리하기 때문에 paramiko 스레드풀에서 겪었던 것 같은 내부 상태 공유 충돌이 애초에 발생하지 않는다.

### ✅ 놓친 경로 — 스케줄러도 여전히 paramiko를 쓰고 있었다

전면 전환 작업을 마쳤다고 생각했는데, 30분 주기로 서버를 자동 동기화하는 스케줄러 경로(`do_sync_server`)가 여전히 `import paramiko`를 하고 있는 게 뒤늦게 발견됐다. API 엔드포인트만 전환하고 백그라운드 스케줄러는 별도 코드 경로라 놓친 것이다.

- `_build_folders`: `paramiko.SSHClient` 인자 대신 `host/port/user/password/jump_*` 시그니처로 변경
- `do_sync_server`: `get_credential`/`get_jump_password` 패턴(API 라우터와 동일하게) 적용 + 점프호스트 자동 지원
- `except: pass` 두 곳을 구체적인 예외(`FileNotFoundError`, `RuntimeError`, `AuthError`) catch + `logger.warning`으로 교체

"paramiko를 없앤다"는 결정 하나를 내려도, 실제로는 진입점마다 개별적으로 적용해야 한다는 걸 다시 확인한 지점이었다. API 라우터, 스케줄러, 파일 뷰어 엔드포인트 — 코드베이스에 SSH를 부르는 곳이 흩어져 있으면 그중 하나는 꼭 빠뜨린다.

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| SSH 클라이언트 | paramiko (Python 라이브러리) | native ssh/scp CLI (subprocess + sshpass) |
| 보안 접근제어 장비 통과 | 차단됨 | 통과 |
| 블로킹 처리 | 이벤트 루프에서 직접 호출 → 부분 수정 반복 | `run_in_executor` 일괄 적용 |
| 점프호스트 | 미지원 | ProxyCommand 옵션 파라미터로 지원 |
| 테스트 | — | 271 passed, 18 xfailed |

paramiko 문제를 두 번 고치는 동안에는 "코드를 더 잘 짜면 해결된다"고 믿었다. 하지만 실제 원인은 라이브러리 품질이 아니라 대상 네트워크의 보안 정책이었다. 라이브러리 선택은 기능 스펙만 보고 정하면 안 되고, 실제로 그 라이브러리가 배포 환경의 네트워크 보안 장비를 통과하는지까지 확인해야 한다는 걸 이번에 체감했다. 그리고 "이 의존성을 제거한다"는 결정을 내리면, 그 의존성을 부르는 진입점을 전수 조사해서 하나도 남기지 않아야 한다는 것도 다시 배웠다.

## 참고한 링크

- [asyncio — Event Loop.run_in_executor](https://docs.python.org/3/library/asyncio-eventloop.html#asyncio.loop.run_in_executor)
- [OpenSSH — ssh_config ProxyCommand](https://man.openbsd.org/ssh_config#ProxyCommand)
- [sshpass — man page](https://linux.die.net/man/1/sshpass)
