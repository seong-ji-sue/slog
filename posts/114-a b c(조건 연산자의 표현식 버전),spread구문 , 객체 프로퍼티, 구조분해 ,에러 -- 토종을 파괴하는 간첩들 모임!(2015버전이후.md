---
title: "a ? b : c(조건 연산자의 표현식 버전),spread구문 , 객체 프로퍼티, 구조분해 ,에러 --> 토종을 파괴하는 간첩들 모임!(2015버전이후 사용가능)"
date: 2021-07-22 23:47:00 +0900
categories: ["공부(Study)", "언어(JS, TS)"]
source: https://zibu-story.tistory.com/114
post_id: 114
---

### ***# 깨닭은것!(개념을 이해함!)***

1. a ? b : c 가 무슨 의미인지 알게됬음!

2. 왜 for문하고 while, if 문이 변수에 콘솔에 바로 출력하는게 않되는지 알게됬음

3. let a = [...b , '니똥']; 에서 ...b가 저번에 배운 rest파라미터랑 다르다는것을 깨닭았음

4. 배열에서 splice메소드와 push 메소드를 합쳐서 새로운 방식으로 쓸수있다는것을 알게됫음

5. 객체에서 속성자리에는 문자열이나 숫자 변수 이렇게 올수있었는데 표현식이 올수있고

점표기법으로 호출시 표현식을 ([문자열] 이거랑 다름) 쓸수있다는것을 알게됬음

6. 객체.속성?.속성 여기서 ?. 이거는 뭥미 라고 생각했었는데 if문이랑 비슷하고 삼항연산이랑 미슷하다는것을 깨닭음

7. 보통 배열에 요소들을 빼낼때 for~of나 직접 하나씩 변수에 할당했는데 이거를 한줄로 요약 가능!

[변수이름, 변수이름, 변수이름]=배열이름

8. 객체에서 값을 뺄때 점표기법으로 했고 ?. 로 통해 속성이 있는지 확인했는데 이것도 한줄로 요약가능!

{속성 : 변수이름, 표현식 : 변수이름} = 객체이름

9. 예외 처리 방식은 자바랑 비슷한데 더 간결해짐! thow랑 try~catch~finally 같음!

### ***#문장vs표현식***

1. 문장    
- 어떤 동작이 일어나도록 작성된 최소한의 코드 덩어리   
- 선언문, 할당문, 조건문, 반복문 .. 이렇게 끝에 문이라고 붙은 이유가 모두 동작을 수행하는 문장   
- 중괄호로 표시    
- for, while if는 문장ㅇㅋ 표현식 ㄴㄴ   
고로 콘솔에 바로 출력 에러   
2. 표현식    
- 결과적으로 하나의 값이 되는 모든 코드를 가리킵니다   
- 세미콜론으로 표시

```javascript
//문장 : 동작이 일어나도록하는 문장
let x;//case1 : 변수를 선언하는것(선언문)
x = 5;//case3 : 변수에 값을 할당(할당문)
if (x < 5) { //case2 : if (조건문)
    console.log('x는 5보다 작다');
}
for (let i =0 ; i<5 ; i++) {//case4 : while이나 for(반복문)
    console.log(i);
}
//표현식 : 결론적으로 값이되는것
console.log(5+4); // case2 : 연산 및 값출력
let codeit = {num : 25};//case3 : 객체 생성
let number = [1,2,3];// case4 : 배열 생성
typeof codeit;//case5 : typeof 함수
codeit.name//case6 : 객체 속성으로 값 가져오기

//문장이면서 표현식? =잡종~!
let title = 'JSP'; //case1 : 값을 title한테 할당(동작),할당한 값 가지기(표현식?)
function flog(){console.log('asd')}
flog(); //case2 : 함수 호출 = 함수를 실행하는것(동작), 실행한 함수의 리턴값 가지기(표현식)
console.log('니똥'); //case3 : console.log 메소드는 콘솔에 아규먼트를 출력하는 동작도 하지만,
                    // 리턴값을 undefined 값을 가지는 표현식이다.

//토종이 문장인 녀석~!    
//let aswq = if('니똥') { //error~!
    //문장은 조건식에 true, 토종이 문장인 녀석과 표현식 같이 쓸수 없음
    console.log('어 니똥 맞아~'); 
//});
```

### ***#조건 연산자 (2015버전, 간첩임?ㄷㄷ)***

- 구조 : 조건 ? true일때 실행부분 : false일때 실행부분   
- why ? : 일반적으로 조건연산자는 문장임 (표현식이랑 혼합 ㄴㄴ), 그부분을 해결하기 위해 표현식으로 문장을 다루는 연산자가 나옴   
-삼항 연산자라고 불림   
-조건문안에 다른 반복문 조건문이 올수 없음

```javascript
//간첩 조건 연산자 ( 조건식 ? true : flase)
let speed = 30;
const msg = speed > 50 ? '[주의!]과속주행 중입니다.' : '정속주행 중입니다.';//case1 : 간첩조건연산 정상동작!
// const msg = if(koreaScore > otherScore) { //case2 : 토종 조건연산 error
//     return '니 간첩임?';
// }else {
//     return '뒤져라';
// }
console.log(msg);
```

### ***# spread 구문 ( 가독성 good!, 사용주의!)***

1. 배열에서 대괄호가 없어지고 요소만 출력함   
2. rest파라미터랑 헷깔릴수 있으니 주의   
3. 객체일 경우    
- A객체배열을 B객체로 할당하면 값이 복사되는게 아닌 가리키게 되는데(참조하게됨)

이때 B객체를 바꾸면 A객체도 바뀜   
- 그래서 어떻게? : slice()메소드를 사용해도 되지만 spread구문을 사용하기도함    
- 왜 slice()보다 spread 권장? : 값을 복사하고(slice()) 추가(push())를 동시에 할수 없지만 spread는 가능   
4. 2개의 배열을 합쳐서 새로운 배열 생각 가능 혼종 탄생~!   
5. 각각의 알규먼트들로 사용할수있음   
6. 배열에 있는 요소를 spread 구문으로 객체형식으로 쓰면 ? 새로운 객체 탄생~!   
7. 주의! : spread구문은 값의 아님! 변수에 할당 불가능, 객체-> spread배열 불가능

```javascript
//spread 구문

//case1 : 살펴보기~!
let koreaWord = ['한국', '독도', '강남'];
console.log(...koreaWord); //한국 독도 강남 이렇게 출력

//case2 : 객체일경우
let aCopyer = [1, '한국', () => console.log];
//let bCopyer = aCopyer //이렇게 하면 aCopyer에도 니똥이 출력됨
//let bCopyer = aCopyer.slice(); //slice(값복사),push(값추가) 2개 동시에 쓰기 싫음
//bCopyer.push('니똥');
let bCopyer = [...aCopyer,'니똥'];// 가독성 보안 문제해결 good!
console.log(aCopyer); 
console.log(bCopyer); 

//case3 : 배열합치기
let aPlus = [1,2,3];
let bPlus = [2,2,1];
let sumPlus = [...aPlus, ...bPlus]; //spread활용해 합치기
console.log(sumPlus);
let sumPlus2 = aPlus.concat(bPlus);//concat메소드 활용해서 합치기
console.log(sumPlus2);

//case4 : 알규먼트로 사용하기
let agbPlay = [1,2];
let sysPlay = (a,b,c=a+b) => {console.log(a+b+c)};//Arrow함수
sysPlay(...agbPlay);//spread로 배열안의값 파라미터에 전달

//case6 : 새로운 객체만들기
let newcopi = [12,32,1];
let newdasd = {...newcopi};
console.log(newdasd);//객체형식으로 출력됨

//case5 : 주의사항!
let abcTest = [1,2];
//let dsaTest = ...abcTest; // 값으로 할당 불가능 error
let abcTest2 = [1,2,123];
let newdasd2 = {...abcTest2};
console.log([1,2,3,4]); //바로 배열만들기 : 가능
console.log([...abcTest2]);//배열 -->spread :가능
console.log([newdasd2]);//객체 --> 배열 : 가능
//console.log([...newdasd2]);//객체 -->spread :불가능
```

### ***# 객체 프로퍼티 표기법 (2015버전이후)***

-속성과 프로퍼티 이름이 같을때 축약할수있음   
-계산된 속성명으로 사용가능   
-점표기법 업그레이드 버전인 옵셔널 체이닝 연산자 사용가능(2020년 버전이후)

```javascript
//객체 프로퍼티 표기법, 계산된 속성명
title = '안녕 나는 바보야';
let whyer = {
    title, //title : title 을 줄인거
    printerA () { // printerA : function() 을 줄인거
        console.log('그래 알아 너 바보야');
    },
    ['asd'+title.length] : '굿잡' // 속성을 [표현식(계산식)] 형태로 쓸수있음 그안에 함수도 올수 있음
};
console.log(whyer);
console.log(whyer['asd'+title.length]);//밑에랑 같은말 굿잡 출력 -->계산된 속성명
console.log(whyer.asd9);

console.log(whyer.name?.title ?? '이름이 없음'); //옵셔널 체이닝 -->객체이름.속성값?.true시 속성값
//코드풀이 : whyer에 name속성이 없으면 undefined 출력 , name속성이 있으면 title속성
// ??(null병합 연산)때문에 whyer.name.title 값 출력
```

### ***# 구조분해 (2015이후 사용가능)***

1. 배열    
- 배열의 요소를 각각 변수에 할당하는거를 가독성 있게 바꿀수 있음   
- 파라미터로 구조분해를 쓰고 배열을 알규먼트로 쓸수도있음   
- 표기법 : [변수이름,변수이름] = 객체이름   
2. 변수   
- 변수의 값을 바꿀때 새로만든 변수에 옮겨 담아서 했었는데 한출로 줄일수 있음   
- 표기법 :[변수이름1,변수이름2] = [변수이름2,변수이름1]   
3. 객체    
- 객체에서도 활용할수 있음    
- 할당하는게 아닌 객체의 속성과 같은 값이 있는지 찾고 프로퍼티를 가져옴   
- 할당해주고 싶으면 : 우측에 변수이름 표기하면됨   
- 파라미터로 구조분해 알규먼트로 객체를 전달받아 바로 속성으로 접근할수있다.   
- 표기법 : let { 속성값 : 변수이름} = 객체이름;

```javascript
//구조분해
//변수 배열
let aArrayT = ['아','나','바','다'];
[abun, bbun='구', ...cbun] = aArrayT; //구조분해 rest파라미터 직접할당 사용가능
// let abun = aArrayT[0];//평소 방법
// let bbun = aArrayT[1];
// let cbun = aArrayT[2];
console.log(`${abun}${bbun}${cbun}`);

[aArrayT[1],aArrayT[2]] = [aArrayT[2],aArrayT[1]];//값 바꾸기
console.log(aArrayT);//아바나다 출력

//객체
let mackbook = {
    mackName : '맥 2012',
    '맥 좋아?' : '아니!',// 프로퍼티 표기법으로 사용가능
    price : '300만원'

};
let mackName2 = mackbook.mackName; //일반적인 점표기법
let {mackName,...rest} = mackbook; //rest파라미터 사용가능
let {['맥'+' 좋아?'] : answerMy} = mackbook;//맥 좋아?라는 속성을 찾고 answerMy에 넣음
console.log(rest);// { '맥 좋아?': '아니!', price: '300만원' } 출력
console.log(answerMy);//아니!출력
```

### ***#에러와 에러객체***

- 문제 : 에러가 발생시 프로그램 자체가 멈춰버림   
- 에러객체의 이름 name과 메세지를 담는 message가 있음   
-throw 에러객체 : 에러객체를 임의로 발생시키기   
- try~catch~finally : 에러를 다루는 코드 ,finally는 생략가능   
- 표기법 : try{ 에러코드} catch(에러이름) {에러발생시 동작코드} finally{에러나든 안나든 무조건 실행}   
- console.err(에러이름) 으로 출력하면 실제 에러처럼 출력됨   
- 블록스코프이기때문에 let이나 const변수일때 밖에나 다른블록에서 변수 사용 못함 잘 생각해야됨   
- 예외처리(Exception) : 실행가능한 코드 블록에서 코드를 다루는것

```javascript
//예외처리
try{//에러날것같은 코드 적는곳
    console.log('에러발생할께~');
    throw new TypeError('타입에러가 발생');//throw로 임의로 에러발생 throw빼고 변수에 할당도됨
}catch(e){//에러날때 실행
    console.error(e.name)//에러이름체크 massage는 에러시 메세지
}finally{//에러나든 안나든 실행
    console.log('에러처리완료!')
}
```

#### ***\*참고용 : 에러객체 종류***

<https://developer.mozilla.org/ko/docs/orphaned/Web/JavaScript/Reference/Global_Objects/Error>

[🔗 Error | MDN](https://developer.mozilla.org/ko/docs/orphaned/Web/JavaScript/Reference/Global_Objects/Error) — Error 객체는 런타임 오류가 발생했을 때 던져집니다. Error 객체를 사용자 지정 예외의 기반 객체로 사용할 수도 있습니다. 아래 표준 내장 오류 유형을 참고하세요.

### ***\* 몰랐던거***

- 객체는 for~of문을 사용할수 없음

### ***#Quize***

```javascript
//Quiz - 함수, 객체의 활용
let jisue = {name : 'jisue', game(name) {return name}, [100 ?? 20] : '잘한다'};
function addPrint ({name}){
    console.log(`${name}는`);
    console.log(`${jisue.game(10>2 ? '롤' : '스타')}를`);
    console.log(`${jisue[100 ?? 20]}`);
}
addPrint(jisue);
```
