'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';

// ─── 우주 색상 팔레트 — 가중치 기반으로 랜덤 선택 ────────────────────────────
const HUE_POOLS = [
  { center: 125, spread: 22, weight: 3 },  // moolab 시그니처 초록
  { center: 210, spread: 28, weight: 3 },  // 별빛 파랑
  { center: 272, spread: 24, weight: 2 },  // 성운 보라
  { center: 185, spread: 20, weight: 2 },  // 청록/민트
  { center:  48, spread: 18, weight: 1 },  // 황금/금성
  { center: 330, spread: 22, weight: 1 },  // 마젠타/핑크 성운
] as const;

const TOTAL_WEIGHT = HUE_POOLS.reduce((s, p) => s + p.weight, 0);

function pickHue(): number {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const pool of HUE_POOLS) {
    r -= pool.weight;
    if (r <= 0) return pool.center + rand(-pool.spread, pool.spread);
  }
  return rand(0, 360);
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── 파라미터 인터페이스 — 각 페이지에서 재활용 시 덮어쓰기 ─────────────────
export interface ParticleFieldConfig {
  count?: number;
  satMin?: number;
  satMax?: number;
  lightMin?: number;
  lightMax?: number;
  minSize?: number;
  maxSize?: number;
  revealRadius?: number;
  bgOpacityMin?: number;
  bgOpacityMax?: number;
  revealOpacity?: number;
  wanderSpeed?: number;
  revealWanderMult?: number;
  magnifyScale?: number;
  upliftStrength?: number;
  /** hue 변화 속도 최대값 (deg/frame) */
  hueShiftSpeed?: number;
  /** sat/light 변화 속도 최대값 */
  colorDriftSpeed?: number;
}
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULTS: Required<ParticleFieldConfig> = {
  count: 420,
  satMin: 15,
  satMax: 68,
  lightMin: 48,
  lightMax: 82,
  minSize: 0.6,
  maxSize: 3.8,
  revealRadius: 220,
  bgOpacityMin: 0.07,
  bgOpacityMax: 0.30,
  revealOpacity: 0.92,
  wanderSpeed: 0.28,
  revealWanderMult: 7,
  magnifyScale: 2.8,
  upliftStrength: 0.22,
  hueShiftSpeed: 0.07,   // 느리게 — 너무 빠르면 사이키델릭해짐
  colorDriftSpeed: 0.015,
};

const PHYSICS = {
  damping: 0.80,
  returnBase: 0.038,
  returnNear: 0.010,
  repelRadius: 55,
  repelStrength: 5.5,
  stretchFactor: 0.28,
  maxStretch: 4.0,
};

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  baseSize: number;
  // 현재 색상값 (매 프레임 drift)
  h: number;
  s: number;
  l: number;
  // drift 속도 — 파티클마다 다른 속도로 색 변화
  hueSpeed: number;
  satSpeed: number;
  lightSpeed: number;
  // sat/light 범위 (파티클 고유 — 별/성운 성격 유지)
  satMin: number;
  satMax: number;
  lightMin: number;
  lightMax: number;
  wanderAngle: number;
  wanderFreq: number;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}

// 범위 내에서 bounce (경계에서 방향 반전)
function driftBounce(val: number, speed: number, min: number, max: number): [number, number] {
  let v = val + speed;
  let s = speed;
  if (v > max) { v = max; s = -Math.abs(s); }
  if (v < min) { v = min; s =  Math.abs(s); }
  return [v, s];
}

