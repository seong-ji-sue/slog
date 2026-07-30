---
title: "Next.js standalone 런타임 환경변수 주입 — CSR 페이지 이동에서 치환이 빠지는 이유"
date: 2025-05-13 10:20:00 +0900
description: "sed 치환 자체가 아니라 '어디를 치환해야 하는가'가 진짜 문제였던 이야기 — 모듈 페더레이션 구조에서 서버 파일만 치환하다 벌어진 사고"
categories: ["일감"]
tags: ["Next.js", "standalone", "환경변수", "모듈페더레이션", "CSR", "런타임주입"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 4
scope: "company"
log: 92
draft: false
---

> **TL;DR** — standalone `server.js`만 sed로 치환하던 스크립트는 반쪽짜리였다. 모듈 페더레이션으로 묶인 다른 서브 앱으로 CSR 이동하면 정적 청크에 박힌 placeholder는 그대로 남아있었고, 결국 치환 대상을 `/app` 전체로 넓히고 나서야 완전히 해결됐다.

난이도 : ★★★★☆

1️⃣ `모듈 페더레이션` 2️⃣ `치환 범위` 3️⃣ `CSR 라우팅`

## ✅ 상황

> 사수 : 콘솔 A에서 콘솔 B로 넘어갔다가 다시 A로 돌아오면 API 요청이 이상한 데로 날아간다는데?
> 나 : 아... 그거 %%NEXT_PUBLIC_XXX_URL%% 이 그대로 남아있는 거 아닐까요. 재현되나요?
> 사수 : 응, 재현됨. 근데 처음 들어갔을 땐 멀쩡해.
> 나 : "처음"이랑 "이동 후"가 다르다는 게 힌트네요. 좀 파볼게요.

이전 글(218번)에서 `%%NEXT_PUBLIC_XXX_URL%%` placeholder를 심어두고 `start.sh`에서 sed로 치환하는 구조 자체는 이미 다뤘다. 이번엔 그 sed가 "어디까지" 치환해야 하는지를 놓쳐서 났던 사고를 판다.

## ✅ 재현 조건부터 좁히기

버그가 나는 조건은 명확했다.

- 컨테이너를 처음 띄우고 콘솔 A에 바로 들어가면 정상
- 콘솔 A → 콘솔 B → 콘솔 A로 **클라이언트 사이드 이동(CSR)** 하면 API URL이 문자열 그대로 깨짐
- 브라우저를 새로고침(풀 리로드)하면 다시 정상으로 돌아옴

"새로고침하면 고쳐진다"는 게 핵심 단서였다. 서버가 다시 응답을 만들어내는 경로(SSR)는 멀쩡한데, 브라우저가 이미 받아둔 정적 자산을 그대로 쓰는 경로(CSR)에서만 깨진다는 뜻이었다.

이 프로젝트는 `next.config.js`에 `NextFederationPlugin`을 붙여서 여러 개의 Next.js 앱을 모듈 페더레이션으로 묶어 쓰고 있었다. 콘솔 A에서 콘솔 B의 화면으로 이동할 때는 서버를 다시 거치지 않고, 콘솔 B가 미리 빌드해둔 remote 청크(정적 JS 파일)를 브라우저가 직접 받아서 그린다.

## ✅ 원인 — sed가 server.js만 보고 있었다

기존 `start.sh`는 이랬다.

```bash
# 기존 — server.js 한 파일만 치환
sed -i "s#%%NEXT_PUBLIC_IAM_URL%%#$NEXT_PUBLIC_IAM_URL#g" "$SERVER_JS_SEARCH"
sed -i "s#%%NEXT_PUBLIC_VAULT_URL%%#$NEXT_PUBLIC_VAULT_URL#g" "$SERVER_JS_SEARCH"
```

`publicRuntimeConfig`에 넣어둔 placeholder는 빌드 시점에 `server.js` 안에만 박히는 게 아니었다. 모듈 페더레이션이 노출하는 remote 청크들도 빌드 결과물 트리 안 여기저기에 같은 placeholder 문자열을 들고 있었다. 그런데 sed는 `server.js` 딱 한 파일만 보고 있었으니, 서버가 처음 응답을 만들 때(SSR)는 문제가 없었지만 브라우저가 다른 앱의 청크를 CSR로 직접 받아쓰는 순간 그 청크 안에 남아있던 날것 그대로의 `%%NEXT_PUBLIC_IAM_URL%%` 문자열이 그대로 노출됐다.

"치환 로직 자체는 맞는데 치환 대상이 틀렸다"는 걸 알아채기까지 좀 걸렸다. sed 명령을 아무리 들여다봐도 문법은 멀쩡했기 때문이다.

## ✅ 해결 — 치환 대상을 파일 하나에서 디렉토리 전체로

```bash
# 이후 — placeholder가 남아있는 파일을 전부 찾아서 치환
grep -rl "%%NEXT_PUBLIC_IAM_URL%%" /app | xargs sed -i "s#%%NEXT_PUBLIC_IAM_URL%%#$NEXT_PUBLIC_IAM_URL#g"
grep -rl "%%NEXT_PUBLIC_VAULT_URL%%" /app | xargs sed -i "s#%%NEXT_PUBLIC_VAULT_URL%%#$NEXT_PUBLIC_VAULT_URL#g"
grep -rl "%%NEXT_PUBLIC_FABRIC_URL%%" /app | xargs sed -i "s#%%NEXT_PUBLIC_FABRIC_URL%%#$NEXT_PUBLIC_FABRIC_URL#g"
grep -rl "%%NEXT_PUBLIC_KMS_URL%%" /app | xargs sed -i "s#%%NEXT_PUBLIC_KMS_URL%%#$NEXT_PUBLIC_KMS_URL#g"

exec node "$SERVER_JS_EXT"
```

- 파일 경로를 미리 특정하지 않고 `grep -rl`로 placeholder가 **남아있는 파일을 전부** 찾음
- `xargs sed -i`로 찾은 파일 전부에 치환을 건다
- `echo "[INFO] NEXT_PUBLIC_IAM_URL = $NEXT_PUBLIC_IAM_URL"` 같은 로그도 같이 추가해서, 다음에 같은 증상이 재현되면 컨테이너 로그만 보고도 "환경변수 자체가 비었는지" vs "치환이 안 됐는지"를 바로 구분할 수 있게 해뒀다

## ✅ next.config.js 쪽에도 조건을 하나 더 걸었다

치환 범위를 넓히기 전에, `next.config.js`에도 작은 방어 로직을 추가했다.

```javascript
publicRuntimeConfig: {
  iamUrl: process.env.NEXT_PUBLIC_IAM_URL || '%%NEXT_PUBLIC_IAM_URL%%', // sh 로 런타임 시 값 치환, _app 에서 사용
  vaultUrl: process.env.NEXT_PUBLIC_VAULT_URL || '%%NEXT_PUBLIC_VAULT_URL%%',
  fabricUrl: process.env.NEXT_PUBLIC_FABRIC_URL || '%%NEXT_PUBLIC_FABRIC_URL%%',
  kmsUrl: process.env.NEXT_PUBLIC_KMS_URL || '%%NEXT_PUBLIC_KMS_URL%%',
},
```

로컬 개발 환경처럼 `process.env.NEXT_PUBLIC_XXX_URL`이 빌드 시점에 이미 채워져 있는 경우엔 그 값을 바로 쓰고, 운영 이미지처럼 아직 값이 없는 경우에만 placeholder 문자열로 떨어지게 만드는 조건이다. `start.sh`를 거치지 않고 로컬에서 바로 띄울 때 화면에 `%%...%%` 같은 이상한 문자열이 그대로 찍히는 걸 막기 위한 최소한의 안전장치였다.

## ✅ 결과 & 배운 점

| | 이전 | 이후 |
|---|---|---|
| 치환 대상 | `server.js` 한 파일 | placeholder가 남은 모든 파일(`grep -rl`) |
| CSR 이동 후 | URL 치환 누락 발생 | 정상 |
| 디버깅 단서 | 없음 | 컨테이너 로그에 치환 전 값 출력 |

"sed 치환은 이미 붙여놨는데 왜 안 되지"라는 질문은 사실 "sed가 어디를 보고 있는지"를 먼저 확인했어야 하는 질문이었다. 런타임 치환 방식을 쓸 땐 placeholder를 심는 지점만큼이나, 그 placeholder가 빌드 산출물의 몇 개 파일에 걸쳐 복제되는지를 같이 추적해야 한다는 걸 배웠다. 특히 모듈 페더레이션처럼 여러 앱의 산출물이 서로 뒤섞이는 구조에서는 더더욱 그렇다.

## 참고한 링크

- [Next.js — Runtime Config](https://nextjs.org/docs/pages/api-reference/config/next-config-js/runtime-configuration)
- [Module Federation — nextjs-mf](https://github.com/module-federation/nextjs-mf)
