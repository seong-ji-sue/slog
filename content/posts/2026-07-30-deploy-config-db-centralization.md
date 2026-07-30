---
title: "배포 설정을 코드가 아니라 DB로 — config 중앙관리 전환"
date: 2026-07-30 21:00:00 +0900
description: "배포 버전 마커를 파일에서 config.ini 섹션으로 옮긴 작은 개선을 시작으로, 서버별 배포 설정 전체를 파일+환경델타 병합 방식에서 DB 중앙관리로 전환하며 겪은 인코딩·CRLF 트러블슈팅 기록"
categories: ["일감"]
tags: ["Alembic", "DB마이그레이션", "배포자동화", "config", "FastAPI"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 3
scope: "company"
log: 118
draft: false
---

> **TL;DR** — 배포 버전 마커를 별도 VERSION 파일에서 config.ini의 [Deploy] 섹션으로 옮긴 작은 개선을 시작으로, 서버별 배포 설정(ID/비밀번호/경로 등) 전체를 로컬 파일+환경델타 병합 방식에서 DB 중앙관리로 전환했다. 그 과정에서 실제 오배포의 원인이었던 .env 백슬래시 소실 버그를 찾아 고쳤다.

난이도 : ★★★☆☆

1️⃣ `config.ini DB 중앙관리` 2️⃣ `라운드트립 검증` 3️⃣ `CRLF·인코딩 가드`

### ✅ 요구사항

> 선임 : 서버마다 앱 설정 파일(config.ini)이 다 다른데, 이거 로컬 파일로 관리하다 보니 서버 수 늘어날수록 관리가 안 되네  
> 나 : 지금은 공통 config.ini에 서버별 환경 델타 파일(config_aws.ini 같은)을 병합하는 방식으로 버티고 있는데, 이걸 DB로 옮기는 게 낫겠습니다  
> 선임 : 대신 기존 배포 동작이 하나도 안 깨져야 돼

RPA 플랫폼은 서버마다 접속 계정, 실행 파일 경로, DB 접속 정보 같은 값이 담긴 `config.ini`를 배포 시 함께 올린다. 서버 수가 적을 땐 로컬 파일 + 환경별 델타 파일(`config_<env>.ini`) 병합으로 충분했지만, 서버가 늘어나면서 "이 서버의 이 값이 지금 뭔지"를 파일 여러 개를 열어봐야 확인할 수 있는 구조가 됐다.

### ✅ 작은 시작 — 배포 버전 마커를 파일에서 config.ini 섹션으로

전체 전환에 앞서, 먼저 손댄 건 배포 버전 표기 방식이었다. 기존엔 배포할 때마다 원격 서버에 `VERSION`이라는 별도 파일을 새로 써서 버전 문자열을 남겼다. 이걸 없애고, 어차피 함께 올라가는 `config.ini` 안에 `[Deploy]` 섹션으로 흡수시켰다.

여기서 선택한 방식이 흥미롭다 — `configparser`로 파싱했다가 다시 쓰는 라운드트립을 쓰지 않고, **정규식으로 텍스트를 직접 조작**했다.

```python
def inject_deploy_version(text: str, version: str) -> str:
    """configparser 라운드트립을 쓰지 않고 문자열 그대로 다뤄, 기존 내용/주석/
    순서를 절대 재배열하거나 손실하지 않는다."""
    section_header_re = re.compile(r"(?im)^\[Deploy\][ \t]*\r?\n")
    match = section_header_re.search(text)
    if match is None:
        return text + f"\n[Deploy]\nVersion={version}\n"
    # 기존 섹션이 있으면 Version= 라인만 교체, 없으면 섹션 끝에 추가
    ...
```

`configparser`를 썼다면 더 짧게 짤 수 있었겠지만, 그러면 기존 config.ini의 주석이나 키 순서가 재배열되거나 사라질 위험이 있다. AutoIt 스크립트가 `IniRead`로 이 파일을 그대로 읽기 때문에, 사람이 손으로 편집한 원본 포맷을 조금이라도 건드리면 안 됐다. 그래서 "덜 우아하지만 원본을 절대 건드리지 않는" 문자열 조작 쪽을 택했다.

### ✅ 리뷰 지적 — 부분 배포·CRLF·인코딩

이 작은 함수 하나에도 코드리뷰에서 세 가지가 지적됐고, 하나씩 고쳤다.

1. **부분 배포 시 config.ini 누락**: 배포할 파일을 선택해서 올릴 때 `config.ini`를 목록에 넣지 않으면 버전 마커 자체가 안 남는 문제. 로컬 폴더에 `config.ini`가 있으면 선택 목록에 없어도 자동으로 포함시키도록 수정 — "버전 마커는 항상 갱신되어야 한다"는 기존 VERSION 파일 시절의 규칙을 그대로 이어받았다.
2. **CRLF/LF 혼용**: 원본이 CRLF(`\r\n`)로 되어 있는데 새로 추가하는 줄을 LF로 넣으면 한 파일 안에 개행 문자가 섞인다. 원본의 지배적 개행 스타일을 감지해서 맞추도록 `_detect_eol()`을 추가했다.
3. **인코딩 실패의 부분 배포**: `config.ini`가 UTF-8이 아니면 디코드 자체가 실패하는데, 이걸 SSH 업로드 도중에 만나면 "다른 파일은 이미 올라갔는데 config.ini만 실패"하는 반쪽짜리 배포가 생긴다. 그래서 SSH 작업에 들어가기 전에 미리 디코드를 시도해서, 실패하면 원격에 아무것도 쓰지 않고 즉시 400을 반환하도록 순서를 바꿨다.

```python
try:
    config_ini_data = inject_deploy_version(
        config_ini_path.read_bytes().decode("utf-8"), version
    ).encode("utf-8")
except UnicodeDecodeError:
    raise HTTPException(400, "config.ini 인코딩 오류(utf-8 아님)")
# 여기서 실패하면 SSH 작업 자체가 시작되지 않는다
```

셋 다 기능 하나 자체는 작지만, 실제 운영에서 자주 터지는 지점이라는 공통점이 있다. 배포 자동화는 "정상 케이스"보다 이런 경계 조건에서 더 많이 무너진다.

### ✅ 큰 전환 — 파일 병합에서 DB 중앙관리로

버전 마커 정리가 끝난 뒤, 본격적으로 config.ini 자체를 DB로 옮기는 작업에 들어갔다. 먼저 데이터 계층을 설계했다.

- `servers.env_tag`: 배포 환경 식별자(예: 사내랩/AWS)
- `app_targets`: (서버 × 앱) 조합마다 1행. 자주 쓰는 값(로그인 ID/비밀번호/URL, 실행파일 경로, DB 호스트/포트)은 canonical 컬럼으로 정규화
- `app_target_props`: canonical 컬럼에 담기지 않는 나머지 모든 섹션/키를 `section/key/value`로 원문 그대로 보존

<!-- 이미지 제안: servers/app_targets/app_target_props 3개 테이블 관계와 canonical 컬럼 vs 원문 보존 구조를 보여주는 ERD -->

canonical과 원문 보존을 분리한 이유는 AutoIt의 `IniRead`가 키 대소문자에 민감하기 때문이다. DB에 넣는다고 값을 정규화(소문자 변환 등)해버리면 스크립트가 그 키를 못 읽는다. 그래서 자주 쓰는 값만 타입 있는 컬럼으로 뽑고, 나머지는 손대지 않고 그대로 저장하는 구조를 택했다.

흥미로운 발견도 하나 있었다 — 이 작업을 하면서 보니 기존 Alembic 리비전 파일(0001~0010)이 저장소에 있긴 했는데, `alembic.ini`와 `env.py`가 없어서 **한 번도 실제로 실행된 적이 없는 문서용 파일**이었다. 이번에 스캐폴딩을 제대로 갖춰서 실제 `alembic upgrade head`가 동작하게 만들었다.

### ✅ 마이그레이션 검증 — 라운드트립 20/20

DB에서 config.ini 텍스트를 생성하는 `config_generate_service`와, 공통 파일 + 환경 델타를 병합하는 `config_merge_service`를 만든 뒤, 기존에 파일로 관리되던 config를 전량 DB로 이관하는 스크립트(`seed_app_targets`)를 돌렸다. 그리고 이관이 끝난 뒤 **DB에서 다시 생성한 config.ini가 기존 파일과 의미상 동일한지**(`semantic_diff`)를 검증했다 — 대상 환경 두 종류(사내랩 11개 앱, AWS 8개 앱) 전부 20/20 일치를 확인하고서야 전환을 마무리했다.

`configparser`를 다룰 때도 두 가지를 명시했다.

```python
configparser.ConfigParser(interpolation=None, optionxform=str)
```

`interpolation=None`은 config 값에 `%` 문자가 들어있어도(비밀번호에 흔함) 보간 문법으로 오해하지 않게 하고, `optionxform=str`은 키 대소문자를 그대로 보존한다 — 둘 다 기본값으로 두면 배포 후 스크립트가 값을 못 읽는 조용한 실패로 이어질 수 있는 지점이었다.

### ✅ 트러블슈팅 — .env 백슬래시가 사라지는 버그

이 작업 도중 실제 오배포의 원인이었던 버그 하나를 발견했다. 배포 대상 경로(`APPSCRIPT_ROOT`)는 `.env`에 `C:\TargetSuite\Plugin\AppScript` 같은 윈도우 경로로 저장돼 있는데, 이 값이 실행 중에는 백슬래시가 통째로 사라진 `C:TargetSuitePluginAppScript` 형태로 로드되는 경우가 있었다.

원인은 `.env` 파일을 bash에서 `source`로 로드할 때, 따옴표 없이 값을 읽으면 `\H`, `\P` 같은 시퀀스를 이스케이프로 해석해서 백슬래시를 삼켜버리기 때문이었다. 코드 버그가 아니라 셸 로딩 방식 자체의 함정이었던 셈이다. 두 가지 가드를 추가했다.

```python
def _is_backslash_stripped(file_v: str, env_v: str) -> bool:
    """os.environ 값이 .env 파일값에서 백슬래시만 사라진 형태인지 판별."""
    return "\\" in file_v and env_v != file_v and env_v == file_v.replace("\\", "")

def _assert_appscript_root_sane(value: str) -> None:
    """APPSCRIPT_ROOT 가 드라이브 경로 형태인데 백슬래시가 없으면
    기동 시점에 즉시 실패시킨다 — 조용히 넘어가지 않는다."""
    if len(value) >= 2 and value[1] == ":" and "\\" not in value:
        raise RuntimeError(f"APPSCRIPT_ROOT 경로 손상 감지: {value!r}")
```

첫 번째는 이미 손상된 값이 환경변수에 남아있어도 `.env` 파일값으로 교정하는 방어, 두 번째는 기동 시점에 아예 값이 이상하면 바로 실패시켜서 "배포 대상 경로가 조용히 잘못 찍히는" 상황 자체를 차단하는 가드다. 조용한 실패보다 시끄러운 실패가 낫다는 원칙을 여기서도 그대로 적용했다.

덧붙여 `_meta.json`에 배포 이력을 기록할 때 키를 서버 `id`(숫자)에서 `host`(문자열)로 바꿨다. 서버를 삭제했다가 재등록하면 id는 바뀌지만 host는 그대로이기 때문에, id를 키로 쓰면 배포 이력이 끊기고 실제로 어느 서버에 배포됐는지도 헷갈리는 문제가 있었다.

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 배포 버전 마커 | 별도 VERSION 파일 | config.ini `[Deploy]` 섹션 |
| 설정 관리 | 로컬 파일 + 환경델타 병합 | DB 중앙관리(app_targets/app_target_props) |
| Alembic | 리비전 파일만 존재, 실행 불가 | 실제 실행 가능한 스캐폴딩 완비 |
| 이관 검증 | — | semantic_diff 라운드트립 20/20 |
| 배포 이력 키 | server_id(숫자) | host(문자열) |
| `.env` 경로 손상 | 조용히 오배포로 이어짐 | 기동 시점 즉시 실패(RuntimeError) |

설정을 파일에서 DB로 옮기면 "어디에 무슨 값이 있는지"는 확실히 찾기 쉬워진다. 하지만 그 이관 과정에서 기존 동작을 그대로 보존했다는 걸 증명하는 검증(라운드트립 비교) 없이 넘어갔다면, 오히려 배포 사고를 늘리는 전환이 됐을 것이다. 그리고 `.env` 백슬래시 버그처럼, 겉보기엔 사소한 인코딩·이스케이프 문제가 실제 오배포의 근본 원인이 되는 경우가 인프라 자동화에서는 생각보다 자주 있다는 걸 다시 확인했다.

## 참고한 링크

- [Python configparser — interpolation / optionxform](https://docs.python.org/3/library/configparser.html)
- [Alembic — Auto Generating Migrations](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
