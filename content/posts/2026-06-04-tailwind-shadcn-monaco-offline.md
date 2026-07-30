---
title: "사내망 대응 프론트엔드 리뉴얼 — Tailwind+shadcn 전환과 Monaco 로컬 번들링"
date: 2026-06-04 21:30:00 +0900
description: "인라인 스타일 범벅이던 사내 자동화 플랫폼 UI를 Tailwind+shadcn으로 전면 리뉴얼하고, 외부 CDN이 막힌 사내망 환경 때문에 Monaco Editor를 로컬 번들로 바꾼 과정"
categories: ["일감"]
tags: ["React", "Tailwind CSS", "shadcn", "Monaco Editor", "Vite", "프론트엔드"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 3
scope: "company"
log: 119
draft: false
---

> **TL;DR** — 업무 자동화(RPA) 플랫폼의 관리 콘솔 UI가 인라인 스타일 범벅으로 방치돼 있던 걸 Tailwind + shadcn 디자인시스템으로 전면 리뉴얼했다. 이 환경은 외부 CDN 접근이 막힌 사내망에서 돌아가야 해서, 기본 설정이면 CDN에서 불러오는 Monaco Editor도 전부 로컬 번들로 바꿔야 했다.

난이도 : ★★★☆☆

1️⃣ `Tailwind + shadcn 전환` 2️⃣ `Monaco 로컬 번들링(사내망 대응)`

### ✅ 요구사항

> 나 : 지금 콘솔 화면 코드 좀 보다가 놀랐다. 버튼 하나하나에 `style={{ ... }}` 인라인 스타일이 박혀 있음  
> 동료 : 나도 알고 있었는데 급하게 기능 붙이다 보니 그렇게 됐다. 이번 기회에 정리 좀 하자  
> 나 : 근데 여기 사내망에서 도는 환경이라 npm CDN이나 외부 폰트 같은 거 그대로 쓰면 안 될 텐데  
> 동료 : 맞음. Monaco 에디터도 지금 CDN 로드 방식 아니냐? 그것부터 확인해봐

이 프로젝트는 회사 내부망에서만 접속되는 관리 콘솔이다. 외부 인터넷이 막힌 장비에서 열리는 화면도 있어서, 빌드 결과물에 CDN 의존이 하나라도 섞이면 그 화면만 깨진다. 리뉴얼을 시작하기 전에 이 제약부터 짚고 넘어가야 했다.

### ✅ 왜 Tailwind + shadcn인가 — Next.js 이전 없이 디자인시스템만 이식

기존 화면은 컴포넌트마다 `style={{ color: 'red', padding: '8px' }}` 식 인라인 스타일이 흩어져 있었다. 공통 버튼 하나 없어서 화면마다 색상·간격이 미묘하게 달랐고, 새 화면을 추가할 때마다 기존 스타일을 복붙해서 가져다 썼다.

- **React + Vite 유지** — Next.js로 옮기는 건 이번 리뉴얼의 목표가 아니었다. 프레임워크는 그대로 두고 스타일링 계층만 교체하기로 함
- **Tailwind CSS v3 도입** — 유틸리티 클래스 기반으로 통일, 디자인 토큰(색상·radius·spacing)은 참고 구현체의 shadcn 토큰을 그대로 이식
- **공통 컴포넌트 분리** — `src/components/ui/`에 `button`, `card`, `badge`, `dialog`, `input`, `label`, `checkbox`, `table` 8종을 shadcn 규격(`cva` 변형 + `cn()` 유틸 + `forwardRef` + named export)으로 새로 작성
- **Radix UI + lucide-react** — 다이얼로그·체크박스 같은 접근성 까다로운 프리미티브는 직접 만들지 않고 Radix에 위임, 아이콘은 lucide-react로 통일
- **기능 100% 보존 원칙** — "표현만 교체, 로직 변경 없음"을 리뉴얼 전체의 기준선으로 못박음. 스타일 리뉴얼 커밋에 동작 변경이 섞이면 회귀 여부를 판단하기 어려워지기 때문

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`cn()` 유틸 하나 도입한 것만으로도 조건부 클래스 조합이 훨씬 깔끔해졌다. 이전에는 `className={active ? 'a b c' : 'a b'}` 식으로 문자열을 직접 조합했는데, 이제는 `cn("a b", active && "c")`로 끝난다.

App.tsx, LocalView.tsx, Editor.tsx, CodeModal.tsx, Toast.tsx 5개 파일을 순서대로 리스타일했고, 빌드는 `tsc -b` + `vite build` 기준 0 에러로 마무리했다.

<!-- 이미지 제안: 인라인 스타일 시절 콘솔 화면과 Tailwind+shadcn 전환 후 화면 Before/After 스크린샷 비교 -->

### ✅ Monaco Editor 로컬 번들링 — CDN 의존 제거

리뉴얼 도중 에디터 컴포넌트를 보다가 진짜 문제를 하나 더 찾았다. `@monaco-editor/react`는 기본 설정으로 쓰면 Monaco 코어 자체를 CDN(jsdelivr)에서 런타임에 내려받는다. 로컬 개발 환경에서는 아무 문제 없이 잘 뜨길래 몰랐는데, 사내망에서 열리는 화면 기준으로 보면 이건 그대로 못 쓰는 구조였다.

```ts
// src/Editor.tsx
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
}

loader.config({ monaco })
```

- `monaco-editor` 패키지를 직접 의존성에 추가하고, Vite의 `?worker` import로 에디터 워커를 번들에 포함
- `self.MonacoEnvironment.getWorker`를 등록해서 브라우저가 워커 스크립트를 어디서 가져올지 명시적으로 지정
- `loader.config({ monaco })`로 `@monaco-editor/react`가 CDN 대신 방금 로컬에서 import한 monaco 인스턴스를 쓰도록 강제

수정량은 파일 하나, 10줄 안팎으로 작았다. 하지만 이 몇 줄이 "로컬에서는 되는데 운영에서는 안 되는" 전형적인 케이스를 막아준 거라서, 코드 양과 별개로 체감 임팩트가 컸다.

### ✅ 코드 에디터 모달 통일 — LOCAL 편집 / SERVERS 읽기전용

Monaco를 로컬 번들로 바꾼 김에, 에디터 UI 자체도 정리했다. 그동안 로컬 스크립트 편집용 모달과 서버 스크립트 조회용 모달이 각각 다른 방식으로 구현돼 있었는데, 이걸 `EditorModal` 하나로 합쳤다.

```ts
interface EditorModalProps {
  content: string;
  mode: "edit" | "readonly"; // LOCAL=edit, SERVERS=readonly
  onSave?: (next: string) => void;
}
```

- LOCAL 뷰에서 열면 편집 가능(`mode="edit"`), 저장 콜백 연결
- SERVERS 뷰에서 열면 읽기전용(`mode="readonly"`)으로 같은 컴포넌트를 재사용
- 기존에 있던 별도 조회 모달은 제거하고 `EditorModal`로 흡수

에디터를 두 벌 유지하지 않게 되면서, Monaco 옵션(테마·폰트·읽기전용 플래그) 변경이 필요할 때 한 곳만 고치면 되는 구조가 됐다.

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 스타일링 | 인라인 style 객체 | Tailwind + shadcn 토큰 |
| 공통 컴포넌트 | 없음 | `components/ui/` 8종 |
| 아이콘 | 개별 SVG/이모지 혼용 | lucide-react 통일 |
| Monaco 로드 | CDN(jsdelivr) 의존 | 전부 번들 내장 |
| 코드 에디터 모달 | LOCAL/SERVERS 개별 구현 | `EditorModal` 하나로 통일 |

로컬 개발 환경은 인터넷이 항상 열려 있으니 CDN 의존성 문제는 웬만해선 눈에 띄지 않는다. 이번에 겪으면서 확실히 배운 건, "배포 대상 환경의 네트워크 제약"은 로컬에서 아무리 테스트해도 재현이 안 된다는 점이다. 라이브러리를 새로 붙일 때 "이 라이브러리가 런타임에 뭘 어디서 받아오는지"까지 확인하는 습관이 이번 일로 생겼다.

## 참고한 링크

- [monaco-editor/react — Loader Config](https://github.com/suren-atoyan/monaco-react#loader-config)
- [Vite — Import with Query Suffixes (Web Workers)](https://vitejs.dev/guide/features.html#web-workers)
- [shadcn/ui — Introduction](https://ui.shadcn.com/docs)
- [Tailwind CSS — Configuration](https://tailwindcss.com/docs/configuration)
