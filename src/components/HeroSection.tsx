'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NeuralNetwork } from './effects/NeuralNetwork';
import { useNeuralGame } from '@/hooks/useNeuralGame';

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── SVG paths ───────────────────────────────────────────────────────────────
const PATHS = {
  iDot: 'M8 50H28V66H8V50Z',
  mBody: 'M94.6406 60.6562C108.844 60.6562 118.688 70.0781 118.688 86.6719V138H97.875V90.75C97.875 82.0312 92.8125 77.8125 85.9219 77.8125C78.0469 77.8125 73.5469 83.2969 73.5469 91.3125V138H53.2969V90.1875C53.2969 82.5938 48.5156 77.8125 41.4844 77.8125C34.4531 77.8125 28.9688 83.4375 28.9688 92.1562V138H8.15625V75H28.8281C32.0625 66.1406 39.7969 60.6562 50.0625 60.6562C60.6094 60.6562 68.3438 66.1406 70.875 75H71.5781C74.8125 66.2812 83.3906 60.6562 94.6406 60.6562Z',
  o1: 'M158.469 139.547C135.406 139.547 121.062 123.656 121.062 100.031C121.062 76.4062 135.406 60.6562 158.469 60.6562C181.531 60.6562 196.016 76.4062 196.016 100.031C196.016 123.656 181.531 139.547 158.469 139.547ZM158.609 123.375C169.297 123.375 174.781 113.391 174.781 100.031C174.781 86.5312 169.297 76.5469 158.609 76.5469C147.781 76.5469 142.156 86.5312 142.156 100.031C142.156 113.391 147.781 123.375 158.609 123.375Z',
  o2: 'M228.469 139.547C205.406 139.547 191.062 123.656 191.062 100.031C191.062 76.4062 205.406 60.6562 228.469 60.6562C251.531 60.6562 266.016 76.4062 266.016 100.031C266.016 123.656 251.531 139.547 228.469 139.547ZM228.609 123.375C239.297 123.375 244.781 113.391 244.781 100.031C244.781 86.5312 239.297 76.5469 228.609 76.5469C217.781 76.5469 212.156 86.5312 212.156 100.031C212.156 113.391 217.781 123.375 228.609 123.375Z',
  lab: 'M294.969 36.1875V138H274.156V36.1875H294.969ZM300.284 116.625C300.284 99.6094 314.066 93.9844 328.691 93.1406C334.175 92.7891 344.441 92.2969 347.675 92.1562V85.9688C347.534 79.6406 343.175 75.8438 335.441 75.8438C328.409 75.8438 323.909 79.0781 322.784 84.2812H302.956C304.222 71.0625 315.753 60.6562 336.003 60.6562C352.597 60.6562 368.347 68.1094 368.347 86.5312V138H348.659V127.453H348.097C344.3 134.484 337.128 139.406 325.737 139.406C311.112 139.406 300.284 131.812 300.284 116.625ZM320.253 116.062C320.253 121.969 325.034 125.062 331.644 125.062C341.066 125.062 347.816 118.734 347.675 110.719V105.094C344.511 105.234 335.652 105.727 332.066 106.078C324.894 106.781 320.253 110.156 320.253 116.062ZM377.459 138V36.1875H398.272V74.4375H398.834C401.787 68.25 407.834 60.6562 420.631 60.6562C437.506 60.6562 451.709 73.7344 451.709 99.8906C451.709 125.344 438.069 139.266 420.631 139.266C408.116 139.266 401.787 132.094 398.834 125.766H397.991V138H377.459ZM397.85 99.75C397.85 113.531 403.756 122.672 414.022 122.672C424.709 122.672 430.334 113.25 430.334 99.75C430.334 86.3906 424.709 77.25 414.022 77.25C403.616 77.25 397.85 85.9688 397.85 99.75Z',
};

const MOO_OFFSET = 89;

