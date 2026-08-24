# DESIGN_SCHEMA — 디자인 토큰·가이드 규격 (`_data/design/`)

> 기획 워크플로우(brief-workflow) DESIGN 단계 산출물. `gate_check.py design`이 기계 검증한다.
> 접근: **코드 기반 토큰** — 외부 디자인 도구(API) 의존 없이, 구현 에이전트가 그대로 소비 가능한
> JSON 토큰 + md 가이드만 산출한다. 구현 코드·컴포넌트 파일은 만들지 않는다.

---

## 1. `design_system.json` — 앱 전역 디자인 토큰 (싱글턴·누적)

피처마다 새로 만들지 않는다. **한 앱에 하나** — 이미 존재하면 보존·확장(전면 교체는 사용자 지시 시만).

```jsonc
{
  "meta": {
    "style_direction": "미니멀·데이터 중심 대시보드",   // 방향 1줄
    "mode": "light|dark|both"
  },
  "colors": {                       // 값은 hex 또는 CSS 색상 문자열
    "primary": "#2563EB",
    "background": "#FFFFFF",
    "foreground": "#0F172A",
    "muted": "#64748B",
    "accent": "#F59E0B",
    "destructive": "#DC2626",
    "border": "#E2E8F0"
  },
  "typography": {
    "font_sans": "system-ui 계열 서술(특정 유료 폰트 강제 금지)",
    "scale": { "h1": "2rem/700", "h2": "1.5rem/600", "body": "1rem/400", "caption": "0.875rem/400" }
  },
  "spacing": { "unit": 4, "scale": [4, 8, 12, 16, 24, 32, 48] },
  "radius": { "sm": "4px", "md": "8px", "lg": "12px" },
  "components": {                   // 컴포넌트 프리셋 — 토큰 참조 서술(코드 아님)
    "button": { "primary": "colors.primary 배경 + 흰 텍스트 + radius.md", "ghost": "..." },
    "card":   { "default": "background + border + radius.lg + spacing 16" }
  }
}
```

**필수 최상위 키**: `colors`(`primary`·`background` 포함) · `typography` · `spacing` · `components`(≥1 프리셋).

## 2. `DESIGN_{feature}.md` — 피처 디자인 가이드 (피처별)

이번 피처 화면(BRIEF §4 SCREENS)별로:

```markdown
# DESIGN — {feature}

## {S-01 화면명}
- 레이아웃: <구조 서술 — 예: 좌측 사이드바 + 우측 그리드>
- 상태: 로딩 <스켈레톤/스피너> · 빈 상태 <문구+CTA> · 에러 <표시 방식>
- 흐름: <진입→행동→결과 사용자 흐름>
- 토큰 적용: <이 화면에서 쓰는 components 프리셋>
```

## 규칙

| 항목 | 규칙 |
|------|------|
| 소유 | design_system.json = 앱 전역(누적·보존), DESIGN_{feature}.md = 피처별 |
| 탈스택 | Tailwind 클래스·CSS 파일·컴포넌트 코드 금지 — 토큰 값·서술만 (스택 매핑은 구현 몫) |
| 구현 금지 | designer는 소스 파일을 만들지 않는다 — ui_developer가 구현 시 토큰 소비 |
| 접근성 | colors는 명도 대비(본문 4.5:1) 고려해 선정 |

## 소비처

- `impl-workflow` EXECUTE: frontend task 프롬프트에 토큰 경로 주입 — ui_developer가 색·타이포·간격 준수
- `prd-writer`: DESIGN_{feature}.md의 상태(로딩/빈/에러) 정의를 acs 후보로 참조 가능
