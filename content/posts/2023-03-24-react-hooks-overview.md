---
title: "React Hook 종류와 쓰는 방법 — useState부터 커스텀 훅까지"
date: 2023-03-24 21:35:00 +0900
description: "useState, useEffect, useRef, useContext, useMemo, useCallback, useReducer, memo, 커스텀 훅까지 각각 어떤 상황에 쓰는지 코드로 정리"
categories: ["딥다이브"]
tags: ["React", "React Hooks", "useState", "useEffect", "useMemo", "useCallback", "useContext", "useRef", "useReducer"]
series: "React 파고들기"
difficulty: 2
log: 66
slug: "react-hooks-overview"
source: https://zibu-story.tistory.com/203
draft: false
---

> **TL;DR** — React Hook은 각자 담당하는 문제가 다르다. `useState`는 값 변경에 따른 렌더링, `useEffect`는 생명주기, `useRef`는 렌더링과 무관한 값 저장, `useMemo`/`useCallback`은 캐싱, `useReducer`는 복잡한 state 관리, `memo`는 컴포넌트 캐싱을 담당한다. 상황에 맞는 훅을 골라 쓰는 게 핵심이다.

난이도 : ★★☆☆☆

1️⃣ `useState / useEffect / useRef` 2️⃣ `useMemo / useCallback` 3️⃣ `Custom Hooks`

## ✅ 왜 알아야 하나

React를 제대로 쓰려면 Hook 개념은 필수다. 각 Hook이 무슨 상황에서 쓰이는지 헷갈려서 별코딩 님의 강의를 참고해 개념을 다시 정리했다. 설명이 명확하고 도움이 많이 돼서 정리한 내용을 공유한다.

