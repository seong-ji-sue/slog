---
title: "TypeScript를 왜 써야 하나 — 이유, 주의점, 활용법"
date: 2023-11-30 14:20:00 +0900
description: "TypeScript가 귀찮다는 말이 나오는 이유, 그럼에도 써야 하는 이유, 그리고 실무에서 제대로 활용하는 법까지 한 번에 정리"
categories: ["딥다이브"]
tags: ["TypeScript", "타입스크립트", "type", "interface", "타입가드", "any", "unknown", "never", "void"]
series: "TypeScript 파고들기"
difficulty: 2
scope: "research"
draft: false
source: https://zibu-story.tistory.com/208
log: 71
slug: "typescript-why"
---

> **TL;DR** TypeScript는 귀찮음을 감수하고도 쓸 만한 이유가 있다 — 런타임 버그 사전 차단과 데이터 타입 명시가 핵심이다.

난이도 : ★★☆☆☆

1️⃣ **왜 써야 하나** — 런타임 에러와 데이터 타입 문제  
2️⃣ **주의할 점** — type vs interface, unknown/never/void/any, 타입 가드  
3️⃣ **활용 패턴** — 조건부 타입, Switch exhaustive check, 로딩 상태 표현

---

## ✅ 왜 TypeScript를 써야 하나

TypeScript를 쓰지 않는 이유로 가장 많이 나오는 말이 있다. "매번 타입 정의하기 귀찮고, 타입 에러 해결에 시간이 너무 걸린다"는 것이다. 충분히 이해할 수 있는 말이다. 그런데 그럼에도 TypeScript를 써야 하는 이유는 두 가지로 정리된다.

### 1. 런타임 버그를 사전에 파악하기 어렵다

JavaScript에서 객체에 없는 프로퍼티에 접근하면 런타임 에러가 발생한다. 이를 옵셔널 체이닝으로 막으면 에러는 사라지지만, 버그가 조용히 숨어들 수 있다.

```typescript
params?.age // 옵셔널 체이닝 — 에러는 없지만 undefined가 흘러다닐 수 있음
'age' in params ? params.age : undefined // typescript in 사용
typeof param === 'object' && typeof param.age === 'number' // typescript typeof 사용
```

TypeScript의 `in`이나 `typeof`로 타입 가드를 명시하면, 런타임 전에 문제를 컴파일 타임에 잡아낼 수 있다.

### 2. 데이터 타입을 유추하기 어렵다

프론트에서 API를 호출해 배열 데이터를 받아 `map`으로 렌더링하는 코드는 흔하다. JavaScript 환경에서는 백엔드 응답 구조가 바뀌어도 프론트에서 바로 알아채기 어렵다.

아래는 JavaScript 기준 예시다.

```typescript
export const findAllApi = async (params) => {
    return await axios.get(url, {params: params});
};

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

`data`의 타입이 불명확하면 `map` 호출 시 에러가 발생한다. TypeScript를 적용하면 파라미터와 반환 타입을 명시하고, 제네릭으로 API 응답 타입을 정의할 수 있다.

```typescript
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

백엔드 스키마가 바뀌면 `DataType` 인터페이스 수정만으로 영향 범위를 즉시 파악할 수 있다.

---

## ✅ 주의할 점

### 1. type과 interface 혼동하지 말기

둘은 비슷해 보이지만 성격이 다르다.

| 구분 | type | interface |
|------|------|-----------|
| 트랜스파일 포함 여부 | 포함 안 됨 | 포함됨 |
| 사용 가능 범위 | 모든 타입 | 객체 타입만 |
| 확장 | 불가 (교차 타입으로 대체) | `extend`로 확장 가능 |
| 합집합/교집합 | 가능 | 불가 |
| 선언 병합 | 불가 | 가능 |

판단 기준은 단순하다. 한 곳에서만 쓸 타입이라면 `type`, 여러 곳에서 재활용할 타입이라면 `interface`가 적합하다. `type`이 더 가볍다.

```typescript
// function
type FType = (a:string) => void;
interface FInter {(a:string):void}

// array
type AType = string[]
interface AInter{[index:number]:string}

// intersection
interface ErrorHandle {
    success:boolean;
    error?:{message:string};
}
interface ErrorData {
    data?: object
}
type TResponseType = ErrorHandle & ErrorData;
interface TResponseInter extends ErrorHandle, ErrorData{}

// union(interface 는 불가)
interface Bird{
    fly():void
}
interface Dog{
    talk():void
}
type AnimalType = Bird | Dog;

// Merge(type은 불가)
interface Ainter {
    a:string
}
interface Ainter {
    b:string
}
// 선언 병합으로 { a:string; b:string }이 됨

// 오버로딩
// 정의
함수(a:number)
함수(a:number|string)
// 사용
함수(a:number|string){
    console.log(a)//number|string
}
```

### 2. unknown / never / void / any 구분해서 쓰기

네 가지 특수 타입은 각각 역할이 다르다.

