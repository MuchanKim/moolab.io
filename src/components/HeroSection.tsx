'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { StarDust } from './effects/StarDust';
import { useTheme } from './ThemeProvider';

// ─── 루프 단어 ────────────────────────────────────────────────────────────────
const LOOP_WORDS_EN = ['apps.', 'tools.', 'ideas.', 'things.'];
// KO: 루프 단어가 동사 포함 ("우리는 [앱을 만듭니다.]")
const LOOP_WORDS_KO = ['앱을 만듭니다.', '도구를 만듭니다.', '아이디어를 만듭니다.', '것들을 만듭니다.'];

const TYPER_CFG = {
  charSpeed:       80,   // ms/글자
  eraseSpeed:      42,   // ms/글자
  pauseAfterType: 1800,  // 완성 후 대기
  pauseAfterErase: 200,  // 지운 후 대기
  cursorBlinkMs:   530,
} as const;
// ─────────────────────────────────────────────────────────────────────────────

type HeroPhase = 'typing' | 'pause' | 'erasing' | 'done';

function useHeroSequence(words: string[]) {
  const [phase, setPhase]             = useState<HeroPhase>('typing');
  const [wordIdx, setWordIdx]         = useState(0);
  const [displayed, setDisplayed]     = useState('');
  const [firstWordDone, setFirstWordDone] = useState(false);

  useEffect(() => {
    if (phase === 'done') return;
    const word = words[wordIdx];

    if (phase === 'typing') {
      if (displayed.length < word.length) {
        const t = setTimeout(
          () => setDisplayed(word.slice(0, displayed.length + 1)),
          TYPER_CFG.charSpeed,
        );
        return () => clearTimeout(t);
      }
      if (!firstWordDone) setFirstWordDone(true);
      const t = setTimeout(() => setPhase('pause'), TYPER_CFG.pauseAfterType);
      return () => clearTimeout(t);
    }

    if (phase === 'pause') {
      const t = setTimeout(() => setPhase('erasing'), 300);
      return () => clearTimeout(t);
    }

    if (phase === 'erasing') {
      if (displayed.length > 0) {
        const t = setTimeout(
          () => setDisplayed(d => d.slice(0, -1)),
          TYPER_CFG.eraseSpeed,
        );
        return () => clearTimeout(t);
      }
      const next = wordIdx + 1;
      if (next >= words.length) {
        // 모든 단어 완료 → done
        const t = setTimeout(() => setPhase('done'), 300);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setWordIdx(next);
        setPhase('typing');
      }, TYPER_CFG.pauseAfterErase);
      return () => clearTimeout(t);
    }
  }, [displayed, phase, wordIdx, words, firstWordDone]);

  return { phase, displayed, firstWordDone };
}

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), TYPER_CFG.cursorBlinkMs);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '3px',
        marginLeft: '4px',
        borderRadius: '2px',
        backgroundColor: 'var(--accent)',
        opacity: visible ? 1 : 0,
        verticalAlign: 'middle',
        height: '0.75em',
        transition: 'opacity 0.08s',
      }}
    />
  );
}

export function HeroSection() {
  const t      = useTranslations('hero');
  const locale = useLocale();
  const { theme } = useTheme();

  const loopWords = locale === 'ko' ? LOOP_WORDS_KO : LOOP_WORDS_EN;
  const { phase, displayed, firstWordDone } = useHeroSequence(loopWords);

  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (phase === 'done') {
      // exit 애니메이션(0.55s) 기다린 후 로고 등장
      const t = setTimeout(() => setShowLogo(true), 620);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const showTypewriter = phase !== 'done';

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center overflow-hidden">
      <StarDust />

      <div className="relative z-10 flex flex-col items-center gap-6">

        {/* ── 타이프라이터 영역 ─────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {showTypewriter && (
            <motion.div
              key="typewriter"
              className="flex flex-col items-center gap-6"
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                className="leading-none tracking-tight"
                style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)', fontWeight: 700 }}
              >
                <span className="text-foreground">{t('line1')}{' '}</span>
                <span style={{ color: 'var(--accent)' }}>{displayed}</span>
                <BlinkingCursor />
              </h1>

              {/* 서브타이틀 — 첫 단어 완성 후 등장 */}
              <motion.p
                className="max-w-md text-[1.05rem] leading-relaxed text-muted"
                initial={{ opacity: 0, y: 12 }}
                animate={firstWordDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {t('subtitle')}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 로고 reveal ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              key="logo"
              className="flex flex-col items-center gap-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* 아이콘 마크 — 항상 초록, 테마 무관 */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/moolab_logo.svg"
                  alt=""
                  width={160}
                  height={160}
                  priority
                />
              </motion.div>

              {/* 워드마크 — fill:#252525 SVG를 다크모드에서 invert */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginTop: '-28px' }}
              >
                <Image
                  src="/moolab_wordmark.svg"
                  alt="Moolab"
                  width={380}
                  height={145}
                  priority
                  style={{
                    filter: theme === 'dark' ? 'invert(1)' : 'none',
                    opacity: 0.9,
                  }}
                />
              </motion.div>

              {/* 태그라인 */}
              <motion.p
                className="text-xs tracking-[0.22em] uppercase text-muted"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {t('tagline')}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── 스크롤 인디케이터 ─────────────────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={showLogo ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-xs tracking-widest text-muted uppercase">scroll</span>
        <motion.div
          className="h-8 w-px bg-gradient-to-b from-muted to-transparent"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </section>
  );
}
