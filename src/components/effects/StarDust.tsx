'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useTheme } from '@/components/ThemeProvider';
import { getParticleForce } from '@/hooks/useParticleForce';

// ── 팔레트 — 다크/라이트 모두 컬러풀 ──────────────────────────────────────────
const PALETTE = [
  { darkH:  28, darkS: 55, lightH:  28, lightS: 62, w: 3 },  // 주황
  { darkH: 215, darkS: 50, lightH: 215, lightS: 58, w: 3 },  // 파랑
  { darkH:  52, darkS: 58, lightH:  52, lightS: 65, w: 2 },  // 노랑
  { darkH: 128, darkS: 48, lightH: 128, lightS: 55, w: 2 },  // 초록
] as const;

const PW = PALETTE.reduce((s, c) => s + c.w, 0);

function pickColor() {
  let r = Math.random() * PW;
  for (const c of PALETTE) {
    r -= c.w;
    if (r <= 0) return {
      darkH:  c.darkH  + rand(-4, 4),
      darkS:  Math.max(0, c.darkS  + rand(-2, 2)),
      lightH: c.lightH + rand(-6, 6),
      lightS: Math.max(0, c.lightS + rand(-5, 5)),
    };
  }
  return { darkH: 0, darkS: 0, lightH: 28, lightS: 62 };
}
// ─────────────────────────────────────────────────────────────────────────────

export interface StarDustConfig {
  count?: number;
  minSize?: number;
  maxSize?: number;
  returnSpeed?: number;
  wanderSpeed?: number;
  bgOpacity?: number;
  damping?: number;
  /** ms 후에 파티클이 중앙에서 팍 퍼짐 (0이면 즉시 표시) */
  burstDelay?: number;
}

const MAGNIFY_RADIUS = 155;  // 좁혀서 렌즈처럼 집중
const MAGNIFY_SCALE  = 2.8;  // 크기 확대 (너무 크지 않게)

const DEFAULTS: Required<StarDustConfig> = {
  count: 850,
  minSize: 0.3,
  maxSize: 2.0,
  returnSpeed: 0.028,
  wanderSpeed: 0.15,
  damping: 0.90,
  bgOpacity: 0.48,
  burstDelay: 0,
};

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  darkH: number;
  darkS: number;
  lightH: number;
  lightS: number;
  rawL: number;
  twinklePhase: number;
  twinkleFreq: number;
  twinkleAmp: number;
  wanderAngle: number;
  wanderFreq: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function smoothstep(x: number) { return x * x * (3 - 2 * x); }

function getResponsiveCount(base: number): number {
  if (typeof window === 'undefined') return base;
  const w = window.innerWidth;
  if (w < 640) return Math.round(base * 0.35);   // 모바일: 35%
  if (w < 1024) return Math.round(base * 0.6);   // 태블릿: 60%
  return base;
}

