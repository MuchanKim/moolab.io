'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function SnapDockPrivacyPage() {
  const t = useTranslations('snapdockPrivacy');
  const s = useTranslations('snapdock');

  const dataItems = [
    t('dataItem1'), t('dataItem2'), t('dataItem3'),
    t('dataItem4'), t('dataItem5'), t('dataItem6'),
  ];

  return (
    <>
      <Navbar />
      <main className="relative z-10 min-h-screen px-6 pt-32 pb-20">
        <div className="mx-auto max-w-2xl">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/apps/snapdock"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              SnapDock
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            className="mt-8 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm text-muted">{t('lastUpdated')}</p>
          </motion.div>

          {/* Content */}
          <Section title={t('overviewTitle')} delay={0.05}>
            <p className="text-sm text-muted leading-relaxed">{t('overviewBody')}</p>
          </Section>

          <Section title={t('dataTitle')} delay={0.1}>
            <p className="text-sm text-muted leading-relaxed mb-3">{t('dataBody')}</p>
            <ul className="space-y-1.5">
              {dataItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t('accessibilityTitle')} delay={0.15}>
            <p className="text-sm text-muted leading-relaxed">{t('accessibilityBody')}</p>
          </Section>

          <Section title={t('storageTitle')} delay={0.2}>
            <p className="text-sm text-muted leading-relaxed">{t('storageBody')}</p>
          </Section>

          <Section title={t('thirdPartyTitle')} delay={0.25}>
            <p className="text-sm text-muted leading-relaxed">{t('thirdPartyBody')}</p>
          </Section>

          <Section title={t('childrenTitle')} delay={0.3}>
            <p className="text-sm text-muted leading-relaxed">{t('childrenBody')}</p>
          </Section>

          <Section title={t('changesTitle')} delay={0.35}>
            <p className="text-sm text-muted leading-relaxed">{t('changesBody')}</p>
          </Section>

          <Section title={t('contactTitle')} delay={0.4}>
            <p className="text-sm text-muted leading-relaxed">{t('contactBody')}</p>
            <div className="mt-3 space-y-1 text-sm text-muted">
              <p>
                <span className="font-medium text-foreground">Email:</span>{' '}
                <a href="mailto:snapdock@moolab.io" className="hover:text-accent transition-colors duration-200">
                  snapdock@moolab.io
                </a>
              </p>
              <p>
                <span className="font-medium text-foreground">Website:</span>{' '}
                <a href="https://moolab.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors duration-200">
                  moolab.io
                </a>
              </p>
            </div>
          </Section>

          {/* Copyright */}
          <motion.p
            className="mt-12 text-xs text-muted/60 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {s('copyright')}
          </motion.p>
        </div>
      </main>
    </>
  );
}
