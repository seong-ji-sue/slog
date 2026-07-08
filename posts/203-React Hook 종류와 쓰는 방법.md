---
title: "React Hook 종류와 쓰는 방법"
date: 2023-03-24 21:35:00 +0900
categories: ["공부(Study)", "리엑트(React)"]
tags: ["react", "React Hooks", "useCallback", "useContext", "useEffect", "useMemo", "useRef", "useState", "리엑트", "리엑트 훅"]
source: https://zibu-story.tistory.com/203
post_id: 203
---

**React를 제대로 사용하고 싶다면 Hook에 대한 개념은 필수이다.**

**강의 듣기도 애매하고 개념을 되짚어야 되서 찾아보다가 별코딩 님의 짧은 강의?를 보고**

**개념을 익혔다. 너무 개념 설명도 잘하시고 좋은 내용 많아서 공유해본다.**

코드 정리(github)

[My Github Sorce](https://github.com/seong-ji-sue/react-hook-study)

목 데이터 모음 사이트 

[JSON PLACEHOLDER](https://jsonplaceholder.typicode.com/)

![](../images/203/img_01.gif)

**📢 React Hook 각각 어느 상황에 쓰이는지 알 수 있다.**

**📢 React Hook 각각 어떻게 사용하는지 알고 있다.**

**📢 직접 Hook을 만들어서 사용할 수 있다.**

### **✔️Summary**

1. **useState (Hook의 시작)**
2. **useEffect (랜더링을 조절할 수 있음!)**
3. **useContext (전역 상태의 시작)**
4. **useMemo (값 캐싱)**
5. **useCallback (함수 캐싱)**
6. **useReducer (복잡한 state의 제거 깔끔!)**
7. **component.memo (컴포넌트도 캐싱!)**
8. **Custom Hooks (내 맘대로 Hook)**

### **✔️useState (Hook의 시작)**

**어느 상황에 쓰임?**

특정 변수 값이 변경할 때 화면을 랜더링 하고 싶을때 쓰임

**특징**

- state를 변경하기 위함
- 값을 변경할 때마다 화면이 랜더링 됨
- 초기 값이 무겁다면 콜백 안에 함수 리턴 단, 함수는 컴포넌트 밖에 선언
- 배열 요소를 추가하고 싶으면 콜백의 첫번째 인자 활용

**코드**

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

### **✔️useEffect (랜더링을 조절할 수 있음!)**

📢 처음 화면 랜더링(DidMount),  Update될 때마다 랜더링(DidUpdate),  소멸될 때(WillUnmount)

📢 Object 특징 : 값을 메모리 어딘가에 따로 저장하고 주소 값만 가져와서 변수에 저장

**어느 상황에 쓰임?**

컴포넌트 생명주기나 특정 state가 update 될 때 화면도 랜더링 하고 싶을 때 쓰임

**특징**

- 두번째 인자로 배열 안에 요소를 넣으면 그 값이 변경할 때 실행
- 배열의 요소가 없으면 맨 처음 마운트될 때만 실행
- 실행을 종료하려면 return 값으로 콜백을 주고 종료 기능을 넣으면 됨
- Object 경우 같은 값이어도 참조하는 주소 값은 다르기 때문에 의존성 배열로 설정한 state가 아닌 다른 state 가 바뀌어도 계속 랜더링 됨
- useEffect 안에 다른 state를 변경하면 무한루프

**코드**

```javascript
//화면 랜더링되고 난 직후,
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

### **✔️useRef (특정 랜더링 무시!, querySelector ???)**

📢 useEffect 안에 다른 state를 변경하면 무한루프 → useRef 사용

**어느 상황에 쓰임?**

저장공간으로 사용(랜더링 영향 안받고 값을 유지하고 싶을 때), Dom 요소에 접근(input에 focus)

**State vs Ref vs 변수**

- state : 값 변경 시 랜더링, 다른 state 변경 시 초기화
- ref : 다른 state 랜더링 되어도 값 유지, 값 변경 시 랜더링 안함
- 변수 : 다른 state 변경 시 랜더링되면 값 초기화

**특징**

- Document.querySelector 와 같은 역할
- 해당 태그에 ref 속성에 값을 넣어주면 Dom 요소에 접근 가능

**코드**

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

### **✔️useContext (전역 상태의 시작)**

**어느 상황에 쓰임?**

Props drilling 때문에 계속 props를 전달해야 되는 경우 쓰임

**특징**

- 모든 컴포넌트에서 공통으로 사용되는 state인데 props로 자식 컴포넌트에게 계속 내리지 않고 한번에 전달
- 단순히 Prop drilling 이 문제면 Component Composition을 고려해봐야 함

**코드**

```javascript
//js 파일 안에 Context 사용 선언 초기값 설정 가능
export const ThemeContext = createContext(null);

//최상위 계층에 감싸주면 됨, state도 최상위에 선언하면 됨
const [isDark, setIsDark] = useState(false);

<ThemeContext.Provider value={{isDark, setIsDark}}>
  <PageContext isDark={isDark} setIsDark={setIsDark} />;
</ThemeContext.Provider>

//사용
const {isDark} = useContext(ThemeContext);
```

### **✔️useMemo (값 캐싱)**

📢 Memoization : 값을 메모리에 저장 후 필요할 때마다 꺼내서 쓰는 것, 캐싱해서 사용

📢 함수형 컴포넌트 특징 : 랜더링 → 컴포넌트 함수 호출 → 모든 내부 변수 초기화

**어느 상황에 쓰임?**

랜더링 때문에 값이 초기화 되는 경우, 특정 값을 캐싱하여 랜더링을 방지하고 싶을 때 쓰임

**특징**

- 컴포넌트 최적화에 사용됨
- 처음 계산된 값을 메모리에 캐싱하기 때문에 랜더링 되어도 값이 초기화 되지 않음
- 첫번째 값은 콜백으로 리턴한 값을 캐싱함, 두번째 값은 업데이트 될 값을 함
- 메모리를 따로 사용해서 저장하기 때문에 무분별하게 사용하면 낭비가 될 수 있음
- 필요할 때만 적절하게 사용
- Object 경우 캐싱해서 값을 기억하기 때문에 useEffect 대신 많이 사용

**코드**

```coffeescript
//사용 방법, {country: isKorea ? '한국' : '외국'}을 캐싱
const location = useMemo(() => {
  return {
    country: isKorea ? '한국' : '외국'
  }
}, [isKorea])
```

### **✔️useCallback (함수 캐싱)**

📢 자바스크립트는 함수도 객체이다.

**어느 상황에 쓰임?**

랜더링 때문에 함수가 초기화 되는 경우, 특정 함수를 캐싱하여 랜더링을 방지하고 싶을 때 쓰임

**특징**

- useMemo랑 달리 콜백 함수 그 자체를 메모리제이션 하는 것
- 함수형 컴포넌트는 랜더링 시 값을 초기화 하는데 함수도 객체이기 때문에 주소 값이 변경 됨
- 메모리를 소비하기 때문에 필요한 부분만 변경

**코드**

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

### **✔️useReducer (복잡한 state의 제거 깔끔!)**

**어느 상황에 쓰임?**

state 값이 객체인데 그 안에 객체로 계속 연결되어 있을 때 사용

**예시**

**상황** : 철수가 1000만원을 인출해달라고 은행에 얘기를 했다

**비교** : state(1000만원), Reducer (은행), Action(인출해주세요 라는 내용), Dispatch(철수가 은행에게 요구함)

**실행 과정** : Dispatch(Action) → Reducer(state, Action) → state update

**용어**

**reducer(함수)**

- state를 업데이트 하는 역할
- dispatch를 실행하면 호출 됨
- 첫번째 인자로 현재 state를 받고 두 번째 인자로 dispatch 실행 시 넘겨준 첫 번째 인자(객체)를 받음(즉 요구 사항을 담은 객체)

**dispatch(함수)**

- state 업데이트를 위한 요구를 할 수 있음
- 실행 시 인자로 객체를 넣어주는데 type(reducer에서 실행 분리)과 payload(값) 을 전달함

**action(객체)**

- 요구 사항에 대한 내용

**코드**

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

### **✔️component.memo (컴포넌트도 캐싱!)**

📢 고차 컴포넌트 : 컴포넌트를 받아서 새로운 컴포넌트를 반환하는 것

**어느 상황에 쓰임?**

- 부모 컴포넌트가 랜더링 되면 모든 자식 컴포넌트들도 랜더링 됨(함수형 컴포넌트는 랜더링 시 초기화 되기 때문)
- 불필요한 랜더링이 자주 일어나거나 자식 컴포넌트에서 무거운 작업을 할 때 주로 사용

**특징**

- Props Check를 통해서 값이 변경 되었다면 새로 랜더링하고 변경되지 않았다면 기존에 사용하던 것을 재 새용함(랜더링 되지 않음)
- 만약 memo로 최적화를 하더라도 props가 객체나 함수이면 랜더링이 일어나고(초기화 때문) 이럴 때는 useMemo와 useCallback을 사용해야 함

**코드**

```haskell
//사용방법 간단
export default memo(Child)
```

### **✔️Custom Hooks (내 맘대로 Hook)**

📢  <pre> : 미리 정의된 형식의 텍스트를 보여줄 때 사용

📢  JSON.stringify(userData[0], null, 2) : 문자열로 반환할 때 씀, userData[0] 를 문자열로 2 들여쓰기

**어느 상황에 쓰임?**

- 여러 컴포넌트에서 동일한 훅을 사용해야 하는 경우 직접 커스텀해서 사용할 수 있음

**특징**

- 일반 함수처럼 작성하고 return 한 값을 사용
- input 이나 fetch 같은 컴포넌트마다 여러번 사용해야 하는 경우 씀
- 함수랑 리턴값을 정의할 수 있음

**코드**

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

**참고**

[https://youtube.com/playlist?list=PLZ5oZ2KmQEYjwhSxjB\_74PoU6pmFzgVMO](https://youtube.com/playlist?list=PLZ5oZ2KmQEYjwhSxjB_74PoU6pmFzgVMO "별코딩 님의 Hooks 시리즈")

[🔗 React Hooks에 취한다 - 리액트 훅스 쉽게 마스터하기](https://youtube.com/playlist?list=PLZ5oZ2KmQEYjwhSxjB_74PoU6pmFzgVMO)

![필독.png](../images/203/img_02.png)
