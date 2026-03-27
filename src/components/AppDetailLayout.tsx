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

export interface VersionEntry {
  version: string;
  date: string;
  changes: string[];
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
  versionHistory?: VersionEntry[];
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

/* ── Download / Coming Soon 버튼 ── */
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function DownloadButton({ url }: { url?: string }) {
  if (url) {
    return (
      <a
        href={url}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold dark:bg-[#2a2b30] dark:text-[rgba(255,255,255,0.85)] bg-[#3a3a42] text-[rgba(255,255,255,0.85)] transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
      >
        <DownloadIcon />
        Download
      </a>
    );
  }

  return (
    <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold dark:bg-[#222226] dark:text-[rgba(255,255,255,0.25)] bg-[#e0e0e4] text-[rgba(0,0,0,0.25)] cursor-not-allowed">
      Coming Soon
    </span>
  );
}

function FeatureCard({ icon, title, body, delay }: { icon: React.ReactNode; title: string; body: string; delay: number }) {
  return (
    <motion.div
      className="group/card rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
      style={{
        background: 'var(--card-detail-bg)',
        border: '1px solid var(--card-detail-border)',
      }}
      whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <div className="mb-3 dark:text-[#8a8a96] text-[#7a7a8a] transition-colors duration-300 group-hover/card:dark:text-[#cdcdd7] group-hover/card:text-[#4a4a5a]">{icon}</div>
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
  versionHistory = [],
}: AppDetailProps) {
  const t = useTranslations(appKey);
  const tFooter = useTranslations('footer');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'changelog'>('overview');
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

          {/* ═══ HEADER (Raycast style) ═══ */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex items-center gap-5">
              {/* Icon with shine */}
              <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                <div className="icon-shine h-full w-full overflow-hidden rounded-[18px]">
                  <Image
                    src={iconSrc}
                    alt={t('name')}
                    width={72}
                    height={72}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Title + Subtitle */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {t('name')}
                </h1>
                <p className="mt-1 text-sm dark:text-[#cdcdd7] text-[#4a4a5a]">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Gradient divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* ═══ MAIN + SIDEBAR ═══ */}
          <div className="flex flex-col md:flex-row gap-12">

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tab bar */}
              <div className="flex gap-0 border-b dark:border-[rgba(255,255,255,0.08)] border-[rgba(0,0,0,0.08)]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 -mb-px ${
                    activeTab === 'overview'
                      ? 'text-foreground border-b-2 border-foreground'
                      : 'dark:text-[#8a8a96] text-[#7a7a8a] hover:text-foreground'
                  }`}
                >
                  Overview
                </button>
                {versionHistory.length > 0 && (
                  <button
                    onClick={() => setActiveTab('changelog')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 -mb-px ${
                      activeTab === 'changelog'
                        ? 'text-foreground border-b-2 border-foreground'
                        : 'dark:text-[#8a8a96] text-[#7a7a8a] hover:text-foreground'
                    }`}
                  >
                    Changelog
                  </button>
                )}
              </div>

              {/* Tab content */}
              <div className="mt-6">
                {activeTab === 'overview' && (
                  <>
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
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full dark:bg-[#60A5FA] bg-[#3b82f6]" />
                          {t(key)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {activeTab === 'changelog' && (
                  <div>
                    {/* Version count */}
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-sm dark:text-[#8a8a96] text-[#7a7a8a]">Versions</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full dark:bg-[rgba(255,255,255,0.06)] dark:text-[#8a8a96] bg-[rgba(0,0,0,0.06)] text-[#7a7a8a]">
                        {versionHistory.length}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[11px] top-3 bottom-3 w-px dark:bg-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.08)]" />

                      <div className="space-y-8">
                        {versionHistory.map((entry) => (
                          <div key={entry.version} className="relative pl-9">
                            {/* Timeline dot */}
                            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full dark:bg-[#111214] bg-[#FFFFFF] border-2 dark:border-[#60A5FA] border-[#3b82f6]" />

                            {/* Version header */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold text-foreground">{entry.version}</span>
                              <span className="text-xs dark:text-[#8a8a96] text-[#7a7a8a]">— {entry.date}</span>
                            </div>

                            {/* Changes */}
                            <ul className="mt-3 space-y-2">
                              {entry.changes.map((change, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm dark:text-[#cdcdd7] text-[#4a4a5a]">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full dark:bg-[#60A5FA] bg-[#3b82f6]" />
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-full md:w-[160px] flex-shrink-0">
              <div className="md:sticky md:top-[100px]">
                {/* Download / Coming Soon */}
                <DownloadButton url={downloadUrl} />

                {/* Divider */}
                <div className="my-5 h-px dark:bg-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.08)]" />

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
