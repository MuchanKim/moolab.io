'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useTheme } from '@/components/ThemeProvider';

export interface ConstellationWebConfig {
  count?: number;
  /** 연결선이 보이는 최대 거리 (px) */
  linkDistance?: number;
  /** 커서 주변 연결 강화 범위 */
  cursorRadius?: number;
  /** 커서 인력 강도 */
  cursorPull?: number;
  minSize?: number;
  maxSize?: number;
  driftSpeed?: number;
  baseOpacity?: number;
  lineOpacity?: number;
  burstDelay?: number;
}

const DEFAULTS: Required<ConstellationWebConfig> = {
  count: 140,
  linkDistance: 130,
  cursorRadius: 220,
  cursorPull: 0.8,
  minSize: 0.8,
  maxSize: 2.5,
  driftSpeed: 0.25,
  baseOpacity: 0.4,
  lineOpacity: 0.12,
  burstDelay: 0,
};

// moolab 팔레트 (미세한 색 변주)
const PALETTE = [
  { darkH: 148, darkS: 40, lightH: 148, lightS: 50 },
  { darkH: 210, darkS: 35, lightH: 210, lightS: 45 },
  { darkH:  28, darkS: 30, lightH:  28, lightS: 42 },
  { darkH: 270, darkS: 28, lightH: 270, lightS: 38 },
  { darkH:  52, darkS: 32, lightH:  52, lightS: 44 },
] as const;
const PW = PALETTE.length;

interface Star {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIdx: number;
  rawL: number;
  wanderAngle: number;
  wanderFreq: number;
  twinklePhase: number;
  twinkleFreq: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function smoothstep(x: number) { return x * x * (3 - 2 * x); }

function responsiveCount(base: number): number {
  if (typeof window === 'undefined') return base;
  const w = window.innerWidth;
  if (w < 640) return Math.round(base * 0.4);
  if (w < 1024) return Math.round(base * 0.65);
  return base;
}

export function ConstellationWeb(props: ConstellationWebConfig) {
  const cfg = { ...DEFAULTS, ...props };
  const burstDelay = props.burstDelay ?? 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef  = useRef<Star[]>([]);
  const rafRef    = useRef(0);
  const frameRef  = useRef(0);
  const burstRef  = useRef(burstDelay === 0);
  const cursor    = useCursorPosition();
  const { theme } = useTheme();
  const themeRef  = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

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

    const init = (w: number, h: number) => {
      const count = responsiveCount(cfg.count);
      starsRef.current = Array.from({ length: count }, () => {
        const x = rand(0, w);
        const y = rand(0, h);
        return {
          homeX: x, homeY: y,
          x: burstDelay > 0 ? w / 2 + rand(-20, 20) : x,
          y: burstDelay > 0 ? h / 2 + rand(-20, 20) : y,
          vx: 0, vy: 0,
          size: rand(cfg.minSize, cfg.maxSize),
          colorIdx: Math.floor(rand(0, PW)),
          rawL: rand(0, 1),
          wanderAngle: rand(0, Math.PI * 2),
          wanderFreq: rand(0.003, 0.01),
          twinklePhase: rand(0, Math.PI * 2),
          twinkleFreq: rand(0.008, 0.03),
        };
      });
    };

    const applySize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width  = p.offsetWidth;
      canvas.height = p.offsetHeight;
      init(canvas.width, canvas.height);
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!burstRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      frameRef.current += 1;
      const frame  = frameRef.current;
      const isDark = themeRef.current === 'dark';
      const stars  = starsRef.current;

      const rect = canvas.getBoundingClientRect();
      const mx = cursor.current.x - rect.left;
      const my = cursor.current.y - rect.top;
      const cursorIn = mx > -50 && mx < W + 50 && my > -50 && my < H + 50;

      // ── 물리 업데이트 ──────────────────────────────────────────
      for (const s of stars) {
        // 유기적 떠돌기
        s.wanderAngle += s.wanderFreq;
        s.vx += Math.cos(s.wanderAngle) * cfg.driftSpeed * 0.15;
        s.vy += Math.sin(s.wanderAngle) * cfg.driftSpeed * 0.15;

        // home 복귀
        s.vx += (s.homeX - s.x) * 0.008;
        s.vy += (s.homeY - s.y) * 0.008;

        // 커서 인력
        if (cursorIn) {
          const dx = mx - s.x;
          const dy = my - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < cfg.cursorRadius && dist > 1) {
            const pull = smoothstep(1 - dist / cfg.cursorRadius) * cfg.cursorPull;
            s.vx += (dx / dist) * pull;
            s.vy += (dy / dist) * pull;
          }
        }

        s.vx *= 0.94;
        s.vy *= 0.94;
        s.x += s.vx;
        s.y += s.vy;
      }

      // ── 연결선 (별자리 실) ─────────────────────────────────────
      const linkSq = cfg.linkDistance * cfg.linkDistance;
      const cursorLinkSq = (cfg.linkDistance * 1.6) ** 2;

      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;

          // 빠른 거리 체크
          if (Math.abs(ddx) > cfg.linkDistance * 1.6 || Math.abs(ddy) > cfg.linkDistance * 1.6) continue;

          const dSq = ddx * ddx + ddy * ddy;

          // 커서 근처: 연결 범위 확대 + 밝기 증가
          let isNearCursor = false;
          if (cursorIn) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const cdx = midX - mx;
            const cdy = midY - my;
            isNearCursor = (cdx * cdx + cdy * cdy) < (cfg.cursorRadius * cfg.cursorRadius);
          }

          const maxSq = isNearCursor ? cursorLinkSq : linkSq;
          if (dSq > maxSq) continue;

          const dist = Math.sqrt(dSq);
          const maxDist = isNearCursor ? cfg.linkDistance * 1.6 : cfg.linkDistance;
          const fadeFactor = 1 - dist / maxDist;
          const lineAlpha = cfg.lineOpacity * fadeFactor * (isNearCursor ? 2.5 : 1);

          const c = PALETTE[a.colorIdx];
          const h = isDark ? c.darkH : c.lightH;
          const s = isDark ? c.darkS : c.lightS;
          const l = isDark ? 65 : 55;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${lineAlpha})`;
          ctx.lineWidth = isNearCursor ? 0.8 : 0.5;
          ctx.stroke();
        }
      }

      // ── 별 렌더링 ─────────────────────────────────────────────
      for (const s of stars) {
        const twinkle = (Math.sin(frame * s.twinkleFreq + s.twinklePhase) + 1) * 0.5;
        const tf = 0.5 + twinkle * 0.5;

        // 커서 근접 bloom
        let bloom = 0;
        if (cursorIn) {
          const dx = s.x - mx;
          const dy = s.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          bloom = smoothstep(Math.max(0, 1 - dist / cfg.cursorRadius));
        }

        const c = PALETTE[s.colorIdx];
        const h = isDark ? c.darkH : c.lightH;
        const sat = isDark ? c.darkS : c.lightS;
        const baseL = isDark ? 60 + s.rawL * 25 : 45 + s.rawL * 20;
        const l = baseL + bloom * 20;
        const alpha = cfg.baseOpacity * tf * (1 + bloom * 2.5);
        const sz = s.size * (1 + bloom * 1.8) * tf;

        // 글로우 (커서 근접 시)
        if (bloom > 0.1) {
          const glowR = sz * 3;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          grad.addColorStop(0, `hsla(${h},${sat}%,${l}%,${alpha * bloom * 0.4})`);
          grad.addColorStop(1, `hsla(${h},${sat}%,${l}%,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 코어
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.3, sz), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${sat}%,${l}%,${alpha})`;
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
