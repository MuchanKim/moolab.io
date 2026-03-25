'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ── Theme-aware card surfaces ── */
const CARD_THEME = {
  dark: {
    bg: 'linear-gradient(165deg, #2a2b30 0%, #1c1d21 40%, #161719 100%)',
    border: 'rgba(255,255,255,0.06)',
    shadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.4)',
    shimmerBase: 'from-white/[0.04] via-transparent to-transparent',
    shimmerHover: 'from-white/[0.08] via-white/[0.02] to-transparent',
    btnBg: 'linear-gradient(145deg, #45464d, #35363c, #2a2b30)',
    btnShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 2px 8px rgba(0,0,0,0.4)',
    btnShimmer: 'via-white/[0.12]',
    textPrimary: 'text-white',
    textSecondary: 'text-white/50',
    btnText: 'text-white/90',
    iconShadowHover: '0 8px 32px rgba(0,0,0,0.5)',
  },
  light: {
    bg: 'linear-gradient(165deg, #ffffff 0%, #f7f7fa 50%, #f2f2f6 100%)',
    border: 'rgba(0,0,0,0.05)',
    shadow: '0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(0,0,0,0.02) inset, 0 4px 12px rgba(0,0,0,0.05)',
    shimmerBase: 'from-white/40 via-transparent to-transparent',
    shimmerHover: 'from-white/70 via-white/15 to-transparent',
    btnBg: 'linear-gradient(145deg, #2a2a30, #1a1a1e, #111114)',
    btnShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 8px rgba(0,0,0,0.2)',
    btnShimmer: 'via-white/[0.12]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-400',
    btnText: 'text-white/90',
    iconShadowHover: '0 8px 32px rgba(0,0,0,0.1)',
  },
} as const;

/* ── Apple logo SVG ── */
const AppleLogo = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/* ── Apple platform labels ── */
const APPLE_PLATFORMS = new Set(['macOS', 'iOS', 'iPadOS']);