- **any**: 모든 타입 허용, 모든 타입에 할당 가능. 사이드 이펙트가 크기 때문에 사용 비권장
- **unknown**: 타입 미지정 상태. 할당은 가능하지만 다른 타입 변수에 대입하려면 타입 지정이 필요함. 사용 권장
- **never**: 예외 발생 로직, 무한루프, 특정 타입을 사용하지 못하게 할 때 씀. 모든 타입의 하위 타입
- **void**: 반환 값이 없을 때, 어떤 값이 와도 상관없지만 사용하지 않을 때 씀

```typescript
// any — 타입 안전성 없음
let a :any = 123
let str:string = a;
a = '123'
```

```typescript
// unknown — 사용 전 타입 지정 필요
let a :unknown = 123
let str:string = a; //ERROR
let b:number = a-1;//ERROR
let c:number = a as number //타입을 지정해서 넣어줘야 함

함수 (a:unknown) {
    if(typeof a === number) {
        a +1
    }
}
```

```typescript
// never — 도달 불가 로직에 씀
// Error 발생
function ErrorMs(a:string):never {
    throw new Error(a);
}

// 무한루프
function Loops():never {
    while (true) { }
}

// 특정 타입 제외
type NonString<T> = T extends string ? never : T;

const c: NonString<string> = '1' //Error.
```

```typescript
// void — 반환 없음
function ErrorMs(a:string):void {
    console.log(a)
}

// js는 기본적으로 undefined임
function func(): void {
  return; // 성공
}
function func2(): void {
  return undefined; // 성공
}
```

### 3. 잘못된 타입 가드 처리

빈 객체 타입에 프로퍼티 접근을 그냥 시도하면 타입 에러가 발생한다.

```typescript
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

// 해결방안
if ('array' in obj && Array.isArray(obj.array)) {
    // 요청 일시 필터 필수
    if ((obj?.array.length || 0) < 1) {
        res.status(400).send(errorData);
    }
}
```

`in` 연산자로 프로퍼티 존재를 먼저 확인하고, `Array.isArray`로 배열 여부까지 좁혀야 안전하다.

### 4. JS 코드에서 타입 정의 순서

애매한 객체는 타입을 먼저 정의하지 말고, 타입을 강제한 후 내부 로직을 작성하는 것이 낫다.

```typescript
const params = {
    path: req.params.path,
    name: req.params.name,
    description: req.body?.description,
    ...func(req.body, 'update'),
} as ParamsType;
```

### 5. filter, map 사용 시 undefined/null 제외

배열에서 `undefined`를 걸러낼 때는 타입 술어(type predicate)를 명시하거나 타입 단언으로 처리한다.

```typescript
// const solution1: (string | null)[]
// const solution2: (string | null)[]
const solution1 = test3.filter((str): str is (string | null) => str !== undefined);
const solution2 = test3.filter((str) => str !== undefined) as (string | null)[];
```

---

## ✅ 실무 활용 패턴

### 1. 조건부 타입으로 3항 연산자 처리

```typescript
// 기본 3항
type ItemType<T> = {
    id:T
    pw:T extends string ? StringContainer : NumberContainer
}
// never로 else 처리
type ItemTypeNever<T> = {
    id:T extends string | number ? T : never
    pw:T extends string ? StringContainer 
    : T extends number ? NumberContainer : never
}
```

### 2. Switch 문에서 never로 exhaustive check

`never`를 활용하면 `switch`에서 처리하지 않은 케이스가 생겼을 때 컴파일 에러로 잡아낼 수 있다.

```typescript
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
        case ToastType.C:
        return 'C'
        default:
        return neverExpected(toast.type)
    }
})
```

`default`에 `neverExpected`를 넣어두면 `ToastType`에 새 값이 추가됐을 때 `switch`를 빠뜨린 경우 타입 에러가 발생한다.

### 3. type으로 data loading 상태 표현

유니온 타입으로 로딩·성공·실패 상태를 하나의 타입에 담을 수 있다.

```typescript
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

`type` 필드를 좁히면 `data`, `error`, `loading` 접근이 안전하게 타입 추론된다.

---

![TypeScript 타입 시스템](/images/208/img_01.png)

---

## ✅ 정리

- TypeScript는 런타임 버그를 컴파일 타임에 차단하고, API 응답 타입을 명시해 백엔드 변경에 빠르게 대응할 수 있게 함
- `type`은 가볍고 합집합·교차 타입에 강하며, `interface`는 확장과 선언 병합이 필요할 때 씀
- `any`는 타입 안전성을 포기하므로 `unknown`으로 대체하는 것이 권장됨
- `never`는 exhaustive check와 조건부 타입의 else 처리에 활용됨
- 타입 가드는 `in`, `typeof`, `Array.isArray`를 조합해 좁혀 나가는 것이 핵심임

다음 편에서는 TypeScript 기초 문법(타입 종류, type vs interface, class)을 정리한다.

---

## 참고한 링크

- <https://zibu-story.tistory.com/208>
