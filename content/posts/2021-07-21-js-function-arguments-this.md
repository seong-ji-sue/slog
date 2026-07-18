---
title: "자바스크립트 함수 완전 정리 — 선언 방식, arguments, this"
date: 2021-07-21 20:13:00 +0900
description: "함수 선언 4가지 방식부터 표현식 활용 패턴, 파라미터·arguments·RestParameter, this 동작 원리까지 예제로 정리"
categories: ["딥다이브"]
tags: ["JavaScript", "함수", "arguments", "this", "RestParameter", "고차함수", "클로저"]
series: "JavaScript 파고들기"
difficulty: 2
log: 6
slug: "js-function-arguments-this"
source: https://zibu-story.tistory.com/113
draft: false
---

> **TL;DR** — 자바스크립트 함수는 일급 함수다. 1️⃣ 함수를 만드는 4가지 방식과 2️⃣ `arguments`·`this`가 호출 맥락에 따라 어떻게 달라지는지 알면 함수를 자유자재로 다룰 수 있다.

난이도 : ★★☆☆☆

1️⃣ `함수 선언 4가지` 2️⃣ `arguments / RestParameter` 3️⃣ `this`

## ✅ 왜 알아야 하나

이 글을 정리하면서 깨달은 것들이다.

1. 함수를 자유자재로 쓸 수 있게 됨
2. 파라미터와 argument(인자)의 차이와 활용을 이해함
3. `arguments` 객체와 RestParameter의 쓰임을 알고 응용할 수 있음
4. Arrow Function으로 함수를 더 간결하게 쓸 수 있음
5. `forEach`와 `for`의 차이를 명확히 이해함
6. `setTimeout`, `setInterval`, `clearInterval`로 함수 호출 시점과 호출 생략을 다룰 수 있음
7. 템플릿 리터럴(`` `${}` ``)로 변수를 텍스트와 함께 자유자재로 쓸 수 있음

## ✅ 함수 만드는 법 (자바스크립트 함수는 일급 함수)

**1. 함수 선언식**
- 선언하기 전에도 호출 가능(호이스팅)
- 함수 스코프를 가짐

**2. 함수 표현식**
- 함수를 값처럼 사용하는 방식
- 호이스팅 안 됨
- 할당된 변수에 따라 스코프가 결정됨
- 함수도 결국 객체다(`console.dir`로 확인 가능)

**3. 즉시 실행 함수(IIFE, 이름 없는 함수)**
- 함수 선언과 동시에 즉시 실행됨
- 외부에서 재사용 불가
- 함수의 리턴값을 바로 변수에 할당하고 싶을 때 사용
- 프로그램 초기화 시 많이 쓰인다고 함

**4. Arrow Function(ES2015 이후)**
- 익명 함수의 축약형
- 함수 선언을 더 간결하게 만들어줌
- 파라미터가 한 개면 소괄호 생략 가능하지만, 없거나 2개 이상이면 반드시 적어야 함
- 리턴값이 하나면 중괄호 생략 가능하지만, 객체이거나 조건이 여러 개면 생략 불가능
- 리턴문이 객체일 때 생략할 수 없는 이유는 객체의 중괄호를 함수 본문의 중괄호로 해석하기 때문 — 굳이 쓰고 싶으면 소괄호로 감싸면 됨
- `arguments`와 호환되지 않음

```javascript
// case1: 함수 선언식
function AZ1(numz) {
  console.log(`나는 바보 ${numz}`);
}
AZ1('다');

// case2: 함수 표현식
let AZ2 = function (numz) {
  console.log(`나는 바보 ${numz}`);
};
AZ2('다');

// case3: 즉시 실행 익명 함수
(function (numz) {
  console.log(`나는 바보 ${numz}`);
})('다');

// case4: Arrow Function (ES2015 이후, () => {})
(numz1 => console.log(`나는 바보 ${numz1}`))('다'); // ${}는 템플릿 리터럴 문법

// case1~case4 전부 동일하게 출력됨
```

