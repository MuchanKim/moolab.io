# App Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a shared AppDetailLayout component and apply it to SnapDock (refactor) and SnapDMG (new page) with Immersive Hero + Floating Meta sidebar design.

**Architecture:** Extract `AppDetailLayout.tsx` as a shared component with typed props (`AppDetailProps`). Each app page becomes a thin wrapper passing config. Icon shine animation via CSS keyframes in `globals.css`. Lucide React for line icons.

**Tech Stack:** Next.js, Framer Motion, next-intl, Tailwind CSS, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-25-app-detail-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `messages/en.json` | Add `snapdmg` i18n namespace |
| Modify | `messages/ko.json` | Korean translations for `snapdmg` |
| Modify | `src/app/globals.css` | Add `@keyframes icon-shine` animation |
| Create | `src/components/AppDetailLayout.tsx` | Shared detail page layout component |
| Modify | `src/app/[locale]/apps/snapdock/page.tsx` | Refactor to use AppDetailLayout |
| Create | `src/app/[locale]/apps/snapdmg/page.tsx` | New page using AppDetailLayout |
| Modify | `package.json` | Add `lucide-react` dependency |

---

### Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install lucide-react**

Run: `npm install lucide-react`

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react for line icons"
```

---

### Task 2: Add SnapDMG i18n keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

- [ ] **Step 1: Add `snapdmg` namespace to en.json**

Add after the `snapdock` section (before `snapdockPrivacy`):

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
  "backToApps": "Back to Apps"
}
```

- [ ] **Step 2: Add `snapdmg` namespace to ko.json**

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
  "backToApps": "Apps로 돌아가기"
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/ko.json
git commit -m "feat: add snapdmg i18n keys for detail page"
```

---

### Task 3: Add icon shine CSS animation

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add keyframes to globals.css**

Add at the end of the file:

```css
/* Icon shine animation — diagonal light sweep */
@keyframes icon-shine {
  0% {
    transform: translateX(-100%) rotate(25deg);
  }
  100% {
    transform: translateX(200%) rotate(25deg);
  }
}

.icon-shine {
  position: relative;
  overflow: hidden;
}

.icon-shine::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 45%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.15) 55%,
    transparent 100%
  );
  transform: translateX(-100%) rotate(25deg);
  animation: icon-shine 0.8s ease-out 0.5s forwards;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add icon shine CSS animation for app detail pages"
