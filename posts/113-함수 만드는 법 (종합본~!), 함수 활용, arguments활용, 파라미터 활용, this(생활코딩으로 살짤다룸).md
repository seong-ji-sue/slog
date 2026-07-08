---
title: "함수 만드는 법 (종합본~!), 함수 활용, arguments활용, 파라미터 활용, this(생활코딩으로 살짤다룸)"
date: 2021-07-21 20:13:00 +0900
categories: ["공부(Study)", "언어(JS, TS)"]
source: https://zibu-story.tistory.com/113
post_id: 113
---

### ***# 마스터 한것!(깨닭은것들~)***

1. 함수를 자유자제로 쓸수있다

2. 파라미터와 argument의 차이점과 응용을 할수있다

3. arguments객체의 씌임과 RestParameter의 씌임을 알고 응용할수있다

4. ArrowFunction로 인해 함수를 더 간결하게 사용할수있다

5. forEach 와 for 의 차이를 명확히 이해했다(개인적인 내용)

6. setTimeout, setInterval, clearInterval 로 인해 함수 호출하는 시간과 호출 생략을 할수있다

7. `$ { }` 로 인해 변수 호출을 text와 함께 자유자제로 쓸수있다

### ***# 함수 만드는법(자바스크립트 함수는 일급함수)***

1.함수 선언   
- 선언하기전에 호출가능   
- 함수 스코프 가짐

2.함수 표현식   
- 함수를 값처럼 사용하는거   
- 호이스팅 불가   
- 할당된 변수에따라 스코프 결정   
- 함수=객체(console.dir로 확인)

3. 즉시 실행 함수(IIFE, 이름이 없는 함수)   
- 함수 선언과 동시에 즉시 실행되는 함수   
- 외부에서 재사용불가   
- 함수의 리턴값을 바로 변수에 할당하고싶을때 사용   
- 프로그램 초기화시 많이 사용한다함

4. ArrowFunction(2015버전 이후로 나옴)   
- 익명함수의 축약버전   
- 함수 선언을 보다 간결하게 만들어줌   
- 파라미터가 한개일경우 소괄호 생략 가능한데   
없거나 2개이상일경우 필히 적어줘야됨   
- 리턴값이 하나이면 대괄호 생략가능한데 객체이거나 조건이 여러개일경우 생략 불가능   
- 리턴문이 객체일때 생략못하는 이유가 객체의 대괄호가 해당 함수의 대괄호로 해석하기때문임 혹시나 쓰고싶으면 소괄호 붙여주면됨   
- arguments랑 호환 불가능

```javascript
//case1 : 함수 선언식
function AZ1(numz){
    console.log(`나는 바보 ${numz}`)//
}
AZ1('다');
// case2 : 함수 표현식
let AZ2 = function(numz){
    console.log(`나는 바보 ${numz}`)
}
AZ2('다');
//case3 : 익명함수 즉시선언
(function(numz){
    console.log(`나는 바보 ${numz}`)
})('다')
//case4 : Arrow Function(2015버전이후부터 가능, () => {})
(numz1 => console.log(`나는 바보 ${numz1}`))('다');//${}는 String 전역객체 만드는거
// --> case1, case2, case3, case4 다 똑같이 출력됨
```

### ***# 함수 표현식 활용***

1. 기명함수    
- 함수 이름을 정의 안했을때 할당된 변수.name하면 변수이름이 출력   
- 함수 이름을 정의 했을때 할당된 변수.name하면 함수이름 출력   
-표현식 밖에서 함수 이름으로 접근하려면 에러

```javascript
//기명함수 - 함수의 이름을 쓰는거
let sayhi = function saybye() {
    console.log(sayhi.name);
    console.log('saybye');
}
sayhi(); //saybye출력, 함수이름 빼면 sayhi출력
//saybye();//Error
```

2.제귀함수   
함수표현식 안에서 자기 자신을 호출하는것!

```javascript
//제귀함수 - 자기자신안에서 본인 호출가능
let talk = function subtalk(n) {
    console.log(n);
    if(n == 0) {
        console.log('함수 종료');
    }else{
        subtalk(n-1);//제귀함수 이게 만약 talk였다면 Error talk는 null이니까
    }
}
//talk(5);//5~0까지 출력
let retalk = talk;//talk랑 retalk는 똑같은 subtalk를 할당받음
talk = null; //talk에는 함수가 아닌 null이 들어감
retalk(5);
```

3. 객체안의 함수   
객체 안에 속성값으로 사용 가능함

```javascript
//함수=객체인지 확인하기
let printA = function() {
    console.log('안녕A');
}
console.dir(printA); //객체로 표시됨
//객체안의 함수
let printB = {
    sa : function(){
        console.log('안녕B');
    }
}
printB.sa();
```

4. 배열안의 함수   
배열안의 요소로 사용 가능함

```javascript
//배열안의 함수
let printC = [function(){
    console.log('안녕 ㅋㅋ');
}]
printC[0]();
```

5. 콜백함수   
다른 함수 파라미터로 전달되는거

```javascript
//파라미터로 전달(콜백)
function getTalk() {
    return '안녕 안녕!';
}
function Quiz(talk){
    console.log(talk());
}
Quiz(getTalk);
```

6. 고차함수   
함수의 리던값으로 함수를 리턴함   
ex) 함수()();

```javascript
//리턴값으로 함수 전달(고차함수)
function reTalk(){
    return function returnTalk(){
        console.log('안녕안녕');
    }
}
reTalk()();
```

### ***#파라미터의 활용***

