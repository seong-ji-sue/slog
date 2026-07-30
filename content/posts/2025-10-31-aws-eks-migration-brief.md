---
title: "온프레미스에서 AWS EKS로 — UI 개발자가 지켜본 인프라 전환 (짧은 기록)"
date: 2025-10-31 18:00:00 +0900
description: "인프라팀 주도 EKS 전환 작업을 프론트엔드 개발자 시선에서 간단히 정리한 기록"
categories: ["일감"]
tags: ["AWS", "EKS", "Terraform", "IaC", "인프라"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
scope: "company"
log: 95
draft: false
---

> **TL;DR** — 온프레미스 K8s에만 설치되던 구조에서 AWS EKS로도 배포할 수 있게 인프라를 넓힌 작업. 인프라팀 주도였고, 나는 이미지가 ECR로 넘어가는 지점 정도만 직접 겪었다.

난이도 : ★★☆☆☆

1️⃣ `Terraform IaC` 2️⃣ `ECR` 3️⃣ `EKS`

## ✅ 왜 EKS로 갔나

> 인프라 담당자 : 고객사마다 온프레미스로 K8s 붙여주는 게 손이 많이 간다. AWS 쓰는 고객사는 EKS로 바로 올릴 수 있게 만들어보려고.

기존엔 고객사 환경에 온프레미스 K8s 클러스터를 직접 구성해서 설치하는 방식뿐이었다. AWS를 쓰는 고객사가 늘면서, 인프라 구성을 매번 손으로 맞추는 대신 IaC로 선언해두고 그대로 재현 가능한 EKS 환경을 표준 배포 옵션 중 하나로 추가하려는 목적이었다.

## ✅ 진행 순서 (인프라팀 주도, UI 개발자로서 이해한 만큼만)

1. EKS 기술조사 — k8s object, aws 리소스 학습
2. 기존 이미지를 ECR(AWS 이미지 레지스트리)로 push하는 테스트
3. 이미 떠 있는 EKS 클러스터에 서비스들을 k8s object로 구동 테스트
4. Terraform으로 VPC·서브넷·ECR push·EKS 클러스터·노드그룹·ALB까지 전체를 IaC로 선언

## ✅ 결과 & 배운 점

프론트 입장에서 바뀐 건 크지 않았다 — 이미지 push 대상이 사내 레지스트리에서 ECR로 하나 더 늘어난 정도였다. 다만 "온프레미스 대비 EKS가 왜 필요한가"를 옆에서 지켜보며, 배포 환경이 다양해질수록 인프라를 코드(IaC)로 선언해두는 쪽이 결국 유지보수 비용을 줄인다는 감각은 얻었다.

## 참고한 링크

- [AWS EKS 공식 문서](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
