'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NeuralNetwork } from './effects/NeuralNetwork';
import { useNeuralGame } from '@/hooks/useNeuralGame';
import { useTheme } from '@/components/ThemeProvider';
import { useNeuronGlow } from '@/contexts/NeuronGlowContext';

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── moolab 워드마크 SVG paths ──────────────────────────────────────────────
const PATHS = {
  iDot: 'M8 50H28V66H8V50Z',
  mBody: 'M94.6406 60.6562C108.844 60.6562 118.688 70.0781 118.688 86.6719V138H97.875V90.75C97.875 82.0312 92.8125 77.8125 85.9219 77.8125C78.0469 77.8125 73.5469 83.2969 73.5469 91.3125V138H53.2969V90.1875C53.2969 82.5938 48.5156 77.8125 41.4844 77.8125C34.4531 77.8125 28.9688 83.4375 28.9688 92.1562V138H8.15625V75H28.8281C32.0625 66.1406 39.7969 60.6562 50.0625 60.6562C60.6094 60.6562 68.3438 66.1406 70.875 75H71.5781C74.8125 66.2812 83.3906 60.6562 94.6406 60.6562Z',
  o1: 'M158.469 139.547C135.406 139.547 121.062 123.656 121.062 100.031C121.062 76.4062 135.406 60.6562 158.469 60.6562C181.531 60.6562 196.016 76.4062 196.016 100.031C196.016 123.656 181.531 139.547 158.469 139.547ZM158.609 123.375C169.297 123.375 174.781 113.391 174.781 100.031C174.781 86.5312 169.297 76.5469 158.609 76.5469C147.781 76.5469 142.156 86.5312 142.156 100.031C142.156 113.391 147.781 123.375 158.609 123.375Z',
  o2: 'M228.469 139.547C205.406 139.547 191.062 123.656 191.062 100.031C191.062 76.4062 205.406 60.6562 228.469 60.6562C251.531 60.6562 266.016 76.4062 266.016 100.031C266.016 123.656 251.531 139.547 228.469 139.547ZM228.609 123.375C239.297 123.375 244.781 113.391 244.781 100.031C244.781 86.5312 239.297 76.5469 228.609 76.5469C217.781 76.5469 212.156 86.5312 212.156 100.031C212.156 113.391 217.781 123.375 228.609 123.375Z',
  lab: 'M294.969 36.1875V138H274.156V36.1875H294.969ZM300.284 116.625C300.284 99.6094 314.066 93.9844 328.691 93.1406C334.175 92.7891 344.441 92.2969 347.675 92.1562V85.9688C347.534 79.6406 343.175 75.8438 335.441 75.8438C328.409 75.8438 323.909 79.0781 322.784 84.2812H302.956C304.222 71.0625 315.753 60.6562 336.003 60.6562C352.597 60.6562 368.347 68.1094 368.347 86.5312V138H348.659V127.453H348.097C344.3 134.484 337.128 139.406 325.737 139.406C311.112 139.406 300.284 131.812 300.284 116.625ZM320.253 116.062C320.253 121.969 325.034 125.062 331.644 125.062C341.066 125.062 347.816 118.734 347.675 110.719V105.094C344.511 105.234 335.652 105.727 332.066 106.078C324.894 106.781 320.253 110.156 320.253 116.062ZM377.459 138V36.1875H398.272V74.4375H398.834C401.787 68.25 407.834 60.6562 420.631 60.6562C437.506 60.6562 451.709 73.7344 451.709 99.8906C451.709 125.344 438.069 139.266 420.631 139.266C408.116 139.266 401.787 132.094 398.834 125.766H397.991V138H377.459ZM397.85 99.75C397.85 113.531 403.756 122.672 414.022 122.672C424.709 122.672 430.334 113.25 430.334 99.75C430.334 86.3906 424.709 77.25 414.022 77.25C403.616 77.25 397.85 85.9688 397.85 99.75Z',
};


function CountUp({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return <span ref={(el) => { if (el && !started) setStarted(true); }}>{count}</span>;
}

const MOO_OFFSET = 89;

// ─── 전기 아크 인디케이터 ────────────────────────────────────────────────────

const DOT_R = 3;
const DOT_GAP = 22; // dot 중심 간 거리
const TOTAL_DOTS = 6;
const CANVAS_PAD = 16;

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
}

