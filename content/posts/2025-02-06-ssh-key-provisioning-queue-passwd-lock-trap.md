---
title: "SSH Key를 배포·회수·갱신하는 방법 — Provisioning 큐와 passwd -l 함정"
date: 2025-02-06 21:10:00 +0900
description: "배포/회수/갱신을 즉시 실행이 아니라 작업 큐(Provisioning)로 처리하도록 만든 이유와, 퇴사자 계정을 passwd -l로만 잠그면 SSH 키 인증이 여전히 뚫려 있다는 걸 알게 된 컴플라이언스 함정을 정리한 기록"
categories: ["일감"]
tags: ["SSH", "Provisioning", "작업큐", "컴플라이언스", "보안"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
log: 147
draft: false
---

> **TL;DR** — Key를 서버에 [배포]·[회수]·[갱신]하는 버튼을 눌렀을 때, 그 자리에서 바로 SSH 접속해서 처리하는 대신 작업 큐(Provisioning)에 적재한 뒤 순차 실행하도록 만들었다. 그리고 이 기능을 만들면서 알게 된 게, 퇴사자 계정을 `passwd -l`로 잠그는 것만으로는 SSH 키 인증이 여전히 뚫려 있다는 사실이었다 — 패스워드 인증과 키 인증은 서로 다른 관문이었다.

난이도 : ★★★☆☆

1️⃣ `Provisioning 작업 큐` 2️⃣ `Authorized_keys Location` 3️⃣ `passwd -l 함정`

### ✅ 요구사항

> 팀장 : Key Pair 화면에 배포·회수·갱신 버튼 붙여야 돼. 근데 이거 클릭하자마자 바로 서버 들어가서 처리하는 방식으로 짜면 안 됨  
> 나 : 버튼 누르면 즉시 반영되는 거 아니었나요?  
> 팀장 : 대상이 수백 대일 수도 있는데 그걸 동기로 처리하면 화면이 멈추잖아. 작업 큐에 쌓아두고 순서대로 처리하는 구조로 가자  
> 나 : 아, 그럼 예약 실행도 자연스럽게 지원되겠네요. 큐 스키마부터 잡아볼게요

이전 두 편에서 "서버에 뭐가 떠 있는지 수집"하고 "새 키를 어떻게 등록할지"를 다뤘다면, 이번엔 그 키를 실제로 서버에 심고 빼내는 실행 단계였다.

### ✅ 왜 즉시 실행이 아니라 작업 큐인가

배포·회수·갱신 버튼을 누르는 순간 바로 SSH로 접속해서 파일을 고치는 방식은 처음엔 단순해 보였다. 하지만 실제 대상은 한 대가 아니라 장비 그룹 단위, 많으면 수백 대였다.

- 버튼 하나로 수백 대를 동기 처리하면 응답이 올 때까지 화면이 멈춰버린다
- 일부 서버가 응답하지 않거나 실패하면, 어디까지 처리됐고 어디부터 실패했는지 추적할 방법이 없다
- "지금 당장"이 아니라 "다음 유지보수 창구에 처리해달라"는 예약 실행 요구도 나중에 들어올 수 있다

그래서 배포·회수·갱신 요청은 실행 결과를 바로 기다리지 않고, 일단 작업 큐에 적재한 다음 백그라운드에서 순차적으로 처리하고 결과를 별도로 기록하는 구조로 잡았다.

```ts
type ProvisioningAction = "배포" | "회수" | "갱신";
type ProvisioningResult = "성공" | "실패" | "진행중" | "대기" | "취소";

interface ProvisioningJob {
  scheduledAt: string; // 작업 예약 일시
  scheduleType: "즉시" | "예약";
  action: ProvisioningAction;
  targetDeviceGroup: string;
  targetDevice: string;
  targetAccount: string;
  keyLocation: string; // Authorized_keys Location
  keyPairName: string;
  result: ProvisioningResult;
  completedAt: string | null;
  requestedBy: string;
}

function enqueueProvisioningJob(job: Omit<ProvisioningJob, "result" | "completedAt">): ProvisioningJob {
  return { ...job, result: "대기", completedAt: null };
}
```

- 작업 큐는 배포/회수/갱신 3종을 같은 스키마로 다루되, `action` 값으로만 실행 로직을 분기한다
- 결과 상태를 성공/실패/진행중/대기/취소 다섯 가지로 나눠서, 화면에서 "지금 이 작업이 어디까지 왔는지"를 항상 조회할 수 있게 했다
- 예약(`scheduleType: "예약"`)을 지원하니, 즉시 실행과 동일한 큐 구조 안에서 "이번 주 유지보수 창구에 회수해달라" 같은 요청도 그대로 얹을 수 있었다

### ✅ Authorized_keys Location — 배포 로봇의 목적지

작업 큐가 실제로 무엇을 하는지 이해하려면, 각 작업이 "어느 경로의 파일"을 건드리는지부터 짚어야 한다.

- **기본 경로**: 일반적인 리눅스 서버라면 `/home/계정ID/.ssh/authorized_keys`가 기본값이다
- **커스텀 경로**: 회사 정책에 따라 `authorized_keys`를 중앙 폴더로 몰아서 관리하는 서버도 있다. 이 경우 `/etc/ssh/sshd_config`의 `AuthorizedKeysFile` 옵션에 지정된 경로(예: `/etc/ssh/KEYS/%u/authorized_keys`, `%u`는 계정 ID로 치환)를 따라간다

이 경로 값이 곧 Provisioning 작업의 실행 목적지가 된다.

| 작업 | 실제 동작 |
|------|----------|
| 배포 | 해당 경로의 파일을 열어서 새 공개키 텍스트를 한 줄 추가 |
| 회수 | 해당 경로의 파일에서 대상자의 공개키 텍스트를 찾아 삭제 |
| 갱신 | 기존 공개키 텍스트를 제거하고 새 공개키 텍스트를 추가 |

> 💡 처음 기획 단계에서는 이 값을 단순히 "Key Location"이라고 불렀는데, 개발하면서 "이게 Key 자체의 위치인지 authorized_keys 파일의 위치인지 헷갈린다"는 이야기가 나와서 이후 논의를 거쳐 "Authorized_keys Location"으로 명칭을 구체화했다. 이름 하나 바꾼 것뿐이지만, 이후 화면·API 필드명을 맞출 때 헷갈림이 확실히 줄었다.

### ✅ passwd -l만으로는 안 되는 이유

작업 큐와 별개로, 회수(퇴사자 처리) 로직을 설계하면서 짚고 넘어가야 했던 문제가 있었다. 계정을 잠글 때 흔히 쓰는 명령어가 이거다.

```bash
passwd -l username
```

이 명령은 패스워드만 잠근다. 그런데 SSH 키 인증은 애초에 패스워드를 확인하는 절차가 아니다 — 계정이 잠겨 있어도 `authorized_keys`에 키가 남아 있으면 그 키로는 여전히 로그인이 된다. 퇴사자 계정을 "잠갔다"고 보고했는데 실제로는 SSH로 계속 들어올 수 있는 상태였던 셈이다.

- 문제의 핵심은 "패스워드 인증 차단"과 "SSH 키 인증 차단"이 서로 다른 관문이라는 점이다
- `passwd -l`은 앞쪽 관문만 잠그고 뒤쪽 관문(키 인증)은 그대로 열어둔다
- 해결책은 계정의 로그인 셸 자체를 막는 것이었다:

```bash
usermod -s /sbin/nologin username
```

셸을 `/sbin/nologin`으로 바꾸면 패스워드든 키든 어떤 인증 수단으로 접속에 성공하더라도 셸이 실행되지 않아 실질적으로 접근이 차단된다. 그래서 회수 작업 큐에 "퇴사자 처리"가 걸리면, `authorized_keys`에서 키를 제거하는 동작과 함께 로그인 셸을 `nologin`으로 바꾸는 동작을 한 세트로 묶어서 처리하도록 설계했다.

- 키만 회수하고 셸은 그대로 두면, 다른 경로로 새 키가 다시 등록될 경우 여전히 접속 가능한 상태가 남는다
- 계정 자체의 로그인 가능 여부를 관리 대상에 포함시켜야 "회수했다"는 말이 실제로 의미가 있어진다

### ✅ 전체 진행 순서 요약

1. 배포/회수/갱신 요청을 즉시 실행하지 않고 작업 큐(Provisioning)에 적재
2. 큐 스키마 설계 — 작업 구분(즉시/예약), 작업 종류(배포/갱신/회수), 결과(성공/실패/진행중/대기/취소)
3. Authorized_keys Location(기본/커스텀 경로) 기준으로 실제 파일 조작 로직 연결
4. 퇴사자 계정 회수 시 `authorized_keys` 삭제 + `usermod -s /sbin/nologin` 세트 처리
5. 배포 상태(정상/Ghost/Broken)와 큐 결과를 연동해 정상화 버튼 노출

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 배포·회수 처리 | 즉시 동기 처리 가정 | 작업 큐 기반 비동기 처리 + 예약 지원 |
| 경로 명칭 | Key Location(모호) | Authorized_keys Location(명확) |
| 퇴사자 계정 차단 | passwd -l만 적용 | passwd -l + nologin 셸 전환 세트 |

"버튼을 누르면 바로 반영된다"는 가정이 규모가 커지는 순간 깨진다는 걸 이번에도 확인했다. 그리고 `passwd -l` 함정은, 겉으로 보이는 상태(계정 잠김)와 실제 접근 가능 여부가 다를 수 있다는 걸 보여준 사례였다 — 보안 기능을 만들 때는 "이 조치가 실제로 모든 인증 경로를 막는가"까지 확인해야 한다는 걸 배웠다. 이렇게 개별 서버마다 배포·회수하는 구조를 갖춰두고 나니, 나중에 SSH CA 서명 방식을 검토할 때 "기존 방식이 정확히 뭘 힘들어했는지"를 비교 기준으로 쓸 수 있었다 — 그 이야기는 이후 편에서 다룬다.

## 참고한 링크

- [OpenSSH sshd_config — AuthorizedKeysFile](https://man.openbsd.org/sshd_config#AuthorizedKeysFile)
- [usermod(8) man page](https://man7.org/linux/man-pages/man8/usermod.8.html)
