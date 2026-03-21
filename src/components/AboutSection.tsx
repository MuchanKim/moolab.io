'use client';

import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inView: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const STATS = [
  { valueKey: 'stat1Value', labelKey: 'stat1Label' },
  { valueKey: 'stat2Value', labelKey: 'stat2Label' },
  { valueKey: 'stat3Value', labelKey: 'stat3Label' },
] as const;

const VALUES = [
  { num: '01', titleKey: 'value1Title', bodyKey: 'value1Body' },
  { num: '02', titleKey: 'value2Title', bodyKey: 'value2Body' },
  { num: '03', titleKey: 'value3Title', bodyKey: 'value3Body' },
] as const;

export function AboutSection() {
  const t = useTranslations('about');
  const tc = useTranslations('contact');

  return (
    <section id="about" className="relative z-10 px-4 sm:px-6 md:px-12">

      {/* Block 1: Mission + Stats */}
      <div className="mx-auto max-w-6xl py-20 sm:py-28 md:py-40">

        {/* Label */}
        <motion.div
          className="mb-10 sm:mb-16 flex items-center gap-3"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <div className="h-px w-8 bg-accent" />
          <span className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
            {t('label')}
          </span>
        </motion.div>

        {/* Heading + Stats row */}
        <div className="flex flex-col gap-10 sm:gap-12 md:flex-row md:items-end md:justify-between">
          <motion.h2
            className="text-[clamp(1.8rem,5vw,4rem)] font-bold leading-tight tracking-tight text-foreground md:max-w-lg"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            {t('heading')}
          </motion.h2>

          <motion.div
            className="flex gap-8 sm:gap-10 md:gap-14 md:pb-2"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            {STATS.map(({ valueKey, labelKey }) => (
              <motion.div key={valueKey} variants={cardVariant} className="flex flex-col gap-1">
                <span className="text-[1.6rem] sm:text-[2.2rem] font-bold tracking-tight text-foreground leading-none">
                  {t(valueKey)}
                </span>
                <span className="text-[10px] sm:text-xs tracking-[0.15em] text-muted uppercase">
                  {t(labelKey)}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Description */}
        <motion.p
          className="mt-8 sm:mt-12 max-w-xl text-base sm:text-lg leading-relaxed text-muted"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {t('body')}
        </motion.p>
      </div>

      {/* Divider */}
      <motion.div
        className="mx-auto max-w-6xl h-px bg-border"
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* Block 2: Value Cards */}
      <div className="mx-auto max-w-6xl py-20 sm:py-28 md:py-32">
        <motion.div
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {VALUES.map(({ num, titleKey, bodyKey }) => (
            <motion.div
              key={num}
              variants={cardVariant}
              className="flex flex-col gap-4 sm:gap-5 rounded-2xl border border-border p-6 sm:p-8 hover:border-accent transition-colors duration-300"
            >
              <span className="text-xs font-medium tracking-[0.2em] text-muted">{num}</span>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">{t(titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted">{t(bodyKey)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Divider */}
      <motion.div
        className="mx-auto max-w-6xl h-px bg-border"
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* Block 3: CTA Banner */}
      <div className="mx-auto max-w-6xl py-20 sm:py-28 md:py-32">
        <motion.div
          className="flex flex-col gap-6 sm:gap-8 rounded-2xl sm:rounded-3xl bg-foreground px-6 py-10 sm:px-10 sm:py-14 md:flex-row md:items-center md:justify-between"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          <div className="flex flex-col gap-3">
            <h3 className="text-[clamp(1.3rem,3vw,2.2rem)] font-bold leading-tight text-background">
              {t('ctaHeading')}
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-background opacity-60">
              {t('ctaBody')}
            </p>
          </div>

          <a
            href={`mailto:${tc('email')}`}
            className="shrink-0 self-start md:self-auto rounded-full border-2 border-background px-6 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-semibold text-background hover:bg-background hover:text-foreground transition-all duration-200 uppercase tracking-wider"
          >
            {t('ctaButton')}
          </a>
        </motion.div>
      </div>

    </section>
  );
}
