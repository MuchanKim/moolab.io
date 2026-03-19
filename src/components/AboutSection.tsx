'use client';

import { useTranslations } from 'next-intl';
import { motion, type Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inView: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const inViewDelayed: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: 0.12 } },
};

export function AboutSection() {
  const t = useTranslations('about');

  return (
    <section id="about" className="relative z-10 px-6 py-40 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-16 md:flex-row md:gap-24">

          {/* Left: label */}
          <motion.div
            className="md:w-1/3"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#6FBB74]" />
              <span className="text-xs font-medium tracking-[0.2em] text-[#6FBB74] uppercase">
                {t('label')}
              </span>
            </div>
          </motion.div>

          {/* Right: content */}
          <div className="flex flex-col gap-8 md:w-2/3">
            <motion.h2
              className="text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight tracking-tight text-[#1a1a1a]"
              variants={inView}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
            >
              {t('heading')}
            </motion.h2>

            <motion.p
              className="max-w-xl text-lg leading-relaxed text-[#6b6b6b]"
              variants={inViewDelayed}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
            >
              {t('body')}
            </motion.p>
          </div>
        </div>

        {/* Divider */}
        <motion.div
          className="mt-24 h-px bg-[#e8e8e8]"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
    </section>
  );
}
