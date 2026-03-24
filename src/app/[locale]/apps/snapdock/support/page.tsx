'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Link } from '@/i18n/navigation';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function IssueCard({ title, fixes, delay }: { title: string; fixes: string[]; delay: number }) {
  return (
    <motion.div
      className="rounded-xl border border-border p-5"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <ul className="space-y-2">
        {fixes.map((fix) => (
          <li key={fix} className="flex items-start gap-2 text-sm text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {fix}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function SnapDockSupportPage() {
  const t = useTranslations('snapdockSupport');
  const s = useTranslations('snapdock');

  const issues = [
    {
      title: t('issue1Title'),
      fixes: [t('issue1Fix1'), t('issue1Fix2')],
    },
    {
      title: t('issue2Title'),
      fixes: [t('issue2Fix1'), t('issue2Fix2')],
    },
    {
      title: t('issue3Title'),
      fixes: [t('issue3Fix1'), t('issue3Fix2'), t('issue3Fix3')],
    },
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
          </motion.div>

          {/* Getting Help */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('gettingHelp')}</h2>
            <p className="text-sm text-muted leading-relaxed">{t('gettingHelpBody')}</p>
          </motion.div>

          {/* Common Issues */}
          <motion.h2
            className="text-lg font-semibold text-foreground mb-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {t('commonIssues')}
          </motion.h2>

          <div className="space-y-4 mb-12">
            {issues.map((issue, i) => (
              <IssueCard
                key={issue.title}
                title={issue.title}
                fixes={issue.fixes}
                delay={0.1 * i}
              />
            ))}
          </div>

          {/* Contact */}
          <motion.div
            className="mb-10 rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('contactTitle')}</h2>
            <div className="space-y-1.5 text-sm text-muted">
              <p>
                <span className="font-medium text-foreground">Email:</span>{' '}
                <a href="mailto:snapdock@moolab.io" className="hover:text-accent transition-colors duration-200">
                  snapdock@moolab.io
                </a>
              </p>
            </div>
          </motion.div>

          {/* System Requirements */}
          <motion.div
            className="mb-10 rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <h2 className="text-sm font-semibold text-foreground mb-1">{t('requirementsTitle')}</h2>
            <p className="text-sm text-muted">{t('requirementsBody')}</p>
          </motion.div>

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
