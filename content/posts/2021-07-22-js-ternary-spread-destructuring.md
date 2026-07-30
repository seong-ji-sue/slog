---
title: "조건 연산자·스프레드 구문·구조 분해 — 문장과 표현식으로 읽는 ES2015+ 문법"
date: 2021-07-22 23:47:00 +0900
description: "문장과 표현식의 차이부터 조건 연산자·spread 구문·구조 분해 할당·예외 처리까지 ES2015 이후 자바스크립트 문법을 한 번에 정리"
categories: ["딥다이브"]
tags: ["JavaScript", "삼항연산자", "spread", "구조분해할당", "옵셔널체이닝", "에러처리", "ES2015"]
series: "JavaScript 파고들기"
difficulty: 2
scope: "research"
log: 7
slug: "js-ternary-spread-destructuring"
source: https://zibu-story.tistory.com/114
draft: false
---

> **TL;DR** — 조건 연산자(삼항 연산자)·spread 구문·구조 분해 할당은 전부 "표현식"이라는 공통점이 있다. 1️⃣ 문장과 표현식의 차이를 구분하면 2️⃣ 왜 `if`는 콘솔에 바로 못 찍고 삼항 연산자는 되는지가 보인다.

난이도 : ★★☆☆☆

1️⃣ `문장 vs 표현식` 2️⃣ `spread 구문` 3️⃣ `구조 분해 할당`

## ✅ 왜 알아야 하나

`for`, `while`, `if`는 콘솔에 바로 찍히지 않는데 `a ? b : c`는 왜 되는지 헷갈렸던 적이 있다. 답은 간단하다 — 전자는 "문장(statement)"이고 후자는 "표현식(expression)"이기 때문이다. 이 구분을 알면 ES2015 이후 등장한 spread 구문·구조 분해 할당도 왜 편리한지 자연스럽게 이해된다.

## ✅ 문장 vs 표현식

| 구분 | 정의 | 특징 |
|------|------|------|
| 문장 | 어떤 동작이 일어나도록 작성된 최소 코드 덩어리 | 선언문·할당문·조건문·반복문 — 끝에 "문"이 붙음. 중괄호로 표시. 콘솔에 바로 출력 불가 |
| 표현식 | 결과적으로 하나의 값이 되는 모든 코드 | 세미콜론으로 표시. 값으로 평가되므로 어디든 끼워 넣을 수 있음 |

```javascript
// 문장 — 동작이 일어나게 하는 것
let x;                      // 선언문
x = 5;                      // 할당문
if (x < 5) {                // 조건문
  console.log('x는 5보다 작다');
}
for (let i = 0; i < 5; i++) { // 반복문
  console.log(i);
}

// 표현식 — 결론적으로 값이 되는 것
console.log(5 + 4);         // 연산 결과값
let obj = { num: 25 };      // 객체 생성
let arr = [1, 2, 3];        // 배열 생성
typeof obj;                 // typeof 연산 결과
obj.name;                   // 속성 접근 결과

// 문장이면서 표현식인 경우도 있음
let title = 'JSP';          // 할당(동작)이면서 할당한 값을 가짐(표현식)
function flog() { console.log('asd'); }
flog();                     // 함수 호출(동작)이면서 리턴값을 가짐(표현식)
console.log('hello');       // 출력(동작)이면서 리턴값은 undefined인 표현식
```

문장은 조건식 자리에 못 들어간다. `if`문 자체를 변수에 담으려 하면 바로 에러가 난다.

```javascript
// let aswq = if ('hello') { ... }  // SyntaxError — 문장은 값이 아니므로 할당 불가
```

## ✅ 조건 연산자 — 문장을 표현식으로

`if`는 원래 문장이라 표현식 자리에 못 들어간다. 이 문제를 해결하기 위해 나온 게 조건(삼항) 연산자다.

- 구조 : `조건 ? 참일 때 값 : 거짓일 때 값`
- 조건문 안에 다른 반복문·조건문은 올 수 없음

```javascript
let speed = 30;

// 삼항 연산자 — 표현식이라 바로 변수에 할당 가능
const msg = speed > 50 ? '[주의] 과속 중입니다.' : '정속 주행 중입니다.';
console.log(msg);

// if/else는 문장이라 이렇게 값처럼 쓸 수 없음
// const msg = if (speed > 50) { return 'a'; } else { return 'b'; } // SyntaxError
```

## ✅ spread 구문 — 배열·객체 펼치기

배열이나 객체 앞에 `...`을 붙이면 대괄호·중괄호가 벗겨지고 요소만 펼쳐진다. 비슷하게 생긴 rest 파라미터(함수 인자를 모을 때 쓰는 `...`)와 헷갈리기 쉬우니 주의.