```

---

### Task 4: Create AppDetailLayout component

**Files:**
- Create: `src/components/AppDetailLayout.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/AppDetailLayout.tsx` with the full Immersive Hero + Floating Meta layout:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface FeatureHighlight {
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
}

export interface AppDetailProps {
  appKey: string;
  iconPath: string;
  highlights: FeatureHighlight[];
  featureKeys: string[];
  downloadUrl?: string;
  privacyUrl?: string;
  supportUrl?: string;
  platform: string;
  category: string;
  version: string;
  requires: string;
  updatedDate: string;
}

/* ── Apple logo SVG ── */
const AppleLogo = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const APPLE_PLATFORMS = new Set(['macOS', 'iOS', 'iPadOS']);

function PlatformBadge({ text }: { text: string }) {
  const isApple = APPLE_PLATFORMS.has(text);
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-[5px] text-[11px] font-bold tracking-wider leading-none dark:bg-black dark:text-white dark:border-[#2a2a2a] bg-white text-black border-[#d4d4d8] border">
      {isApple && <AppleLogo />}{text}
    </span>
  );
}

function CategoryBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-[5px] text-[11px] font-bold tracking-wider leading-none dark:bg-[#28282e] dark:text-[#a0a0a8] dark:border-[#3a3a42] bg-[#ebebef] text-[#555560] border-[#d0d0d6] border">
      {text}
    </span>
  );
}

function FeatureCard({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay: number }) {
  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        background: 'var(--card-detail-bg)',
        border: '1px solid var(--card-detail-border)',
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <div className="mb-3 dark:text-[#8a8a96] text-[#7a7a8a]">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed dark:text-[#8a8a96] text-[#7a7a8a]">{body}</p>
    </motion.div>
  );
}

export function AppDetailLayout({
  appKey,
  iconPath,
  highlights,
  featureKeys,
  downloadUrl,
  privacyUrl,
  supportUrl,
  platform,
  category,
  version,
  requires,
  updatedDate,
}: AppDetailProps) {
  const t = useTranslations(appKey);
  const tFooter = useTranslations('footer');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === 'dark';
  const iconSrc = isDark
    ? `${iconPath}/appIcon_dark.png`
    : `${iconPath}/appIcon_default.png`;

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-5xl">

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 text-sm dark:text-[#8a8a96] text-[#7a7a8a] hover:text-foreground transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('backToApps')}
            </Link>
          </motion.div>

          {/* ═══ HERO ═══ */}
          <motion.div
            className="mt-8 mb-0 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* Icon with shine */}
            <div className="relative mx-auto" style={{ width: 96, height: 96 }}>
              <div className="icon-shine h-full w-full overflow-hidden rounded-[22px]">
                <Image
                  src={iconSrc}
                  alt={t('name')}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Subtle glow */}
              <div className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
            </div>

            {/* App name */}
            <h1 className="mt-5 text-5xl font-extrabold text-foreground tracking-tighter">
              {t('name')}
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-lg dark:text-[#cdcdd7] text-[#4a4a5a]">
              {t('subtitle')}
            </p>

            {/* Download CTA */}
            <div className="mt-6">
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                >
                  ↓ Download
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-foreground/30 text-background/50 px-7 py-3 text-sm font-semibold cursor-not-allowed">
                  ↓ Download
                </span>
              )}
            </div>
          </motion.div>

          {/* Gradient divider */}
          <div className="my-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ═══ MAIN + SIDEBAR ═══ */}
          <div className="flex flex-col md:flex-row gap-12">

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Description */}
              <motion.p
                className="text-sm leading-relaxed dark:text-[#cdcdd7] text-[#4a4a5a]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
              >
                {t('description')}
              </motion.p>

              {/* Highlights */}
              <h2 className="mt-10 text-lg font-bold text-foreground">Highlights</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {highlights.map((h, i) => (
                  <FeatureCard
                    key={h.titleKey}
                    icon={h.icon}
                    title={t(h.titleKey)}
                    body={t(h.bodyKey)}
                    delay={0.1 * i}
                  />
                ))}
              </div>

              {/* Features list */}
              <h2 className="mt-10 text-lg font-bold text-foreground">{t('featuresTitle')}</h2>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {featureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm dark:text-[#cdcdd7] text-[#4a4a5a]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full dark:bg-[rgba(255,255,255,0.3)] bg-[rgba(0,0,0,0.2)]" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar */}
            <aside className="w-full md:w-[160px] flex-shrink-0">
              <div className="md:sticky md:top-[100px]">
                {/* Platform */}
                <div className="text-[9px] uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">Platform</div>
                <div className="mt-2">
                  <PlatformBadge text={platform} />
                </div>

                {/* Category */}
                <div className="mt-5 text-[9px] uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">Category</div>
                <div className="mt-2">
                  <CategoryBadge text={category} />
                </div>

                {/* Divider */}
                <div className="my-5 h-px dark:bg-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.08)]" />

                {/* Specs */}
                <div className="text-[9px] uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">Requires</div>
                <div className="mt-1 text-xs dark:text-[#cdcdd7] text-[#4a4a5a]">{requires}</div>

                <div className="mt-4 text-[9px] uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">Version</div>
                <div className="mt-1 text-xs dark:text-[#cdcdd7] text-[#4a4a5a]">{version}</div>

                <div className="mt-4 text-[9px] uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">Updated</div>
                <div className="mt-1 text-xs dark:text-[#cdcdd7] text-[#4a4a5a]">{updatedDate}</div>

                {/* Links */}
                {(privacyUrl || supportUrl) && (
                  <>
                    <div className="my-5 h-px dark:bg-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.08)]" />
                    <div className="flex flex-col gap-2">
                      {privacyUrl && (
                        <Link href={privacyUrl} className="text-xs underline underline-offset-2 dark:text-[#8a8a96] text-[#7a7a8a] hover:text-foreground transition-colors">
                          Privacy Policy
                        </Link>
                      )}
                      {supportUrl && (
                        <Link href={supportUrl} className="text-xs underline underline-offset-2 dark:text-[#8a8a96] text-[#7a7a8a] hover:text-foreground transition-colors">
                          Support
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-4 border-t dark:border-[rgba(255,255,255,0.04)] border-[rgba(0,0,0,0.04)] text-center">
            <p className="text-xs dark:text-[rgba(255,255,255,0.2)] text-[rgba(0,0,0,0.25)]">
              {tFooter('rights')}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
```

Also add CSS variables for feature card backgrounds to `globals.css` (inside `:root` and `html[data-theme="dark"]`):