/* ── Unified label shell ── */
function Tag({ bg, fg, border, children }: { bg: string; fg: string; border: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-[5px] text-[11px] font-bold tracking-wider leading-none"
      style={{ backgroundColor: bg, color: fg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  );
}

function AppLabel({ text, isDark }: { text: string; isDark: boolean }) {
  if (APPLE_PLATFORMS.has(text)) {
    return isDark
      ? <Tag bg="#000000" fg="#ffffff" border="#2a2a2a"><AppleLogo />{text}</Tag>
      : <Tag bg="#ffffff" fg="#000000" border="#d4d4d8"><AppleLogo />{text}</Tag>;
  }
  return isDark
    ? <Tag bg="#28282e" fg="#a0a0a8" border="#3a3a42">{text}</Tag>
    : <Tag bg="#ebebef" fg="#555560" border="#d0d0d6">{text}</Tag>;
}



/* ── Placeholder icon for coming soon apps ── */
function PlaceholderIcon({ isDark = true }: { isDark?: boolean }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #3a3a42, #2a2a32)'
          : 'linear-gradient(135deg, #e0e0e6, #d0d0d8)',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

/* ── App Card ── */
interface AppCardProps {
  name: string;
  subtitle: string;
  labels: string[];
  href?: string;
  comingSoon?: boolean;
  delay?: number;
  icon?: React.ReactNode | ((isDark: boolean) => React.ReactNode);
}

const MAX_VISIBLE_LABELS = 2;

function AppCard({
  name,
  subtitle,
  labels,
  href,
  comingSoon = false,
  delay = 0,
  icon,
}: AppCardProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === 'dark';
  const ct = isDark ? CARD_THEME.dark : CARD_THEME.light;

  // Deduplicate labels
  const uniqueLabels = [...new Set(labels)];
  const visibleLabels = uniqueLabels.slice(0, MAX_VISIBLE_LABELS);
  const extraCount = uniqueLabels.length - MAX_VISIBLE_LABELS;

  return (
    <motion.div
      className="group relative flex flex-col items-center rounded-2xl px-10 pt-6 pb-8 text-center transition-all duration-500 overflow-hidden h-[360px]"
      style={{
        background: ct.bg,
        border: `1px solid ${ct.border}`,
        boxShadow: ct.shadow,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {/* Shimmer overlay */}
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ct.shimmerBase} opacity-100 transition-opacity duration-500 group-hover:opacity-0`} />
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ct.shimmerHover} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

      {/* Icon */}
      <div className="relative mb-5 h-28 w-28 overflow-hidden rounded-[24px] shadow-lg transition-all duration-300 group-hover:scale-105">
        {typeof icon === 'function' ? icon(isDark) : icon}
      </div>

      {/* Name */}
      <h2 className={`relative text-2xl font-bold tracking-tight ${ct.textPrimary}`}>
        {name}
      </h2>

      {/* Tagline */}
      <p className={`relative mt-2 text-sm ${ct.textSecondary}`}>
        {subtitle}
      </p>

      {/* Labels */}
      <div className="relative mt-3 flex items-center justify-center gap-2 flex-nowrap">
        {visibleLabels.map((label) =>
          <AppLabel key={label} text={label} isDark={isDark} />
        )}
        {extraCount > 0 && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider"
            style={{
              backgroundColor: 'rgba(140,140,140,0.12)',
              color: '#8B8B8B',
              border: '1px solid rgba(140,140,140,0.25)',
            }}
          >
            +{extraCount}
          </span>
        )}
      </div>

      {/* Action button — pushed to bottom */}
      <div className="relative mt-auto pt-5">
        {comingSoon ? (
          <span
            className="inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold cursor-not-allowed"
            style={{
              background: isDark
                ? 'linear-gradient(145deg, #35363c, #2a2b30, #222226)'
                : 'linear-gradient(145deg, #e2e2e6, #d8d8dc, #d0d0d4)',
              boxShadow: isDark
                ? '0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 6px rgba(0,0,0,0.3)'
                : '0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 6px rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)',
            }}
          >
            Coming Soon
          </span>
        ) : (
          <Link
            href={href ?? '/apps'}
            className={`group/btn relative inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold ${ct.btnText} transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,255,255,0.06)] active:scale-95 overflow-hidden`}
            style={{
              background: ct.btnBg,
              boxShadow: ct.btnShadow,
            }}
          >
            <span className={`absolute inset-0 bg-gradient-to-r from-white/0 ${ct.btnShimmer} to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700`} />
            <span className="relative">Explore</span>
            <svg className="relative" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ── SnapDock card (with theme-aware icon) ── */
function SnapDockCard({ delay }: { delay: number }) {
  const t = useTranslations('snapdock');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const iconSrc = mounted && theme === 'dark'
    ? '/apps/snapdock/appIcon_dark.png'
    : '/apps/snapdock/appIcon_default.png';

  return (
    <AppCard
      name={t('name')}
      subtitle={t('subtitle')}
      labels={[t('platform'), t('category')]}
      href="/apps/snapdock"
      delay={delay}
      icon={
        <Image
          src={iconSrc}
          alt="SnapDock"
          width={128}
          height={128}
          className="h-full w-full object-cover"
        />
      }
    />
  );
}

export default function AppsPage() {
  const t = useTranslations('apps');

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-muted">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* App Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SnapDockCard delay={0.1} />

            <AppCard
              name="Gitivity"
              subtitle="GitHub activity, at a glance"
              labels={["iOS", "Productivity"]}
              comingSoon
              delay={0.2}
              icon={(isDark) => <PlaceholderIcon isDark={isDark} />}
            />

            <AppCard
              name="SnapDMG"
              subtitle=".app to DMG, styled your way"
              labels={["macOS", "Util"]}
              comingSoon
              delay={0.3}
              icon={(isDark) => <PlaceholderIcon isDark={isDark} />}
            />
          </div>
        </div>
      </main>
    </>
  );
}
