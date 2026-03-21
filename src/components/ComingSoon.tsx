'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function FloatingDot({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-accent"
      style={{ left: x, top: y, width: size, height: size }}
      animate={{
        y: [0, -14, 0],
        opacity: [0.18, 0.45, 0.18],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export function ComingSoon() {
  const t = useTranslations('comingSoon');

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center overflow-hidden">

      {/* 배경 장식 도트들 */}
      <FloatingDot delay={0}   x="15%" y="20%" size={6} />
      <FloatingDot delay={0.6} x="80%" y="25%" size={4} />
      <FloatingDot delay={1.2} x="25%" y="75%" size={5} />
      <FloatingDot delay={0.3} x="70%" y="70%" size={7} />
      <FloatingDot delay={0.9} x="50%" y="15%" size={3} />
      <FloatingDot delay={1.5} x="85%" y="55%" size={5} />
      <FloatingDot delay={0.4} x="10%" y="50%" size={4} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">

        {/* 이모지 캐릭터 — 바운스 애니메이션 */}
        <motion.div
          className="text-6xl sm:text-7xl select-none"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
        >
          <motion.span
            className="inline-block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {t('emoji')}
          </motion.span>
        </motion.div>

        {/* 메인 텍스트 */}
        <motion.h1
          className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
        >
          {t('title')}
        </motion.h1>

        <motion.p
          className="text-sm sm:text-base leading-relaxed text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
        >
          {t('body')}
        </motion.p>

        {/* 돌아가기 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('backButton')}
          </Link>
        </motion.div>

        {/* 하단 힌트 라인 */}
        <motion.div
          className="mt-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <motion.div
            className="h-px w-8 bg-accent"
            animate={{ scaleX: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: 0.5 }}
          />
          <span className="text-[10px] sm:text-xs tracking-[0.2em] text-muted uppercase">
            {t('hint')}
          </span>
          <motion.div
            className="h-px w-8 bg-accent"
            animate={{ scaleX: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            style={{ originX: 0.5 }}
          />
        </motion.div>
      </div>
    </section>
  );
}
