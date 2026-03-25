# Apps Page Hero Section Design

## Overview

Apps 페이지 히어로 섹션 리디자인. 기존 단순 텍스트(제목+서브타이틀)에서 Stats Grid를 포함한 정보성 히어로로 변경.

## Structure

Top-to-bottom order:

```
┌─────────────────────────────────┐
│           Navbar                │
├─────────────────────────────────┤
│                                 │
│            Apps                 │  ← title (text-4xl sm:text-5xl, font-bold)
│                                 │
│  Baked by moolab,               │  ← subtitle main (text-lg, muted tone)
│  Seasoned by you.               │
│                                 │
│  Share your ingredients via     │  ← subtitle secondary (text-sm, weaker opacity, links)
│  Email or Community.            │
│  We're always open.             │
│                                 │
│    3      │    1     │    2     │  ← stats numbers (text-2xl+, font-bold)
│  Total    │ Released │ Coming   │  ← stats labels (text-xs, uppercase)
│           │  (green) │  Soon    │
│                                 │
├─────────────────────────────────┤
│  [Card]   [Card]    [Card]      │  ← existing app cards grid
└─────────────────────────────────┘
```

## Design Decisions

### Layout
- Center-aligned, no badge
- Vertical stack: Title → Subtitle (main) → Subtitle (secondary) → Stats Grid

### Title
- "Apps" — from existing i18n key, unchanged
- `text-4xl sm:text-5xl font-bold text-foreground tracking-tight`

### Subtitle — Main Line
- EN: "Baked by moolab, Seasoned by you."
- KO: "moolab이 굽고, 당신이 완성합니다."
- `text-lg`, color: dark `#8b8b99`, light `#6b6b76`

### Subtitle — Secondary Line
- EN: "Share your ingredients via Email or Community. We're always open."
- KO: "메일과 커뮤니티로 당신의 의견을 들려주세요. 우리는 언제나 열려 있습니다."
- `text-sm`, weaker opacity than main subtitle
- Dark: `rgba(255,255,255,0.25)`, links `rgba(111,187,116,0.6)`
- Light: `rgba(0,0,0,0.3)`, links `rgba(60,140,65,0.8)`
- "Email" links to `mailto:hello@moolab.com` (existing contact)
- "Community" renders as plain (non-clickable) styled text until a real URL is provided. No `href="#"` — avoid dead link UX.

### Stats Grid — Number Grid Style
- 3 items separated by vertical dividers
- **Total**: count of all apps (currently 3), `text-foreground`
- **Released**: count of released apps (currently 1), accent green (`#6FBB74` dark, `#4a9b50` light)
- **Coming Soon**: count of upcoming apps (currently 2), `text-foreground`
- Numbers: `text-2xl font-bold`
- Labels: `text-xs uppercase tracking-widest`, muted color
- Dividers: 1px vertical, `rgba(255,255,255,0.08)` dark / `rgba(0,0,0,0.08)` light
- "Released" combines all distribution channels (App Store + web/DMG)

### Theme Handling — Clean Invert
- Dark and light use the same structure
- Colors swap naturally using CSS custom properties where possible
- Stats grid, subtitle secondary, and link colors need explicit dark/light values

### Animation
- Retain existing Framer Motion fade-up animation (`opacity: 0, y: 24` → `opacity: 1, y: 0`)
- Stats grid can stagger slightly after subtitle appears

## i18n Keys to Update/Add

> `apps.subtitle` is a **replacement** of the existing key (was: "Discover apps made by MooLab.").
> Stats labels (`statsTotal`, `statsReleased`, `statsComingSoon`) stay English in both locales — no Korean translation needed.
> `subtitleSecondary` uses `next-intl`'s rich text API (`t.rich()`) with named XML tags (`<email>`, `<community>`) to embed links inside translated strings.

```json
{
  "apps": {
    "subtitle": "Baked by moolab, Seasoned by you.",
    "subtitleSecondary": "Share your ingredients via <email>Email</email> or <community>Community</community>. We're always open.",
    "statsTotal": "Total",
    "statsReleased": "Released",
    "statsComingSoon": "Coming Soon"
  }
}
```

Korean equivalents:
```json
{
  "apps": {
    "subtitle": "moolab이 굽고, 당신이 완성합니다.",
    "subtitleSecondary": "<email>메일</email>과 <community>커뮤니티</community>로 당신의 의견을 들려주세요. 우리는 언제나 열려 있습니다."
  }
}
```

## Data Source for Stats

Current page renders apps as inline JSX (`SnapDockCard` + `AppCard` calls), not from an array. Refactor into an `apps` config array to derive stats:

```ts
const apps = [
  { name: 'SnapDock', comingSoon: false, ... },
  { name: 'Gitivity', comingSoon: true, ... },
  { name: 'SnapDMG', comingSoon: true, ... },
];
```

- Total = `apps.length`
- Released = `apps.filter(a => !a.comingSoon).length`
- Coming Soon = `apps.filter(a => a.comingSoon).length`

## Files to Modify

1. `src/app/[locale]/apps/page.tsx` — hero section markup + stats grid
2. `messages/en.json` — new i18n keys
3. `messages/ko.json` — Korean translations

## Out of Scope

- App cards redesign (separate task)
- App detail pages (separate task)
- Community link destination (renders as plain text for now)
- The `apps` config array is only for stats derivation; card rendering JSX stays as-is
