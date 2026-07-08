---
title: "typescript Why?!?!?(이유, 주의, 활용)"
date: 2023-11-30 14:20:00 +0900
categories: ["공부(Study)", "언어(JS, TS)"]
tags: ["typescript", "타입스크립트", "타입스크립트 사용 이유", "타입활용", "활용"]
source: https://zibu-story.tistory.com/208
post_id: 208
---

## **안쓰는 사람들 특징 : 귀찮음**

**타입스크립트는 런타임 전 컴파일 단계에서 버그를**찾을 수 있다는 강한 이점이 있지만**

**제대로 인지를 못하고 사용하면** **타입 오류해결 하기 위해 많은 시간을 할애할 수 있다.**

**(이 내용은 필자의 생각이며 잘 못 된 부분이나 개인적인 의견이**

**있다면 자유롭게 댓글 달아줘)**

### **기초 문법 정리**

<https://zibu-story.tistory.com/210>

[🔗 typescript Enum, 제네릭, 내장](https://zibu-story.tistory.com/210) — 요즘 javascript 취업시장에 typescript는 필수가 되었다. 이는 런타임에서 버그를 예방하기 위함이다. 하지만 제대로 인지를 못하고 사용하면 쓰는 이만 못하기 때문에 꼭 제대로 알고 있자! (타입 종

<https://zibu-story.tistory.com/209>

[🔗 typescript 기초! 이 정도는 알고 있어야 함!](https://zibu-story.tistory.com/209) — 요즘 javascript 취업시장에 typescript는 필수가 되었다. 이는 런타임에서 버그를 예방하기 위함이다. 하지만 제대로 인지를 못하고 사용하면 쓰는 이만 못하기 때문에 꼭 제대로 알고 있자! (타입 종

### **✔️ Reason(사용해야 하는 이유)**

#### **자바스크립트만 사용하는 이유**

매번 타입을 정의해야 하는 번거로움 때문에 JS 를 선택하는 개발자들

타입 에러가 발생하다 보면 지정하는데 할애하는 시간도 많이 듬

그럼에도 TS에 익숙해져야 하는 이유는?

#### **타입스크립트를 사용하는 이유**

**런타임에서 버그가 발생하면 문제를 찾기 힘듬**

프로퍼티가 없을 경우 런타임에서 에러가 발생하기 때문에 파악하기 힘들어서 우리는 옵셔널 체이닝으로

임의로 undefined를 발생하지만 이는 버그를 발생시킬 위험이 있다

프로퍼티가 없을 경우 아래와 같이 in을 사용해서 타입 가드를 해야하고 typeof를 사용해서 예외 상황을 만들 수 있다.

```sqf
params?.age // ....옵셔널 체이닝
'age' in params ? params.age : undefined,//...typescript in 사용
typeof param === 'object' && typeof param.age === 'number' //...typescript typeof 사용
```

**데이터의 타입을 유추하기 힘듬**

예를 들어 프론트에서는 data라는 데이터를 배열로 받아 map 으로 레이아웃을 그리도록 구현되었는데

요소가 객체일 경우 프로퍼티가 없으면 옵셔널 체이닝으로 undefined를 사용한다.

프론트에서 data 객체를 대략적으로 유추해야하며 백엔드에서 준 데이터가 다를 경우를 감지해 조율해야 한다.

타입스크립트를 사용하면 param, return 타입을 대략적으로 정의하고 api 마다 제네릭을 통해 타입을 정의해야한다.

```cs
//**기존 로직**
//api
export const findAllApi = async (params) => {
	return await axios.get(url, {params: params});
};

//component
const getData = useCallback(async () => {
	try {
		setLoading(true);
		const res = await findAllApi(params);
		await setData(res.data);
	} catch (e) {
		console.log(e);
		setData([]);
	} finally {
		setLoading(false);
	}
}, [DependencyList]);

return (
	<div>
		{data.map((v) => {//error
			return (
				<div>...내부로직</div>
			);
		})}
	</div>
);
```

```dart
//**타입 적용**
export interface ParamType {
	//...param 타입 표시
}

export interface DataType {
	//...return 타입 표시
}

export const findAllApi = async (
	params:ParamType
):Promise<AxiosResponse<DataType[]>> => {
	return await axios.get(url, {params: params});
};
```

### **✔️ Caution(주의해야 될 점)**

#### **type 과 interface 헷깔리지 말기**

type 하고 interface 의 차이점을 명확하게 인지하고 있어야 한다.

1. type : 트랜스 포함 안됨, 모든 타입에 가능, 확장 불가능
2. interface : 트랜스에 포함, 합집합 교집합 안됨, 객체 타입에만 가능, extend 로 확장

→ 단순히 한 곳에서 쓸껀지 다양한 곳에서 재활용해서 사용할껀지 파악(type이 더 가벼움)

```angelscript
//function
type FType = (a:string) => void;
interface FInter {(a:string):void}

//array
type AType = string[]
interface AInter{[index:number]:string}

//intersection
interface ErrorHandle {
    success:boolean;
    error?:{message:string};
}
interface ErrorData {
    data?: object
}
type TResponseType = ErrorHandle & ErrorData;
interface TResponseInter extends ErrorHandle, ErrorData{}

//union(interface 는 불가)
interface Bird{
    fly():void
}
interface Dog{
    talk():void
}
type AnimalType = Bird | Dog;

//Merge(type은 불가)
interface Ainter {
    a:string
}
interface Ainter {
    b:string
}
interface Ainter {
    a:string
		b:string
}

//오버로딩
//정의
함수(a:number)
함수(a:number |string)
//사용
함수(a:number|string){
	console.log(a)//number|string
}
```

#### **unkwon never void any 잘 적기**

무분별하게 any만 사용할 경우 버그를 발생시킬 위험이 있음

타입을 모를 경우 unknown,

값이 없을 경우 void(undefined랑 헷깔리지 말 것),

예외나 예상하지 못한 값이 올 경우 never,

기억할 것!!

**any**

모든 타입을 허용하는 타입, 반대로 모든 타입에 할당 가능, 사이드 이팩트, 사용 안하는 것을 추천

```nix
let a :any = 123
let str:string = a;
a = '123'
```

**unkown**

아직 타입이 지정되지 않는 상태, 어떤 값이든 할당은 가능하나 다른 타입 변수에 대입할 때는 타입을 지정해야 함, 사용 권장, 타입을 계속 체크 해줘야 함

```typescript
let a :unknown = 123
let str:string = a; //ERROR
let b:number = a-1;//ERROR
let c:number = a as number //타입을 지정해서 넣어줘야 함

함수 (a:unknown) {
	if(typeof a === number) {
		a +1
}
```

**never**

예외가 발생하는 로직일 때, 무한루프, 특정 타입을 사용 못하게 할 때, 모든 타입의 하위, 타입 추론이 되지 않을 때 사용, 조건문에서 else 나올 때 Error 나오게 가능

```typescript
//Error 발생
function ErrorMs(a:string):never {
    throw new Error(a);
}

console.log(ErrorMs('asdasd'))

//무한루프
function Loops():never {
    while (true) { }
}

console.log(Loops())

//특정 타입 제외
type NonString<T> = T extends string ? never : T;

const c: NonString<string> = '1' //Error.
```

**void**

반환 값이 존재하면 안될 때, 어떠한 값이 와도 상관 없지만 사용하지 않을 때

(사용하는 경우가 있는데 좀 더 찾아보기)

```actionscript
function ErrorMs(a:string):void {
    console.log(a)
}

//js는 기본적으로 undefinded임
function func(): void {
  return; // 성공
}
function func2(): void {
  return undefined; // 성공
}
```

#### **잘 못된 타입 가드 처리**

프로퍼티 예외의 상황을 잘 파악하며 작성해야 한다.

```angelscript
let obj:{} = {};

// 아이디 존재
if (obj.has(id)) {
	//...property를 넣는 로직
}

// 요청 일시 필터 필수
//TS2339: Property 'array' does not exist on type '{}'.
if ((obj?.array.length || 0) < 1) {
	res.status(400).send(errorData);
}

//해결방안
if ('array' in obj && Array.isArray(obj.array)) {
	// 요청 일시 필터 필수
	if ((obj?.array.length || 0) < 1) {
		res.status(400).send(errorData);
	}
}
```

#### **JS 코드에서 타입 정의 순서**

애매한 것은 타입 먼저 정의하지 말고 타입을 강제한 후 내부 로직을 작성함

```roboconf
//명확하게 타입 지정 as 로 지정하면 params가 TUpdateGcpRole
const params = {
			path: req.params.path,
			name: req.params.name,
			description: req.body?.description,
			...func(req.body, 'update'),//func 함수 타입 정의 x
		} as ParamsType;
```

#### **filter, map 등 사용할 때 undefined, null 제외**

```typescript
// const solution1: (string | null)[]
// const solution2: (string | null)[]
const solution1 = test3.filter((str): str is (string | null) => str !== undefined);
const solution2 = test3.filter((str) => str !== undefined) as (string | null)[];
```

### **✔️Conjungation(활용해야 될 것)**

#### **3항 연산자 처리 방법**

```elm
//기본 3항
type ItemType<T> = {
    id:T
    pw:T extends string ? StringContainer : NumberContainer
}
//never로 else 처리
type ItemTypeNever<T> = {
    id:T extends string | number ? T : never
    pw:T extends string ? StringContainer 
    : T extends number ? NumberContainer : never
}
```

#### **Switch 문 처리**

```groovy
enum ToastType {A, B, C}
interface Toast { type: ToastType,createAt: string}

const toasts: Toast[] = [
    {type:ToastType.A, createAt:'2020' }, 
    {type:ToastType.B, createAt:'2020' },
    {type:'sad', createAt:'2020' }
]

function neverExpected(val: never):never {
    throw new Error("Unexpected")
}

const toastTest = toasts.map((toast) => {
    switch(toast.type) {
        case ToastType.A:
        return 'A'
        case ToastType.B:
        return 'B'
        case ToastType.C: //이거를 else 처리하면 안됨
        return 'C'
        default:
        return neverExpected(toast.type)
    }
})

console.log(toastTest)
```

#### **type을 붙여서 data loading**

```lua
type Result<T> = 
| { type: 'reject', error:Error, loading:false}
| { type: 'success', data: T, loading:false}
| { type: 'fulfill', loading:true}

declare function getResult(): Result<string>;

const r = getResult();

if(r.type === 'success') console.log(r.data)
if(r.type === 'fulfill') console.log('대기중')
if(r.type === 'reject') console.log(r.error)
```

#### **else 처리 방법**

```groovy
enum ToastType {A, B, C}
interface Toast { type: ToastType,createAt: string}

const toasts: Toast[] = [
    {type:ToastType.A, createAt:'2020' }, 
    {type:ToastType.B, createAt:'2020' },
    {type:'sad', createAt:'2020' }
]

function neverExpected(val: never):never {
    throw new Error("Unexpected")
}

const toastTest = toasts.map((toast) => {
    switch(toast.type) {
        case ToastType.A:
        return 'A'
        case ToastType.B:
        return 'B'
        case ToastType.C: //이거를 else 처리하면 안됨
        return 'C'
        default:
        return neverExpected(toast.type)
    }
})

console.log(toastTest)
```

![다운로드 (3).png](../images/208/img_01.png)
