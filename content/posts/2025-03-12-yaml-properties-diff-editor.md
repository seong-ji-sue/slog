---
title: "웹에서 IntelliJ급 Diff 편집기 만들기 — table 방식을 버리고 flat 비교 알고리즘으로 간 이유"
date: 2025-03-12 22:30:00 +0900
description: "YAML·Properties 설정값을 버전끼리 비교하는 화면을 table 방식으로 먼저 만들었다가, 결국 AST 평탄화 + deep-diff로 갈아엎은 3주간의 알고리즘 교체 기록"
categories: ["일감"]
tags: ["diff알고리즘", "CodeMirror", "YAML", "AST", "React", "커스텀훅"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 5
scope: "company"
log: 100
draft: false
---

> **TL;DR** — 애플리케이션 설정값(YAML/Properties)을 버전끼리 비교하는 화면이 필요했는데, 참고할 만한 오픈소스 라이브러리가 마땅치 않아서 IntelliJ의 diff 뷰어를 참고해 직접 만들었다. 처음엔 테이블 형태로 값을 줄 세워 비교했지만, 자유 형식 텍스트 편집 요구사항이 커지면서 텍스트 에디터(CodeMirror) 기반으로 갈아탔다. 그 안에서도 "줄 단위 위치 비교" 알고리즘이 계층 구조가 있는 YAML에서 계속 오탐을 내서, 결국 "키 경로 기준으로 평탄화한 뒤 객체로 비교하는" 방식으로 다시 한번 갈아엎었다.

난이도 : ★★★★★

1️⃣ `diff 알고리즘 교체` 2️⃣ `AST 평탄화` 3️⃣ `CodeMirror 커스텀 확장`

### ✅ 요구사항

> 팀장 : Application 설정값(YAML, Properties)을 버전별로 비교해서 볼 수 있어야 해. IntelliJ에서 파일 비교하듯이
> 나 : 그런 diff 뷰어를 웹에서 통째로 구현해야 한다는 거죠? 참고할 만한 라이브러리부터 찾아볼게요
> 팀장 : 찾아보고, 없으면 만들어야지 뭐

Application의 설정 정보(properties, yaml)는 버전이 바뀔 때마다 값이 달라지는데, 이 차이를 한눈에 비교하고 필요하면 이전 버전 값으로 되돌릴 수 있어야 한다는 요구사항이었다. 웹에서 쓸 수 있는 diff 뷰어 라이브러리들을 먼저 찾아봤지만 이 화면에 맞게 커스터마이징하기엔 제약이 많았고, 결국 diff 로직부터 하이라이팅까지 직접 구현하기로 했다. 이 시리즈 5편 중 가장 오래 걸리고 가장 많이 갈아엎은 기능이다.

### ✅ 1차 시도 — table 방식

가장 먼저 만든 건 테이블 형태였다. 좌측 컬럼에 현재 버전 값, 우측 컬럼에 이전 버전 값을 나란히 놓고, 행 단위로 `key`를 비교해서 추가(add)/삭제(remove)/변경(modify) 상태를 표시하는 방식이다.

```js
// diff.js — 두 버전 배열을 key 기준으로 병합해 diff 상태를 붙임
const compareDiffType = { add: 'add', remove: 'remove', modify: 'modify' };

export const compareItems = (items) => {
  const currentArray = items.map(({ key, value }) => ({ key, value }));
  const previousArray = items
    .filter(({ beforeKey }) => beforeKey)
    .map(({ beforeKey, beforeValue }) => ({ key: beforeKey, value: beforeValue }));

  const currentMap = new Map(currentArray.map(({ key, value }) => [key, value]));
  const usedKeys = new Set();
  const diffResult = [];

  previousArray.forEach(({ key, value }) => {
    if (currentMap.has(key)) {
      diffResult.push({ key, value: currentMap.get(key), beforeKey: key, beforeValue: value });
      usedKeys.add(key);
    } else {
      diffResult.push({ key: undefined, value: undefined, beforeKey: key, beforeValue: value });
    }
  });

  currentArray.forEach(({ key, value }) => {
    if (!usedKeys.has(key)) {
      diffResult.push({ key, value, beforeKey: undefined, beforeValue: undefined });
    }
  });

  return diffResult.filter(({ key, beforeKey }) => key || beforeKey);
};
```

`add`/`remove`/`modify` 상태가 붙은 각 행에는 "이전 값으로 되돌리기" 버튼(`<<`)을 달았다. 개별 행만 되돌릴 수도, 전체를 한 번에 되돌릴 수도 있게 만들었다.

```jsx
// DiffCell.js — 개별/전체 대치 버튼
const DiffCell = ({ row, allDiff }) => {
  const { setValue, getValues } = useFormContext();
  const formData = getValues().propertyTypeForm;
  const isDiff = row?.original?.isDiff;
  const hasDiff = formData.some((item) => item.isDiff === true);

  const onClickBtn = () => {
    setValue('propertyTypeForm', overwritePreviousValues(formData, row?.index));
  };

  return (
    ((allDiff && hasDiff) || isDiff) && (
      <div className="diff-restore-btn" onClick={onClickBtn}>
        {'<<'}
      </div>
    )
  );
};
```

### ❌ table 방식의 한계

테이블 방식은 "정형화된 key-value 목록"을 비교할 땐 잘 맞았지만, YAML처럼 계층 구조와 자유로운 서식(주석, 들여쓰기, 배열)이 있는 텍스트를 그대로 편집해야 하는 요구사항 앞에서는 무너졌다. 테이블 한 행 = 값 하나로는 YAML의 중첩 구조를 표현할 방법이 없었고, 사용자가 원문 그대로를 보면서 편집하고 싶어했기 때문이다. 그래서 "table 방식 vs 텍스트 에디터(textEdit) 방식"을 실제로 각각 구현해 비교 테스트를 해봤고, 텍스트 에디터 기반으로 완전히 대체하기로 결정했다.

### ✅ 2차 시도 — CodeMirror 기반 textEdit, 그리고 첫 번째 알고리즘

텍스트 에디터는 CodeMirror를 붙이고, 좌우 두 에디터에 각각 현재/이전 버전 텍스트를 띄운 다음 다른 부분을 하이라이트하는 구조로 갔다. 처음 짠 비교 알고리즘은 `diff-match-patch` 라이브러리를 이용한 줄 단위 위치 비교였다 — 좌측 텍스트의 각 줄을 우측에서 찾아 매칭시키고(순서가 바뀌어도 같은 줄로 인식하도록), 매칭되지 않은 줄끼리는 문자 단위로 다시 비교해 어느 부분이 다른지 표시했다.

```js
// 1차 알고리즘 — 줄 단위 매칭 후 문자 단위 diff (요약)
function computeDiffsIgnoringPosition(leftText, rightText) {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const leftMap = new Map(); // line content -> line index[]
  leftLines.forEach((line, i) => {
    if (!leftMap.has(line)) leftMap.set(line, []);
    leftMap.get(line).push(i);
  });

  const leftMatched = new Array(leftLines.length).fill(false);
  const rightMatched = new Array(rightLines.length).fill(false);
  rightLines.forEach((line, j) => {
    const candidates = leftMap.get(line);
    if (!candidates?.length) return;
    const li = candidates.find((i) => !leftMatched[i]);
    if (li !== undefined) {
      leftMatched[li] = true;
      rightMatched[j] = true;
    }
  });
  // 매칭 안 된 줄들만 diff-match-patch로 문자 단위 비교 ...
}
```

### ❌ 첫 번째 알고리즘의 문제 — "줄이 같다"와 "값이 같다"는 다르다

이 방식은 줄 단위로는 잘 작동했지만, YAML/Properties는 "같은 키가 같은 줄에 있는가"가 아니라 "같은 키 경로(path)의 값이 같은가"가 진짜 비교 대상이었다. 예를 들어 들여쓰기가 한 칸 바뀌거나, 형제 키의 순서가 바뀌거나, 값 앞뒤 공백이 달라지기만 해도 줄 문자열 자체는 달라지므로 실제로는 값이 같은데도 diff로 잡히는 오탐이 계속 나왔다. 텍스트를 "줄의 나열"로만 보는 한, 이 구조적인 포맷의 의미 있는 비교는 근본적으로 한계가 있었다.

### ✅ 3차 — flat으로 비교 후 object로 값 대치

그래서 접근 자체를 바꿨다. 텍스트를 줄 단위 문자열로 비교하는 대신, YAML/Properties를 파싱해서 "키 경로 → 값" 형태의 평탄화(flatten)된 객체로 만든 다음, 이 객체 두 개를 구조적으로 비교하는 방식으로 갈아엎었다.

YAML은 AST로 파싱해서 재귀적으로 순회하며 각 노드의 키 경로와 원본 줄 번호를 함께 기록했다.

```js
// AST를 순회하며 { "a.b[0].c": { value, line } } 형태로 평탄화
function flattenAST(node, yamlText, parent = '') {
  if (!node) return {};
  const result = {};
  const getLineNumber = (text, pos) => text.slice(0, pos).split('\n').length;

  if (node.kind === Kind.MAP) {
    node.mappings.forEach((mapping) => {
      if (!mapping.key) return;
      const fullKey = parent ? `${parent}.${mapping.key.value}` : mapping.key.value;
      const line = getLineNumber(yamlText, mapping.key.startPosition);
      result[fullKey] = { value: mapping.value?.value, line };
      if (mapping.value?.kind === Kind.MAP || mapping.value?.kind === Kind.SEQ) {
        Object.assign(result, flattenAST(mapping.value, yamlText, fullKey));
      }
    });
  } else if (node.kind === Kind.SEQ) {
    node.items.forEach((item, i) => {
      const fullKey = `${parent}[${i}]`;
      const line = getLineNumber(yamlText, item.startPosition);
      result[fullKey] = { value: item.value ?? item, line };
      if (item?.kind === Kind.MAP || item?.kind === Kind.SEQ) {
        Object.assign(result, flattenAST(item, yamlText, fullKey));
      }
    });
  }
  return result;
}
```

Properties는 구조가 단순해서 AST 없이 정규식으로 `key=value` 줄만 뽑아 같은 형태로 평탄화했다.

```js
function flattenProperties(text) {
  const result = {};
  text.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) return;
    const eq = line.indexOf('=');
    if (eq === -1) return;
    result[line.slice(0, eq).trim()] = { value: line.slice(eq + 1).trim(), line: index + 1 };
  });
  return result;
}
```

평탄화가 끝나면, 두 버전의 평탄화 객체를 `deep-diff` 라이브러리로 비교해서 어떤 키 경로가 추가/삭제/변경됐는지 뽑아내고, 각 diff 결과에 원본 줄 번호를 다시 매핑해서 CodeMirror 하이라이팅에 넘겼다.

```js
function getYamlDiff(leftText, rightText, type) {
  const [leftFlat, rightFlat] =
    type === propertyTypeOption.yaml.value
      ? [flattenAST(parseYamlAST(leftText), leftText), flattenAST(parseYamlAST(rightText), rightText)]
      : [flattenProperties(leftText), flattenProperties(rightText)];

  const flatDiff = deepDiff.diff(transformObject(leftFlat), transformObject(rightFlat));
  const diffsWithLine = addLineInfoToDiffs(flatDiff, leftFlat, rightFlat);

  return {
    diffs: diffsWithLine,
    leftLineList: [...new Set(diffsWithLine.map((d) => d.leftLine).filter(Boolean))],
    rightLineList: [...new Set(diffsWithLine.map((d) => d.rightLine).filter(Boolean))],
  };
}
```

이 구조로 바꾸면서 "값이 같은데 줄이 다르다"는 이유로 diff로 잡히던 오탐이 사라졌다. 비교 대상이 "줄"이 아니라 "키 경로의 값"이 됐기 때문에, 들여쓰기나 형제 키 순서가 달라져도 실제 값이 같으면 diff에 걸리지 않는다. 대신 하이라이팅은 여전히 줄 단위로 보여줘야 했기 때문에, 평탄화 단계에서 기록해둔 줄 번호를 diff 결과에 다시 매핑하는 단계(`addLineInfoToDiffs`)를 추가로 뒀다 — "비교는 구조로, 표시는 줄로"라는 두 겹 구조다.

### ✅ 리팩토링 — 커스텀 훅으로 관심사 분리

CodeMirror 확장 로직(하이라이팅, 클릭 가능한 화살표 위젯, 값 대치)까지 전부 한 컴포넌트 파일에 몰려 있다 보니 코드가 급격히 불어났다. 이 로직을 `useExtensionDiff`라는 커스텀 훅으로 분리해서, 컴포넌트는 훅이 반환하는 diff 결과와 확장(extension) 목록만 CodeMirror에 꽂도록 정리했다. 알고리즘이 두 번 바뀌는 동안에도 훅의 반환 형태(`{ diffs, extensions }`)는 그대로 유지했기 때문에, 사용하는 쪽 컴포넌트는 거의 수정 없이 내부 알고리즘 교체를 흡수할 수 있었다 — 이번 작업에서 가장 잘한 결정 중 하나였다.

### ✅ 그 외 — 버전 선택 콤보박스 페이징

비교할 두 버전(현재/이전)을 고르는 콤보박스는 애플리케이션 버전 이력이 쌓일수록 목록이 길어졌다. 전체 버전을 한 번에 불러오는 대신, 콤보박스에도 페이징을 적용해서 스크롤/페이지 단위로만 목록을 불러오도록 했다 — diff 알고리즘과 별개로, 버전이 누적될수록 필연적으로 마주치는 문제였다.

### ✅ 결과 & 배운 점

- 웹에 diff 뷰어를 직접 짤 때는 "무엇을 비교 단위로 볼 것인가"가 알고리즘의 8할이다. 줄 단위 비교는 순수 텍스트에는 맞지만, 구조가 있는 포맷(YAML)에는 결국 키 경로 기준 비교가 필요했다
- table 방식에서 만든 "개별/전체 값 대치" UX(`<<` 버튼)는 알고리즘을 두 번 갈아엎는 동안에도 그대로 살아남았다 — 알고리즘과 UX를 분리해서 설계해둔 덕
- 커스텀 훅으로 로직을 분리해두면, 내부 알고리즘이 통째로 바뀌어도 반환 형태만 유지하면 상위 컴포넌트는 영향을 안 받는다는 걸 이번에 제대로 체감했다
- 접근 방식을 처음부터 실제로 두 가지 다 구현해서 비교 테스트를 해본 것도 중요했다 — 문서나 감으로 판단했으면 table 방식을 더 오래 붙들고 있었을 것 같다

## 참고한 링크

- [deep-diff — GitHub](https://github.com/flitbit/diff)
- [CodeMirror 6 — Decorations](https://codemirror.net/docs/ref/#view.Decoration)
