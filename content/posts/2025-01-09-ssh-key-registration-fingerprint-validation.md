---
title: "PublicKey와 PrivateKey의 지문이 다르면 안 되는 이유 — SSH Key 등록 검증 로직"
date: 2025-01-09 20:40:00 +0900
description: "신규 키 생성과 기존 키 등록, 두 방식이 왜 화면 입력값도 유효성 검증도 다르게 짜여야 하는지 정리하고, PublicKey↔PrivateKey 지문 일치 검증과 중복 키 차단 로직을 구현한 기록"
categories: ["일감"]
tags: ["SSH", "Fingerprint", "유효성검증", "React", "보안"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 146
draft: false
---

> **TL;DR** — SSH Key 등록 팝업에는 [신규 키 생성]과 [기존 키 등록] 두 방식이 있는데, 이 둘은 화면 입력값도 검증 시점도 완전히 다르다. 신규 생성은 콤보박스에 허용 알고리즘만 노출해서 애초에 약한 키를 못 고르게 막고, 기존 키 등록은 이미 만들어진 텍스트를 파싱한 다음 PublicKey와 PrivateKey의 지문(Fingerprint)이 일치하는지, 그리고 이미 다른 사람에게 등록된 지문은 아닌지를 사후에 검증해야 했다.

난이도 : ★★★☆☆

1️⃣ `신규 생성 vs 기존 등록` 2️⃣ `Fingerprint 일치 검증` 3️⃣ `중복 키 차단`

### ✅ 요구사항

> 선임 : Key 추가 팝업에 [신규 키 생성]이랑 [기존 키 등록] 라디오 버튼 두 개 넣어야 됨  
> 나 : 둘이 결국 같은 Key 등록 아닌가요? 폼 하나로 될 것 같은데  
> 선임 : 아니야, 신규는 우리가 키를 직접 만들어주는 거고 기존 등록은 이미 밖에서 만들어진 키를 텍스트로 받는 거라 입력값도 검증 순서도 달라  
> 나 : 아... 그럼 활성화되는 필드부터 다르게 짜야겠네요. 검증 케이스도 따로 정리해볼게요

### ✅ 신규 키 생성 vs 기존 키 등록 — 뭐가 다른가

이전 편(수집 스크립트)에서 이미 서버에 떠 있는 키를 파악했다면, 이번엔 반대로 "새 키를 어떻게 화면에서 만들거나 등록할 것인가"였다. 처음엔 폼 하나로 될 줄 알았는데, 실제로 뜯어보니 두 방식은 키가 만들어지는 주체 자체가 달랐다.

| 구분 | 신규 키 생성 | 기존 키 등록 |
|------|------------|------------|
| 생성 위치 | 접근관리 콘솔 내부 Key Generator | 외부에서 이미 생성된 키를 가져옴 |
| 사용자 동작 | 알고리즘·길이 선택 → 시스템이 자동 생성 | PublicKey/PrivateKey 텍스트를 직접 붙여넣기 |
| 검증 시점 | 사전 필터링(선택 단계에서 차단) | 사후 검증(파싱 후 정책 위반 여부 확인) |

이 차이가 화면 입력 항목에도 그대로 나타났다.

<!-- 이미지 제안: [신규 키 생성] vs [기존 키 등록] 라디오 선택에 따라 활성화되는 필드가 달라지는 팝업 화면 비교 -->

- **신규 키 생성 시 활성화**: Key 알고리즘(필수) / Key 길이(필수) / Key passphrase / Key comment / Fingerprint·PublicKey 내용(ReadOnly, 자동)
- **기존 키 등록 시 활성화**: PublicKey/PrivateKey 가져오기 버튼 / PublicKey·PrivateKey 텍스트 영역 / Key 알고리즘·길이·Fingerprint·Comment(ReadOnly, 자동 파싱)

공통적으로 PrivateKey 텍스트 자체는 어느 경우에도 화면에 그대로 노출하지 않도록 막았다 — 등록 직후든 나중에 조회할 때든, 개인키 원문은 화면에 찍히지 않아야 한다는 원칙을 처음부터 정했다.

### ✅ 왜 사전 필터링과 사후 검증으로 나눴나

- **신규 키 생성 — 사전 필터링**: 알고리즘 콤보박스에 애초에 허용된 알고리즘(RSA 2048/3072/4096, ED25519, ECDSA-256)만 노출한다. 사용자가 약한 알고리즘을 선택할 여지 자체가 없다
- **기존 키 등록 — 사후 검증**: 외부에서 이미 만들어진 키 텍스트를 받는 구조라, 선택지를 미리 제한할 수가 없다. 대신 파싱한 다음 정책에 위반되는 알고리즘(DSA 등)이면 저장 자체를 차단한다

두 방식의 근본적인 차이는 "입력을 막을 수 있느냐, 없느냐"였다. 콘솔이 키를 직접 만들어줄 땐 나쁜 선택지를 아예 안 보여주면 되지만, 이미 만들어진 키를 가져오는 경우엔 일단 받아서 뜯어본 다음 판정할 수밖에 없다.

### 🛠️ PublicKey ↔ PrivateKey 지문 일치 검증

기존 키 등록에서 가장 신경 쓴 부분은 PublicKey와 PrivateKey를 둘 다 입력받았을 때, 이 둘이 진짜 짝이 맞는 키 쌍인지 확인하는 로직이었다.

```ts
type KeyValidationResult =
  | { ok: true; fingerprint: string; algorithm: string; bits: number }
  | { ok: false; reason: "FINGERPRINT_MISMATCH" | "DUPLICATE_FINGERPRINT" | "WEAK_ALGORITHM" };

async function validateExistingKeyPair(
  publicKeyText: string | null,
  privateKeyText: string | null,
  registeredFingerprints: Set<string>,
): Promise<KeyValidationResult> {
  // 케이스 B: PrivateKey만 입력된 경우 — 짝이 맞는 PublicKey를 서버가 직접 추출
  if (!publicKeyText && privateKeyText) {
    const derived = parsePrivateKey(privateKeyText);
    return finalizeValidation(derived.fingerprint, derived.algorithm, derived.bits, registeredFingerprints);
  }

  // 케이스 A: PublicKey + PrivateKey 모두 입력된 경우 — 각각 파싱해서 지문 대조
  if (publicKeyText && privateKeyText) {
    const pub = parsePublicKey(publicKeyText);
    const priv = parsePrivateKey(privateKeyText);
    if (pub.fingerprint !== priv.fingerprint) {
      return { ok: false, reason: "FINGERPRINT_MISMATCH" };
    }
    return finalizeValidation(pub.fingerprint, pub.algorithm, pub.bits, registeredFingerprints);
  }

  const pub = parsePublicKey(publicKeyText!);
  return finalizeValidation(pub.fingerprint, pub.algorithm, pub.bits, registeredFingerprints);
}

function finalizeValidation(
  fingerprint: string,
  algorithm: string,
  bits: number,
  registeredFingerprints: Set<string>,
): KeyValidationResult {
  if (isWeakAlgorithm(algorithm, bits)) {
    return { ok: false, reason: "WEAK_ALGORITHM" };
  }
  // 케이스 C: 중복 키 검증 — 이미 다른 사용자에게 등록된 지문이면 차단
  if (registeredFingerprints.has(fingerprint)) {
    return { ok: false, reason: "DUPLICATE_FINGERPRINT" };
  }
  return { ok: true, fingerprint, algorithm, bits };
}
```

- **케이스 A (Public+Private 모두 입력)**: 각각 따로 파싱해서 지문을 뽑아낸 다음 1:1로 비교한다. 지문이 다르면 애초에 짝이 맞지 않는 키 쌍을 등록하려는 것이므로 그 자리에서 막는다
- **케이스 B (Private만 입력)**: 개인키만 있으면 서버가 짝이 맞는 공개키를 직접 추출해서 알고리즘·길이·지문·주석까지 함께 파싱한다. 이 경로는 구조적으로 두 키의 지문이 다를 수가 없다 —애초에 하나의 키에서 파생시켰기 때문이다
- **케이스 C (중복 키 검증)**: 지문이 정상적으로 일치하는 키 쌍이라도, 이미 시스템 어딘가에 다른 사용자 이름으로 매핑된 지문이면 등록을 차단한다. "한 사람이 여러 키를 갖는 것"은 문제가 안 되지만, "같은 키가 다른 사람 이름으로 두 번 등록되는 것"은 나중에 접속 로그를 봐도 누구인지 특정할 수 없게 만들기 때문이다

### ✅ 왜 중복 키 검증이 필요한가

앞선 글에서 다뤘듯 접속 로그에는 지문만 남는다. 만약 같은 지문(=같은 키)이 시스템에 두 번, 서로 다른 사람 이름으로 등록될 수 있다면, 로그에 찍힌 지문만으로는 그 두 사람 중 누가 실제로 접속했는지 다시 구분할 수 없는 문제가 생긴다. "PublicKey:PrivateKey는 항상 1:1로 매핑돼야 한다"는 원칙은 결국 개인 식별 가능성을 지키기 위한 조건이었다.

### ✅ 전체 진행 순서 요약

1. [신규 키 생성] / [기존 키 등록] 라디오에 따라 활성화 필드를 분리
2. 신규 생성 — 알고리즘 콤보박스에 허용 알고리즘만 노출(사전 필터링)
3. 기존 등록 — PublicKey/PrivateKey 텍스트 파싱 후 알고리즘·길이·Fingerprint 자동 추출(사후 검증)
4. PublicKey↔PrivateKey 지문 일치 검증 (케이스 A/B)
5. 중복 지문 등록 차단 (케이스 C)
6. 최초 등록 시 명명 규칙(UnNamed-N) 및 유형(Unknown) 기본값 적용

### ✅ 결과 & 배운 점

| 항목 | 신규 키 생성 | 기존 키 등록 |
|------|------------|------------|
| 약한 알고리즘 처리 | 선택지에서 원천 배제 | 파싱 후 저장 시점에 차단 |
| Fingerprint | 자동 생성 후 ReadOnly 표시 | 입력값 파싱 + 지문 일치 검증 |
| 중복 검사 | 필요 없음(항상 신규 지문) | 필수(외부 키는 이미 등록됐을 수 있음) |

같은 "Key 추가"라는 이름의 기능이라도, 키가 어디서 만들어지느냐에 따라 화면 구조와 검증 순서를 완전히 다르게 짜야 한다는 걸 이번에 확실히 배웠다. 특히 "지문이 유일한 식별자"라는 전제를 세우고 나니, 신규/기존을 나누는 기준도, 중복을 막아야 하는 이유도 전부 하나의 원칙(지문↔사람 매핑이 항상 1:1이어야 한다)으로 설명됐다.

## 참고한 링크

- [OpenSSH — ssh-keygen(1) man page](https://man.openbsd.org/ssh-keygen)