// ─────────────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const t = useTranslations('hero');
  const game = useNeuralGame();
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [showLogo, setShowLogo] = useState(false);
  const [showLab, setShowLab] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const isClearedAndDone = game.isCleared && game.clearWaveProgress >= 1;

  // 마운트 즉시 로고 시퀀스 시작
  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 400);
    const t2 = setTimeout(() => setShowLab(true), 2000);
    const t3 = setTimeout(() => setShowEnd(true), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // ResizeObserver for hidden neuron positions
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      game.updatePositions(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [game.updatePositions]);

  // Logo glitch rAF loop
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let rafId = 0;
    let nextGlitchFrame = 0;

    const glitchLoop = () => {
      const count = game.activatedCount;
      if (count === 0 || isClearedAndDone) {
        svg.style.transform = '';
        rafId = requestAnimationFrame(glitchLoop);
        return;
      }

      const intensity = count / 5; // 0.2 ~ 1.0
      nextGlitchFrame--;

      if (nextGlitchFrame <= 0) {
        const dx = (Math.random() - 0.5) * intensity * 4;
        const dy = (Math.random() - 0.5) * intensity * 2;
        const skew = (Math.random() - 0.5) * intensity * 1.5;
        svg.style.transform = `translate(${dx}px, ${dy}px) skewX(${skew}deg)`;

        if (Math.random() < 0.3) {
          nextGlitchFrame = Math.floor(Math.random() * 2) + 1;
        } else {
          svg.style.transform = '';
          nextGlitchFrame = Math.floor(Math.random() * (60 / (intensity + 0.2)));
        }
      }

      rafId = requestAnimationFrame(glitchLoop);
    };

    rafId = requestAnimationFrame(glitchLoop);
    return () => {
      cancelAnimationFrame(rafId);
      if (svg) svg.style.transform = '';
    };
  }, [game.activatedCount, isClearedAndDone]);

  // Logo opacity: dimmer at start, brightens with activations
  const logoOpacity = isClearedAndDone ? 1 : 0.5 + game.activatedCount * 0.1;

  return (
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 text-center overflow-hidden"
    >
      <NeuralNetwork
        hiddenNeurons={game.hiddenNeurons}
        onActivate={game.activate}
        clearWaveProgress={game.clearWaveProgress}
        isCleared={game.isCleared}
      />

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-4xl">

        {/* ── SVG 워드마크 ─────────────────────────────────────────── */}
        <div className="relative w-full min-h-[180px] sm:min-h-[240px] md:min-h-[280px]">
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{
              opacity: showLogo ? 1 : 0,
              scale: showLogo ? 1 : 1.06,
            }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 452 173"
              className="w-56 sm:w-72 md:w-[380px] h-auto"
              style={{ color: 'var(--foreground)', opacity: logoOpacity }}
              aria-label="moolab"
              filter={game.clearWaveProgress > 0 ? 'url(#logoGlow)' : undefined}
            >
              {game.clearWaveProgress > 0 && (
                <defs>
                  <filter id="logoGlow">
                    <feGaussianBlur stdDeviation={game.clearWaveProgress * 6} result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              )}

              <motion.g
                animate={{ x: showLab ? 0 : MOO_OFFSET }}
                transition={
                  showLab
                    ? { type: 'spring', stiffness: 50, damping: 15, mass: 1.3 }
                    : { duration: 1.0, ease: EASE }
                }
              >
                <motion.path
                  d={PATHS.iDot}
                  fill="currentColor"
                  initial={{ y: -60, opacity: 0 }}
                  animate={showLogo ? { y: 0, opacity: 1 } : { y: -60, opacity: 0 }}
                  transition={
                    showLogo
                      ? {
                          y: { type: 'spring', stiffness: 300, damping: 12, mass: 0.4, delay: 0.4 },
                          opacity: { duration: 0.15, delay: 0.4 },
                        }
                      : { duration: 0.3 }
                  }
                />
                <motion.path
                  d={PATHS.mBody} fill="currentColor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
                <motion.path
                  d={PATHS.o1} fill="currentColor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
                />
                <motion.path
                  d={PATHS.o2} fill="currentColor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
                />
              </motion.g>

              <motion.path
                d={PATHS.lab} fill="currentColor"
                initial={{ opacity: 0, x: 70 }}
                animate={{ opacity: showLab ? 1 : 0, x: showLab ? 0 : 70 }}
                transition={
                  showLab
                    ? { type: 'spring', stiffness: 50, damping: 15, mass: 1.3 }
                    : { duration: 0.3 }
                }
              />
            </svg>

            {/* 태그라인 — SVG 아래 */}
            <motion.p
              className="mt-4 text-[10px] sm:text-xs tracking-[0.22em] uppercase text-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={showEnd ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 1.0, ease: EASE }}
            >
              {t('tagline')}
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* ── 진행 인디케이터 (5 dots) ─────────────────────────────── */}
      {game.activatedCount > 0 && !game.isCleared && (
        <motion.div
          className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {game.hiddenNeurons.map((hn) => (
            <motion.div
              key={hn.id}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: hn.activated ? 'var(--accent)' : 'var(--border)',
              }}
              animate={hn.activated ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
        </motion.div>
      )}

      {/* ── 스크롤 인디케이터 ──────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={showEnd ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      >
        <span className="text-[10px] sm:text-xs tracking-widest text-muted uppercase">scroll</span>
        <motion.div
          className="h-6 sm:h-8 w-px bg-gradient-to-b from-muted to-transparent"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originY: 0 }}
        />
      </motion.div>
    </section>
  );
}
