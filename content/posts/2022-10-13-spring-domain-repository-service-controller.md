---
title: "스프링 계층 구조 — Domain, Repository, Service, Controller가 나뉘는 이유"
date: 2022-10-13 15:05:00 +0900
description: "도메인 객체와 Repository·Service·Controller가 각각 어떤 역할을 하는지, 왜 계층을 나누는지 예제 코드와 테스트 케이스로 정리"
categories: ["딥다이브"]
tags: ["Spring", "SpringBoot", "Repository", "Service", "Controller", "단위테스트"]
series: "스프링 파고들기"
difficulty: 2
scope: "research"
log: 62
slug: "spring-domain-repository-service-controller"
source: https://zibu-story.tistory.com/199
draft: false
---

> **TL;DR** — Repository는 저장소, Service는 가공, Controller는 요청·응답 담당으로 역할을 나누는 이유는 Controller에서 바로 데이터를 CRUD하면 원본 데이터가 손상될 위험이 크기 때문이다. Service 계층을 한 번 거치게 하면 그 위험을 줄일 수 있다.

난이도 : ★★☆☆☆

1️⃣ `Domain / Repository / Service / Controller` 2️⃣ `계층 분리 이유` 3️⃣ `단위 테스트`

## ✅ 왜 알아야 하나

스프링 프로젝트를 처음 만들면 `domain`, `repository`, `service`, `controller` 폴더부터 나뉜다. 왜 굳이 이렇게 나누는지 이해하지 못하면 그냥 관례라서 따라 하는 수준에 머무른다. 각 계층이 실제로 무슨 일을 하는지, 왜 Controller에서 바로 데이터베이스에 접근하면 안 되는지를 짚어본다. JDBC·JPA를 배우기 전 단계에서 정리한 내용이라 예제는 DB 없이 domain 객체만으로 구성했다.

