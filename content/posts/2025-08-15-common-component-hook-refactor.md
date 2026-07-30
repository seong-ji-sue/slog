---
title: "접근관리 콘솔의 반복되는 Dialog·Table 코드를 공통 컴포넌트·훅으로 뽑아낸 기록"
date: 2025-08-15 22:00:00 +0900
description: "Dialog 버튼 props 공통화, 테이블 기본 cell·헤더 분리, API 상태 처리 커스텀 훅으로 반복 코드를 정리한 Before/After 기록"
categories: ["일감"]
tags: ["리팩토링", "커스텀훅", "공통컴포넌트", "React"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 104
draft: false
---

> **TL;DR** — Dialog 버튼 props, 테이블 기본 cell·헤더, API 호출 상태, 에러 처리 — 화면마다 복붙되던 네 가지를 공통 컴포넌트·커스텀 훅으로 뽑아냈다. 이전 글에서 정리한 "반복되는 버그 패턴"의 실제 처방전이다.

난이도 : ★★★☆☆

1️⃣ `Dialog props 공통화` 2️⃣ `useApiData 훅` 3️⃣ `Error 처리 훅`

### ✅ 상황

> 팀장 : 지난번 유지보수 버그들 보니까 결국 공통화가 안 돼서 생긴 게 많더라. 이번 스프린트는 리팩토링에 집중하자
> 나 : Dialog 버튼이랑 테이블 헤더부터 손볼게요. API 호출 상태 처리하는 훅도 하나 필요해 보여요

앞선 글에서 정리했듯, 접근관리 콘솔의 반복 버그는 대부분 "화면마다 각자 구현"이 원인이었다. 이번 스프린트는 그 처방으로 네 가지를 공통화했다.

### 🛠️ Dialog Layout button props 공통화

**Before**: 화면마다 Dialog 하단 버튼(확인/취소/삭제 등)을 개별 컴포넌트에서 각자 렌더링하고 있었다. 버튼 배치·로딩 상태 처리·비활성 조건이 다이얼로그마다 조금씩 달랐다.

```jsx
// 화면 A
<DialogFooter>
  <Button onClick={onCancel}>취소</Button>
  <Button onClick={onConfirm} disabled={isSaving}>확인</Button>
</DialogFooter>

// 화면 B (거의 같은데 조금 다름)
<div className="dialog-footer">
  <button onClick={onClose}>닫기</button>
  <button onClick={onSubmit} disabled={loading}>저장</button>
</div>
```

**After**: Dialog Layout이 버튼 구성을 props로 받아 공통 렌더링하도록 정리했다.

```jsx
<DialogLayout
  title="애플리케이션 등록"
  buttons={[
    { label: '취소', variant: 'secondary', onClick: onCancel },
    { label: '확인', variant: 'primary', onClick: onConfirm, loading: isSaving },
  ]}
>
  {children}
</DialogLayout>
```

버튼 배치·로딩 스피너·비활성 처리가 `DialogLayout` 내부 로직 하나로 모이면서, 새 다이얼로그를 만들 때 버튼 영역을 매번 새로 짤 필요가 없어졌다. 이전 글에서 봤던 "Dialog 리사이징 시 브라우저 과부하", "브라우저 크기에 따른 Dialog 컨텐츠 벗어남" 같은 이슈들도 결국 Dialog 레이아웃이 화면마다 따로 구현돼서 생긴 문제였는데, 공통 레이아웃으로 모으면서 이런 종류의 버그가 발생할 수 있는 지점 자체가 줄었다.

### 🛠️ 테이블 기본 cell 추가 + resize dialog 공통 header 분리

**Before**: 테이블마다 셀 렌더링(긴 텍스트 처리, 툴팁)과 크기 조정 가능한 다이얼로그의 헤더 영역을 각 화면이 개별 구현하고 있었다.

- 셀 텍스트가 길어지면 행이 늘어나거나, 툴팁이 테이블 밖으로 잘려 보이는 문제가 화면마다 따로 존재
- 크기 조정 가능한 Dialog는 헤더 레이아웃(제목, 닫기 버튼, 리사이즈 핸들)을 화면마다 새로 그림

**After**: 기본 cell 컴포넌트를 테이블 공통 레이어에 추가하고, 리사이즈 가능한 Dialog의 헤더 영역을 별도로 분리했다.

```jsx
// 공통 기본 cell — 텍스트가 길면 자동으로 툴팁 처리
function BaseCell({ value }) {
  return (
    <Tooltip content={value} disabled={!isOverflowing(value)}>
      <span className="cell-text">{value}</span>
    </Tooltip>
  );
}

// 리사이즈 Dialog 공통 header
function ResizableDialogHeader({ title, onClose }) {
  return (
    <div className="resizable-dialog-header">
      <span>{title}</span>
      <CloseButton onClick={onClose} />
    </div>
  );
}
```

목적은 두 가지였다. 하나는 테이블 컬럼에 들어가는 데이터가 길어져도 행이 무너지지 않고 툴팁으로 자연스럽게 보이도록 사용성을 높이는 것, 다른 하나는 공통 영역(헤더)을 하나로 잡아둠으로써 유지보수 지점을 줄이는 것이었다. 실제로 이 작업 이후 "테이블 툴팁이 잘려 보인다"류의 버그 티켓이 눈에 띄게 줄었다.

### 🛠️ default 데이터 호출을 로직화하는 useApiData 훅

**Before**: API를 호출하고 그 결과(`isLoading`, `isError`, `isUnauthorized`, `refetch`)를 컴포넌트마다 개별 state로 관리하고 있었다.

```jsx
function SomePage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch((e) => {
        if (e.status === 401) setIsUnauthorized(true);
        else setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);
  // ... 컴포넌트마다 이 블록이 반복
}
```

**After**: 이 반복 패턴을 `useApiData` 훅 하나로 뽑아냈다.

```jsx
function useApiData(fetcher) {
  const [state, setState] = useState({
    data: null, isLoading: true, isError: false, isUnauthorized: false,
  });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const data = await fetcher();
      setState({ data, isLoading: false, isError: false, isUnauthorized: false });
    } catch (e) {
      setState({
        data: null,
        isLoading: false,
        isError: e.status !== 401,
        isUnauthorized: e.status === 401,
      });
    }
  }, [fetcher]);

  useEffect(() => { refetch(); }, [refetch]);

  return { ...state, refetch };
}

// 사용
function SomePage() {
  const { data, isLoading, isError, isUnauthorized, refetch } = useApiData(fetchData);
}
```

API 호출 상태를 다루는 로직이 훅 하나에 모이면서, 새 화면을 만들 때 로딩·에러·권한 없음 처리를 매번 새로 쓰지 않아도 됐다. 이전 글에서 다룬 "조회 권한이 없을 때 화면에 아무것도 안 뜨고 유효성도 건너뛰는" 문제도, `isUnauthorized`를 훅 레벨에서 일관되게 처리하면서 화면별로 빠뜨릴 여지가 줄었다.

### 🛠️ Error 처리 부분을 hook으로 리팩토링

**Before**: API 호출부마다 에러 메시지 출력과 페이지 이동(예: 인증 만료 시 로그인 페이지로) 처리 로직이 개별적으로 흩어져 있었다.

**After**: 에러 발생 시 "메시지 출력"과 "페이지 이동"을 함께 처리하는 훅으로 분리했다.

```jsx
function useErrorHandler() {
  const router = useRouter();

  return useCallback((error) => {
    if (error.status === 401) {
      toast.error('로그인이 만료되었습니다.');
      router.push('/login');
      return;
    }
    toast.error(error.message ?? '알 수 없는 오류가 발생했습니다.');
  }, [router]);
}
```

에러 하나를 처리하는 방식(메시지 문구, 이동 여부)이 호출부마다 다르면 사용자 경험이 화면마다 미묘하게 달라진다. 이 로직을 훅 하나로 모으면서 "에러가 나면 어떻게 반응하는가"에 대한 기준이 화면 전체에서 하나로 통일됐다.

### ✅ 네 가지 리팩토링을 관통하는 원칙

| 대상 | Before | After |
|------|--------|-------|
| Dialog 버튼 | 화면마다 개별 렌더링 | `buttons` props로 공통 렌더링 |
| 테이블 셀/헤더 | 화면마다 툴팁·헤더 직접 구현 | `BaseCell` / 공통 헤더 컴포넌트 |
| API 호출 상태 | 컴포넌트별 개별 state | `useApiData` 훅 |
| 에러 처리 | 호출부마다 개별 분기 | `useErrorHandler` 훅 |

네 가지 모두 "여러 화면이 똑같은 걸 반복하고 있다"는 게 확인된 다음에 뽑아낸 것이지, 처음부터 예측해서 만든 게 아니다. 이전 글에서 정리한 버그 패턴을 먼저 파악해두지 않았다면, 이번 리팩토링 대상도 감으로 골랐을 가능성이 크다.

#### 🎯 결과 & 배운 점

- 공통화는 "반복이 눈에 보인 다음"에 하는 게 안전하다 — 너무 이르게 추상화하면 오히려 화면마다 다른 요구사항을 억지로 끼워 맞추게 된다
- Dialog·Table처럼 여러 화면이 뼈대를 공유하는 요소는 props 인터페이스를 잘 잡아두면 이후 화면이 늘어나도 비용이 거의 늘지 않는다
- 훅으로 뽑을 때는 "무엇을 반환하는가"보다 "어떤 상황을 하나의 기준으로 처리하고 싶은가"를 먼저 정의하는 게 인터페이스 설계에 도움이 됐다

## 참고한 링크

- (사내 프론트엔드 컨벤션 문서 — 링크 비공개)