export function ParticleField(props: ParticleFieldConfig) {
  const cfg = { ...DEFAULTS, ...props };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const cursor = useCursorPosition();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initParticles = (w: number, h: number) => {
      particlesRef.current = Array.from({ length: cfg.count }, () => {
        const x = rand(0, w);
        const y = rand(0, h);
        const z = Math.pow(Math.random(), 0.7);

        // 파티클 고유 sat/light 범위 — 작은 별(z낮음)은 흰색에 가깝게
        const isSmall = z < 0.4;
        const pSatMin  = isSmall ? cfg.satMin : cfg.satMin + 15;
        const pSatMax  = isSmall ? cfg.satMax * 0.5 : cfg.satMax;
        const pLightMin = cfg.lightMin;
        const pLightMax = isSmall ? cfg.lightMax : cfg.lightMax - 10;

        const initSat   = rand(pSatMin, pSatMax);
        const initLight = rand(pLightMin, pLightMax);

        return {
          homeX: x, homeY: y, x, y, vx: 0, vy: 0,
          z,
          baseSize: cfg.minSize + (cfg.maxSize - cfg.minSize) * z,
          h: pickHue(),
          s: initSat,
          l: initLight,
          hueSpeed:   rand(-cfg.hueShiftSpeed, cfg.hueShiftSpeed),
          satSpeed:   rand(-cfg.colorDriftSpeed, cfg.colorDriftSpeed),
          lightSpeed: rand(-cfg.colorDriftSpeed * 0.6, cfg.colorDriftSpeed * 0.6),
          satMin: pSatMin, satMax: pSatMax,
          lightMin: pLightMin, lightMax: pLightMax,
          wanderAngle: rand(0, Math.PI * 2),
          wanderFreq: rand(0.004, 0.016),
        };
      });
      particlesRef.current.sort((a, b) => a.z - b.z);
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = cursor.current;

      for (const p of particlesRef.current) {
        // ── 색상 drift ──────────────────────────────────
        p.h = (p.h + p.hueSpeed + 360) % 360;
        const [ns, nss] = driftBounce(p.s, p.satSpeed, p.satMin, p.satMax);
        const [nl, nls] = driftBounce(p.l, p.lightSpeed, p.lightMin, p.lightMax);
        p.s = ns; p.satSpeed = nss;
        p.l = nl; p.lightSpeed = nls;

        // ── 커서 거리 & reveal ─────────────────────────
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const reveal = smoothstep(Math.max(0, 1 - dist / cfg.revealRadius));
        const effectiveZ = p.z + reveal * (1 - p.z) * 0.85;

        // ── 물리 ───────────────────────────────────────
        const zSpeedMult = 0.4 + p.z * 0.6;
        const amp = cfg.wanderSpeed * zSpeedMult * (1 + cfg.revealWanderMult * reveal);
        p.wanderAngle += p.wanderFreq;
        p.vx += Math.cos(p.wanderAngle) * amp;
        p.vy += Math.sin(p.wanderAngle) * amp;

        if (reveal > 0.05) {
          p.vy -= reveal * cfg.upliftStrength * effectiveZ;
        }

        if (dist < PHYSICS.repelRadius && dist > 0.1) {
          const f = smoothstep(1 - dist / PHYSICS.repelRadius) * PHYSICS.repelStrength;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }

        const rs = PHYSICS.returnBase + (PHYSICS.returnNear - PHYSICS.returnBase) * reveal;
        p.vx += (p.homeX - p.x) * rs;
        p.vy += (p.homeY - p.y) * rs;

        const damping = PHYSICS.damping - p.z * 0.06;
        p.vx *= damping;
        p.vy *= damping;
        p.x  += p.vx;
        p.y  += p.vy;

        // ── 렌더링 ─────────────────────────────────────
        const bgAlpha = cfg.bgOpacityMin + (cfg.bgOpacityMax - cfg.bgOpacityMin) * p.z;
        const alpha   = bgAlpha + (cfg.revealOpacity - bgAlpha) * reveal;

        const sizeBase = cfg.minSize + (cfg.maxSize - cfg.minSize) * effectiveZ;
        const magnify  = 1 + reveal * (cfg.magnifyScale - 1) * p.z;
        const size     = Math.max(0.3, sizeBase * magnify);

        const speed   = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const stretch = Math.min(1 + speed * PHYSICS.stretchFactor, PHYSICS.maxStretch);
        const angle   = speed > 0.4 ? Math.atan2(p.vy, p.vx) : 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},${p.s}%,${p.l}%,${alpha})`;
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
