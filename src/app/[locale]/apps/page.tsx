'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function AppCard() {
  const t = useTranslations('snapdock');
  const { theme } = useTheme();
  const iconSrc = theme === 'dark'
    ? '/apps/snapdock/appIcon_dark.png'
    : '/apps/snapdock/appIcon_default.png';

  return (
    <Link href="/apps/snapdock" className="block">
      <motion.div
        className="group relative rounded-2xl border border-border p-6 sm:p-8 transition-colors duration-200 hover:border-accent/50"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        {/* App icon */}
        <div className="mb-4 h-16 w-16 overflow-hidden rounded-2xl">
          <Image src={iconSrc} alt="SnapDock" width={64} height={64} className="h-full w-full object-cover" />
        </div>

        {/* App info */}
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {t('name')}
        </h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          {t('subtitle')}
        </p>

        {/* Badges */}
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {t('category')}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            {t('platform')}
          </span>
        </div>

        {/* Arrow indicator */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}

export default function AppsPage() {
  const t = useTranslations('apps');

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-3 text-base text-muted">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* App Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppCard />
          </div>
        </div>
      </main>
    </>
  );
}
