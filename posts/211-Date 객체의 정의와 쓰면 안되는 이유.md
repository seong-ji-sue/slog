---
title: "Date 객체의 정의와 쓰면 안되는 이유"
date: 2023-12-05 11:08:00 +0900
categories: ["공부(Study)", "언어(JS, TS)"]
tags: ["Date", "javascript", "javascript date", "Moment", "자바스크립트"]
source: https://zibu-story.tistory.com/211
post_id: 211
---

**자바의 Date 객체를 따라 만들었다는 뇌피셜….**

**하지만 자바는 Date 객체 잘 안씀**

**(이 내용은 필자의 생각이며 잘 못 된 부분이나 개인적인 의견이**

**있다면 자유롭게 댓글 달아줘)**

### **✔️ Summary**

1. **Date 객체 사용 방법**
2. **어느 곳에서나 한국시간 보여주기**
3. **Date 객체의 문제점**
4. **시간을 다루는 라이브러리 종류와 사용방법, 예시**
5. **실제 코드에 적용**

### **✔️**Date 객체 사용 방법**

#### **메소드 종류**

**new Date()**

설명 현재 날짜와 시간을 가져오는 Date 객체를 생성합니다.

```lasso
// KST(Korea Standard Time)는 GMT(그리니치 평균시: Greenwich Mean Time)에 9시간을 더한 시간이다.
let date = new Date(0);
console.log(date); // Thu Jan 01 1970 09:00:00 GMT+0900 (한국 표준시)

// 86400000ms는 1day를 의미한다.
// 1s = 1,000ms
// 1m = 60s * 1,000ms = 60,000ms
// 1h = 60m * 60,000ms = 3,600,000ms
// 1d = 24h * 3,600,000ms = 86,400,000ms
date = new Date(86400000);
console.log(date); // FFri Jan 02 1970 09:00:00 GMT+0900 (한국 표준시)
```

**Date.now()**

1970년 1월 1일 00:00:00(UTC)을 기점으로 현재 시간까지 경과한 밀리초를 숫자로 돌아온다.

```vbscript
const now = Date.now();
console.log(now);
```

**getFullYear()**

현재 연도를 반환합니다.

```javascript
const currentDate = new Date();
const year = currentDate.getFullYear(); // 현재 연도
```

**getMonth()**

현재 월을 반환합니다. (0부터 시작, 0: 1월, 1: 2월, ...)

```javascript
const currentDate = new Date();
const month = currentDate.getMonth(); // 현재 월 (0부터 시작)
```

**getDay()**

재 요일을 반환합니다. (0: 일요일, 1: 월요일, ...)

```javascript
const currentDate = new Date();
const dayOfWeek = currentDate.getDay(); // 현재 요일 (0: 일요일, 1: 월요일, ...)
```

**getTime()**

1970년 1월 1일부터 현재까지 경과한 밀리초를 반환합니다. (타임스탬프)

```javascript
const currentDate = new Date();
const timestamp = currentDate.getTime(); // 타임스탬프
```

#### **활용 예시**

```scheme
(function printNow() {
  const today = new Date();

  const dayNames = ['(일요일)', '(월요일)', '(화요일)', '(수요일)', '(목요일)', '(금요일)', '(토요일)'];

  // getDay: 해당 요일(0 ~ 6)를 나타내는 정수를 반환한다.
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

  // 10미만인 분과 초를 2자리로 변경
  minute = minute < 10 ? '0' + minute : minute;
  second = second < 10 ? '0' + second : second;

  const now = `${year}년 ${month}월 ${date}일 ${day} ${hour}:${minute}:${second} ${ampm}`;

  console.log(now);
  setTimeout(printNow, 1000);
}());
```

### **✔️**어느 곳에서나 한국시간 보여주기**

#### **UTC, GMT, KST 의 차이점**

즉 UTF를 기본적으로 사용하며 세계의 시간을 다루려면 KST 에서 UTF로 바꾸어서 작업해야 함

- **UTC (Coordinated Universal Time)**
  - UTC는 협정 세계시(Coordinated Universal Time)의 약자
  - 원자 시계를 기반으로 한 국제 표준 시간
  - JavaScript의 Date 객체는 내부적으로 UTC를 사용하여 날짜와 시간을 처리
- **GMT (Greenwich Mean Time)**
  - GMT는 그리니치 평균시(Greenwich Mean Time)의 약자
  - GMT는 영국 그리니치 천문대의 평균 태양 시간을 기준으로 한 시간
  - UTC와 GMT는 일반적으로 동일한 시간으로 간주되지만 엄밀하게 말하면 미세한 차이, 잘 안씀
- **KST (Korea Standard Time)**
  - 한국 표준시(Korea Standard Time)의 약어로, 한국의 표준 시간대를 나타냄
  - KST는 UTC+9로서, 협정 세계시(UTC)에서 9시간 뒤의 시간을 가리킴
  - 한국의 공식 표준 시간대이며, 한국의 대다수 지역에서 사용
  - 한국의 지역 시간대를 나타내므로, 한국 이외의 지역에서 사용할 때에는 지역의 시간대를 고려

#### **어느 곳이든 한국 시간 계산 방법**

> PC 설정된 시간이 KST면 그냥 사용해도 됨, UTF로 프로그램이 세팅 되어 있다면 안해도 됨 라이브러리를 이용하면 쉽게 세팅 가능

getTimezoneOffset : 현재 사용자 PC 설정 시간대로부터 UTC 시간까지의 차이를 '분'단위로 리턴

