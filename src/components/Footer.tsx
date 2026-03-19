'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export function Footer() {
  const t = useTranslations();

  return (
    <motion.footer
      className="relative z-10 px-6 pb-12 md:px-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="mx-auto max-w-6xl flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#c0c0c0]">{t('footer.rights')}</p>

        <a
          href={`mailto:${t('contact.email')}`}
          className="group flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
        >
          <span className="h-px w-4 bg-[#6FBB74] transition-all duration-300 group-hover:w-6" />
          {t('contact.email')}
        </a>
      </div>
    </motion.footer>
  );
}