```javascript
// 배열 펼치기
let words = ['한국', '독도', '강남'];
console.log(...words); // 한국 독도 강남

// 참조 vs 복사 — 그냥 대입하면 같은 배열을 가리킴
let a = [1, '한국', () => console.log];
// let b = a;             // b를 바꾸면 a도 바뀜(참조 공유)
// let b = a.slice();     // 복사는 되지만 push까지 한 번에 못 함
let b = [...a, '추가값'];  // 복사 + 추가를 한 줄로

// 배열 합치기
let arr1 = [1, 2, 3];
let arr2 = [2, 2, 1];
let sum1 = [...arr1, ...arr2];   // spread로 합치기
let sum2 = arr1.concat(arr2);    // concat으로 합치기

// 인자로 펼쳐서 전달
let pair = [1, 2];
let sumFn = (a, b, c = a + b) => console.log(a + b + c);
sumFn(...pair); // 배열 요소를 각각의 인자로 전달

// 주의 — spread는 값이 아니라 문법이라 변수에 직접 할당 불가
// let x = ...arr1; // SyntaxError
let arr3 = [1, 2, 3];
console.log([...arr3]);   // 배열 → spread: 가능
console.log([{ ...arr3 }]); // 배열 → 객체 → 배열: 가능
// console.log([...{ ...arr3 }]); // 객체 → spread: 불가능
```

## ✅ 객체 프로퍼티 표기법 (ES2015+)

- 변수 이름과 속성 이름이 같으면 축약 가능
- 계산된 속성명 — 대괄호 안에 표현식을 넣어 동적으로 key를 만들 수 있음
- 옵셔널 체이닝(`?.`, ES2020) — 점 표기법에 `if` 역할을 더한 버전

```javascript
let title = '자기소개';
let obj = {
  title,                          // title: title 의 축약
  print() {                       // print: function() 의 축약
    console.log('안녕하세요');
  },
  ['key' + title.length]: '축약값' // 계산된 속성명 — 표현식 결과가 key가 됨
};

console.log(obj);
console.log(obj['key' + title.length]); // '축약값'

// 옵셔널 체이닝 — obj.name이 없으면 undefined, 있으면 obj.name.title
console.log(obj.name?.title ?? '이름이 없음');
```

## ✅ 구조 분해 할당

값을 하나씩 꺼내서 변수에 담던 코드를 한 줄로 줄여주는 문법이다. 배열·객체 둘 다 적용된다.

```javascript
// 배열 구조 분해 — rest 파라미터, 기본값도 함께 사용 가능
let arr = ['가', '나', '다', '라'];
let [first, second = '기본값', ...rest] = arr;
console.log(`${first}${second}${rest}`);

// 배열 요소 교환도 한 줄로
[arr[1], arr[2]] = [arr[2], arr[1]];
console.log(arr); // 가다나라

// 객체 구조 분해
let laptop = {
  name: '맥북 2012',
  '좋아해?': '아니!', // 계산된 속성명처럼 문자열 key도 가능
  price: '300만원'
};

let name2 = laptop.name;               // 일반적인 점 표기법
let { name, ...restObj } = laptop;     // rest 파라미터
let { ['좋아해?']: answer } = laptop;   // key를 표현식으로 지정해 꺼내기

console.log(restObj); // { '좋아해?': '아니!', price: '300만원' }
console.log(answer);  // 아니!
```

## ✅ 에러와 예외 처리

- 에러가 발생하면 프로그램이 멈춘다 — 이를 다루는 게 예외 처리
- 에러 객체는 `name`(에러 이름)과 `message`(에러 메시지)를 가짐
- `throw`로 에러를 직접 발생시킬 수 있고, `try~catch~finally`로 다룬다 (`finally`는 생략 가능)
- `try~catch`는 블록 스코프라 `let`·`const`로 선언한 변수는 블록 밖에서 못 씀

```javascript
try {
  console.log('에러 발생 예정');
  throw new TypeError('타입 에러가 발생');
} catch (e) {
  console.error(e.name); // 에러 이름 확인. message로 상세 메시지 확인
} finally {
  console.log('에러 처리 완료');
}
```

## ✅ 정리

- 문장은 값이 아니라 동작이라 콘솔에 바로 못 찍고, 표현식은 값이라 어디든 끼워 넣을 수 있음
- 삼항 연산자는 `if`(문장)를 표현식으로 쓸 수 있게 해주는 문법
- spread 구문은 복사와 추가를 한 번에 처리해서 `slice()` + `push()` 조합보다 간결함
- 구조 분해 할당으로 배열·객체에서 값을 꺼내는 코드를 한 줄로 줄일 수 있음
- 예외 처리는 `try~catch~finally`로, 에러 객체는 `name`·`message`를 가짐

## 참고한 링크

- [Error | MDN](https://developer.mozilla.org/ko/docs/orphaned/Web/JavaScript/Reference/Global_Objects/Error)
