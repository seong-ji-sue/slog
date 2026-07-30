---
title: "Dockerfile 하나가 1년 동안 어떻게 바뀌었나 — 이미지 빌드 스크립트 진화사"
date: 2025-04-02 09:40:00 +0900
description: "client/server 분리부터 standalone 슬림화까지, 커밋 로그로 되짚어본 Dockerfile 변천사"
categories: ["일감"]
tags: ["Docker", "Dockerfile", "멀티스테이징", "이미지최적화", "빌드스크립트"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
scope: "company"
log: 93
draft: false
---

> **TL;DR** — Dockerfile은 처음부터 멀티스테이징으로 시작했지만, standalone 전환 이후에야 "필요한 파일만 복사한다"는 원칙이 제대로 지켜지기 시작했다. `git log --follow`로 한 파일의 1년 치 역사를 되짚어보니 전환점이 뚜렷하게 보였다.

난이도 : ★★☆☆☆

1️⃣ `멀티스테이징` 2️⃣ `standalone COPY` 3️⃣ `이미지 슬림화`

## ✅ 상황

> 사수 : 지금 Dockerfile이 왜 이렇게 생겼는지 아는 사람이 나밖에 없는 것 같은데, 정리 좀 해줄 수 있나?
> 나 : `git log --follow`로 한번 쭉 훑어볼게요. 파일 하나 역사인데 생각보다 이야기가 많네요.

`docker/client.Dockerfile` 하나의 커밋 로그를 시간순으로 따라가 보니, 이 파일은 "한 번에 완성된" 게 아니라 몇 번의 뚜렷한 전환점을 거치며 지금 모습이 됐다.

## ✅ 전환점 1 — client/server Dockerfile 분리 (멀티스테이징 도입)

처음 `client.Dockerfile`이 별도 파일로 쪼개졌을 때부터 이미 `base → builder → runner` 3단 멀티스테이징 구조였다.

```dockerfile
FROM node:18-alpine AS base

FROM base as builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/client/.next/standalone/packages/client ./packages/client
COPY --from=builder --chown=nextjs:nodejs /app/packages/client/server.mjs ./packages/client/
```

이때도 `standalone` 산출물을 쓰긴 했지만, `node_modules` 전체를 통째로 복사하고 `server.mjs` 커스텀 서버도 같이 들고 가는 구조였다. 멀티스테이징은 도입했지만 "빌더 단계에서 무거운 걸 다 만들고, 러너 단계로 필요한 것만 옮긴다"는 원칙은 아직 절반만 지켜지고 있었다.

## ✅ 전환점 2 — standalone 서버로 교체 (server.mjs 제거)

```diff
- COPY --from=builder --chown=nextjs:nodejs /app/apps/client/server.mjs ./apps/client/
+ COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone/apps/client/server.js ./apps/client/
```

커스텀 서버 파일 대신 standalone이 자동 생성한 `server.js`를 복사하도록 바뀌었다. 이 한 줄이 이후 모든 변화의 시작점이었다 — 커스텀 서버가 없어지면서 HTTPS·환경변수 처리를 코드 밖(Nginx, start.sh)으로 넘겨야 하는 숙제가 같이 딸려왔다.

## ✅ 전환점 3 — 런타임 환경변수 주입용 start.sh 추가

```diff
+ COPY ./apps/client/start.sh ./apps/client/
+ RUN chmod +x /app/apps/client/start.sh

- CMD ["yarn", "run", "run-client"]
+ CMD ["yarn", "workspace", "client", "run", "run"]
```

컨테이너 시작 명령이 `yarn run-client`에서 workspace 단위 실행으로 바뀌고, `start.sh`가 이미지 안에 같이 들어가기 시작했다. sed 치환 로직 자체는 앞선 두 편에서 다뤘으니 여기선 "이 스크립트가 이미지에 어떻게 편입됐는가"만 짚고 넘어간다.

## ✅ 전환점 4 — 불필요한 스테이지·COPY 제거 (이미지 250MB)

가장 크게 손을 댄 변화다. `prod_deps`라는 별도 스테이지를 통째로 없앴다.

```diff
- FROM base AS prod_deps
- ENV NODE_ENV=production
- COPY package.json lerna.json yarn.lock* ./
- ...(각 패키지 package.json 나열)...
- RUN yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline
-
  FROM base AS runner
- COPY --from=prod_deps /app/node_modules ./node_modules
- COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone/apps/client/.next ./apps/client/.next
+ COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone/ ./
  COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/static ./apps/client/.next/static
```

이전엔 "런타임에 필요한 `node_modules`만 따로 골라서 설치하는" 별도 스테이지(`prod_deps`)를 뒀는데, 이 자체가 standalone의 취지와 어긋났다. standalone 산출물(`.next/standalone/`) 안에는 실행에 필요한 `node_modules`가 이미 추려져서 들어있기 때문에, 별도 스테이지를 만들어 두 번 골라내는 건 중복 작업이었다. `prod_deps` 스테이지를 통째로 걷어내고 standalone 폴더를 그대로 복사하는 것만으로 이미지가 250MB까지 줄었다.

## ✅ 전환점 5 — 포트 주입까지 스크립트로 통일

```diff
- COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone/apps/client/server.js ./apps/client/
- COPY ./lerna.json ./
- COPY ./package.json ./
- COPY ./apps/client/package.json ./apps/client/
- COPY ./apps/client/tsconfig.json ./apps/client/

  COPY ./apps/client/start.sh ./apps/client/
  RUN chmod +x /app/apps/client/start.sh
```

`server.js`를 따로 복사하던 줄도 없앴다 — 어차피 `.next/standalone/` 통짜 복사에 이미 포함돼 있었기 때문이다. `lerna.json`, 각 패키지의 `package.json`·`tsconfig.json`처럼 런타임에 실제로는 쓰이지 않는 파일들도 이 시점에 정리됐다. client뿐 아니라 iam·vault·kms·fabric 등 나머지 서비스 Dockerfile에도 같은 패턴을 그대로 복제해서 일관성을 맞췄다.

## ✅ 커밋 순서로 본 전체 흐름

1. client/server Dockerfile 분리 — 멀티스테이징 도입(그러나 복사 대상은 아직 큼)
2. standalone 서버(`server.js`)로 교체, `server.mjs` 제거
3. 런타임 환경변수 주입용 `start.sh` 이미지에 편입
4. 불필요한 `prod_deps` 스테이지 제거 → standalone 산출물 통짜 복사로 단순화(250MB)
5. 남은 불필요 COPY 정리, 여러 패키지에 동일 패턴 확산

## ✅ 결과 & 배운 점

| | 최초 분리 시점 | 최종(이번 정리 시점) |
|---|---|---|
| 스테이지 수 | 2단(builder/runner) | 2단, 단 각 스테이지 역할이 명확해짐 |
| node_modules 처리 | 전체 복사 / 별도 재설치 스테이지 | standalone 산출물에 포함된 것만 사용 |
| 이미지 크기 | 600MB대 | 250MB |

Dockerfile을 고칠 때마다 "뭘 더 넣어야 하나"보다 "뭘 빼도 되나"를 먼저 물어야 한다는 걸 이번에 제대로 배웠다. standalone의 진짜 장점은 빌드 단계가 아니라, 그 산출물을 러너 단계로 옮길 때 얼마나 욕심 안 부리고 그대로 복사하느냐에서 나왔다.

## 참고한 링크

- [Next.js — output 'standalone'](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Docker — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