In `:root`:
```css
--card-detail-bg: linear-gradient(165deg, #ffffff 0%, #f7f7fa 50%, #f2f2f6 100%);
--card-detail-border: rgba(0,0,0,0.05);
```

In `html[data-theme="dark"]`:
```css
--card-detail-bg: linear-gradient(165deg, #1e1f23 0%, #18191d 100%);
--card-detail-border: rgba(255,255,255,0.06);
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/AppDetailLayout.tsx src/app/globals.css
git commit -m "feat: create AppDetailLayout shared component"
```

---

### Task 5: Refactor SnapDock page to use AppDetailLayout

**Files:**
- Modify: `src/app/[locale]/apps/snapdock/page.tsx`

- [ ] **Step 1: Replace entire SnapDock page**

Replace the full content of `src/app/[locale]/apps/snapdock/page.tsx` with:

```tsx
'use client';

import { Zap, Target, Sparkles, ShieldCheck } from 'lucide-react';
import { AppDetailLayout } from '@/components/AppDetailLayout';

export default function SnapDockPage() {
  return (
    <AppDetailLayout
      appKey="snapdock"
      iconPath="/apps/snapdock"
      highlights={[
        { icon: <Zap size={20} />, titleKey: 'instantAccessTitle', bodyKey: 'instantAccessBody' },
        { icon: <Target size={20} />, titleKey: 'organizeTitle', bodyKey: 'organizeBody' },
        { icon: <Sparkles size={20} />, titleKey: 'designTitle', bodyKey: 'designBody' },
        { icon: <ShieldCheck size={20} />, titleKey: 'privacyTitle', bodyKey: 'privacyBody' },
      ]}
      featureKeys={['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
      privacyUrl="/apps/snapdock/privacy"
      supportUrl="/apps/snapdock/support"
      platform="macOS"
      category="Util"
      version="1.0.0"
      requires="macOS 26 (Tahoe) or later"
      updatedDate="March 2026"
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Visual check**

Run: `npx next dev` — check `/apps/snapdock` in both dark and light mode

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/apps/snapdock/page.tsx"
git commit -m "refactor: migrate SnapDock detail page to AppDetailLayout"
```

---

### Task 6: Create SnapDMG detail page

**Files:**
- Create: `src/app/[locale]/apps/snapdmg/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/[locale]/apps/snapdmg/page.tsx`:

```tsx
'use client';

import { MousePointerClick, Palette, Download, Feather } from 'lucide-react';
import { AppDetailLayout } from '@/components/AppDetailLayout';

export default function SnapDMGPage() {
  return (
    <AppDetailLayout
      appKey="snapdmg"
      iconPath="/apps/snapDMG"
      highlights={[
        { icon: <MousePointerClick size={20} />, titleKey: 'dragDropTitle', bodyKey: 'dragDropBody' },
        { icon: <Palette size={20} />, titleKey: 'customizeTitle', bodyKey: 'customizeBody' },
        { icon: <Download size={20} />, titleKey: 'exportTitle', bodyKey: 'exportBody' },
        { icon: <Feather size={20} />, titleKey: 'lightweightTitle', bodyKey: 'lightweightBody' },
      ]}
      featureKeys={['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
      platform="macOS"
      category="Util"
      version="1.0.0"
      requires="macOS 26 (Tahoe) or later"
      updatedDate="March 2026"
    />
  );
}
```

Note: No `downloadUrl`, `privacyUrl`, or `supportUrl` — Download renders disabled, links hidden in sidebar.

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`

- [ ] **Step 3: Visual check**

Run: `npx next dev` — check `/apps/snapdmg` in both dark and light mode. Verify:
- Icon loads (dark/light)
- Download button is disabled
- Sidebar has no Privacy/Support links
- i18n text renders in both EN/KO

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/apps/snapdmg/page.tsx"
git commit -m "feat: create SnapDMG detail page using AppDetailLayout"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full build check**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds, no errors

- [ ] **Step 2: Visual checklist**

Verify in browser:
- `/apps/snapdock` — dark/light mode, icon shine animation plays, sidebar sticky on scroll
- `/apps/snapdmg` — dark/light mode, disabled download, no privacy/support links
- `/ko/apps/snapdock` — Korean translations render
- `/ko/apps/snapdmg` — Korean translations render
- `/apps` → click SnapDock card → detail page loads
- `/apps` → click SnapDMG card → detail page loads
- Back link `← Back to Apps` works on both pages
- Mobile responsive: sidebar collapses below main content at `< md`
