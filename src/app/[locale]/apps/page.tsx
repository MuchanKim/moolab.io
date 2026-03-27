'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function SlotNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const [started, setStarted] = useState(false);
  const digits = Array.from({ length: 10 }, (_, i) => i);

  return (
    <span
      ref={(el) => { if (el && !started) setStarted(true); }}
      className="inline-flex overflow-hidden"
      style={{ height: '1em', lineHeight: 1 }}
    >
      <motion.span
        className="flex flex-col items-center"
        initial={{ y: 0 }}
        animate={started ? { y: `-${target}em` } : { y: 0 }}
        transition={{
          duration: 0.8 + target * 0.1,
          ease: [0.16, 1, 0.3, 1],
          delay,
        }}
      >
        {digits.map((d) => (
          <span key={d} className="block" style={{ height: '1em' }}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

/* ── Apple logo SVG ── */
const AppleLogo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/* ── App Card (B안: Raycast style + Soft Fill + Corner Badge) ── */
interface AppCardProps {
  name: string;
  subtitle: string;
  description: string;
  platform: string;
  category: string;
  href: string;
  comingSoon?: boolean;
  delay?: number;
  iconPath: string;
}

function AppCard({
  name,
  subtitle,
  description,
  platform,
  category,
  href,
  comingSoon = false,
  delay = 0,
  iconPath,
}: AppCardProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === 'dark';
  const iconSrc = isDark
    ? `${iconPath}/appIcon_dark.png`
    : `${iconPath}/appIcon_default.png`;

  return (
    <Link href={href} className="block">
      <div
        className={`group relative flex flex-col gap-3 rounded-2xl p-6 cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-0.5 ${
          isDark
            ? 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] backdrop-blur-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.05)]'
            : 'bg-white border border-[rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] hover:border-[rgba(0,0,0,0.14)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'
        }`}
      >
        {/* Dark: glass gradient overlay */}
        {isDark && (
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent" />
        )}
        {/* Coming Soon corner badge */}
        {comingSoon && (
          <span className={`absolute top-4 right-5 text-[10px] font-semibold tracking-[0.05em] px-2.5 py-1 rounded-full ${
            isDark
              ? 'bg-[rgba(255,180,60,0.1)] text-[rgba(255,180,60,0.5)] border border-[rgba(255,180,60,0.15)]'
              : 'bg-[rgba(180,120,20,0.1)] text-[rgba(160,100,10,0.75)] border border-[rgba(180,120,20,0.18)]'
          }`}>
            Coming Soon
          </span>
        )}

        {/* Top: Icon + Name/Subtitle */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-[14px] overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
            isDark ? 'shadow-[0_4px_12px_rgba(0,0,0,0.3)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
          }`}>
            <Image src={iconSrc} alt={name} width={56} height={56} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-semibold text-foreground">{name}</h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-[rgba(255,255,255,0.35)]' : 'text-[rgba(0,0,0,0.45)]'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className={`text-[13px] leading-relaxed ${isDark ? 'text-[rgba(255,255,255,0.45)]' : 'text-[rgba(0,0,0,0.55)]'}`}>
          {description}
        </p>

        {/* Meta: Soft Fill labels */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md ${
            isDark ? 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.4)]' : 'bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.5)]'
          }`}>
            <AppleLogo /> {platform}
          </span>
          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-md ${
            isDark ? 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.4)]' : 'bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.5)]'
          }`}>
            {category}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AppsPage() {
  const t = useTranslations('apps');
  const tSnapdock = useTranslations('snapdock');

  const apps = [
    { name: 'SnapDMG', comingSoon: false },
    { name: 'SnapDock', comingSoon: false },
    { name: 'Gitivity', comingSoon: true },
  ];

  const totalApps = apps.length;
  const releasedApps = apps.filter(a => !a.comingSoon).length;
  const comingSoonApps = apps.filter(a => a.comingSoon).length;

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <motion.div
            className="mb-16 pt-8 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground tracking-tighter">
              {t('title')}
            </h1>

            {/* Subtitle — Main */}
            <p className="mt-5 text-xl sm:text-2xl dark:text-[#cdcdd7] text-[#4a4a5a]">
              {t('subtitle')}
            </p>

            {/* Subtitle — Secondary */}
            <p className="mt-2 text-base leading-relaxed dark:text-[#8a8a96] text-[#7a7a8a]">
              {t.rich('subtitleSecondary', {
                email: (chunks) => (
                  <a
                    href="mailto:hello@moolab.com"
                    className="underline underline-offset-[3px] decoration-current/30 dark:text-inherit text-inherit"
                  >
                    {chunks}
                  </a>
                ),
                community: (chunks) => (
                  <a
                    href="https://discord.gg/2x7GQg2PVF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-[3px] decoration-current/30 dark:text-inherit text-inherit"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>

            {/* Stats Grid — 좌우 대칭 (1fr auto auto auto 1fr) */}
            <motion.div
              className="mx-auto mt-10 grid max-w-md items-center"
              style={{ gridTemplateColumns: '1fr auto auto auto 1fr' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
            >
              {/* Total */}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-foreground"><SlotNumber target={totalApps} delay={0.3} /></div>
                <div className="mt-2 text-sm uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">
                  {t('statsTotal')}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 h-12 w-px dark:bg-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.1)]" />

              {/* Released (정중앙) */}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-foreground"><SlotNumber target={releasedApps} delay={0.5} /></div>
                <div className="mt-2 text-sm uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">
                  {t('statsReleased')}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 h-12 w-px dark:bg-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.1)]" />

              {/* Coming Soon */}
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-foreground"><SlotNumber target={comingSoonApps} delay={0.7} /></div>
                <div className="mt-2 text-sm uppercase tracking-widest dark:text-[#8a8a96] text-[#7a7a8a]">
                  {t('statsComingSoon')}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Divider */}
          <div className="mb-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* App Grid — 2열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppCard
              name="SnapDMG"
              subtitle={t('snapdmgSubtitle')}
              description="Drag, drop, and export beautifully styled DMG installers. No terminal needed."
              platform="macOS"
              category="Util"
              href="/apps/snapdmg"
              iconPath="/apps/snapDMG"
              delay={0.1}
            />
            <AppCard
              name="SnapDock"
              subtitle={tSnapdock('subtitle')}
              description="Summon a floating dock at your cursor with a keyboard shortcut. Pin, reorder, launch."
              platform="macOS"
              category="Util"
              href="/apps/snapdock"
              iconPath="/apps/snapdock"
              delay={0.2}
            />
            <AppCard
              name="Gitivity"
              subtitle={t('gitivitySubtitle')}
              description="AI-powered GitHub activity summaries with widgets and streak tracking across devices."
              platform="iOS · iPadOS · macOS"
              category="Productivity"
              href="/apps/gitivity"
              iconPath="/apps/gitivity"
              comingSoon
              delay={0.3}
            />
          </div>
        </div>
      </main>
    </>
  );
}
