# App Detail Page Design

## Overview

앱 상세 페이지 리디자인. SnapDock/SnapDMG 공통 레이아웃. Immersive Hero + Floating Meta 구조로, Apps 목록 페이지와 시각적 톤 통일.

## Structure

```
┌─────────────────────────────────────────────┐
│                  Navbar                      │
├─────────────────────────────────────────────┤
│ ← Back to Apps                              │
│                                             │
│              [App Icon 96px]                │
│              (shine animation)              │
│                                             │
│              AppName (48px)                 │
│         A dock launcher, anywhere           │
│            [↓ Download]                     │
│                                             │
├──────── gradient divider ───────────────────┤
│                                             │
│  Main Content (left)  │  Sidebar (right)    │
│                       │  sticky, borderless │
│  Description text     │                     │
│                       │  PLATFORM           │
│  Highlights           │   macOS            │
│  ┌────┐ ┌────┐       │                     │
│  │ ⚡ │ │ 🎯 │       │  CATEGORY           │
│  └────┘ └────┘       │   Utility           │
│  ┌────┐ ┌────┐       │  ─────────          │
│  │ ✨ │ │ 🔒 │       │  REQUIRES           │
│  └────┘ └────┘       │   macOS 26          │
│                       │  VERSION            │
│  Features             │   1.0.0             │
│  • feature 1          │  UPDATED            │
│  • feature 2          │   March 2026        │
│  • ...                │  ─────────          │
│                       │  Privacy Policy     │
│                       │  Support            │
├─────────────────────────────────────────────┤
│        © 2026 MooLab. All rights reserved.  │
└─────────────────────────────────────────────┘
```

## Design Decisions

### Layout
- Immersive Hero (full-width, center-aligned) + Floating Meta sidebar
- Mobile (`< md`): sidebar collapses below main content as a horizontal row
- Max width: `max-w-5xl` — intentionally wider than listing page (`max-w-4xl`) to accommodate sidebar column

### Hero
- Back link: `← Back to Apps` at top left
- App icon: **96px**, `rounded-[22px]`, theme-aware (dark/light variants)
- **Icon shine animation**: CSS shimmer effect that plays once on page load — a diagonal light streak sweeps across the icon, similar to App Store new app launch effect
- App name: **48px** (`text-5xl`), `font-extrabold`, `tracking-tighter`
- Subtitle: existing i18n key (e.g. `t('subtitle')`)
- CTA: **Download button only** — `bg-foreground text-background`, rounded, `↓ Download` text. If `downloadUrl` is not yet available, render as disabled (reduced opacity, `cursor-not-allowed`, no href)
- No badges in hero — badges live in sidebar
- Subtle radial gradient glow behind icon (`rgba(255,255,255,0.02)`)

### Main Content
- **Description**: 1-2 paragraphs, `text-sm`, `leading-relaxed`, color `#cdcdd7` dark / `#4a4a5a` light
- **Section title "Highlights"**: `text-lg font-bold text-foreground`
- **Feature cards**: 2x2 grid, Subtle Card style (same gradient+border as app listing cards)
  - Line icons instead of emojis (Lucide or similar)
  - Icon size ~20px, muted color
  - Title: `text-sm font-semibold text-foreground`
  - Body: `text-xs text-[#8a8a96]` dark / `text-[#7a7a8a]` light
- **Section title "Features"**: `text-lg font-bold text-foreground`
- **Features list**: `<ul>` with bullet points, `text-sm`, color `#cdcdd7` dark / `#4a4a5a` light

### Sidebar (Floating Meta)
- **Borderless** — no card background, no border
- **Sticky**: `position: sticky; top: ~100px` (below navbar)
- Structure (top to bottom):
  - **Platform**: label + badge(s) (e.g. ` macOS`)
  - **Category**: label + badge (e.g. `Utility`)
  - Divider (`1px`, `rgba(255,255,255,0.06)` dark / `rgba(0,0,0,0.08)` light)
  - **Requires**: label + value text
  - **Version**: label + value text
  - **Updated**: label + value text
  - Divider
  - **Privacy Policy**: underline link
  - **Support**: underline link
- Labels: `text-[9px] uppercase tracking-widest`, color `#8a8a96` dark / `#7a7a8a` light
- Values: `text-xs`, color `#cdcdd7` dark / `#4a4a5a` light
- Links: `text-xs underline underline-offset-2`, color `#8a8a96` dark / `#7a7a8a` light

### Footer
- Copyright only: `© 2026 MooLab. All rights reserved.`
- `text-xs`, very muted color, centered
- Thin top border

### Theme Handling
- Same Clean Invert approach as Apps hero
- Dark/light classes using Tailwind `dark:` variant (already configured with `@custom-variant`)
- Colors follow established palette:
  - Dark text hierarchy: `#f5f5f5` → `#cdcdd7` → `#8a8a96`
  - Light text hierarchy: `#111214` → `#4a4a5a` → `#7a7a8a`

### Animation
- Page: Framer Motion fade-up on hero (`opacity: 0, y: 24` → `opacity: 1, y: 0`)
- Icon shine: CSS `@keyframes` — diagonal linear-gradient sweeps left-to-right once, delay ~0.5s after page load. Replays on every page visit (route transition included).
- Feature cards: stagger fade-up on scroll (`whileInView`)
- Stats grid uses existing `EASE` curve `[0.22, 1, 0.36, 1]`

