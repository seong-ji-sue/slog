---
title: "자바스크립트 Date 객체 — 쓰는 법과 그대로 쓰면 안 되는 이유"
date: 2023-12-05 11:08:00 +0900
description: "Date 객체의 기본 메서드부터 UTC/GMT/KST 시간 계산, 실무에서 자주 걸리는 함정, 대안 라이브러리까지 정리"
categories: ["딥다이브"]
tags: ["JavaScript", "Date", "moment", "Luxon", "Intl", "시간대"]
series: "JavaScript 파고들기"
difficulty: 2
log: 74
slug: "date-object-pitfalls"
source: https://zibu-story.tistory.com/211
draft: false
---

> **TL;DR** — 자바스크립트 `Date` 객체는 자바의 Date를 참고해 만들어졌다고 알려져 있는데, 정작 자바에서는 잘 쓰지 않는다. `Date` 자체를 쓰는 것보다, 왜 문제가 되는지 알고 `moment`·`Luxon`·`Intl` 같은 대안을 언제 꺼낼지 판단하는 게 더 중요하다.

난이도 : ★★☆☆☆

1️⃣ `Date 객체 메서드` 2️⃣ `UTC/GMT/KST` 3️⃣ `moment · Luxon · Intl`

## ✅ 왜 알아야 하나

`Date` 객체는 쓰기 쉬워 보이지만 월(month) 인덱스가 0부터 시작한다거나, 객체 비교를 `===`로 하면 안 된다거나 하는 함정이 곳곳에 있다. 이걸 모르고 쓰면 날짜 계산이 하루 어긋나거나 타임존 버그를 만들기 쉽다. 아래 내용은 개인적으로 정리한 내용이라 틀린 부분이 있으면 언제든 지적 받고 싶다.

## ✅ Date 객체 사용 방법

### new Date()

현재 날짜와 시간을 가져오는 `Date` 객체를 생성한다.

```javascript
// KST(Korea Standard Time)는 GMT(그리니치 평균시)에 9시간을 더한 시간이다.
let date = new Date(0);
console.log(date); // Thu Jan 01 1970 09:00:00 GMT+0900 (한국 표준시)

// 86400000ms는 1day를 의미한다.
// 1s = 1,000ms
// 1m = 60s * 1,000ms = 60,000ms
// 1h = 60m * 60,000ms = 3,600,000ms
// 1d = 24h * 3,600,000ms = 86,400,000ms
date = new Date(86400000);
console.log(date); // Fri Jan 02 1970 09:00:00 GMT+0900 (한국 표준시)
```

### Date.now()

1970년 1월 1일 00:00:00(UTC) 기점으로 현재까지 경과한 밀리초를 숫자로 반환한다.

```javascript
const now = Date.now();
console.log(now);
```

### getFullYear() / getMonth() / getDay() / getTime()

```javascript
const currentDate = new Date();

const year = currentDate.getFullYear();       // 현재 연도
const month = currentDate.getMonth();          // 현재 월 (0부터 시작: 0=1월)
const dayOfWeek = currentDate.getDay();         // 현재 요일 (0=일요일, 1=월요일 ...)
const timestamp = currentDate.getTime();        // 1970-01-01부터 경과한 밀리초(타임스탬프)
```

### 활용 예시

```javascript
(function printNow() {
  const today = new Date();
  const dayNames = ['(일요일)', '(월요일)', '(화요일)', '(수요일)', '(목요일)', '(금요일)', '(토요일)'];

  const day = dayNames[today.getDay()];
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  let hour = today.getHours();
  let minute = today.getMinutes();
  let second = today.getSeconds();
  const ampm = hour >= 12 ? 'PM' : 'AM';

  // 12시간제로 변경
  hour %= 12;
  hour = hour || 12; // 0 => 12

  // 10 미만인 분·초를 2자리로 변경
  minute = minute < 10 ? '0' + minute : minute;
  second = second < 10 ? '0' + second : second;

  const now = `${year}년 ${month}월 ${date}일 ${day} ${hour}:${minute}:${second} ${ampm}`;
  console.log(now);
  setTimeout(printNow, 1000);
}());
```

## ✅ 어느 곳에서나 한국 시간 보여주기

### UTC, GMT, KST 차이

`Date` 객체는 내부적으로 UTC를 기준으로 처리하기 때문에, 전 세계 시간을 다루려면 KST를 UTC로 변환하는 과정이 필요하다.

- **UTC(Coordinated Universal Time)** — 원자 시계를 기반으로 한 국제 표준시. `Date` 객체가 내부적으로 사용하는 기준
- **GMT(Greenwich Mean Time)** — 그리니치 천문대의 평균 태양시 기준. UTC와 일반적으로 같게 취급되지만 엄밀히는 미세한 차이가 있고, 실무에서는 잘 쓰지 않음
- **KST(Korea Standard Time)** — 한국 표준시. UTC+9이며 한국의 공식 표준 시간대. 한국 외 지역에서 쓸 때는 해당 지역의 시간대를 함께 고려해야 함

### 어디서든 한국 시간 계산하는 방법

> PC에 설정된 시간대가 이미 KST면 그냥 써도 되고, UTC로 세팅돼 있다면 아래처럼 변환해야 한다. 라이브러리를 쓰면 이 계산을 직접 안 해도 된다.

- `getTimezoneOffset()` — 사용자 PC 설정 시간대와 UTC 시간의 차이를 '분' 단위로 반환
- `getTime()` — 1970년 1월 1일 00:00:00 UTC로부터 경과한 시간(밀리초)을 반환

