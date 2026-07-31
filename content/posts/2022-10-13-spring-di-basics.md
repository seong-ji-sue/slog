---
title: "스프링 DI — 의존성 주입은 왜, 어떻게 하나"
date: 2022-10-13 15:18:00 +0900
description: "필드·setter·생성자 주입 세 가지 방식의 차이와 컴포넌트 스캔·수동 빈 등록으로 의존관계를 설정하는 방법 정리"
categories: ["딥다이브"]
tags: ["Spring", "SpringBoot", "DI", "의존성주입", "Bean"]
series: "스프링 파고들기"
difficulty: 1
scope: "research"
log: 63
slug: "spring-di-basics"
source: https://zibu-story.tistory.com/200
draft: false
---

> **TL;DR** — 의존관계 주입(DI)은 스프링 컨테이너에 등록된 빈에서 필요한 객체를 찾아서 넣어주는 것이다. 주입 방식은 필드·setter·생성자 세 가지가 있는데, 실무에서는 불변성을 보장하는 생성자 주입을 기본으로 쓴다.

난이도 : ★☆☆☆☆

1️⃣ `의존관계(DI)` 2️⃣ `필드/setter/생성자 주입` 3️⃣ `컴포넌트 스캔`

## ✅ 왜 알아야 하나

`@Autowired`를 붙이면 알아서 객체가 주입된다는 것만 알고 넘어가면, 왜 실무에서 필드 주입 대신 생성자 주입을 권장하는지 설명하기 어렵다. 주입 방식마다 트레이드오프가 다르고, 컴포넌트 스캔과 수동 빈 등록을 언제 나눠 써야 하는지도 헷갈리기 쉽다.

- 코드: [깃허브 Repository](https://github.com/seong-ji-sue/springboot-inflearn-kimyounghan-basic)

![](/images/200/img_01.gif)

## ✅ 의존관계(DI)란

A가 B를 의존한다는 건 의존 대상인 B가 변하면 그 영향이 A에게 미친다는 뜻이다. 의존관계 주입은 이 관계를 스프링 컨테이너에 등록된 빈(Bean)에서 찾아서 설정해주는 방법이다. 컨트롤러가 서비스 구현이 바뀌어도 코드를 직접 고치지 않아도 되게 해준다.

주입이 일어나는 과정은 다음과 같다.

1. 스프링 컨테이너가 `@Component`가 붙은 클래스를 찾아서 모두 스프링 빈으로 등록한다.
2. 의존성이 필요한 곳에 `@Autowired`가 있으면 등록된 빈에서 찾아 의존관계를 주입한다.

```angelscript
//controller
class Controller{
    private Service service;

    public Controller() {//의존성 주입
        service = new Service();        
    }
}

//service
interface Element {

}

class Service implements Element{

}
```

## ✅ 의존성 주입의 세 가지 방식

### 필드 주입

필드(변수)에 `@Autowired`를 붙여서 자동으로 주입한다. 코드는 간결하지만 객체 생성 후에는 변경하기 어렵다.

```groovy
@Controller
public class Controller {
	@Autowired private Service service; //service단
}
```

### setter 주입

setter 메서드를 public으로 열어둬서 인스턴스 생성 후에도 언제든 변경할 수 있다. 반대로 말하면 아무 곳에서나 값을 바꿀 수 있다는 뜻이기도 하다.

```java
@Controller
public class Controller {
	private Service service; //service단

	@Autowired
	public void setController (Service Controller) {
		this.service = service;
	}

}
```

### 생성자 주입

인스턴스를 생성하면서 바로 주입받는다. 인스턴스 하나당 등록된 빈 하나만 주입되기 때문에 불변성을 갖는다. 실무에서 가장 권장되는 방식이다.

생성자 주입이 권장되는 이유는 불변성 하나만이 아니다. 두 빈이 서로를 필요로 하는 **순환 참조(circular dependency)**가 생겼을 때, 필드·setter 주입은 객체를 일단 빈 껍데기로 만들어두고 나중에 값을 채워 넣는 방식이라 기동 자체는 되어버리는 경우가 있어 문제를 늦게(런타임에) 발견하게 된다. 반면 생성자 주입은 객체 생성 시점에 필요한 의존성이 모두 갖춰져 있어야 하므로, 순환 참조가 있으면 애플리케이션 기동 시점에 곧바로 에러(`BeanCurrentlyInCreationException` 등)로 잡아준다 — 문제를 최대한 빨리 드러내는 fail-fast 관점에서도 생성자 주입이 유리하다.

```java
@Controller
public class Controller {
	private final Service service; //service단

	@Autowired
	public Controller (Service service) {
		this.service = service;
	}

}
```

## ✅ 의존관계 설정 방법

정형화된 코드는 컴포넌트 스캔 방식을 기본으로 쓰고, 구현 클래스를 상황에 따라 바꿔야 하는 경우에는 수동으로 등록한다.

### 수동으로 빈을 등록하는 방법

1. `Service`, `Repository`에서 어노테이션을 전부 지운다.
2. `SpringConfig` 파일에서 `@Configuration`, `@Bean`으로 직접 등록한다.

```java
@Configuration
public class SpringConfig {
    @Bean
    public Service servie() {
        return new Service(repository());
    }

    @Bean
    public Repository repository(){
        return new MemoryRepository();
    }
}
```

### 컴포넌트 스캔 방법

`Controller`, `Service`, `Repository` 어노테이션을 붙이면 스프링 컨테이너가 자동으로 빈으로 등록하고, `@Autowired`를 통해 인스턴스 생성 시점에 바로 주입된다.

```java
@Controller //빈생성
public class Controller {
    private  final Service service;

    @Autowired //의존성 주입
    public Controller(Service service) {
        this.service= service;
    }
}

@Service
public class Service{

    private final Repository repository;

    @Autowired
    public Service(Repository ) {
        this.repository= repository;
    }
}

@Repository
public class Repository implements MemoryRepository{

}
```

## ✅ 정리

- DI는 컨테이너에 등록된 빈을 찾아서 필요한 곳에 넣어주는 것임
- 필드/setter 주입은 편하지만 변경 가능성을 열어두고, 생성자 주입은 불변성을 보장함 — 실무 기본값은 생성자 주입
- 정형화된 코드는 컴포넌트 스캔, 구현체 교체가 잦은 경우엔 수동 빈 등록을 씀

## 참고한 링크

- [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard)

![](/images/200/img_02.png)