## Shared Components

This design applies to both SnapDock and SnapDMG detail pages. Extract a shared `AppDetailLayout` component:

```ts
interface FeatureHighlight {
  icon: React.ReactNode;  // Lucide icon component, e.g. <Zap size={20} />
  titleKey: string;       // i18n key for title
  bodyKey: string;        // i18n key for body
}

interface AppDetailProps {
  appKey: string;           // i18n namespace (e.g. 'snapdock', 'snapdmg')
  iconPath: string;         // base path, e.g. '/apps/snapdock' (appends /appIcon_dark.png or /appIcon_default.png)
  highlights: FeatureHighlight[];
  featureKeys: string[];    // i18n keys for bullet list (e.g. ['feature1', 'feature2', ...])
  downloadUrl?: string;     // if undefined, Download button renders as disabled
  privacyUrl?: string;      // if undefined, link hidden in sidebar
  supportUrl?: string;      // if undefined, link hidden in sidebar
  platform: string;         // e.g. 'macOS'
  category: string;         // e.g. 'Util'
  version: string;          // e.g. '1.0.0'
  requires: string;         // e.g. 'macOS 26 (Tahoe) or later'
  updatedDate: string;      // e.g. 'March 2026'
}
```

Footer copyright uses `footer.rights` i18n key (already exists in both locales).

## SnapDMG i18n Content

New `snapdmg` namespace to add to `messages/en.json` and `messages/ko.json`:

```json
"snapdmg": {
  "name": "SnapDMG",
  "subtitle": ".app to DMG, styled your way",
  "description": "SnapDMG turns your .app files into beautifully styled DMG installers. Drag, drop, customize the background and layout, and export — no terminal needed.",
  "dragDropTitle": "Drag & Drop",
  "dragDropBody": "Drop your .app file and SnapDMG handles the rest. No command line required.",
  "customizeTitle": "Customize Everything",
  "customizeBody": "Choose background images, icon positions, and window size to match your brand.",
  "exportTitle": "One-Click Export",
  "exportBody": "Generate a production-ready DMG with a single click. Ready to distribute.",
  "lightweightTitle": "Lightweight",
  "lightweightBody": "Minimal footprint. Does one thing and does it well.",
  "feature1": "Custom background images",
  "feature2": "Drag-and-drop .app import",
  "feature3": "Adjustable icon layout and spacing",
  "feature4": "One-click DMG generation",
  "feature5": "Retina-ready output",
  "feature6": "No code signing required",
  "featuresTitle": "Features",
  "requirements": "System Requirements",
  "requirementsBody": "macOS 26 (Tahoe) or later",
  "backToApps": "Back to Apps",
  "copyright": "© 2026 MooLab. All rights reserved."
}
```

Korean:
```json
"snapdmg": {
  "name": "SnapDMG",
  "subtitle": ".app을 DMG로, 예쁘게 포장까지",
  "description": "SnapDMG는 .app 파일을 스타일리시한 DMG 인스톨러로 만들어줍니다. 드래그 앤 드롭으로 배경과 레이아웃을 커스터마이즈하고, 터미널 없이 내보내기.",
  "dragDropTitle": "드래그 & 드롭",
  "dragDropBody": ".app 파일을 놓으면 SnapDMG가 알아서 처리합니다. 커맨드 라인 불필요.",
  "customizeTitle": "모든 것을 커스터마이즈",
  "customizeBody": "배경 이미지, 아이콘 위치, 윈도우 크기를 브랜드에 맞게 설정하세요.",
  "exportTitle": "원클릭 내보내기",
  "exportBody": "클릭 한 번으로 배포용 DMG를 생성합니다. 바로 배포 가능.",
  "lightweightTitle": "가벼움",
  "lightweightBody": "최소한의 리소스. 한 가지를 제대로 합니다.",
  "feature1": "커스텀 배경 이미지",
  "feature2": "드래그 앤 드롭 .app 가져오기",
  "feature3": "아이콘 레이아웃 및 간격 조정",
  "feature4": "원클릭 DMG 생성",
  "feature5": "레티나 지원 출력",
  "feature6": "코드 사이닝 불필요",
  "featuresTitle": "기능",
  "requirements": "시스템 요구사항",
  "requirementsBody": "macOS 26 (Tahoe) 이상",
  "backToApps": "Apps로 돌아가기",
  "copyright": "© 2026 MooLab. All rights reserved."
}
```

## Files to Create/Modify

1. `src/components/AppDetailLayout.tsx` — shared detail page layout component
2. `src/app/[locale]/apps/snapdock/page.tsx` — refactor to use AppDetailLayout
3. `src/app/[locale]/apps/snapdmg/page.tsx` — create using AppDetailLayout
4. `messages/en.json` — add `snapdmg` namespace
5. `messages/ko.json` — Korean translations for `snapdmg`

## Out of Scope

- Screenshots/preview images (can be added later in main content area)
- App Store / download link destinations (placeholder for now)
- Privacy/Support sub-pages for SnapDMG (separate task)
- Changelog / version history tab