## ✅ 함수 표현식 활용

### 1. 기명 함수

함수 이름을 정의하지 않았을 때 할당된 변수의 `.name`은 변수 이름이 출력된다. 함수 이름을 정의했을 때는 함수 이름이 출력된다. 표현식 밖에서 함수 이름으로 접근하면 에러가 난다.

```javascript
let sayhi = function saybye() {
  console.log(sayhi.name);
  console.log('saybye');
};
sayhi(); // saybye 출력. 함수 이름을 빼면 sayhi가 출력됨
// saybye(); // Error
```

### 2. 재귀 함수

함수 표현식 안에서 자기 자신을 호출하는 것이다.

```javascript
let talk = function subtalk(n) {
  console.log(n);
  if (n == 0) {
    console.log('함수 종료');
  } else {
    subtalk(n - 1); // 재귀 호출. talk로 호출하면 아래에서 null이 되므로 Error
  }
};
// talk(5); // 5~0까지 출력

let retalk = talk; // talk와 retalk는 같은 subtalk 함수를 참조
talk = null;        // talk에는 함수가 아닌 null이 들어감
retalk(5);
```

### 3. 객체 안의 함수

객체 안에 속성값으로 함수를 넣을 수 있다.

```javascript
let printA = function () {
  console.log('안녕A');
};
console.dir(printA); // 객체로 표시됨

let printB = {
  sa: function () {
    console.log('안녕B');
  },
};
printB.sa();
```

### 4. 배열 안의 함수

배열 안의 요소로도 함수를 넣을 수 있다.

```javascript
let printC = [function () {
  console.log('안녕');
}];
printC[0]();
```

### 5. 콜백 함수

다른 함수의 파라미터로 전달되는 함수다.

```javascript
function getTalk() {
  return '안녕 안녕!';
}
function Quiz(talk) {
  console.log(talk());
}
Quiz(getTalk);
```

### 6. 고차 함수

함수의 리턴값으로 함수를 리턴하는 함수다. `함수()()` 형태로 쓴다.

```javascript
function reTalk() {
  return function returnTalk() {
    console.log('안녕안녕');
  };
}
reTalk()();
```

## ✅ 파라미터의 활용

1. 기본적으로는 인자 개수와 파라미터 개수가 일치함
2. 파라미터가 더 많으면 남는 파라미터는 `undefined`
3. `undefined`인 파라미터에 기본값을 직접 할당할 수 있음(단, 값을 직접 전달하면 전달된 값이 우선)
4. 파라미터에 `undefined`를 직접 전달할 수도 있음(그러면 기본값이 할당됨)
5. 파라미터 안에서 연산도 가능함(`x, y=x+1`)

```javascript
function ftget(name) {
  console.log(`안녕 ${name}`); // 템플릿 리터럴은 백틱(``)을 써야 함
}
ftget('뻐큐먹어'); // 기본적인 방법
ftget();           // name에 undefined 출력

function addget(x, y = x + 1 + z, z = 2, f) { // 파라미터 안에서 연산 가능
  console.log(`x = ${x}`);
  console.log(`y = ${y}`); // 기본값보다 전달된 인자가 우선이라 5 출력
  console.log(`z = ${z}`);
  console.log(`f = ${f}`); // 인자를 안 주면 undefined
}
addget(2, 5, undefined); // undefined도 명시적으로 전달 가능
```

**파라미터 vs 인자(argument)**

- 파라미터 — 함수를 정의할 때 소괄호 안에 있는 값
- 인자(argument) — 함수를 호출할 때 소괄호 안에 있는 값

## ✅ arguments와 RestParameter

### 1. arguments 객체

- 유사 배열(배열은 아니지만 배열처럼 보이는 것)
- 배열 메소드는 못 씀(`length`, `for...of`는 가능)
- 파라미터는 3개인데 인자는 4개처럼 초과 전달된 값을 다루고 싶을 때 씀
- 전달된 인자들을 전부 묶어 유사 배열로 만들어줌