1. 기본적인방법(알규먼트갯수= 파라미터갯수)   
2. 파라미터가 더 많을때 남는거는 undefined   
(파라미더>알규먼트)   
3. undefined된 파라미터에 직접 값을 할당   
(값을 직접 전달시 알규먼트가 우선!)   
4. undefine로 파라미터에 전달가능   
(파라미터에 직접할당 없으면 undefined가 할당됨)   
5. 파라미터 안에서 연산가능   
(x, y=x+1)

```javascript
//파라미터 활용
function ftget(name) {
    console.log(`안녕 ${name}`);//${}를 쓰려면 ``(역따음표) 해줘야됨
}
ftget('뻐큐먹어');//기본적인 방법
ftget(); //name에 undefined출력

function addget(x, y=x+1+z, z=2, f){//파라미터내 연산가능
    console.log(`x = ${x}`);
    console.log(`y = ${y}`);//직접할당보다는 알규먼트가 우선이라 5 출력
    console.log(`z = ${z}`);
    console.log(`f = ${f}`);//알규펀트 안쓰면 undefined
}
addget(2, 5, undefined); //undefined 전달가능
```

#### ***\*파라미터vs알규먼트***

-파라미터 : 정의된 함수 소괄호 안에 있는 값   
-알규먼트 : 함수 호출때 소괄호 안에 있는 값

### ***#알규먼트들의 활용***

1. arguments 객체   
-유사배열(배열아닌 배열같은너)   
-배열의 메소드 사용 못함(length, for~of는 가능)   
-파라미터는 3개인데 알규먼트는 4개일때 맨마지막은 무시되는데 그럴때 해결방법   
-알규먼트로 전달한 값들을 다 묶어 유사배열로 만듬

```javascript
//argument 객체 활용
(function(a, b){ //즉시 실행 익명함수 a하고 b는 파라미터
    let sum = 0
    console.log(`${a} , ${b}`); //10만 제외하고 출력
    for(let add of arguments){ //모든 알규먼트들 arguments유사배열에 담김 for~of로 꺼내기
         sum += add; //알규먼트들 전부 더함
    }
    console.log(sum);
})(5,5,10)//알규먼트
```

2. RestParameter(2015버전 이후로 나옴)   
-완전 배열임 메소드 사용가능   
-마지막 파라미터에 써야됨   
-파라미터랑 매칭 안된 알규먼트들만 배열로 묶음

```javascript
//RestParameter(2015버전이후부터 , ...변수이름)
function ignoreFirst(...other){// ...other --> RestParameter,모든 알규먼트 배열형식으로 other에 들어감
    other.shift();//shift()가 배열의 첫번째 인자값 제거?
    for(another of other){//첫번째 요소 말고 나머지 요소 other에 배열로 저장되있는데 for~of로 꺼내기
      console.log(another);
    }
  }
  ignoreFirst('1세대', '2세대', '3세대');
  ignoreFirst('곰팡이', '강아지', '고양이');
  ignoreFirst(20, 9, 18, 19, 30, 34, 40);
```

### ***#this - 어디로 튈지 모르는 xx***

- 아무것도 없이 console.log로 출력하면 window객체나옴   
- 접근한 함수에따라 this의 값이 달라짐   
- ArrowFunction안에서 this값은 window가 나옴

<https://zibu-story.tistory.com/104>

[🔗 7. 11 생활코딩(자바스크립트 정리 후반부) - 객체, 생성자, this, 상속, Object](https://zibu-story.tistory.com/104) — \*참고한곳! 위코드 부트캠프 시작전 사전 학습하는 곳이고(부캠 안하는 사람도 학습하기 좋음!) 전반적으로 문제풀이방식으로 진행되는데 KG아이티 뱅크에서 배운 JSP강의처럼 개념이나 이론을

```javascript
//this - 어디로 튈지 모르는 xx
console.log(this); //window객체 출력됨
function printThis() {//Arrow Function 형식으로 쓰면 window객체 출력됨
    console.log(this);//호출한 객체에따라 다르게 출력
}
let myObj = {
    ad: 'myObj',
    md: printThis
};
let otherObj = {
    ad: 'otherObj',
    md: printThis
};
myObj.md(); //어떤객체? myObj
otherObj.md();//이거는 otherObj
```

#### ***\*모르는 코드***

prompt(A,B) --> A라는 설명 B라는 택스트 안 에 글 형식으로 경고창이 뜸   
`$ { }` --> 뭔지 모르겠는데 안에 변수 넣으면 됨, 역따음표 필수~   
배열이름.shift() ---> 배열의 맨 앞의 값 제거   
배열이름.forEach((변수의 요소) =>명령); ---> for 와 같이 배열의 요소를 꺼낼때 사용하는 반복문이고 차이점은 forEach는 break 와 continue, return으로 제어할수 없음   
setTimeout(함수명, ms) --> 일정 시간이 지난 후에 함수를 실행하는 방법 , 함수명() 이렇게 쓰면 않됨   
setInterval(함수명, ms) --> 일정 시간 간격을 두고 함수를 실행하는 방법, 함수명() 이렇게 쓰면 않됨   
clearInterval(함수) -->호출 중단

```javascript
//forEach
let number10 = [1,2,3,4,5];
number10.forEach(els=> console.log(els));//1~5까지 출력 반복문

//setTimeout, setInterval, clearInterval --> 어쩌다가 알게됨
let timerId = setInterval(() => console.log('째깍'), 2000);//2초(2000ms)마다 째깍
setTimeout(() => { clearInterval(timerId); console.log('정지'); }, 5000);
//5초(5000)뒤에 정지
clearInterval(timerId);//콘솔에 출력 ㄴㄴ
```

#### ***\*깜짝 Quize~!!! 위코드 FullStack 팀 Notion 참고함!***

```javascript
const teamLadder = ['신', '윤', '이', '이', '김', '한'];

setInterval(() => {
	teamLadder.forEach(member => levelUp(member));
}, everyday);
```