export function StarDust(props: StarDustConfig) {
  const cfg       = { ...DEFAULTS, ...props };
  const burstDelay = props.burstDelay ?? 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ptsRef    = useRef<Particle[]>([]);
  const rafRef    = useRef<number>(0);
  const frameRef  = useRef(0);
  const burstRef  = useRef(burstDelay === 0); // true = 파티클 렌더링 시작
  const cursor    = useCursorPosition();
  const { theme } = useTheme();
  const themeRef  = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  // burstDelay 후 파티클 활성화
  useEffect(() => {
    if (burstDelay > 0) {
      const t = setTimeout(() => { burstRef.current = true; }, burstDelay);
      return () => clearTimeout(t);
    }
  }, [burstDelay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initParticles = (w: number, h: number) => {
      const count = getResponsiveCount(cfg.count);
      const cols = Math.ceil(Math.sqrt(count * (w / h)));
      const rows = Math.ceil(count / cols);
      const cw = w / cols;
      const ch = h / rows;

      ptsRef.current = Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = Math.max(0, Math.min(w, (col + 0.5 + rand(-0.45, 0.45)) * cw));
        const y = Math.max(0, Math.min(h, (row + 0.5 + rand(-0.45, 0.45)) * ch));
        const c = pickColor();
        // burstDelay > 0이면 중앙에서 시작
        const startX = burstDelay > 0 ? w / 2 : x;
        const startY = burstDelay > 0 ? h / 2 : y;
        return {
          homeX: x, homeY: y, x: startX, y: startY, vx: 0, vy: 0,
          size: rand(cfg.minSize, cfg.maxSize),
          darkH: c.darkH, darkS: c.darkS,
          lightH: c.lightH, lightS: c.lightS,
          rawL: Math.random(),
          twinklePhase: rand(0, Math.PI * 2),
          twinkleFreq:  rand(0.01, 0.04),
          twinkleAmp:   rand(0.15, 0.65),
          wanderAngle:  rand(0, Math.PI * 2),
          wanderFreq:   rand(0.003, 0.012),
        };
      });
    };

    const applySize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width  = p.offsetWidth;
      canvas.height = p.offsetHeight;
      initParticles(canvas.width, canvas.height);
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // burst 전: 렌더링 하지 않고 대기
      if (!burstRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      frameRef.current += 1;
      const frame  = frameRef.current;
      const isDark = themeRef.current === 'dark';

      const rect = canvas.getBoundingClientRect();
      const mx   = cursor.current.x - rect.left;
      const my   = cursor.current.y - rect.top;

      for (const p of ptsRef.current) {
        // ── 물리 ──────────────────────────────────────────────────────────
        p.wanderAngle += p.wanderFreq;
        p.vx += Math.cos(p.wanderAngle) * cfg.wanderSpeed;
        p.vy += Math.sin(p.wanderAngle) * cfg.wanderSpeed;

        // 왼쪽 하단 흐름
        p.vx -= 0.012;
        p.vy += 0.018;

        // home 복귀
        p.vx += (p.homeX - p.x) * cfg.returnSpeed;
        p.vy += (p.homeY - p.y) * cfg.returnSpeed;

        p.vx *= cfg.damping;
        p.vy *= cfg.damping;
        p.x  += p.vx;
        p.y  += p.vy;

        // ── 반짝임 ────────────────────────────────────────────────────────
        const twinkle = (Math.sin(frame * p.twinkleFreq + p.twinklePhase) + 1) * 0.5;
        const tf      = 1 - p.twinkleAmp + p.twinkleAmp * twinkle;

        // ── magnify ───────────────────────────────────────────────────────
        const mdx     = p.x - mx;
        const mdy     = p.y - my;
        const mdist   = Math.sqrt(mdx * mdx + mdy * mdy);
        const magnify = smoothstep(Math.max(0, 1 - mdist / MAGNIFY_RADIUS));
        const magMult = 1 + magnify * (MAGNIFY_SCALE - 1);

        // ── 색상 ──────────────────────────────────────────────────────────
        const h = isDark ? p.darkH  : p.lightH;
        const s = isDark ? p.darkS  : p.lightS;

        // 다크: 65~88% (밝은 컬러), 라이트: 42~62% (더 밝게)
        const baseL = isDark
          ? 65 + p.rawL * 23
          : 42 + p.rawL * 20;

        // 커서 근처: 밝기 살짝 낮아지며 쨍해짐
        const l     = (baseL - magnify * (isDark ? 0 : 10)) * tf;
        const baseOpacity = isDark ? cfg.bgOpacity : Math.min(1, cfg.bgOpacity * 1.8);
        const alpha = baseOpacity * tf * (1 + magnify * 2.0);

        // ── 파티클 포스 (히어로 애니메이션 연동) ──────────────────────────
        const force = getParticleForce();
        if (force) {
          const fdx = p.x - (force.x - rect.left);
          const fdy = p.y - (force.y - rect.top);
          const fd  = Math.sqrt(fdx * fdx + fdy * fdy);
          if (fd < force.radius && fd > 1) {
            const ft  = smoothstep(1 - fd / force.radius);
            const dir = force.strength > 0 ? -1 : 1; // attract vs repel
            p.vx += dir * (fdx / fd) * Math.abs(force.strength) * ft;
            p.vy += dir * (fdy / fd) * Math.abs(force.strength) * ft;
          }
        }

        // ── 렌더링 ────────────────────────────────────────────────────────
        const sz = Math.max(0.2, p.size * tf * magMult);
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${s}%,${l}%,${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
