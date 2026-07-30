---
title: "위코드 Week5 프로젝트 초기세팅 가이드 — CRA부터 Prisma·JWT까지"
date: 2021-09-19 23:57:00 +0900
description: "위코드 첫 팀 프로젝트를 앞두고 정리한 프론트엔드·백엔드 초기세팅 가이드 — VSCode 확장, CRA, ESLint/Prettier, Express, Prisma, JWT 세팅"
categories: ["회고"]
tags: ["위코드", "부트캠프", "초기세팅", "CRA", "Prisma", "Express"]
series: "위코드 부트캠프 회고"
difficulty: 1
scope: "personal"
log: 33
slug: "wecode-week5-project-setup"
source: https://zibu-story.tistory.com/164
draft: false
---

> **TL;DR** — 첫 팀 프로젝트(Webucks)를 시작하기 전, 매번 헤맸던 프론트·백엔드 초기세팅 절차를 한 번에 정리해서 이후 프로젝트마다 그대로 갖다 쓸 수 있게 만들었다.

## ✅ 상황 — 왜 정리했나

Week5 Foundation을 지나면 바로 팀 프로젝트가 시작된다. 매 프로젝트마다 VSCode 확장, CRA 세팅, ESLint/Prettier, Express·Prisma 초기화를 처음부터 다시 찾아보는 게 비효율적이라고 느껴서, 앞으로 남은 프로젝트 기간 동안 계속 재사용할 수 있는 가이드를 미리 작성해뒀다.

## ✅ 이번에 한 것 — 세팅 가이드 작성

### VSCode 확장 프로그램

마켓플레이스에서 아래 확장을 설치한다.

- Auto Close Tag
- Code Runner
- ESLint
- Korean Language Pack for Visual Studio Code
- Live Server
- Material Icon Theme
- open in browser
- Prettier - Code formatter

![VSCode 확장 설치 화면](/images/164/img_01.png)

크롬 확장도 함께 설치한다.

- Visual Inspector
- React Developer Tool

### 프론트엔드 초기세팅

**CRA 설치**

```shell
// 원하는 directory로 이동 후 CRA 프로젝트를 설치한다
// 예) cd Desktop/wecode > npx create-react-app webucks-project

npx create-react-app webucks-project
```

**React Router(경로 기반) 설치**

```shell
npm install react-router-dom --save
```

**Sass 설치**

```shell
npm install node-sass --save
```

**`.eslintrc` 파일**

```shell
{ "extends": ["react-app", "plugin:prettier/recommended"] }
```

**`.gitignore` 파일** — [gitignore.io](https://www.toptal.com/developers/gitignore) 참고

```shell
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

.eslintcache
```

**`.prettierrc` 파일**

```shell
{
  "tabWidth": 2,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "singleQuote": true
}
```

**`package.json` 파일**

```shell
{
  "name": "westabucks-react-team2",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@fortawesome/fontawesome-svg-core": "^1.2.36",
    "@fortawesome/free-regular-svg-icons": "^5.15.4",
    "@fortawesome/free-solid-svg-icons": "^5.15.4",
    "@fortawesome/react-fontawesome": "^0.1.15",
    "@testing-library/jest-dom": "^5.14.1",
    "@testing-library/react": "^11.2.7",
    "@testing-library/user-event": "^12.8.3",
    "cros": "^1.0.1",
    "node-sass": "^6.0.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "^5.2.1",
    "react-scripts": "4.0.3",
    "web-vitals": "^1.1.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://52.79.143.176:8000",
  "devDependencies": {
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-prettier": "^4.0.0",
    "prettier": "^2.3.2"
  }
}
```

**VSCode `settings.json` 파일**

```shell
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.format.enable": false,
  "eslint.alwaysShowStatus": true,
  "files.autoSave": "onFocusChange"
}
```

### 백엔드 초기세팅

**NPM 초기화**

```shell
npm init -y
```

**서버 작동 확인**

```javascript
const http = require('http'); // 1

const server = http.createServer((req, res) => { // 2
  console.log('request received');

  res.setHeader('Content-Type', 'application/json'); // 3
  res.end(JSON.stringify({ message: "Welcome to wecode server! Http server without express" })); // 4
});

server.listen(8080, () => {
  console.log('server is running on PORT 8000');
}); // 5
```

```shell
node withoutExpress.js
```

**httpie 설치** — 터미널 전용 HTTP 클라이언트

```shell
# 각 환경에 맞게 설치한다
# mac 환경
brew install httpie
# ubuntu 환경
apt-get install httpie
# or
sudo apt-get install httpie

# 설치 후 확인
http localhost:3000
```

**Express 설치**

```shell
npm install express --save
```

**Babel 설치**

```shell
npm install --save-dev @babel/core @babel/preset-env @babel/node
```

**nodemon 설치**

```shell
npm install --save-dev nodemon
npm install -g nodemon
```

**Prisma 설치 및 세팅**

```shell
npm install prisma --save-dev
npm install @prisma/client --save

npx prisma init // prisma 초기 세팅
```

```shell
// prisma/schema.prisma 파일 세팅
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

```shell
// .env 파일 세팅
DATABASE_URL = "mysql://USERNAME:PASSWORD@localhost:3306/DATABASE_NAME"
```

**Migration 세팅**

```shell
npx prisma migrate dev --name init
```

**Bcrypt 암호화**

```shell
npm install bcryptjs --save-dev
```

**JWT 발행**

```shell
npm install jsonwebtoken --save-dev
```

## ✅ 결과

이 가이드는 이후 남은 팀 프로젝트 세팅 때마다 그대로 재사용했다. 프론트엔드 CRA 세팅부터 백엔드 Express·Prisma·JWT까지 한 번에 정리해두니, 프로젝트 킥오프 시점에 세팅 때문에 시간을 낭비하는 일이 크게 줄었다.

## ✅ 배운 점 / 아쉬운 점

**잘한 점**

- 세팅을 매번 새로 찾아보는 대신 한 번 정리해서 재사용 가능한 형태로 만든 것
- 프론트엔드·백엔드 세팅을 분리해서 팀원이 각자 필요한 부분만 참고할 수 있게 정리한 것

**아쉬운 점**

- 당시에는 `.env` 파일에 실제 값을 그대로 적어 넣는 습관이 있었는데, 지금 돌아보면 예시 값으로만 남기고 시크릿 관리 원칙을 더 일찍 세웠어야 했다
- ESLint·Prettier 설정을 팀 컨벤션으로 미리 합의하지 않고 개인 취향대로 정리했던 것

## 참고한 링크

- [gitignore.io](https://www.toptal.com/developers/gitignore)
