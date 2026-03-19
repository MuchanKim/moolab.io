'use client';

import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: EASE },
  }),
};

export function HeroSection() {
  const t = useTranslations('hero');

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-6">
        <motion.p
          className="text-xs font-medium tracking-[0.25em] text-[#6FBB74] uppercase"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.1}
        >
          moolab
        </motion.p>

        <h1 className="flex flex-col items-center gap-1 leading-none tracking-tight">
          <motion.span
            className="block text-[clamp(3.5rem,10vw,8rem)] font-bold text-[#1a1a1a]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.25}
          >
            {t('line1')}
          </motion.span>
          <motion.span
            className="block text-[clamp(3.5rem,10vw,8rem)] font-bold text-[#1a1a1a]"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0.4}
          >
            {t('line2')}
          </motion.span>
        </h1>

        <motion.p
          className="max-w-md text-[1.05rem] leading-relaxed text-[#6b6b6b]"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0.6}
        >
          {t('subtitle')}
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={0.9}
      >
        <span className="text-xs tracking-widest text-[#c0c0c0] uppercase">scroll</span>
        <motion.div
          className="h-8 w-px bg-gradient-to-b from-[#c0c0c0] to-transparent"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </section>
  );
}