function dotX(i: number) { return CANVAS_PAD + i * DOT_GAP; }
const CANVAS_W = CANVAS_PAD * 2 + (TOTAL_DOTS - 1) * DOT_GAP;
const CANVAS_H = CANVAS_PAD * 2;
const CENTER_Y = CANVAS_H / 2;

function ProgressIndicator({ count, isCleared }: { count: number; isCleared: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const prevCountRef = useRef(0);
  const completeBurstRef = useRef(false);
  const [visible, setVisible] = useState(true);

  // 클리어 후 축하 애니메이션 → 페이드아웃
  useEffect(() => {
    if (!isCleared) return;
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [isCleared]);

  const spawnSparks = useCallback((x: number, y: number, amount: number, spread: number) => {
    const sparks = sparksRef.current;
    for (let s = 0; s < amount; s++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * spread;
      const life = 25 + Math.random() * 25;
      sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    let rafId = 0;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      const sparks = sparksRef.current;
      const curCount = count;

      // 새 뉴런 발견 시 불똥 생성
      if (curCount > prevCountRef.current) {
        const newIdx = curCount - 1;
        spawnSparks(dotX(newIdx), CENTER_Y, 12, 2.5);
        // 연결선 위에도 불똥
        if (newIdx > 0) {
          const x1 = dotX(newIdx - 1);
          const x2 = dotX(newIdx);
          for (let s = 0; s < 8; s++) {
            const t = Math.random();
            spawnSparks(x1 + (x2 - x1) * t, CENTER_Y + (Math.random() - 0.5) * 6, 1, 1.5);
          }
        }
        prevCountRef.current = curCount;
      }

      // 클리어 축하 버스트 (1회)
      if (isCleared && !completeBurstRef.current) {
        completeBurstRef.current = true;
        for (let i = 0; i < TOTAL_DOTS; i++) {
          spawnSparks(dotX(i), CENTER_Y, 15, 3);
        }
      }

      // ── 전기 아크 그리기 (활성 dot 사이) ──
      for (let i = 0; i < curCount - 1 && i < TOTAL_DOTS - 1; i++) {
        const x1 = dotX(i);
        const x2 = dotX(i + 1);

        // 클리어 시 더 밝고 격렬
        const intensity = isCleared ? 1.5 : 1;

        // 메인 아크 (매 프레임 랜덤 재생성 → 치지직 효과)
        for (let arc = 0; arc < 2; arc++) {
          const segs = 4 + Math.floor(Math.random() * 3);
          ctx.beginPath();
          ctx.moveTo(x1, CENTER_Y);
          for (let s = 1; s < segs; s++) {
            const t = s / segs;
            const jitterY = (Math.random() - 0.5) * 8 * intensity;
            const jitterX = (Math.random() - 0.5) * 2;
            ctx.lineTo(x1 + (x2 - x1) * t + jitterX, CENTER_Y + jitterY);
          }
          ctx.lineTo(x2, CENTER_Y);
          ctx.strokeStyle = arc === 0
            ? `hsla(45, 90%, 70%, ${0.5 * intensity})`
            : `hsla(45, 80%, 85%, ${0.25 * intensity})`;
          ctx.lineWidth = arc === 0 ? 1.0 : 0.5;
          ctx.stroke();
        }

        // 글로우 라인
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(45, 90%, 65%, ${0.35 * intensity})`;
        ctx.beginPath();
        ctx.moveTo(x1, CENTER_Y);
        ctx.lineTo(x2, CENTER_Y);
        ctx.strokeStyle = `hsla(45, 90%, 70%, ${0.12 * intensity})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // 랜덤 분기 (작은 갈래) — 치지직
        if (Math.random() < 0.4 * intensity) {
          const bx = x1 + (x2 - x1) * (0.2 + Math.random() * 0.6);
          const by = CENTER_Y + (Math.random() - 0.5) * 6;
          const bend = (Math.random() - 0.5) * 10;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + (Math.random() - 0.5) * 4, by + bend);
          ctx.strokeStyle = `hsla(45, 85%, 80%, ${0.35 * intensity})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }

      // ── dot 그리기 ──
      for (let i = 0; i < TOTAL_DOTS; i++) {
        const x = dotX(i);
        const filled = i < curCount;
        const isComplete = isCleared;

        if (filled) {
          // 글로우
          const pulse = isComplete
            ? (Math.sin(frame * 0.1 + i * 1.2) + 1) * 0.5
            : 0;
          const glowR = DOT_R * 4 + pulse * 6;
          const grad = ctx.createRadialGradient(x, CENTER_Y, 0, x, CENTER_Y, glowR);
          grad.addColorStop(0, `hsla(45, 90%, 70%, ${0.3 + pulse * 0.3})`);
          grad.addColorStop(0.5, `hsla(45, 85%, 60%, ${0.1 + pulse * 0.1})`);
          grad.addColorStop(1, 'hsla(45, 80%, 55%, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, CENTER_Y, glowR, 0, Math.PI * 2);
          ctx.fill();

          // 코어
          ctx.beginPath();
          ctx.arc(x, CENTER_Y, DOT_R, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(45, 85%, ${70 + pulse * 15}%, ${0.9 + pulse * 0.1})`;
          ctx.fill();

          // 하이라이트
          ctx.beginPath();
          ctx.arc(x, CENTER_Y, DOT_R * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(45, 30%, 95%, ${0.6 + pulse * 0.4})`;
          ctx.fill();
        } else {
          // 비활성
          ctx.beginPath();
          ctx.arc(x, CENTER_Y, DOT_R * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = 'hsla(0, 0%, 100%, 0.1)';
          ctx.fill();
        }
      }

      // ── 불똥 업데이트 & 렌더 ──
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.04;
        s.vx *= 0.98;
        s.life--;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }

        const alpha = (s.life / s.maxLife);
        const r = 0.4 + alpha * 1.0;

        // 불똥 글로우
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3);
        sg.addColorStop(0, `hsla(45, 90%, 85%, ${alpha * 0.5})`);
        sg.addColorStop(1, 'hsla(45, 80%, 65%, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        // 코어
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(40, 95%, 90%, ${alpha * 0.9})`;
        ctx.fill();
      }

      // 클리어 시 지속적 불똥 (축하 동안)
      if (isCleared && frame % 3 === 0) {
        const ri = Math.floor(Math.random() * TOTAL_DOTS);
        spawnSparks(dotX(ri), CENTER_Y, 2, 1.5);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [count, isCleared, spawnSparks]);

  if (!visible) return null;

  return (
    <motion.div
      className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible && !isCleared ? 1 : isCleared ? [1, 1, 0] : 1 }}
      transition={isCleared ? { duration: 2.2, times: [0, 0.7, 1] } : { duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const t = useTranslations('hero');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const game = useNeuralGame();
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [showLogo, setShowLogo] = useState(false);
  const [showLab, setShowLab] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [holdActive, setHoldActive] = useState(false);
  const [holdIntensity, setHoldIntensity] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [neuronHue, setNeuronHue] = useState(45);

  const isClearedAndDone = game.isCleared && game.clearWaveProgress >= 1;
  // 로고 등장 타이밍: 배경 딤이 시작되면 (cwp > 0.3)
  const showCosmicLogo = isDark && game.isCleared && game.clearWaveProgress > 0.3;

  // Navbar 로고에 glow 상태 전달
  const { setGlow } = useNeuronGlow();
  useEffect(() => {
    setGlow({ hue: neuronHue, active: isClearedAndDone });
  }, [neuronHue, isClearedAndDone, setGlow]);

  // 폭파: 모든 UI 숨기기
  useEffect(() => {
    if (!isDead) return;
    document.documentElement.classList.add('neural-death');
    return () => { document.documentElement.classList.remove('neural-death'); };
  }, [isDead]);

  // 마운트 즉시 워드마크 시퀀스 시작
  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 400);
    const t2 = setTimeout(() => setShowLab(true), 1700);
    const t3 = setTimeout(() => setShowEnd(true), 3000);
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

  // 워드마크 글리치 rAF loop
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let rafId = 0;
    let nextGlitchFrame = 0;

    const glitchLoop = () => {
      const count = game.activatedCount;
      if (count === 0 || isClearedAndDone || !isDark) {
        svg.style.transform = '';
        rafId = requestAnimationFrame(glitchLoop);
        return;
      }

      const intensity = count / 6;
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
  }, [game.activatedCount, isClearedAndDone, isDark]);

  // 워드마크: 항상 흰색(1)
  const wordmarkOpacity = 1;

  return (
    <>
    <section
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 text-center overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => { if (e.button === 0 && isClearedAndDone) setHoldActive(true); }}
      onMouseUp={(e) => { if (e.button === 0) setHoldActive(false); }}
      onMouseLeave={() => setHoldActive(false)}
    >
      {isDark && (
        <NeuralNetwork
          hiddenNeurons={game.hiddenNeurons}
          onActivate={game.activate}
          clearWaveProgress={game.clearWaveProgress}
          isCleared={game.isCleared}
          holdActive={holdActive}
          onHoldProgress={setHoldIntensity}
          onDeath={() => setIsDead(true)}
          onHueChange={setNeuronHue}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-4xl">

        {/* ── 스테이지 ─────────────────────────────────────────── */}
        <div className="relative w-full min-h-[180px] sm:min-h-[240px] md:min-h-[280px]">

          {/* ── 워드마크 (클리어 시 글로우 추가) ──────────────────── */}
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
              overflow="visible"
              className="w-56 sm:w-72 md:w-[380px] h-auto"
              style={{
                color: holdActive || holdIntensity > 0
                  ? `hsl(${neuronHue}, ${60 + holdIntensity * 35}%, ${85 + holdIntensity * 15}%)`
                  : isClearedAndDone
                    ? `hsl(${neuronHue}, 30%, 88%)`
                    : 'var(--foreground)',
                opacity: wordmarkOpacity,
                filter: holdActive || holdIntensity > 0
                  ? `drop-shadow(0 0 ${8 + holdIntensity * 30}px hsla(${neuronHue}, 90%, 70%, ${0.3 + holdIntensity * 0.5})) drop-shadow(0 0 ${20 + holdIntensity * 60}px hsla(${neuronHue}, 80%, 60%, ${holdIntensity * 0.3}))`
                  : isClearedAndDone
                    ? `drop-shadow(0 0 12px hsla(${neuronHue}, 60%, 70%, 0.4)) drop-shadow(0 0 40px hsla(${neuronHue}, 50%, 60%, 0.15))`
                    : 'none',
                transition: holdActive || holdIntensity > 0 ? 'none' : 'opacity 0.5s ease, filter 1.2s ease, color 0.3s ease',
              }}
              aria-label="moolab"
            >
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
                <motion.path d={PATHS.mBody} fill="currentColor" initial={{ opacity: 0, y: 8 }} animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.7, ease: EASE }} />
                <motion.path d={PATHS.o1} fill="currentColor" initial={{ opacity: 0, y: 8 }} animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.7, ease: EASE, delay: 0.06 }} />
                <motion.path d={PATHS.o2} fill="currentColor" initial={{ opacity: 0, y: 8 }} animate={showLogo ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.7, ease: EASE, delay: 0.12 }} />
              </motion.g>
              <motion.path
                d={PATHS.lab} fill="currentColor"
                initial={{ opacity: 0, x: 70 }}
                animate={{ opacity: showLab ? 1 : 0, x: showLab ? 0 : 70 }}
                transition={showLab ? { type: 'spring', stiffness: 50, damping: 15, mass: 1.3 } : { duration: 0.3 }}
              />
            </svg>

            <motion.p
              className="mt-4 text-lg tracking-[0.03em] text-[#9a9aa6] dark:text-[#8b8b99]"
              initial={{ opacity: 0, y: 10 }}
              animate={showEnd ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 1.0, ease: EASE }}
            >
              {showEnd && <CountUp target={Math.max(1, Math.floor((Date.now() - new Date('2026-03-19').getTime()) / 86400000))} />} days — still baking.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* ── 진행 인디케이터 (전기 아크 + 불똥) ─────────────────────── */}
      {isDark && game.activatedCount > 0 && (
        <ProgressIndicator count={game.activatedCount} isCleared={game.isCleared} />
      )}

    </section>

    {/* ── 후레쉬 오버레이 (폭파 후, section 밖) ────────────────────── */}
    {isDead && <FlashlightOverlay />}
    </>
  );
}

// ─── 후레쉬 오버레이 ─────────────────────────────────────────────────────

function FlashlightOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const onRef = useRef(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const applyLight = () => {
      const { x, y } = posRef.current;
      overlay.style.background = `radial-gradient(
        circle 160px at ${x}px ${y}px,
        transparent 0%,
        transparent 30%,
        rgba(0,0,0,0.85) 60%,
        rgba(0,0,0,0.97) 80%,
        black 100%
      )`;
    };

    const handleMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (onRef.current) applyLight();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') {
        onRef.current = !onRef.current;
        if (onRef.current) {
          applyLight();
        } else {
          overlay.style.background = 'black';
        }
      }
    };

    const handleLeave = () => {
      overlay.style.background = 'black';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'black',
        pointerEvents: 'none',
      }}
    />
  );
}