- 코드: [깃허브 Repository](https://github.com/seong-ji-sue/springboot-inflearn-kimyounghan-basic)

![](/images/199/img_01.gif)

## ✅ Domain — 데이터를 객체로 정의

데이터베이스에 있는 컬럼 정보를 객체로 정의해서 사용한다. `@Entity`, `@Id`, `@GeneratedValue`는 JPA에서 컬럼 정보를 자동으로 매핑하기 위한 어노테이션이다(JPA는 별도 글에서 다룬다).

```java
package hello.hellospring.domain;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer age;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }
}
```

## ✅ Repository — 저장소 역할

Entity를 통해 받은 정보를 데이터베이스에 저장하고 조회하는 기능을 수행한다. 인터페이스로 형태를 정의하고 클래스로 구현체를 만드는 게 기본 원칙이다.

```java
package hello.hellospring.repository;

import hello.hellospring.domain.Person;

import java.util.List;
import java.util.Optional;

public interface PersonRepository {

    Person save(Person person);
    Optional<Person> findByPerson(Long id);
    Optional<Person> findByName(String name);
    Optional<Person> findByAge(Integer age);
    List<Person> findAll();
}
```

```java
package hello.hellospring.repository;

import hello.hellospring.domain.Person;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

public class JpaPersonRepository implements PersonRepository {
    private EntityManager em;

    public JpaPersonRepository(EntityManager em) {
        this.em = em;
    }

    @Override
    public Person save(Person person) {
        em.persist(person);
        return person;
    }

    @Override
    public Optional<Person> findByPerson(Long id) {
        Person person = em.find(Person.class, id);
        return Optional.ofNullable(person);
    }

    @Override
    public Optional<Person> findByName(String name) {
        String sql = "select p from Person p where p.name= :name";
        List<Person> result = em.createQuery(sql,Person.class)
                .setParameter("name",name).getResultList();
        return result.stream().findAny();

    }

    @Override
    public Optional<Person> findByAge(Integer age) {
        return Optional.empty();
    }

    @Override
    public List<Person> findAll() {
        String sql = "select p from Person p";
        return em.createQuery(sql, Person.class).getResultList();
    }
}
```

## ✅ Service — 왜 Controller에서 바로 CRUD하면 안 되나

Repository에서 꺼내온 데이터를 가공해서 Controller에 넘기는 역할이다. Controller에서 바로 데이터를 CRUD하면 테이블에 저장된 원본 정보가 손상될 우려가 크기 때문에, Service 계층을 한 번 더 거치게 해서 그 위험을 낮춘다.

```java
package hello.hellospring.service;

import hello.hellospring.domain.Person;
import hello.hellospring.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Transactional
public class PersonService {
    private final PersonRepository personRepository;
    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    /**
     * 회원가입
     * @param person
     * @return
     */
    public Long join(Person person) {
        validateDuplicatePerson(person);
        personRepository.save(person);
        return person.getId();
    }

    /**
     * 중복 회원 검증
     * findByName으로 같은 Person이 있는지 확인
     * 반환된 Optional에 값이 없으면 false, 있으면 이미 존재하는 회원 에러
     * @param person
     */
    private void validateDuplicatePerson(Person person) {
        personRepository.findByName(person.getName())
                        .ifPresent(m -> {
                            throw new IllegalStateException("이미 존재하는 회원입니다.");
                        });
    }
}
```

## ✅ Controller — 요청과 응답만 담당

클라이언트가 요청하는 URL을 통해 실행되는 영역이다. 반환 값을 통해 데이터를 전달한다.

```java
package hello.hellospring.controller;

import hello.hellospring.domain.Person;
import hello.hellospring.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller //빈 생성
public class PersonController {
    private  final PersonService personService;

    @Autowired //의존성 주입
    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @PostMapping( "/person/new")
    @ResponseBody
    public Person create(@RequestParam("name") String name,@RequestParam("age") Integer age) {
        Person person = new Person();
        person.setName(name);
        person.setAge(age);
        personService.join(person);

        return person;
    }

    @GetMapping("/persons")
    @ResponseBody
    public List list() {
        List<Person> persons = personService.findPersons();
        return persons;
    }

}
```

## ✅ 테스트 케이스 작성 이유와 방법

단위 테스트란 구현 클래스마다 영역별로 제대로 동작하는지 테스트하는 것이다. 프로그램을 실행하기 전에 단위별로 미리 검증하기 위해 작성한다.

작성할 때 참고한 규칙이다.

- `given`(생성), `when`(실행문), `then`(비교) 순서로 주석을 달면서 작성하면 흐름이 잡힘
- `@BeforeEach`로 동일한 객체를 생성하고 `@AfterEach`로 테이블을 초기화함
- 각 메서드는 단독 실행 가능하지만 클래스 전체를 실행하면 순서가 보장되지 않음
- IntelliJ에서 `Ctrl + Shift + T`를 누르면 자동으로 테스트 케이스 파일을 생성해줌 (`test/java/`에 동일 경로로 저장됨)

```java
package hello.hellospring.service;

import hello.hellospring.domain.Person;
import hello.hellospring.repository.PersonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class PersonServiceIntegrationTest {

    @Autowired PersonService personService;
    @Autowired PersonRepository personRepository;

    /**
     * 회원가입
     */
    @Test
    void join() {
        //given
        Person person = new Person();
        person.setName("JS");
        person.setAge(20);

        //when
        Long saveId = personService.join(person);

        //then
        Person findPerson = personRepository.findByPerson(saveId).get();
        assertEquals(person.getName(),findPerson.getName());
    }

    /**
     * 중복회원
     */
    @Test
    public void 중복회원예외() {
        Person person1 = new Person();
        person1.setName("JS");
        person1.setAge(20);

        Person person2 = new Person();
        person2.setName("JS");
        person2.setAge(43);

        personService.join(person1);
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> personService.join(person2));
        assertThat(e.getMessage()).isEqualTo("이미 존재하는 회원입니다.");

    }
}
```

![](/images/199/img_02.png)

## ✅ 정리

- Domain — DB 컬럼을 객체로 매핑
- Repository — 저장·조회 담당, 인터페이스+구현체로 분리
- Service — Repository 데이터를 가공, 비즈니스 로직·검증 담당
- Controller — 요청을 받아 Service를 호출하고 응답만 반환함
- 계층을 나누는 이유는 결국 Controller가 데이터베이스를 직접 건드리지 못하게 막기 위함임

## 참고한 링크

- [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard)