- 코드: [My Github Source](https://github.com/seong-ji-sue/react-hook-study)
- 목 데이터: [JSON Placeholder](https://jsonplaceholder.typicode.com/)

![](/images/203/img_01.gif)

## ✅ 한눈에 보는 Hook 목록

1. `useState` — Hook의 시작
2. `useEffect` — 렌더링을 조절
3. `useContext` — 전역 상태의 시작
4. `useMemo` — 값 캐싱
5. `useCallback` — 함수 캐싱
6. `useReducer` — 복잡한 state를 깔끔하게 관리
7. `memo` — 컴포넌트도 캐싱
8. `Custom Hooks` — 내 맘대로 만드는 Hook

## ✅ useState — Hook의 시작

특정 변수 값이 변경될 때 화면을 다시 렌더링하고 싶을 때 쓴다.

- state를 변경하기 위해 씀
- 값을 변경할 때마다 화면이 렌더링됨
- 초기값 계산이 무겁다면 콜백으로 함수를 리턴하되, 함수 자체는 컴포넌트 밖에 선언함
- 배열 요소를 추가하고 싶으면 콜백의 첫 번째 인자를 활용함

```javascript
//값 변경
const [time, setTime] = useState(5)
setTime(6) //랜더링 후 6으로 변경

//배열 변경
const [names, setNames] = useState(() => heavyWork()); //초기값 함수
const handleUpdate = () => {
	setNames((prev) => {
		return [input, ...prevState] //input은 사용자가 입력한 값
	})
}
```

## ✅ useEffect — 렌더링을 조절

처음 화면 렌더링(DidMount), 업데이트될 때마다 렌더링(DidUpdate), 소멸될 때(WillUnmount) 시점을 다룬다. 컴포넌트 생명주기나 특정 state가 업데이트될 때 화면도 다시 그리고 싶을 때 쓴다.

> Object 특징: 값을 메모리 어딘가에 따로 저장하고 주소 값만 가져와서 변수에 저장함

- 두 번째 인자 배열에 넣은 요소가 변경되면 실행됨
- 배열 요소가 없으면 처음 마운트될 때만 실행됨
- 실행을 종료하려면 return 값으로 콜백을 주고 종료 로직을 넣으면 됨
- 객체는 값이 같아도 참조 주소가 다르기 때문에, 의존성 배열에 넣은 state가 아닌 다른 state가 바뀌어도 계속 렌더링될 수 있음
- `useEffect` 안에서 다른 state를 변경하면 무한루프가 생길 수 있음

```javascript
//화면 랜더링되고 난 직후
useEffect(() => {})
//화면 랜더링될 때, value 값이 변경될 때
useEffect(() => {},[value])//dependency array
//마운트될 때만 실행됨
useEffect(() => {},[])
//Clean Up 예제
useEffect(() => {
	const timer = setInterval(() => {
		console.log("타이머 돌아가는 중")
	},1000)
	return () => {
		clearInterval(timer)
		console.log("타이머 종료")
	}
},[])
```

## ✅ useRef — 특정 렌더링을 무시하고 싶을 때

`useEffect` 안에서 다른 state를 변경하면 무한루프가 생길 수 있는데, 이럴 때 `useRef`를 쓴다. 저장공간으로 쓰거나(렌더링 영향 없이 값 유지), DOM 요소에 접근할 때(input focus 등) 쓴다.

**state vs ref vs 변수**

- state — 값 변경 시 렌더링, 다른 state 변경 시 초기화
- ref — 다른 state가 렌더링돼도 값 유지, 값 변경 시 렌더링 안 함
- 변수 — 다른 state 변경으로 렌더링되면 값 초기화됨

`document.querySelector`와 비슷한 역할이라고 보면 된다. 태그의 `ref` 속성에 값을 넣으면 DOM 요소에 접근할 수 있다.

```javascript
//ref 값 변경과 useRef 선언 방법
const countRef = useRef(0); //{current : 0}
const increaseCountRef = () => {
  countRef.current = countRef.current + 1
}

//Dom에 접근해서 focus 속성
inputRef.current.focus();
<input ref={inputRef} type={"text"} placeholder={"username"}/>
```

## ✅ useContext — 전역 상태의 시작

Props drilling 때문에 계속 props를 전달해야 하는 경우에 쓴다. 모든 컴포넌트에서 공통으로 쓰는 state를 자식에게 계속 내리지 않고 한 번에 전달할 수 있다. 단순히 prop drilling만 문제라면 Component Composition을 먼저 고려하는 게 맞다.

```javascript
//js 파일 안에 Context 사용 선언, 초기값 설정 가능
export const ThemeContext = createContext(null);

//최상위 계층에 감싸주면 됨, state도 최상위에 선언하면 됨
const [isDark, setIsDark] = useState(false);

<ThemeContext.Provider value={{isDark, setIsDark}}>
  <PageContext isDark={isDark} setIsDark={setIsDark} />;
</ThemeContext.Provider>

//사용
const {isDark} = useContext(ThemeContext);
```

## ✅ useMemo — 값 캐싱

Memoization은 값을 메모리에 저장해뒀다가 필요할 때 꺼내 쓰는 것이다. 함수형 컴포넌트는 렌더링될 때마다 함수가 다시 호출되고 내부 변수가 모두 초기화되는데, 렌더링 때문에 값이 초기화되는 걸 막고 특정 값을 캐싱하고 싶을 때 쓴다.

- 컴포넌트 최적화에 사용됨
- 처음 계산된 값을 메모리에 캐싱하기 때문에 렌더링돼도 값이 초기화되지 않음
- 첫 번째 인자는 콜백으로 리턴한 값을 캐싱, 두 번째 인자는 업데이트 조건이 되는 의존성 배열
- 메모리를 따로 사용하기 때문에 무분별하게 쓰면 오히려 낭비가 될 수 있음 — 필요할 때만 적절히 사용
- 객체를 캐싱해서 기억하기 때문에 `useEffect` 대신 많이 쓰임

```coffeescript
//사용 방법, {country: isKorea ? '한국' : '외국'}을 캐싱
const location = useMemo(() => {
  return {
    country: isKorea ? '한국' : '외국'
  }
}, [isKorea])
```

## ✅ useCallback — 함수 캐싱

자바스크립트에서 함수도 객체다. 렌더링 때문에 함수가 다시 만들어지는 걸 막고, 특정 함수를 캐싱하고 싶을 때 쓴다.

- `useMemo`와 달리 콜백 함수 자체를 메모이제이션함
- 함수형 컴포넌트는 렌더링 시 함수도 새로 만들어지기 때문에 주소 값이 매번 바뀜
- 메모리를 소비하므로 필요한 부분에만 적용함

```javascript
//사용 방법, () => {return{~~}} 함수 자체를 캐싱
const createBoxStyle = useCallback(() => {
  return {
    backgroundColor: 'pink',
    width: `${size}px`,
    height: `${size}px`
  }
},[size])
```

## ✅ useReducer — 복잡한 state를 깔끔하게

state가 객체인데 그 안에 또 객체가 중첩돼서 이어질 때 쓴다.

**비유**: 철수가 은행에 1000만원을 인출해달라고 요청했다.

| 개념 | 비유 |
|------|------|
| state | 1000만원 |
| Reducer | 은행 |
| Action | 인출해주세요 라는 요청 내용 |
| Dispatch | 철수가 은행에 요구하는 행위 |

실행 순서는 `Dispatch(Action) → Reducer(state, Action) → state update`다.

- `reducer` — state를 업데이트하는 함수. `dispatch`가 실행되면 호출됨. 첫 번째 인자로 현재 state, 두 번째 인자로 `dispatch` 실행 시 넘긴 객체(요구 사항)를 받음
- `dispatch` — state 업데이트를 요청하는 함수. 실행 시 `type`(reducer에서 분기할 값)과 `payload`(전달할 값)를 담은 객체를 넘김
- `action` — 요구 사항을 담은 객체

```javascript
//useReducer 선언
//const [A, B] = useReducer(C, D)
//A : state 변수
//B : useReducer가 만들어준 dispatch 함수
//C : reducer 함수, state 조작 + dispatch 실행시 호출
//D : state의 초기값
const [money, dispatch] = useReducer(reducer, 0);

//dispatch 호출
//dispatch({A, B})
//A : type, reducer에서 switch로 상황 분리할 때 쓰임
//B : payload, 전달할 값 
<button onClick={() => {
  dispatch({type: ACTION_TYPES.deposit, payload: number});
}}>예금</button>

//reducer 정의
//const 변수명 = (A, B) => {return C}
//A : state 값
//B : 요구사항, dispatch에서 전달받은 객체
//C : 새로운 state 값, 요구사항에 따라 switch로 변경
const reducer = (state, action) => {
  console.log('reducer가 일을 합니다.', state, action)
  switch (action.type) {
    case ACTION_TYPES.deposit:
      return state + action.payload
    case ACTION_TYPES.withdraw:
      return state - action.payload
    default:
      return state
  }
}
```

## ✅ memo — 컴포넌트도 캐싱

부모 컴포넌트가 렌더링되면 모든 자식 컴포넌트도 함께 렌더링된다(함수형 컴포넌트는 렌더링될 때 초기화되기 때문). 불필요한 렌더링이 자주 일어나거나 자식 컴포넌트가 무거운 작업을 할 때 `memo`(고차 컴포넌트 — 컴포넌트를 받아서 새 컴포넌트를 반환)를 쓴다.

- Props를 비교해서 값이 바뀌었으면 새로 렌더링하고, 안 바뀌었으면 기존 것을 재사용함(렌더링하지 않음)
- `memo`로 최적화해도 props가 객체나 함수면 매번 새로 초기화되므로 렌더링이 일어남 — 이럴 때는 `useMemo`, `useCallback`을 같이 써야 함

```haskell
//사용방법 간단
export default memo(Child)
```

## ✅ Custom Hooks — 내 맘대로 만드는 Hook

여러 컴포넌트에서 동일한 로직을 반복해서 써야 할 때 직접 커스텀 훅으로 뽑아서 쓴다.

- 일반 함수처럼 작성하고 return한 값을 사용함
- input이나 fetch처럼 여러 컴포넌트에서 반복되는 로직에 씀
- 함수와 리턴값을 자유롭게 정의할 수 있음

```php
//커스텀 훅 정의(js파일)
//A: 초기값
//B: 함수나 값
export function useInput(A, B) {
	//useState, useEffect 같은 훅
	return [함수나 변수]
}

//사용
//A : 초기값
//B : 함수나 변수
//C : 훅에서 return 한 함수나 값
const [C] = useInput(A, B);
```

## ✅ 정리

- `useState`/`useEffect`는 렌더링과 생명주기를 다루는 기본 훅임
- `useRef`는 렌더링에 영향 없이 값을 유지하고 싶을 때 씀
- `useMemo`/`useCallback`은 각각 값과 함수를 캐싱하지만 남용하면 오히려 메모리 낭비가 됨
- `useReducer`는 중첩된 복잡한 state를, `memo`는 자식 컴포넌트 렌더링 자체를 줄일 때 씀

## 참고한 링크

- [별코딩 — React Hooks에 취한다](https://youtube.com/playlist?list=PLZ5oZ2KmQEYjwhSxjB_74PoU6pmFzgVMO)

![](/images/203/img_02.png)
