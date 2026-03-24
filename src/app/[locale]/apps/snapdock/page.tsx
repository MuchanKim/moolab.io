'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function FeatureCard({ icon, title, body, delay }: { icon: string; title: string; body: string; delay: number }) {
  return (
    <motion.div
      className="rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </motion.div>
  );
}

export default function SnapDockPage() {
  const t = useTranslations('snapdock');
  const { theme } = useTheme();
  const iconSrc = theme === 'dark'
    ? '/apps/snapdock/appIcon_dark.png'
    : '/apps/snapdock/appIcon_default.png';

  const features = [
    { icon: '⚡', titleKey: 'instantAccessTitle', bodyKey: 'instantAccessBody' },
    { icon: '🎯', titleKey: 'organizeTitle', bodyKey: 'organizeBody' },
    { icon: '✨', titleKey: 'designTitle', bodyKey: 'designBody' },
    { icon: '🔒', titleKey: 'privacyTitle', bodyKey: 'privacyBody' },
  ];

  const featureList = [
    t('feature1'), t('feature2'), t('feature3'),
    t('feature4'), t('feature5'), t('feature6'),
  ];

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-3xl">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('backToApps')}
            </Link>
          </motion.div>

          {/* Hero */}
          <motion.div
            className="mt-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            <div className="mb-5 h-20 w-20 overflow-hidden rounded-[22px]">
              <Image src={iconSrc} alt="SnapDock" width={80} height={80} className="h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t('name')}
            </h1>
            <p className="mt-2 text-lg text-muted">
              {t('subtitle')}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {t('category')}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                {t('platform')}
              </span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-base text-muted leading-relaxed mb-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          >
            {t('description')}
          </motion.p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {features.map((f, i) => (
              <FeatureCard
                key={f.titleKey}
                icon={f.icon}
                title={t(f.titleKey)}
                body={t(f.bodyKey)}
                delay={0.1 * i}
              />
            ))}
          </div>

          {/* Feature list */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t('featuresTitle')}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featureList.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* System requirements */}
          <motion.div
            className="mb-12 rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-1">
              {t('requirements')}
            </h2>
            <p className="text-sm text-muted">{t('requirementsBody')}</p>
          </motion.div>

          {/* Links */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link
              href="/apps/snapdock/privacy"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors duration-200"
            >
              {t('privacyPolicy')}
            </Link>
            <Link
              href="/apps/snapdock/support"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors duration-200"
            >
              {t('support')}
            </Link>
          </motion.div>

          {/* Copyright */}
          <motion.p
            className="mt-16 text-xs text-muted/60 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t('copyright')}
          </motion.p>
        </div>
      </main>
    </>
  );
}
