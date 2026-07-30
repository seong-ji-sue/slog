---
title: "Application·Version 등록관리 — 좌우 분할 레이아웃과 재사용 가능한 개정이력(Revision) 구현기"
date: 2024-10-22 21:00:00 +0900
description: "Application/Version 목록-상세 좌우 패널 구조와, 두 화면이 공유하는 Revision 다이얼로그를 재사용 가능하게 뽑아낸 과정"
categories: ["일감"]
tags: ["React", "레이아웃설계", "폼컴포넌트", "URL상태관리", "컴포넌트재사용"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 99
draft: false
---

> **TL;DR** — Application과 그 하위 Version은 목록·상세를 동시에 보여줘야 해서 좌우 분할(SplitLayout) 구조로 짰다. 여기에 각 리소스의 변경 이력을 보여주는 Revision(개정이력) 다이얼로그가 필요했는데, 두 화면에서 거의 동일한 형태였기 때문에 처음부터 재사용 가능한 컴포넌트로 뽑아 information·version 양쪽에 그대로 꽂았다.

난이도 : ★★★☆☆

1️⃣ `SplitLayout` 2️⃣ `Revision 재사용` 3️⃣ `URL 상태 동기화`

### ✅ 요구사항

> 팀장 : Application 관리 화면은 등록된 애플리케이션 목록이랑, 그 애플리케이션이 갖는 버전(Version) 목록을 같이 봐야 해
> 나 : 목록 보다가 상세 보고, 버전별로 개정이력도 봐야 하는 거면... 화면을 어떻게 나눌지부터 정해야겠네요
> 팀장 : 좌측에 목록, 우측에 상세 폼으로 가면 어때? Version 쪽도 똑같은 구조로

Application 관리는 이 콘솔에서 다루는 리소스 계층 중 가장 아래(Namespace → Entity → Application) 단위다. 리소스 자체는 앞선 화면들과 비슷하게 CRUD로 접근할 수 있었지만, "목록을 보면서 동시에 상세도 봐야 한다"는 요구사항 때문에 레이아웃부터 다르게 잡아야 했다.

### ✅ 좌우 분할 레이아웃 — SplitLayout

Namespace·Entity는 리스트 화면과 다이얼로그가 분리돼 있었는데, Application·Version은 "왼쪽에서 항목을 고르면 오른쪽 폼이 그 항목 내용으로 바뀐다"는 마스터-디테일 패턴이 더 맞았다. 그래서 화면을 좌우로 나누는 `SplitLayout` 컴포넌트를 새로 만들었다.

처음엔 좌/우 2개 영역만 고려했는데, Version 상세 화면에서는 "리스트 - 상세 폼 - 개정이력 패널"까지 3개 영역을 동시에 배치해야 하는 요구사항이 나와서, DOM 요소 2개가 아니라 3개까지 유연하게 처리할 수 있도록 구조를 넓혔다.

```jsx
// SplitLayout.js
function SplitLayout({ panels }) {
  // panels: [{ width, node }, ...] — 2개 또는 3개 모두 지원
  return (
    <div className="split-layout">
      {panels.map((panel, i) => (
        <div key={i} className="split-panel" style={{ flexBasis: panel.width }}>
          {panel.node}
        </div>
      ))}
    </div>
  );
}
```

리스트에서 행을 선택하면 우측 패널이 바뀌는 구조이다 보니, 페이지를 이동했다가 뒤로가기로 돌아왔을 때 이전에 선택했던 행이 유지되지 않으면 사용성이 크게 떨어졌다. 그래서 선택된 행 정보를 컴포넌트 상태가 아니라 URL 쿼리 파라미터에 저장하도록 바꿨다.

```jsx
// useSelectedRow.js
function useSelectedRow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('rowId');

  function selectRow(id) {
    setSearchParams((prev) => {
      prev.set('rowId', id);
      return prev;
    });
  }

  return { selectedId, selectRow };
}
```

이렇게 하면 새로고침이나 뒤로가기를 해도 URL만 보고 선택 상태를 그대로 복원할 수 있고, 링크 공유로 특정 항목의 상세를 바로 열어주는 것도 자연스럽게 됐다.

### ✅ Revision(개정이력) 다이얼로그를 재사용 가능하게

Application과 Version은 둘 다 "변경 이력을 리스트로 보여주고, 특정 시점의 값으로 되돌아볼 수 있어야 한다"는 동일한 요구사항을 갖고 있었다. 처음엔 Application용 Revision 다이얼로그를 먼저 만들었는데, Version 쪽에서도 거의 같은 UI가 필요해지자 "복사해서 Version용으로 하나 더 만들 것인가, 공통 컴포넌트로 뽑을 것인가"를 결정해야 했다.

리소스 타입(Application/Version)에 따라 달라지는 부분은 조회 API와 표시할 필드 목록뿐이었기 때문에, 이 두 가지를 props로 주입받는 형태로 재사용 가능하게 리팩토링했다.

```jsx
// RevisionDialog.js
function RevisionDialog({ resourceType, resourceId, fields, fetchRevisions }) {
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    fetchRevisions(resourceId).then(setRevisions);
  }, [resourceId]);

  return (
    <Dialog title={`${resourceType} 개정이력`}>
      <RevisionTable revisions={revisions} fields={fields} />
    </Dialog>
  );
}

// 사용하는 쪽
<RevisionDialog
  resourceType="Application"
  resourceId={appId}
  fields={applicationFields}
  fetchRevisions={fetchApplicationRevisions}
/>

<RevisionDialog
  resourceType="Version"
  resourceId={versionId}
  fields={versionFields}
  fetchRevisions={fetchVersionRevisions}
/>
```

이후 Version 상세 경로(URL 구조)를 정리하면서 Revision 다이얼로그 호출부만 살짝 바뀌었을 뿐, 다이얼로그 내부 로직은 손대지 않고 그대로 재사용됐다.

### ✅ 폼 모드 전환 시 데이터 유실 방지

좌우 패널 구조에서 자주 나온 버그는 "수정 모드로 폼을 채우다가 좌측에서 새 항목을 선택하거나 생성 모드로 전환하면, 이전에 입력하던 편집 테이블 데이터가 초기화되지 않고 남아있는" 케이스였다. 폼을 생성 모드로 바꾸는 시점에 이전 폼 상태를 명시적으로 리셋하지 않으면, 이전 항목의 값이 새 항목 폼에 잔류하는 문제가 반복적으로 나왔다.

이건 폼 전환 로직에 리셋 호출을 빠뜨린 곳이 있었기 때문이라, 모드가 바뀌는 지점(행 선택 변경, 신규 버튼 클릭)마다 폼 리셋을 명시적으로 호출하도록 정리했고, 특히 "수정 중인데 신규 버튼을 누르면 입력 중이던 내용이 날아간다"는 걸 사용자가 인지할 수 있도록 확인 경고창을 추가했다.

```jsx
function handleNewClick() {
  if (isDirty) {
    const confirmed = window.confirm('작성 중인 내용이 사라집니다. 계속할까요?');
    if (!confirmed) return;
  }
  resetForm();
  setMode('create');
}
```

### ✅ 결과 & 배운 점

- 목록+상세를 동시에 보여줘야 하는 화면은 다이얼로그보다 좌우 분할 레이아웃이 더 맞았고, 2패널로 시작해도 3패널까지 확장 가능하게 여지를 둔 게 Version 상세에서 바로 도움이 됐다
- 선택 상태를 컴포넌트 상태가 아니라 URL에 두면, 새로고침·뒤로가기·링크 공유까지 별도 로직 없이 따라온다
- 리소스 타입만 다르고 구조가 같은 화면은 "차이나는 부분만 props로 주입"하는 방식으로 뽑아두면, 나중에 화면이 하나 더 늘어도(예: 세 번째 리소스 타입) 다이얼로그 자체를 새로 만들 필요가 없다
- 폼 모드 전환 지점은 항상 리셋 로직을 명시적으로 검토해야 한다 — 뒤늦게 발견되는 데이터 잔류 버그의 대부분이 여기서 나왔다

## 참고한 링크

- [React Router — useSearchParams](https://reactrouter.com/en/main/hooks/use-search-params)
