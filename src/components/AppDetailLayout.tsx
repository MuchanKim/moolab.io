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
