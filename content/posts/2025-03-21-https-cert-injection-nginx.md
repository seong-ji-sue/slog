---
title: "HTTPS 인증서를 코드에서 빼내 인프라로 옮기기 — TLS Termination 딥다이브"
date: 2025-03-21 20:10:00 +0900
description: "server.mjs가 인증서 파일을 직접 읽던 구조에서 Nginx가 TLS를 종료하는 구조로 — 인증서가 어디로 이사갔는지 실제 설정으로 따라가 본 기록"
categories: ["일감"]
tags: ["HTTPS", "Nginx", "TLS", "리버스프록시", "인증서"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 94
draft: false
---

> **TL;DR** — standalone 전환 전엔 앱 코드(`server.mjs`)가 인증서 파일을 직접 읽어서 HTTPS 서버를 띄웠다. standalone으로 넘어가면서 이 코드를 통째로 걷어내고, Nginx가 인증서를 들고 TLS를 종료(termination)한 뒤 내부로는 평문 HTTP로 여러 서비스를 path별로 프록시하는 구조로 옮겼다.

난이도 : ★★★☆☆

1️⃣ `TLS Termination` 2️⃣ `path 기반 리버스 프록시` 3️⃣ `인증서 위치 이전`

## ✅ 상황

> 설계 부장님 : SSL 인증서, 지금은 프론트 서버 코드 안에서 직접 물고 있는 거 맞지?
> 나 : 네, `server.mjs`에서 인증서 파일 읽어서 https 서버 띄우고 있어요.
> 설계 부장님 : standalone 넘어가면 그 서버 코드를 못 건드린다며. 인증서는 그럼 어디서 처리하나?
> 나 : Nginx 앞단으로 옮기는 방법밖에 없을 것 같아요. 한번 짜볼게요.

이전 글(218번)에서 "HTTPS는 Nginx로 넘겼다"까지는 이미 다뤘다. 이번엔 인증서가 실제로 어떤 경로로, 어떤 설정으로 옮겨갔는지를 실제 diff로 따라가 본다.

## ✅ 이전 구조 — 앱 코드가 인증서를 직접 물고 있었다

standalone 전환 전 `server.mjs`는 이랬다.

```javascript
import fs from 'node:fs';
import https from 'node:https';

const httpsOptions = {
  key: fs.readFileSync('./certificates/{도메인}_key.pem'),
  cert: fs.readFileSync('./certificates/{도메인}_crt.pem'),
};

app.prepare().then(() => {
  const server = express();
  // ... CORS 헤더 설정 ...
  https
    .createServer(httpsOptions, server)
    .listen(process.env.NEXT_PUBLIC_CLIENT_PORT);
});
```

인증서 파일이 앱 저장소 안(`./certificates/`)에 같이 들어있었고, 앱이 부팅할 때 그 파일을 직접 읽어서 `https.createServer`로 TLS 소켓을 열었다. 인증서를 갱신하려면 앱 코드 배포와 같이 움직여야 하는 구조였던 셈이다.

## ✅ 왜 이 구조를 못 쓰게 됐나

standalone은 `server.js`를 빌드 시점에 자동 생성하고, 그 파일은 배포 이후 직접 수정할 수 없다. `https.createServer`를 호출하는 코드 자체가 이 자동 생성 파일 안에 들어갈 자리가 없어진 것이다. 결국 "TLS를 어디서 처리할 것인가"라는 질문에 코드로는 답할 수 없게 됐고, 인프라 레이어로 넘기는 수밖에 없었다.

## ✅ 해결 — Nginx가 인증서를 들고 TLS를 종료(termination)

<!-- 이미지 제안: 앱 코드가 인증서를 직접 물던 이전 구조 vs Nginx가 TLS를 종료하고 내부는 평문 HTTP로 프록시하는 이후 구조 아키텍처 다이어그램 -->

`server.mjs`를 걷어내는 커밋에서 `nginx.conf`가 새로 생겼다.

```nginx
http {
    # HTTP로 들어오면 HTTPS로 리다이렉트
    server {
        listen 80;
        server_name localhost;
        return 301 https://$host:4000$request_uri;
    }

    # HTTPS 서버 — 인증서는 여기 한 곳에만 있다
    server {
        listen 4000 ssl;
        server_name localhost;

        ssl_certificate     /path/to/certificates/{도메인}_crt.pem;
        ssl_certificate_key /path/to/certificates/{도메인}_key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        location /iam/ {
            proxy_pass         http://<iam 서비스>/;
            proxy_http_version 1.1;
            proxy_set_header   Host $host;
        }

        location /vault/ {
            proxy_pass         http://<vault 서비스>/;
            proxy_http_version 1.1;
            proxy_set_header   Host $host;
        }

        location / {
            proxy_pass         http://<client 서비스>/;
            proxy_http_version 1.1;
            proxy_set_header   Host $host;
        }
    }
}
```

인증서 파일(`_crt.pem`, `_key.pem`)은 그대로 유지하되, 그걸 읽는 주체가 앱 코드에서 Nginx로 바뀐 것이 핵심이다. `location` 블록별로 요청 경로(`/iam/`, `/vault/`, `/` 등)에 따라 뒷단의 각 서비스로 프록시하도록 나눠뒀다 — 여러 개의 Next.js standalone 앱이 하나의 인증서, 하나의 포트(4000) 아래에서 path로 갈라지는 구조다.

## ✅ 딥다이브 — TLS Termination이 뭐길래

TLS Termination은 "클라이언트와 리버스 프록시(Nginx) 사이 구간만 암호화하고, 프록시에서 내부 서비스까지 가는 구간은 평문 HTTP로 통신하는" 방식이다.

- 클라이언트 ↔ Nginx : HTTPS (암호화)
- Nginx ↔ 내부 서비스(client/iam/vault/...) : HTTP (평문, 내부망이라 별도 암호화 불필요)

이 구조가 주는 실익은 세 가지다.

- 인증서를 서비스마다 각각 들고 있을 필요가 없음 — Nginx 한 곳에만 있으면 됨
- 인증서 갱신이 앱 배포 사이클에서 완전히 분리됨 — Nginx 설정만 리로드하면 끝
- 서비스마다 https 서버 초기화 코드를 따로 짤 필요가 없어짐 — 앱은 순수 HTTP만 신경 쓰면 됨

## ✅ 결과 & 배운 점

| | 이전 | 이후 |
|---|---|---|
| 인증서를 읽는 주체 | 앱 코드(`server.mjs`) | Nginx |
| 인증서 갱신 시 | 앱 재배포 필요 | Nginx 설정만 리로드 |
| 여러 서비스 라우팅 | 앱마다 개별 포트 | 하나의 HTTPS 포트 + path 분기 |

인증서를 "누가 들고 있어야 하는가"는 결국 "그 계층이 재배포 없이도 바뀔 수 있는가"의 문제였다. 코드가 인증서를 쥐고 있으면 인증서 하나 갱신하는 데도 배포 파이프라인을 통째로 태워야 하지만, 인프라 계층으로 옮기고 나니 그 둘이 완전히 분리됐다. standalone처럼 "코드를 못 건드리게 만드는" 제약이 오히려 역할 분리를 강제한 셈이다.

## 참고한 링크

- [Nginx — SSL Termination](https://docs.nginx.com/nginx/admin-guide/security-controls/terminating-ssl-http/)
- [Nginx — Reverse Proxy 가이드](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