getTime : 는 '1970년 1월1 일 00:00:00 UTC'로부터 주어진 시간 사이의 경과시간(밀리초)를 리턴

```angelscript
// 1. 현재 시간(Locale)
const curr = new Date();//사용자 PC에 설정된 시간대 기준으로 시간을 표시
console.log(curr)

// 2. UTC 시간 계산
const utc = curr.getTime() + (curr.getTimezoneOffset() * 60 * 1000);

// 3. UTC to KST (UTC + 9시간)
const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
const kr_curr = new Date(utc + (KR_TIME_DIFF));

console.log(kr_curr)
```

### **✔️**Date 객체의 문제점**

#### **new Date해서 나온게 RFC 임 → ISO 로 바꿔줘야 함**

```lasso
let date = new Date();
console.log(date.toISOString())
```

#### **문자 포멧 시 전부 다 뽑아야 함**

```qml
let date = new Date();
let str = `${date.getFullYear()}년 ${date.getMonth()월 ${date.getDate()일}`
```

#### **월을 출력 0부터 11까지 출력 +1 해줘야 함**

```angelscript
date.getMonth()+1 // getMonth 8 -> 9월 
```

#### **set, get으로 연산해야 되고 20220931 + 1개월을 하면 20221201로 나옴**

```lasso
let date = new Date(2022,09,31)
date.setMonth(date.getMonth()+1)
```

#### **객체이기 때문에 getTime으로 비교해야 함**

```javascript
const time1 = new Date("2023-08-01T00:00:00")
const time2 = new Date("2023-08-01T00:00:00")

const checkDate = time1 === time2 //false
const checkTime = time1.getTime() === time2.getTime() //true
```

#### **요일을 구하려면 배열에 요일의 값을 저장해서 매칭, 일요일이 0임**

```javascript
const koreanDaysOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const currentDate = new Date();

// 요일 가져오기 (0: 일요일, 1: 월요일, 2: 화요일, ..., 6: 토요일)
const dayOfWeek = currentDate.getDay();
const koreanDayOfWeek = koreanDaysOfWeek[dayOfWeek];
console.log(`오늘은 ${koreanDayOfWeek} 입니다.`);
```

### **✔️시간을 다루는 라이브러리 종류와 사용방법, 예시**

#### **moment.js**:

시간을 다루기 위한 강력한 라이브러리로, 날짜 형식화, 날짜 계산, 로컬화 등 다양한 기능을 제공

다양한 플러그인과 확장 기능을 제공하여 프로젝트의 요구 사항에 맞게 확장

Moment.js에서 시간대 처리를 하려면 moment-timezone 라이브러리를 설치

```javascript
// Moment.js 라이브러리 가져오기
const moment = require('moment');

// 현재 시간 얻기
const currentTime = moment();

// 특정 날짜와 시간 파싱
const customDate = moment('2023-08-30T14:30:00');

// 날짜 및 시간 형식 지정
const formattedTime = currentTime.format('YYYY-MM-DD HH:mm:ss');

// 날짜 및 시간 연산
const tomorrow = currentTime.add(1, 'day');

// 시간 차이 계산
const timeA = moment('2023-08-30T12:00:00');
const timeB = moment('2023-08-31T14:30:00');
const duration = moment.duration(timeB.diff(timeA));
const hoursDiff = duration.asHours();

console.log('현재 시간:', formattedTime);
console.log('내일:', tomorrow.format('YYYY-MM-DD HH:mm:ss'));
console.log('시간 차이 (시간):', hoursDiff);
```

#### **Luxon**

기본적으로 시간대 정보를 처리할 수 있는 기능을 내장

생성한 날짜 및 시간 객체는 불변성

다양한 언어로 사용자 정의 형식화 옵션을 제공하여 요구사항에 맞게 날짜와 시간을 표시

```processing
const { DateTime } = require('luxon');

// 현재 시간 얻기
const now = DateTime.now();
console.log(now.toISO()); // ISO 8601 형식으로 현재 시간 출력

// 특정 날짜 및 시간 생성
const customDate = DateTime.fromObject({
  year: 2023,
  month: 8,
  day: 30,
  hour: 14,
  minute: 30,
  second: 0,
  zone: 'Asia/Seoul', // 시간대 설정
});
console.log(customDate.toFormat('yyyy-MM-dd HH:mm:ssZZ')); // "2023-08-30 14:30:00+09:00"

// 날짜 및 시간 연산
const tomorrow = now.plus({ days: 1 });
console.log(tomorrow.toISO()); // 다음 날짜와 시간 출력
```

#### **Intl**

라이브러리 아님 내장

RelativeTimeFormat().format(10,’days’) : 10일 후

DateTimeFormat(’kr’,{dateStyle:’full’, timeStyle:’full’}).format: 한국시간 계산

```processing
const now = new Date();

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  hour12: false, // 24시간 형식 사용
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short'
});

const formattedDate = dateFormatter.format(now);
console.log(formattedDate); // "2023-08-30 14:30:00 UTC"
```

### **✔️**실제 코드에 적용**

#### **상황**

time 이라는 시간에 second 라는 초를 더해 시간을 구하는 상황

#### **적용**

**Date 객체**

```vbscript
const expiryTime = new Date(
	new Date(time).getTime() + (second * 1000 || 0),
);
```

**moment로 변경**

```php
const moment = require('moment');

// expiryTime 계산
const expiryTime = moment(time).clone().add(second || 0, 'seconds');
```
