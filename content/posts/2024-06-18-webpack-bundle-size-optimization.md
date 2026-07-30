---
title: "웹팩 번들 사이즈 줄이기 — Module Federation 마이크로 프론트엔드에서 번들러 교체 대신 트리쉐이킹을 택한 이유"
date: 2024-06-18 20:10:00 +0900
description: "Rollup·Esbuild·Vite·Turbopack까지 번들러 교체 가능성을 다 따져봤지만 Module Federation 호환 문제로 막혔고, 결국 Webpack 안에서 Tree Shaking·dayjs 전환·공통 패키지 export 분리로 방향을 튼 기록"
categories: ["일감"]
tags: ["Webpack", "Module Federation", "Tree Shaking", "번들최적화", "Next.js", "dayjs"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 150
draft: false
---

> **TL;DR** — 배포 이미지 사이즈를 줄이려고 다른 번들러(Rollup·Esbuild·Vite·Turbopack)로 갈아타는 걸 먼저 검토했는데, Module Federation을 공식 지원하는 건 Rollup(플러그인)뿐이고 Next.js 자체를 지원하는 건 Turbopack뿐이었다. 결국 SWC+Webpack 조합은 그대로 두고, Webpack이 제공하는 최적화 옵션 안에서 트리쉐이킹 안 되는 moment를 dayjs로 바꾸고 공통 패키지의 export를 쪼개는 쪽으로 방향을 잡았다.

난이도 : ★★★☆☆

1️⃣ `Module Federation 번들러 호환성` 2️⃣ `Tree Shaking` 3️⃣ `공통 패키지 export 분리`

### ✅ 요구사항

> 사수 : 배포 이미지가 너무 커. client, kms, vault 이런 패키지들 번들 사이즈부터 좀 줄여보자
> 나 : 요즘 esbuild나 turbopack이 빠르다던데, 아예 번들러를 바꾸는 건 어떨까요?
> 사수 : 우리는 Module Federation으로 마이크로 프론트엔드 구성돼 있잖아. 그거부터 호환되는지 확인해봐

### ✅ 작업 전 — 사이즈부터 측정

빌드 스크립트 실행 기준으로 쟀다(도커 이미지 빌드 기준 아님). 패키지 5개(`client`·`fabric`·`iam`·`kms`·`vault`) 각각 서버 사이드/클라이언트 사이드 번들을 최적화 전에 먼저 재봤다.

| 패키지 | server side | client side |
|--------|-------------|-------------|
| client | 808.61 KB | 1.96 MB |
| fabric | 5478.61 KB | 34.75 MB |
| iam | 851 KB | 51.18 MB |
| kms | 479.01 KB | 9.46 MB |
| vault | 670.73 KB | 43.93 MB |

### ✅ 번들러 자체를 바꿀 수 있는지부터 확인

Next.js는 Rust 기반 SWC로 트랜스파일하고 Webpack으로 번들링하는 조합이 고정돼 있다. 다른 번들러로 옮기려면 SWC를 안 쓰거나 Webpack을 걷어내고, 번들링된 결과물을 SWC에 다시 넘겨야 하는 구조라 간단히 교체할 수 없다. 그래도 가능성부터 따져봤다.

| | Rollup | Esbuild | Vite | Turbopack |
|---|---|---|---|---|
| Next.js 호환 | x | x | x | o |
| Module Federation 지원 | o (플러그인) | x | x | x |

- **Rollup** — Tree-shaking·ESM에 강점이 있는 라이브러리 번들링 특화 도구. Next.js는 공식 지원 안 하지만, Module Federation은 서드파티 플러그인으로 대체 가능
- **Esbuild** — Go로 작성된 초고속 번들러. `esbuild-loader`로 Webpack 내부의 로더 자리에만 끼워 넣을 수 있고(`yarn add esbuild-loader --dev`), 번들러 자체를 대체하진 못함. Module Federation 미지원
- **Vite** — 개발 서버는 Esbuild, 프로덕션 빌드는 Rollup을 씀. SPA·경량 프로젝트에 적합한 Next.js 대안으로 언급되지만 Next.js와 호환 자체가 안 되고 Module Federation도 지원 안 함
- **Turbopack** — Vercel이 만든 Next.js 차세대 번들러. Webpack 대비 최대 10배 빠른 개발 서버 속도를 내세우지만, 이 작업 시점 기준으로는 아직 초기 단계라 Module Federation을 지원하지 않음 ([관련 discussion](https://github.com/vercel/next.js/discussions/69836))

네 가지 다 Next.js와 Module Federation을 동시에 만족하지 못했다. 번들러를 갈아타는 선택지는 접고, SWC+Webpack 조합 안에서 최적화하는 쪽으로 방향을 정했다.

### ✅ 적용 1 — Tree Shaking과 moment → dayjs 전환

`package.json`에 `sideEffects: false`를 선언해 사용하지 않는 코드가 트리쉐이킹되도록 먼저 열어뒀다.

```json
// package.json
"sideEffects": false
```

그다음 날짜 라이브러리를 바꿨다. `moment`는 약 280KB 번들 크기에 Tree Shaking을 지원하지 않아서 실제로 안 쓰는 코드도 번들에 그대로 포함되고, 객체도 mutable이라 값이 예기치 않게 바뀔 위험이 있었다. `dayjs`는 약 2KB로 Tree Shaking을 지원하고 immutable하게 동작한다.

```javascript
// 변경 전
moment(startDate).toISOString() + '::' + moment(endDate).toISOString(),

// 변경 후
dayjs(startDate).toISOString() + '::' + dayjs(endDate).toISOString(),
```

| | client | fabric | iam | kms | vault |
|---|---|---|---|---|---|
| 최적화 전 (server/client) | 808.61 KB / 1.96 MB | 5478.61 KB / 34.75 MB | 851 KB / 51.18 MB | 479.01 KB / 9.46 MB | 670.73 KB / 43.93 MB |
| Tree Shaking + dayjs 전환 후 (server/client) | 804.25 KB / 1.91 MB | 575.64 KB / 32.75 MB | 848.35 KB / 48.26 MB | 477.75 KB / 8.96 MB | 665.6 KB / 41.44 MB |

`fabric` 패키지에서 특히 큰 폭(34.75 MB → 32.75 MB, server side는 5478.61 KB → 575.64 KB)으로 줄었는데, `moment`가 그만큼 안 쓰는 코드를 많이 물고 있었다는 뜻이다. 다만 부작용도 하나 있었다 — `react-datepicker`를 쓰는 화면에서는 내부적으로 `date-fns`를 의존성으로 물고 있어서, 이게 임의로 같이 설치되는 문제가 남았다.

### ✅ 적용 2 — 공통 패키지(server-common) export 쪼개기

`@console/server-common`은 `client`·`fabric`·`iam`·`kms`·`vault` 다섯 패키지가 공용으로 쓰는 API 모음이다. 그런데 이 패키지가 `controllers`를 `index.js`에서 한 번에 export하는 구조라, 정작 특정 패키지에서는 쓰지도 않는 controller까지 전부 번들링되고 있었다.

**확인한 문제 두 가지**

1. `client`·`fabric`·`iam`·`kms`·`vault` 각각 자기가 쓰지 않는 controller까지 번들에 포함됨 → export를 쪼개고 동적 import를 도입해야 함
2. controller가 `apis`·`convertor`를 가져올 때도 각각의 `index.js`를 통째로 import하고 있어서, 실제로 쓰는 것만 골라 쓰는 게 아니라 전체가 번들링됨 → `index.js`를 거치지 말고 필요한 모듈에 바로 접근해야 함

```javascript
// apis 쪼개기 전
import apis from '../../apis/index.js';
await apis.auth.clients.findAll(...);

// apis 쪼개기 후
import authApis from '../../apis/auth';
await authApis.clients.findAll(...);
```

```javascript
// convertor 쪼개기 전
import convertor from '../../../../utils/convertor/index.js';
res.status(data.status).send(resToListConvertor({ data, func: convertor.read.vault.group }));

// convertor 쪼개기 후
import vaultReadConvertor from '../../../../utils/convertor/read/vault';
res.status(data.status).send(resToListConvertor({ data, func: vaultReadConvertor.group }));
```

controller 쪽은 `exports` 필드를 패키지별 진입점으로 쪼개고, 동적 import로 지연 로딩까지 같이 넣었다.

```javascript
// package.json — 쪼개기 전
"exports": {
  "./controllers": "./src/controllers/index.js"
}

// 쪼개기 전 사용부
import controllers from '@console/server-common/controllers';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    await tokenMiddleware(req, res, controllers.iam.policies.verify);
  }
}
```

```javascript
// package.json — 쪼개기 후
"exports": {
  "./auth-controller": "./src/controllers/auth/index.js",
  "./fabric-controller": "./src/controllers/fabric/index.js",
  "./iam-controller": "./src/controllers/iam/index.js",
  "./kms-controller": "./src/controllers/kms/index.js",
  "./vault-controller": "./src/controllers/vault/index.js",
  "./setting-controller": "./src/controllers/setting/index.js",
  "./searchFilter-controller": "./src/controllers/searchFilter.js"
}

// 쪼개기 후 사용부 — 동적 import로 지연 로딩
export default async function handler(req, res) {
  const { default: iam } = await import('@console/server-common/iam-controller');
  if (req.method === 'POST') {
    await tokenMiddleware(req, res, iam.policies.verify);
  }
}
```

**결과 — kms 기준**

| | client | fabric | iam | kms | vault |
|---|---|---|---|---|---|
| Tree Shaking + dayjs 전환 후 (server/client) | 804.25 KB / 1.91 MB | 575.64 KB / 32.75 MB | 848.35 KB / 48.26 MB | 477.75 KB / 8.96 MB | 665.6 KB / 41.44 MB |
| server-common export 분리 후 (server/client) | 864.29 KB / 1.91 MB | 574.09 KB / 32.75 MB | 826.99 KB / 44.61 MB | 467.56 KB / 8.96 MB | 682.18 KB / 41.44 MB |

`server-common`에서 각 패키지가 실제로 쓰는 controller/api만 import하게 됐으니 방향은 맞는데, 정작 사이즈 변화는 크지 않았다 — `iam` client side가 48.26 MB → 44.61 MB로 줄어든 정도가 가장 컸고 나머지는 거의 그대로였다. `client`처럼 오히려 server side가 소폭 늘어난 패키지도 있었다. export를 쪼개는 작업 자체는 "필요한 것만 가져다 쓰는 구조"를 만드는 데는 의미가 있었지만, 이 시점 기준으로는 체감 사이즈 감소 효과가 기대보다 작았다.

### ❌ 아직 못 끝낸 것 (정직하게 남겨둠)

- `@console/client-common` 중에서 `client` 패키지가 안 쓰는 부분까지 여전히 같이 딸려 옴 — 조사 중
- Next.js는 페이지 단위로 모듈을 관리하는데, 페이지마다 청크가 쪼개지면서 `server-common`·`client-common`을 페이지마다 각자 따로 물고 있는 걸 확인함. 이걸 하나의 공통 청크로 병합하면 사이즈를 더 줄일 수 있을 것 같은데, 아직 적용 전임
- `optimizePackageImports`·`transpilePackages`를 설정은 해뒀는데, 특히 `client-common`에서 안 쓰는 부분을 실제로 걸러내고 있는지는 검증하지 못함

```javascript
// next.config.js
experimental: {
  optimizePackageImports: [
    '@console/client-common',
    '@console/server-common',
    '@console/common',
  ],
},
transpilePackages: [
  '@console/client-common',
  '@console/common',
  '@console/server-common',
],
```

- Module Federation은 Remote·Host 각각의 Webpack 설정에 따라 런타임에 필요한 모듈이 청크로 갈리는 구조라, 공통 부분을 분리·병합해서 사이즈를 줄이는 최적화는 코드 파악부터 다시 해야 함

### ✅ 결과 & 배운 점

- Next.js + Module Federation 조합에서는 번들러 교체가 사실상 막혀 있다는 걸 먼저 확인하고 나서야, "Webpack 안에서 뭘 더 할 수 있나"로 문제를 좁힐 수 있었음
- Tree-shaking이 안 되는 라이브러리(moment)를 걷어내는 작업이 공통 패키지를 잘게 쪼개는 작업보다 체감 효과가 훨씬 컸음 — 손대기 전에 "이 라이브러리가 트리쉐이킹되는가"부터 확인하는 게 우선순위가 높다는 걸 배움
- 공통 패키지 export 분리는 사이즈 감소 폭이 작아도 "각 패키지가 실제로 쓰는 것만 가져온다"는 구조 자체는 옳은 방향이라 유지하기로 했고, 페이지별 청크 병합은 다음 작업으로 넘김

## 참고한 링크

- [Next.js — output 옵션 공식 문서](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Next.js Turbopack과 Module Federation 관련 discussion](https://github.com/vercel/next.js/discussions/69836)
