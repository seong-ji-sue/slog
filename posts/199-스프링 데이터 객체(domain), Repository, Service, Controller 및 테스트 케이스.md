---
title: "스프링 데이터 객체(domain), Repository, Service, Controller 및 테스트 케이스"
date: 2022-10-13 15:05:00 +0900
categories: ["공부(Study)", "스프링(Spring)"]
tags: ["기본", "김영한", "스프링", "인프런"]
source: https://zibu-story.tistory.com/199
post_id: 199
---

**자세한 코드 내용은 아래 링크를 통해 확인 가능하고**

**Repository, Service, Controller 설명에서 적은 코드는 영역마다 어떤 역할을 하는지 간략하게**

**깨우쳐 주기 위해서 작성했습니다.**

**코드 내용**

**[깃허브 Repository](https://github.com/seong-ji-sue/springboot-inflearn-kimyounghan-basic)**

![](../images/199/img_01.gif)

**📢 DB가 없다는 가정에 domain 객체로 코드를 작성했습니다.**

**📢 강의에서는 간략한 부분만 다뤄서 자세한 부분은 세미나를 통해 디테일하게 조사하겠습니다.**

### **Repository, Service, Controller**

> **JDBC, JPA 를 배우지 않았다는 가정하에 작성하였습니다.**

**Domain(Class)**

데이터베이스에 있는 칼럼 정보를 객체로 정의하여 사용함.

(@Entity, @Id, @Generate 는 자동으로 칼럼을 정보를 넣기 위해서 작성한 내용이고 JPA 설명했을 때 나온다.) 

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

**Repository(Interface + Class)**

저장소 역할을 함. 즉, 데이터 단에 매칭되는 Entity를 통해 받아온 정보를 데이터베이스에 저장하고 조회하는 기능을 수행 인터페이스를 통해 형태를 만들고 클래스를 통해 구현체를 만든다

(JPA 설명할 때 작성한 코드 내용을 가져온것이다. Interface를 상속받아 구현 Class를 작성하는게 기본적인 원칙이다.)

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

**Service(Interface + Class)**

Repository 에서 꺼내온 데이터들을 가공하여 Controller 단에 보내는 역할 Controller 쪽에서 바로 꺼내온 정보를 CRUD로가공하면 데이터베이스의 테이블에 저장된 원본 정보가 손상될 우려가 크기 때문에 Service 단을 한번 더 거쳐서 Controller로 데이터를 넘김.

(JPA 설명할 때 작성한 코드 내용을 가져온것이다.)

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
     * 주석은 시간 재는거
     * @param person
     * @return
     */
    public Long join(Person person) {
//        long start = System.currentTimeMillis();
//        try{
            validateDuplicatePerson(person);
            personRepository.save(person);
            return person.getId();

//        }finally {
//            long finish = System.currentTimeMillis();
//            long timeMs = finish - start;
//            System.out.println("join " + timeMs + "ms");
//        }
    }

    /**
     * 중복 회원 검증
     * person객체가 이미 있는지 확인
     * findByName으로 같은 Person 있는지 확인
     * 반환된 Optional 객체 값이 없다면 false
     * 있으면 이미 존제하는 회원 에러
     * @param person
     */
    private void validateDuplicatePerson(Person person) {
        personRepository.findByName(person.getName())
                        .ifPresent(m -> {
                            throw new IllegalStateException("이미 존재하는 회원입니다.");
                        });
    }

    /**
     * 전체 Person 조회, 특정 회원 조회는 생략
     */
  }
```

**Controller(Class)**

클라이언트에서 요청하는 URL을 통해 실행되는 영역, 반환 값으로 통해서 데이터를 전달함

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

@Controller //빈생성
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

### **테스트 케이스 작성 이유, 방법**

> **단위 테스트란, 영역마다 구현 클래스마다 테스트하는 것이다.**

**이유**

프로그램을 실행 시키기 전에 단위별로 제대로 동작하는지 테스트 하기 위함이다.

**작성하는 방법과 주의사항**

1. given(생성), when(실행문), then(비교) 으로 주석을 표시하면서 적으면 작성하기 쉽니다.
2. @BeforeEach로 동일한 객체를 생성하고 @AfterEach로 테이블을 초기화 해준다.
3. 각각의 메서드를 실행할 수 있지만 클래스 전체로 실행시 순서가 보장되지 않는다.
4. cntrl + shift + T 단축키를 누르면 자동으로 테스트 케이스를 만들 수 있고 파일은 test/java/해당 구역 파일 에 저장된다.

**코드내용**

(JPA 설명할 때 작성한 코드 내용을 가져온것이다. 어노테이션은 따로 다룰 예정이다.)

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

### **✔️ 강의 참고**

[스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard)

[🔗 [무료] 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술 - 인프런 | 강의](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard) — 스프링 입문자가 예제를 만들어가면서 스프링 웹 애플리케이션 개발 전반을 빠르게 학습할 수 있습니다., - 강의 소개 | 인프런...

![필독.png](../images/199/img_02.png)
