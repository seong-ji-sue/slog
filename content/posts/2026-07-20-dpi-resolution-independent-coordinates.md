---
title: "해상도·DPI에 안 흔들리는 좌표 자동화 — 템플릿 매칭에서 ORB, 그리고 DPI Aware까지"
date: 2026-07-20 22:30:00 +0900
description: "같은 해상도인데 장비마다 이미지 매칭이 되거나 안 되는 문제에서 시작해, 템플릿 매칭 → ORB 특징점 매칭 → DPI Aware API 좌표 계산까지 세 번에 걸쳐 좌표 자동화를 갈아엎은 기록"
categories: ["일감"]
tags: ["AutoIt", "OpenCV", "ORB", "DPI", "이미지매칭", "Windows 자동화"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 4
log: 114
draft: false
---

> **TL;DR** — 같은 해상도(2560×1440)인데도 장비에 따라 이미지 매칭이 되거나 안 되는 문제를 특징점(ORB) 매칭으로 해결했더니, 이번엔 배율(DPI)에 따라 좌표가 어긋나는 문제가 또 나왔다. 템플릿 매칭 → ORB 특징점 매칭 → DPI Aware API 좌표 계산까지, 좌표 하나 제대로 찍기 위해 세 번을 갈아엎은 기록이다.

난이도 : ★★★★☆

1️⃣ `ORB 특징점 매칭` 2️⃣ `DPI Aware 좌표 계산`

### ✅ 요구사항

> 나 : 같은 해상도인데 A 장비에서는 이미지 매칭이 되고, B 장비에서는 안 되네요  
> 선임 : 템플릿 매칭이 해상도 변화에 민감한 방식이라 그래. 특징점 매칭으로 바꿔봐  
> 나 : 넵, 조사부터 하고 구현하겠습니다

이 글은 다른 세 편과 조금 결이 다르다. 관련 이슈가 사내에 등록된 시점은 이전인데(2025년 12월~2026년 1월), 실제로 이 리팩토링 커밋들이 반영된 건 한참 뒤(2026년 6~7월)였다. 문제를 인지하고도 실제 정리까지 반년 가까이 걸렸다는 뜻이다. 이유는 단순하다 — SAP POC나 VNC 신규 개발처럼 마감이 걸린 요청부터 먼저 처리하다 보니, 구조 개선 작업은 계속 뒤로 밀렸다. 이번 기회에 그동안 미뤄뒀던 걸 한 번에 정리했다.

### ✅ 1차 문제 — 템플릿 매칭의 해상도 의존성

C/S 애플리케이션 자동화 과제를 진행하면서 OpenCV로 이미지를 비교하는 방식(템플릿 매칭)을 구현했는데, 같은 해상도(2560×1440)임에도 A 장비에서는 매칭이 되고 B 장비에서는 안 되는 현상이 나타났다.

조사해보니 템플릿 매칭은 픽셀 단위로 거의 완전 일치에 가까운 비교 방식이다. 해상도가 같아도 렌더링·스케일링 조합에 따라 미세한 픽셀 차이가 누적되면 매칭이 실패로 이어질 수 있다는 게 원인이었다.

### ✅ 해결 — ORB 특징점 매칭으로 전환

이미지 전체를 그대로 비교하는 대신, 이미지 안의 특징점(코너·모서리 등)을 추출해서 특징점 간 유사도로 비교하는 방식으로 바꿨다.

```
이미지 2개 준비 → 특징점 검출기(ORB 생성자) 생성 → 특징점 추출
  → 특징점 매칭 → 비율 테스트로 유효한 매칭만 필터링 → 결과 판단
```

AutoIt에서는 OpenCV를 직접 호출할 수 없어서, OpenCV C++ 바이너리와 COM 인터페이스 두 개의 DLL을 프로젝트에 넣어 문서화된 함수를 그대로 호출하는 구조로 붙였다. 실제 구현은 존재 여부만 확인하는 함수와 위치까지 찾아내는 함수 두 개로 나눴다.

```autoit
Func isImgExistKeyPoint($aNowRect, $sIdImgName, $sNowImgName, $iMaxFeatures=1000, $nMatchRatioThresh=0.75, $iMinGoodMatches=80)
    ; 이미지 캡쳐 및 준비
    Local $iCaptureImg = _OpenCV_GetDesktopScreenMat($aNowRect)
    ImgSaveFileAtFolder($iCaptureImg, $sNowImgName)

    Local $findIdImg = _OpenCV_FindFile($sIdImgName)
    Local $findNowImg = _OpenCV_FindFile($sNowImgName)
    Local $idImg = _OpenCV_imread_and_check($findIdImg, $CV_IMREAD_GRAYSCALE)
    Local $nowImg = _OpenCV_imread_and_check($findNowImg, $CV_IMREAD_GRAYSCALE)

    If $idImg.empty Or $nowImg.empty Then
        writeLog("[isImgExistKeyPoint] 오류: 이미지 파일을 로드하지 못했습니다.")
        Return False
    EndIf
    ; ... ORB 검출기 생성 → 특징점 추출 → 매칭 → 비율 테스트로 판정
EndFunc
```

같은 해상도인데 장비마다 결과가 달랐던 문제는, 특징점 매칭으로 바꾼 뒤로는 재현되지 않았다.

### ✅ 2차 문제 — 해상도별 캡처 위치 자체가 어긋남

특징점 매칭을 도입한 뒤에도 남은 문제가 있었다. 창을 캡처하는 시점의 위치 계산이 해상도가 바뀌면 어긋난다는 것이었다. 원격 접속 등으로 해상도가 바뀌면(예: 1920×1080 ↔ 1024×768) 캡처 좌표가 밀려서, 활성화된 창 대신 엉뚱한 영역을 캡처하게 됐다. 비교할 이미지 자체가 잘못 찍히니, 그 위의 특징점 매칭도 당연히 의미가 없어진다.

해결 방향은 DPI Aware API를 활용해서 창의 실제 위치(테두리 그림자 영역을 제외한 순수 창 영역)를 구하도록 캡처 로직을 바꾸는 것이었다. 기존 방식은 단순히 창 위치를 조회하는 API만 썼는데, 이 API는 해상도·배율이 바뀌는 환경에서 정확한 위치를 보장하지 못했다.

### ✅ 3차 문제 — 배율(DPI Scaling)에 따른 좌표 이동 오차

캡처 문제를 해결하고 나니 마지막으로 남은 게 좌표 이동 오차였다. 특징점 매칭으로 목표 지점을 찾은 다음, 거기서 일정 거리만큼 이동해서 버튼을 클릭하는 로직이 있었는데, 이 이동 거리가 고정 픽셀 값(예: +30, +290)이었다.

배율 100% 환경에서는 100칸을 이동하면 목표 버튼에 도착했다. 그런데 배율 125% 환경에서는 화면상 버튼 간격이 물리적으로 1.25배 늘어나므로 실제로는 150칸을 이동해야 하는데, 스크립트는 여전히 100칸만 이동하고 멈춰서 허공을 클릭하는 현상이 발생했다.

해결책은 고정 오프셋을 그대로 쓰는 대신, 실행 시점에 Windows API로 실제 배율을 조회해서 오프셋에 곱해주는 함수를 만드는 것이었다.

```autoit
Func GetScaledCoordinate($iStartX, $iStartY, $iOffsetX, $iOffsetY)
    Local $nScaleFactor = 1.0 ; 기본값 (100%)
    Local $hDC = DllCall("user32.dll", "ptr", "GetDC", "hwnd", 0)

    If @error = 0 And IsArray($hDC) Then
        ; GetDeviceCaps 88(LOGPIXELSX) 조회 — 예: 96(100%), 120(125%), 144(150%)
        Local $aRet = DllCall("gdi32.dll", "int", "GetDeviceCaps", "ptr", $hDC[0], "int", 88)
        If @error = 0 And IsArray($aRet) Then
            ; 표준 DPI(96) 대비 배율 계수 산출 — 예: 144/96 = 1.5
            $nScaleFactor = $aRet[0] / 96
        EndIf
        DllCall("user32.dll", "int", "ReleaseDC", "hwnd", 0, "ptr", $hDC[0])
    EndIf

    Local $nScaledOffsetX = $iOffsetX * $nScaleFactor
    Local $nScaledOffsetY = $iOffsetY * $nScaleFactor

    Local $aResult[2]
    $aResult[0] = $iStartX + $nScaledOffsetX
    $aResult[1] = $iStartY + $nScaledOffsetY
    Return $aResult
EndFunc
```

`GetDeviceCaps`로 화면의 실제 DPI(96=100%, 120=125%, 144=150% 같은 값)를 조회해서 표준 DPI(96) 대비 배율을 구하고, 그 배율을 오프셋에 곱해서 최종 좌표를 계산한다. 이후로는 배율이 몇 퍼센트든 환경이 스스로 알아서 계산하기 때문에, 장비마다 좌표를 손으로 고쳐야 하는 일이 없어졌다.

### ✅ 결과 & 배운 점

| 단계 | 방식 | 한계 |
|------|------|------|
| 1차 | 템플릿(픽셀) 매칭 | 같은 해상도에서도 장비 간 매칭 실패 |
| 2차 | ORB 특징점 매칭 | 해상도 의존성은 줄었지만 캡처 좌표 자체가 어긋남 |
| 3차 | DPI Aware API + 동적 좌표 계산 | 배율이 달라도 실행 시점에 스스로 계산해 대응 |

좌표 하나, 이미지 하나 제대로 찍는 문제가 이렇게 세 겹으로 쌓여있을 줄은 몰랐다. 해상도나 배율이 다르다고 매번 좌표를 손으로 고치는 임시방편 대신, 실행 시점에 환경을 조회해서 스스로 계산하게 만드는 방향이 결국 정답이었다. 그리고 이런 구조 개선은 급한 요청에 밀려 계속 뒤로 밀리기 쉬운데, 미뤄둔 채로 넘어가면 결국 다른 앱에서 같은 문제가 반복해서 터진다는 것도 이번에 다시 확인했다.

## 참고한 링크

- [AutoIt — DllCall 함수 레퍼런스](https://www.autoitscript.com/autoit3/docs/functions/DllCall.htm)
- [ORB(Oriented FAST and Rotated BRIEF) 알고리즘 설명](https://searching-fundamental.tistory.com/64)
