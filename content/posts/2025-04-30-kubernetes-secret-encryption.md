---
title: "쿠버네티스 Secret이 etcd에 평문으로 저장된다는 걸 알고 나서"
date: 2025-04-30 09:00:00 +0900
description: "Kubernetes Secret이 기본적으로 etcd에 평문 저장된다는 사실을 확인하고 EncryptionConfiguration으로 암호화 저장을 적용한 기록"
categories: ["일감"]
tags: ["Kubernetes", "Secret", "암호화", "etcd", "보안"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 110
draft: false
---

> **TL;DR** — Kubernetes Secret은 base64로 인코딩될 뿐 암호화되지 않는다. etcd에 그대로 저장된다는 뜻이다. `EncryptionConfiguration`으로 secretbox 암호화를 적용해 이 문제를 막았다.

난이도 : ★★★☆☆

1️⃣ `EncryptionConfiguration` 2️⃣ `secretbox` 3️⃣ `etcd 평문저장`

### ✅ 요구사항

> 사수 : Secret 관련 데이터 보안을 좀 더 강화했으면 하는데, 지금 상태 확인해줄 수 있어?  
> 나 : Secret이면 이미 암호화된 거 아니에요?  
> 사수 : 확인해보면 알겠지만, Kubernetes Secret이 base64 인코딩이랑 암호화를 헷갈리기 쉬워서 한 번 짚고 넘어가면 좋을 것 같아

시크릿 관리 콘솔을 표방하는 제품에서, 정작 그 콘솔이 떠 있는 Kubernetes 클러스터 자체의 Secret 저장 방식이 안전한지는 따로 확인한 적이 없었다. 그래서 이 일감이 왔을 때 제일 먼저 한 일은 "지금 상태를 직접 눈으로 확인하는 것"이었다.

### ✅ 눈으로 확인한 문제

Secret을 하나 만들고, etcd에 저장된 실제 값을 까봤다.

```bash
kubectl create secret generic test-secret --from-literal=password=1234
ETCDCTL_API=3 etcdctl get /registry/secrets/default/test-secret
```

결과는 `cGFzc3dvcmQ6IDEyMzQ=` 같은 base64 값 그대로였다. Kubernetes Secret은 이름 때문에 오해하기 쉽지만, 기본 설정에서는 **base64 인코딩만 될 뿐 암호화되지 않는다.** base64는 누구나 디코딩할 수 있는 인코딩 방식이라, etcd 백업 파일이나 etcd 접근 권한이 새어나가면 Secret 값이 그대로 노출된다.

### ❌ 기존 상태

- 클러스터가 이미 운영 중이었지만 Secret 암호화 설정(`EncryptionConfiguration`)이 전혀 없었음
- Secret이 "이름 때문에" 안전하다고 암묵적으로 가정되고 있었음

### ✅ 왜 secretbox인가

Kubernetes가 지원하는 암호화 provider는 여러 개(`aescbc`, `aesgcm`, `secretbox`, `kms` 등)가 있는데, 공식 문서 기준으로 `secretbox`가 속도와 보안성 균형이 좋다고 권장되는 편이라 이걸 선택했다. 별도의 외부 KMS 연동 없이 클러스터 자체 설정만으로 암호화를 걸 수 있다는 점도 지금 상황(빠르게 적용해야 하는 보안 강화 작업)에 맞았다.

### 🛠️ 암호화 키 생성

```bash
head -c 32 /dev/urandom | base64
```

32바이트 랜덤 값을 base64로 인코딩해서 키로 쓴다. 이 키가 새어나가면 암호화 자체가 무의미해지므로, 이후 키 관리(로테이션·백업)를 어떻게 할지는 별도 과제로 남겨뒀다.

### 🛠️ EncryptionConfiguration 작성

```yaml
# encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - secretbox:
          keys:
            - name: key1
              secret: <위에서 생성한 base64 키>
      - identity: {}
```

`providers` 목록의 순서가 중요하다. `secretbox`가 `identity`(암호화 없음)보다 앞에 있어야 새로 쓰는 Secret이 암호화된 형태로 저장된다. `identity`를 맨 뒤에 남겨둔 이유는, 기존에 이미 평문으로 저장된 Secret을 읽을 때 하위 호환을 위해서다.

### 🛠️ kube-apiserver에 반영

```yaml
# kube-apiserver.yaml
volumeMounts:
  - name: encryption-config
    mountPath: /etc/kubernetes/encryption
    readOnly: true
volumes:
  - name: encryption-config
    hostPath:
      path: /etc/kubernetes/encryption
```

`kube-apiserver.yaml`에 `--encryption-provider-config` 경로를 추가하고, 설정 파일이 마운트되도록 volume과 volumeMount를 붙였다. 정적 파드 형태로 뜨는 `kube-apiserver`라 이 파일을 수정하면 API 서버가 자동으로 재시작된다 — 이 부분이 제일 긴장됐던 지점인데, 클러스터의 관제탑 격인 컴포넌트를 건드리는 작업이라 재시작 실패 시 전체 API 접근이 막힐 수 있기 때문이다.

### ✅ 검증

```bash
kubectl create secret generic encrypted-secret --from-literal=password=1234
ETCDCTL_API=3 etcdctl get /registry/secrets/default/encrypted-secret
```

이번엔 etcd에 저장된 값 앞에 `k8s:enc:secretbox:v1:key1:` 같은 프리픽스가 붙은 걸 확인했다. 더 이상 디코딩만으로는 값을 읽을 수 없는 상태가 된 것이다.

#### 🎯 결과

- Secret이 etcd에 암호화된 형태로 저장되도록 전환 완료
- 최초 설정 시 API 서버 재시작이 반드시 필요하다는 점을 운영 매뉴얼에 남김
- 기존에 이미 평문으로 저장돼 있던 Secret들은 `identity` provider로 여전히 읽히지만, 재저장(다시 write)해야 실제로 암호화 형태로 바뀐다는 한계는 남아있음 — 이 부분은 이후 전체 Secret 재기록(rewrite) 작업으로 이어질 필요가 있다.

## 참고한 링크

- [Kubernetes 공식 문서 — Encrypting Confidential Data at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)
