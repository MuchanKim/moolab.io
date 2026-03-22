# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.2.0] - 2026-03-22

### Added
- **Neural Network Easter Egg**: 다크모드에서 6개의 히든 뉴런을 찾아 클릭하면 클리어 시퀀스 발동
- **Progress Indicator**: 전기 아크 + 불똥 애니메이션으로 발견 진행도 표시
- **Post-clear Interactions**
  - 우클릭: 뉴런 간 전기 연결 (3초 지속, 스파크)
  - 스크롤: 모든 뉴런/시냅스 색상(hue) 실시간 변경
  - 왼클릭 홀드: 전기 가속 → 발광 → 과부하 → 시스템 소멸 (20초)
- **Flashlight Mode**: 시스템 소멸 후 커서가 손전등으로 변환, 어둠 속 UI 탐색
- **PullCord**: 화면 상단 손잡이를 당겨 다크/라이트 모드 전환
- **Neural Death CSS**: 시스템 소멸 시 모든 UI 숨김 + 손전등 오버레이

### Changed
- 홈 페이지를 히어로 섹션만으로 단순화 (AboutSection, Footer 제거)
- 워드마크 색상이 클리어 후 뉴런 hue와 동기화
- 클리어 시퀀스: 딤 오버레이 방식으로 재설계

### Removed
- 스크롤 인디케이터
- 코스믹 로고 교체 방식 제거, 단일 워드마크로 통합

---

## [0.1.0] - 2026-03-21

### Added
- Landing page with hero section (typewriter animation + moolab SVG wordmark reveal)
- Navbar with responsive hamburger menu (About, Apps, Store)
- About section with mission, stats, value cards, CTA banner
- Footer with contact email
- Dark/light theme toggle with FOUC prevention
- ConstellationWeb background effect (cursor-reactive star network)
- StarDust background effect (particle system with magnify)
- ComingSoon placeholder page (About, Apps, Store routes)
- i18n support (Korean / English) via next-intl
- Responsive layout (mobile / tablet / desktop)

### Technical
- Next.js 16.2.0 + React 19 + TypeScript
- Tailwind CSS 4 (PostCSS)
- Framer Motion 12 for animations
- Canvas-based background effects with cursor interaction
- SVG wordmark animation with spring physics