```javascript
(function (a, b) { // 즉시 실행 익명 함수. a, b는 파라미터
  let sum = 0;
  console.log(`${a} , ${b}`); // 10을 제외하고 출력
  for (let add of arguments) { // 전달된 모든 인자가 arguments 유사 배열에 담김
    sum += add;
  }
  console.log(sum);
})(5, 5, 10); // 인자
```

### 2. RestParameter(ES2015 이후)

- 완전한 배열이라 배열 메소드를 그대로 사용 가능
- 마지막 파라미터로만 써야 함
- 파라미터와 매칭되지 않은 나머지 인자들만 배열로 묶임

```javascript
function ignoreFirst(...other) { // ...other가 RestParameter. 모든 인자가 배열로 들어감
  other.shift(); // 배열의 첫 번째 요소 제거
  for (another of other) { // 첫 번째 요소를 뺀 나머지를 for...of로 순회
    console.log(another);
  }
}
ignoreFirst('1세대', '2세대', '3세대');
ignoreFirst('곰팡이', '강아지', '고양이');
ignoreFirst(20, 9, 18, 19, 30, 34, 40);
```

## ✅ this — 어디로 튈지 모르는 값

- 아무것도 없이 `console.log(this)`를 찍으면 `window` 객체가 나옴
- 어떤 함수로 접근했느냐에 따라 `this` 값이 달라짐
- Arrow Function 안에서 `this`는 `window`가 나옴

참고: [7.11 생활코딩(자바스크립트 정리 후반부) - 객체, 생성자, this, 상속, Object](https://zibu-story.tistory.com/104)

```javascript
console.log(this); // window 객체 출력됨

function printThis() { // Arrow Function으로 쓰면 항상 window가 출력됨
  console.log(this); // 호출한 객체에 따라 다르게 출력됨
}

let myObj = {
  ad: 'myObj',
  md: printThis,
};
let otherObj = {
  ad: 'otherObj',
  md: printThis,
};

myObj.md();    // myObj가 호출한 대상이므로 myObj 출력
otherObj.md();  // otherObj가 호출한 대상이므로 otherObj 출력
```

## ✅ 그 밖에 알아둔 것들

- `prompt(A, B)` — A라는 설명과 B라는 텍스트를 담은 경고창을 띄움
- `` `${}` `` — 템플릿 리터럴. 안에 변수를 넣으면 됨. 백틱(`` ` ``) 필수
- `배열.shift()` — 배열의 맨 앞 값 제거
- `배열.forEach((요소) => 명령)` — `for`처럼 배열을 순회하지만 `break`, `continue`, `return`으로 제어할 수 없음
- `setTimeout(함수명, ms)` — 지정 시간 뒤에 함수를 한 번 실행. `함수명()`처럼 괄호를 붙이면 안 됨
- `setInterval(함수명, ms)` — 지정 시간 간격마다 함수를 반복 실행
- `clearInterval(함수)` — 반복 호출 중단

```javascript
// forEach
let number10 = [1, 2, 3, 4, 5];
number10.forEach(els => console.log(els)); // 1~5까지 출력

// setTimeout, setInterval, clearInterval
let timerId = setInterval(() => console.log('째깍'), 2000); // 2초마다 실행
setTimeout(() => {
  clearInterval(timerId);
  console.log('정지');
}, 5000); // 5초 뒤 정지
```

## ✅ 정리

- 함수 선언식은 호이스팅되고, 함수 표현식은 안 됨 — 할당된 변수의 스코프를 따름
- `arguments`는 유사 배열, RestParameter는 진짜 배열 — 배열 메소드가 필요하면 RestParameter를 씀
- `this`는 정의 시점이 아니라 호출 시점(어떤 객체가 호출했는지)에 따라 결정됨. Arrow Function은 예외로 항상 `window`를 가리킴

## 참고한 링크

- [7.11 생활코딩(자바스크립트 정리 후반부) - 객체, 생성자, this, 상속, Object](https://zibu-story.tistory.com/104)
