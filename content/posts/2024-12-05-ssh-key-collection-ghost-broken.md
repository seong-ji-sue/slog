---
title: "서버에 떠도는 SSH Key를 전수조사하다 — 수집 스크립트와 Ghost/Broken 판정 로직"
date: 2024-12-05 21:20:00 +0900
description: "authorized_keys를 서버마다 긁어와 지문(Fingerprint) 기준으로 DB 장부와 대조하고, 배포 기록 없이 떠 있는 키(Ghost)와 배포 기록만 남고 사라진 키(Broken)를 자동으로 가려내는 수집 로직을 만든 기록"
categories: ["일감"]
tags: ["SSH", "authorized_keys", "쉘스크립트", "보안", "감사"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 145
draft: false
---

> **TL;DR** — SSH Key 관리 기능의 첫 단추는 "지금 서버에 실제로 어떤 키가 얼마나 떠 있는지" 파악하는 것부터였다. 서버마다 `authorized_keys`를 긁어오는 쉘 스크립트를 짜고, 그 결과를 DB 장부와 지문(Fingerprint) 기준으로 대조해서 "장부엔 없는데 서버엔 있는 키(Ghost)"와 "장부엔 있는데 서버엔 없는 키(Broken)"를 자동으로 가려내는 로직까지 붙였다.

난이도 : ★★★☆☆

1️⃣ `authorized_keys 수집` 2️⃣ `Fingerprint 대조` 3️⃣ `Ghost/Broken 판정`

### ✅ 요구사항

> 팀장 : SSH Key 관리 화면 만들기 전에, 지금 서버에 실제로 어떤 키가 얼마나 있는지부터 알아야 함. 계정 수집이랑 같이 SSH Key도 수집하는 스크립트부터 붙이자  
> 나 : 넵, OS별로 authorized_keys 위치가 다를 텐데 그것도 감안해야겠네요  
> 팀장 : 어, sshd_config 기준으로 잡고. 그리고 수집한 다음엔 DB에 없는 키, DB엔 있는데 서버에서 없어진 키도 구분해서 보여줘야 돼

이 시리즈의 다른 글들이 IAM이나 Vault처럼 "권한·시크릿을 관리하는 화면"을 다뤘다면, 이번 건 시리즈 제목 그대로 "SSH Key" 자체를 다루는 첫 기능이었다. 화면을 만들기 전에 먼저 "지금 뭐가 얼마나 떠 있는지도 모르는 상태"부터 해결해야 했다.

### ✅ 왜 수집부터 해야 했나

접근관리 콘솔이 관리하려는 SSH Key는 이미 여러 서버에 흩어져 있는 상태였다. 화면에서 새 키를 등록하고 배포하는 기능만 만들면, 정작 "이미 서버에 올라가 있는 키"는 화면에 하나도 안 보이는 반쪽짜리 기능이 된다. 그래서 첫 번째로 붙인 기능은 등록도 배포도 아니라, 서버에 이미 있는 키를 있는 그대로 긁어와서 DB 장부와 맞춰보는 수집이었다.

- 계정 수집과 SSH Key 수집을 같은 요청으로 묶되, 이력은 서로 분리해서 관리
- 수집 여부를 선택하게 두지 않고 무조건 진행 — 옵션으로 남겨두면 "수집 안 함"을 고른 서버가 사각지대가 되기 때문
- `authorized_keys` 위치는 표준 경로(`/home/계정/.ssh/authorized_keys`)만 가정하면 안 되고, `/etc/ssh/sshd_config`의 `AuthorizedKeysFile` 값을 기준으로 잡아야 커스텀 경로를 쓰는 서버도 놓치지 않는다

### 🛠️ 수집 스크립트 — 환경 정보와 키 스펙을 나눠서 파싱

수집 스크립트는 크게 두 부분으로 나뉜다. 어떤 서버·계정에 매달려 있는 키인지(환경 정보)와, 그 키 자체가 어떤 알고리즘·강도인지(키 스펙)다.

```bash
#!/bin/bash
SERVER_NAME=$(hostname)
SERVER_IP=$(hostname -I | awk '{print $1}')
TARGET_USERS=("root" $(awk -F: '$3 >= 1000 && $3 < 60000 { print $1 }' /etc/passwd))

echo "Hostname,IP_Address,Account,Key_Type,Key_Fingerprint,Comment"

for USER in "${TARGET_USERS[@]}"; do
  USER_INFO=$(getent passwd "$USER")
  [ -z "$USER_INFO" ] && continue
  HOME_DIR=$(echo "$USER_INFO" | cut -d: -f6)
  AUTH_FILE="$HOME_DIR/.ssh/authorized_keys"

  if sudo test -f "$AUTH_FILE"; then
    sudo cat "$AUTH_FILE" | while read -r line; do
      [[ -z "$line" || "$line" =~ ^# ]] && continue
      INFO=$(echo "$line" | ssh-keygen -lf - 2>/dev/null)
      if [ $? -eq 0 ]; then
        BITS=$(echo "$INFO" | awk '{print $1}')
        FINGERPRINT=$(echo "$INFO" | awk '{print $2}')
        COMMENT=$(echo "$INFO" | awk '{print $3}')
        TYPE=$(echo "$INFO" | awk '{print $4}' | tr -d '()')
        echo "$SERVER_NAME,$SERVER_IP,$USER,$TYPE($BITS),$FINGERPRINT,$COMMENT"
      fi
    done
  fi
done
```

- root와 UID 1000~60000 범위의 일반 계정만 대상으로 삼는다 — 시스템 계정(1000 미만)까지 뒤지면 노이즈가 너무 많아진다
- 공개키 한 줄 한 줄을 `ssh-keygen -lf -`에 그대로 흘려보내면, 비트 수·지문·주석·알고리즘 타입을 한 번에 정형화된 형태로 뽑아준다 — 이 명령어 하나가 사실상 파싱 로직의 8할이다
- 최종 출력은 `Hostname,IP_Address,Account,Key_Type,Key_Fingerprint,Comment` 형식의 CSV 한 줄로, 백엔드가 그대로 파싱할 수 있는 포맷으로 맞췄다

```
app-server-01,192.168.x.x,alice,RSA(2048),SHA256:uk0FPj...,alice@hostname
app-server-01,192.168.x.x,alice,ECDSA(521),SHA256:MPuhq...,alice@hostname
```

이 스크립트는 리눅스 계열(Rocky Linux 9.4, Ubuntu 22.04/24.04, RHEL 8.10/10.1, Debian 13, SLES 16.0)과 AWS EC2 인스턴스까지는 그대로 돌아갔다. Windows 계열(Windows 11, Windows Server 2019)은 `authorized_keys` 개념 자체가 OpenSSH for Windows 기준으로 다르게 동작해서, 별도로 PowerShell 스크립트를 만들어 대응했다.

### ✅ 왜 Fingerprint가 핵심 식별자인가

수집 결과에서 가장 중요하게 다룬 컬럼은 `Key_Fingerprint`였다. SSH 접속 로그에는 어떤 키로 접속했는지 지문(SHA256 해시)만 남는다. 즉 "이 지문 = 이 사람"이라는 매핑을 DB가 갖고 있지 않으면, 로그를 아무리 뒤져도 실제로 누가 접속했는지 추적할 수 없다. 그래서 지문을 단순한 표시용 값이 아니라, 수집된 키를 DB 장부와 대조하는 유일한 기준 키로 삼았다.

### 🛠️ 백엔드 대조 로직 — Ghost와 Broken 판정

수집된 CSV를 백엔드가 받으면, 지문을 기준으로 DB 장부와 대조하는 흐름을 탄다.

```ts
type CollectedKey = {
  hostname: string;
  ipAddress: string;
  account: string;
  fingerprint: string;
  comment: string;
};

type DeployStatus = "정상" | "Ghost" | "Broken";

async function reconcileCollectedKeys(
  collected: CollectedKey[],
  registeredFingerprints: Set<string>,
): Promise<Map<string, DeployStatus>> {
  const statusByFingerprint = new Map<string, DeployStatus>();

  // 1. 수집된 키 중 DB 장부에 없는 지문 = Ghost 후보
  for (const key of collected) {
    const isRegistered = registeredFingerprints.has(key.fingerprint);
    statusByFingerprint.set(key.fingerprint, isRegistered ? "정상" : "Ghost");
  }

  // 2. DB 장부에는 있는데 이번 수집 결과에 없는 지문 = Broken
  const collectedSet = new Set(collected.map((k) => k.fingerprint));
  for (const fingerprint of registeredFingerprints) {
    if (!collectedSet.has(fingerprint)) {
      statusByFingerprint.set(fingerprint, "Broken");
    }
  }

  return statusByFingerprint;
}
```

- **Ghost** — DB 장부에는 등록된 적 없는데 서버 `authorized_keys`에는 떡하니 올라가 있는 키. 누군가 승인 절차를 거치지 않고 직접 서버에 키를 심었다는 뜻이라 경고 대상이다
- **Broken** — DB 장부에는 "배포되어 있어야 한다"고 기록돼 있는데, 실제로 수집해보니 서버 파일에서 사라진 키. 누군가 임의로 회수했거나 파일이 손상됐다는 신호다
- 신규로 발견된 키(Ghost 포함)는 최초 수집 시 `UnNamed-N` 형태의 임시 이름과 `Unknown` 유형으로 DB에 등록해두고, 나중에 담당자가 실제 이름·유형을 정정하도록 남겨뒀다

알고리즘·길이 검증도 같은 파이프라인에 끼워 넣었다 — 수집된 키의 타입·비트 수가 보안 정책에서 허용하지 않는 조합(예: DSA, RSA 1024)이면 상태와 별개로 정책 위반 표시가 따라붙는다.

### ✅ 전체 진행 순서 요약

1. 서버별 계정·authorized_keys 수집 스크립트 작성 (OS별 분기 포함)
2. CSV 포맷으로 서버 환경 정보 + 키 스펙 정보를 함께 출력
3. 백엔드에서 Fingerprint 기준으로 DB 장부와 대조
4. Ghost(장부에 없는데 서버에 있음) / Broken(장부에 있는데 서버에 없음) 판정 로직 구현
5. 신규 발견 키는 UnNamed-N + Unknown 유형으로 임시 등록

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 서버 내 키 현황 | 파악 불가 | 수집 스크립트로 전수 확인 |
| 승인 없이 심어진 키 | 발견 불가 | Ghost로 자동 판정 |
| 회수됐는데 기록만 남은 키 | 발견 불가 | Broken으로 자동 판정 |
| 접속자 추적 | 로그의 지문만으로는 불가 | 지문↔등록 정보 매핑으로 가능 |

화면 하나 만들기 전에 "지금 뭐가 떠 있는지도 모르는 상태"부터 인정하고 수집·대조 로직을 먼저 만든 게 결과적으로 맞는 순서였다. Ghost/Broken이라는 이름을 붙여 놓고 나니, 이후 등록·배포 화면을 설계할 때도 "이 키가 지금 어떤 상태인가"를 판단하는 기준이 이미 갖춰져 있어서 화면 쪽 상태값 설계가 오히려 수월해졌다.

## 참고한 링크

- [OpenSSH — ssh-keygen(1) man page](https://man.openbsd.org/ssh-keygen)
- (사내 기술 조사 노트 — 링크 비공개)