```javascript
// 1. 현재 시간(로케일 기준)
const curr = new Date(); // 사용자 PC에 설정된 시간대 기준
console.log(curr)

// 2. UTC 시간 계산
const utc = curr.getTime() + (curr.getTimezoneOffset() * 60 * 1000);

// 3. UTC to KST (UTC + 9시간)
const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
const kr_curr = new Date(utc + (KR_TIME_DIFF));

console.log(kr_curr)
```

## ✅ Date 객체의 문제점

### new Date()의 출력은 RFC 형식 — ISO로 바꿔야 함

```javascript
let date = new Date();
console.log(date.toISOString())
```

### 문자열 포맷팅을 하려면 값을 전부 따로 뽑아야 함

```javascript
let date = new Date();
let str = `${date.getFullYear()}년 ${date.getMonth()}월 ${date.getDate()}일`
```

### 월은 0부터 11까지라 항상 +1 해줘야 함

```javascript
date.getMonth() + 1 // getMonth가 8이면 -> 실제로는 9월
```

### set/get으로 계산해야 하고, 없는 날짜는 다음 달로 자동 보정됨

```javascript
let date = new Date(2022, 09, 31)
date.setMonth(date.getMonth() + 1) // 2022-09-31은 존재하지 않아 다음 달로 보정됨
```

### 객체라서 `getTime()`으로 비교해야 함

```javascript
const time1 = new Date("2023-08-01T00:00:00")
const time2 = new Date("2023-08-01T00:00:00")

const checkDate = time1 === time2               // false — 서로 다른 객체
const checkTime = time1.getTime() === time2.getTime() // true — 값은 같음
```

### 요일은 배열로 직접 매핑해야 하고, 일요일이 0부터 시작함

```javascript
const koreanDaysOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const currentDate = new Date();

const dayOfWeek = currentDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
const koreanDayOfWeek = koreanDaysOfWeek[dayOfWeek];
console.log(`오늘은 ${koreanDayOfWeek}입니다.`);
```

## ✅ 시간을 다루는 라이브러리

### moment.js

날짜 형식화, 계산, 로컬화 등을 폭넓게 지원하는 대표 라이브러리다. 시간대 처리를 하려면 `moment-timezone`을 추가로 설치해야 한다.

```javascript
const moment = require('moment');

const currentTime = moment();
const customDate = moment('2023-08-30T14:30:00');
const formattedTime = currentTime.format('YYYY-MM-DD HH:mm:ss');
const tomorrow = currentTime.add(1, 'day');

const timeA = moment('2023-08-30T12:00:00');
const timeB = moment('2023-08-31T14:30:00');
const duration = moment.duration(timeB.diff(timeA));
const hoursDiff = duration.asHours();

console.log('현재 시간:', formattedTime);
console.log('내일:', tomorrow.format('YYYY-MM-DD HH:mm:ss'));
console.log('시간 차이 (시간):', hoursDiff);
```

### Luxon

시간대 정보를 기본 내장하고, 생성한 날짜·시간 객체는 불변이다. 언어별 포맷 옵션도 다양하게 지원한다.

```javascript
const { DateTime } = require('luxon');

const now = DateTime.now();
console.log(now.toISO()); // ISO 8601 형식

const customDate = DateTime.fromObject({
  year: 2023, month: 8, day: 30,
  hour: 14, minute: 30, second: 0,
  zone: 'Asia/Seoul',
});
console.log(customDate.toFormat('yyyy-MM-dd HH:mm:ssZZ')); // "2023-08-30 14:30:00+09:00"

const tomorrow = now.plus({ days: 1 });
console.log(tomorrow.toISO());
```

### Intl

별도 라이브러리가 아니라 자바스크립트 내장 객체다.

- `RelativeTimeFormat().format(10, 'days')` → "10일 후"
- `DateTimeFormat('kr', { dateStyle: 'full', timeStyle: 'full' }).format` → 한국 시간 계산

```javascript
const now = new Date();

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  timeZoneName: 'short'
});

const formattedDate = dateFormatter.format(now);
console.log(formattedDate); // "2023-08-30 14:30:00 UTC"
```

## ✅ 실무에서는 이렇게 쓴다

`time`이라는 시각에 `second`만큼의 초를 더해 만료 시각을 구하는 상황을 예로 들면 다음과 같다.

**Date 객체로 짰을 때**

```javascript
const expiryTime = new Date(
  new Date(time).getTime() + (second * 1000 || 0),
);
```

**moment로 바꿨을 때**

```javascript
const moment = require('moment');

const expiryTime = moment(time).clone().add(second || 0, 'seconds');
```

계산식을 직접 풀어 쓰지 않아도 되고, 시간대까지 함께 다뤄야 하는 로직에서는 가독성 차이가 확실히 난다.

## ✅ Summary

- `Date` 객체는 월 인덱스, 객체 비교, 문자열 포맷팅에서 함정이 많아 그대로 다루면 실수하기 쉬움
- 시간대를 정확히 다루려면 UTC 기준 계산 로직을 이해하거나, `moment`·`Luxon` 같은 라이브러리로 위임하는 게 안전함
- 라이브러리 설치가 부담스러운 간단한 포맷팅은 내장 `Intl`로도 충분히 처리 가능함

## 참고한 링크

- [MDN — Date](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Moment.js](https://momentjs.com/)
- [Luxon](https://moment.github.io/luxon/)
