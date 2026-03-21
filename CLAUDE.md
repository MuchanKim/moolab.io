@AGENTS.md

# Moolab Project Rules

## Navbar
- 네비게이션 탭(About, Apps, Store)은 **항상 영어**. 로케일/언어 설정의 영향을 받지 않는다.
- i18n을 사용하지 않고 하드코딩한다.

## Branch Strategy
```
feat/* ─┐
fix/*   ├──► PR ──► develop ──► release PR ──► main (tagged)
chore/* ┘
```
- `main`: 릴리즈 버전만. 태그(v0.1.0 등)가 붙는다.
- `develop`: 통합 브랜치. 모든 feature/fix PR은 여기로.
- `feat/*`, `fix/*`, `chore/*`: 작업 브랜치. develop으로 PR.
- 실험적 작업도 develop에서 진행하거나 feat/ 브랜치로 분리.

## Versioning & Release Notes
- **Semantic Versioning**: `MAJOR.MINOR.PATCH`
- 현재: `v0.1.0` (초기 랜딩페이지)
- `v1.0.0` = MVP 완성
- 릴리즈 노트는 **main에 머지할 때만** `CHANGELOG.md`에 작성.
- 각 릴리즈 항목: 버전, 날짜, Added/Changed/Fixed/Removed 섹션.

## Background Effects
- `src/components/effects/` 에 배경 효과 컴포넌트를 모아둔다.
- 각 효과는 독립 컴포넌트로, props로 커스텀 가능하게 설계한다.
- `burstDelay` prop을 공통으로 지원한다 (0이면 즉시 표시).
