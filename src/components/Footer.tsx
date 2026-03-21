'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function Footer() {
  const t = useTranslations();

  return (
    <motion.footer
      className="relative z-10 px-4 pb-10 sm:px-6 sm:pb-12 md:px-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="mx-auto max-w-6xl flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs sm:text-sm text-muted">{t('footer.rights')}</p>

        <a
          href={`mailto:${t('contact.email')}`}
          className="group flex items-center gap-2 text-xs sm:text-sm text-muted hover:text-foreground transition-colors"
        >
          <span className="h-px w-4 bg-accent transition-all duration-300 group-hover:w-6" />
          {t('contact.email')}
        </a>
      </div>
    </motion.footer>
  );
}
