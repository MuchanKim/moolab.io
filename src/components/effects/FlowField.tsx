'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useTheme } from '@/components/ThemeProvider';

// ── 별 색상 — 흰색/은색 기반, 소수만 컬러 (우주 느낌) ───────────────────────
const STAR_PALETTE = [
  { h:   0, s:  0, weight: 6 },  // 순백 별
  { h:   0, s:  4, weight: 3 },  // 따뜻한 흰별
  { h: 210, s: 18, weight: 2 },  // 파란 별 (Rigel/Sirius 류)
  { h:  48, s: 22, weight: 1 },  // 황금 별 (Capella 류)
] as const;

const PALETTE_WEIGHT = STAR_PALETTE.reduce((s, c) => s + c.weight, 0);

function pickStarColor(): { h: number; s: number } {
  let r = Math.random() * PALETTE_WEIGHT;
  for (const c of STAR_PALETTE) {
    r -= c.weight;
    if (r <= 0) return { h: c.h + rand(-4, 4), s: Math.max(0, c.s + rand(-4, 4)) };
  }
  return { h: 0, s: 0 };
}
// ─────────────────────────────────────────────────────────────────────────────

// ── 파라미터 인터페이스 ──────────────────────────────────────────────────────
export interface FlowFieldConfig {
  count?: number;
  minSize?: number;
  maxSize?: number;
  fieldScale?: number;
  fieldSpeed?: number;
  flowStrength?: number;
  cursorRadius?: number;
  curlStrength?: number;
  cursorRepel?: number;
  lineDistance?: number;
  lineOpacity?: number;
  bgOpacityMin?: number;
  bgOpacityMax?: number;
  revealOpacityBoost?: number;
}
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS: Required<FlowFieldConfig> = {
  count: 160,
  minSize: 0.8,
  maxSize: 3.6,
  fieldScale: 0.0011,
  fieldSpeed: 0.00048,
  flowStrength: 0.12,
  cursorRadius: 230,
  curlStrength: 3.8,
  cursorRepel: 2.0,
  lineDistance: 115,
  lineOpacity: 0.10,
  bgOpacityMin: 0.10,
  bgOpacityMax: 0.45,
  revealOpacityBoost: 0.40,
};

const PHYSICS = {
  damping: 0.87,
  maxSpeed: 3.5,
  stretchFactor: 0.22,
  maxStretch: 3.8,
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;           // depth 0(멀리)~1(가까이)
  baseSize: number;
  h: number;
  s: number;
  rawL: number;        // 0~1 정규화 밝기 — 테마에 따라 실제 l 결정
  // 반짝임
  twinklePhase: number;
  twinkleFreq: number;
  twinkleAmp: number;  // 0~1: 반짝임 강도 (0이면 거의 안 변함)
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}

/**
 * fBm 스타일 flow angle — 6개 레이어 sin/cos 합성
 * 유기적 방향 벡터 필드 생성
 */
function flowAngle(x: number, y: number, t: number, scale: number): number {
  const sx = x * scale, sy = y * scale;
  let v = 0;
  v += Math.sin(sx * 1.2  + sy * 0.9  + t * 0.7);
  v += Math.sin(sx * 0.5  + sy * 2.1  + t * 1.1)  * 0.50;
  v += Math.cos(sx * 2.3  + sy * 0.6  + t * 0.5)  * 0.35;
  v += Math.sin(sx * 0.8  + sy * 1.4  + t * 0.9)  * 0.25;
  v += Math.cos(sx * 1.7  + sy * 2.0  + t * 0.3)  * 0.15;
  v += Math.sin(sx * 3.1  + sy * 1.2  + t * 1.4)  * 0.10;
  return v * Math.PI;
}

export function FlowField(props: FlowFieldConfig) {
  const cfg = { ...DEFAULTS, ...props };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const cursor = useCursorPosition();
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  // 테마 변화 즉시 반영
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // grid+jitter 배치 — 균등 분포 (뭉침 방지)
    const initParticles = (w: number, h: number) => {
      const cols = Math.ceil(Math.sqrt(cfg.count * (w / h)));
      const rows = Math.ceil(cfg.count / cols);
      const cellW = w / cols;
      const cellH = h / rows;

      particlesRef.current = Array.from({ length: cfg.count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // 셀 중심 + jitter
        const x = (col + 0.5 + rand(-0.42, 0.42)) * cellW;
        const y = (row + 0.5 + rand(-0.42, 0.42)) * cellH;
        const z = Math.pow(Math.random(), 0.75);
        const { h: sh, s: ss } = pickStarColor();

        return {
          x: Math.max(0, Math.min(w, x)),
          y: Math.max(0, Math.min(h, y)),
          vx: rand(-0.3, 0.3),
          vy: rand(-0.3, 0.3),
          z,
          baseSize: cfg.minSize + (cfg.maxSize - cfg.minSize) * z,
          h: sh,
          s: ss,
          rawL: Math.random(),  // 0~1 정규화
          twinklePhase: rand(0, Math.PI * 2),
          twinkleFreq:  rand(0.008, 0.035),
          twinkleAmp:   rand(0.15, 0.75),  // 별마다 다른 반짝임 강도
        };
      });

      // depth 순 정렬 (멀리 있는 것 먼저)
      particlesRef.current.sort((a, b) => a.z - b.z);
    };

    // 부모 요소 크기 기반 — ResizeObserver로 섹션에 딱 맞게
    const applySize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      initParticles(canvas.width, canvas.height);
    };
    applySize();

    const ro = new ResizeObserver(applySize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      timeRef.current += 1;
      const t = timeRef.current * cfg.fieldSpeed;
      const frame = timeRef.current;
      // 커서 좌표를 캔버스 로컬 좌표로 변환 (섹션 내 배치 대응)
      const rect = canvas.getBoundingClientRect();
      const mx = cursor.current.x - rect.left;
      const my = cursor.current.y - rect.top;
      const pts = particlesRef.current;
      const isDark = themeRef.current === 'dark';

      // ── 연결선 (batch) ────────────────────────────────────────────────────
      const lineRGB = isDark ? '255,255,255' : '20,20,20';
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${lineRGB},${cfg.lineOpacity})`;
      ctx.lineWidth = 0.5;
      const lineSq = cfg.lineDistance * cfg.lineDistance;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const ddx = pts[i].x - pts[j].x;
          const ddy = pts[i].y - pts[j].y;
          if (Math.abs(ddx) > cfg.lineDistance || Math.abs(ddy) > cfg.lineDistance) continue;
          if (ddx * ddx + ddy * ddy < lineSq) {
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
          }
        }
      }
      ctx.stroke();

      // ── 파티클 ────────────────────────────────────────────────────────────
      for (const p of pts) {

        // ── 별 반짝임 — opacity와 size를 함께 파동 ──────────────────────────
        const twinkle = (Math.sin(frame * p.twinkleFreq + p.twinklePhase) + 1) * 0.5; // 0~1
        const twinkleFactor = 1 - p.twinkleAmp + p.twinkleAmp * twinkle;

        // ── 테마 기반 밝기 매핑 ───────────────────────────────────────────
        // rawL(0~1) → 다크: 72~100%, 라이트: 3~22%
        const baseL = isDark
          ? 72 + p.rawL * 28
          :  3 + p.rawL * 19;
        const l = baseL * twinkleFactor;

        // ── Flow field ────────────────────────────────────────────────────
        const angle = flowAngle(p.x, p.y, t, cfg.fieldScale);
        const zMult = 0.4 + p.z * 0.6;
        p.vx += Math.cos(angle) * cfg.flowStrength * zMult;
        p.vy += Math.sin(angle) * cfg.flowStrength * zMult;

        // ── 커서 소용돌이 + 반발 ──────────────────────────────────────────
        const cdx = p.x - mx;
        const cdy = p.y - my;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cdist < cfg.cursorRadius && cdist > 0.1) {
          const ct = smoothstep(1 - cdist / cfg.cursorRadius);
          // curl (소용돌이)
          p.vx += (-cdy / cdist) * ct * cfg.curlStrength * zMult;
          p.vy += ( cdx / cdist) * ct * cfg.curlStrength * zMult;
          // 반발
          p.vx += (cdx / cdist) * ct * cfg.cursorRepel;
          p.vy += (cdy / cdist) * ct * cfg.cursorRepel;
        }

        // ── 속도 제한 + 감쇠 ──────────────────────────────────────────────
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > PHYSICS.maxSpeed) {
          p.vx = (p.vx / spd) * PHYSICS.maxSpeed;
          p.vy = (p.vy / spd) * PHYSICS.maxSpeed;
        }
        p.vx *= PHYSICS.damping;
        p.vy *= PHYSICS.damping;
        p.x  += p.vx;
        p.y  += p.vy;

        // wrap-around
        if (p.x < -12) p.x = W + 12;
        else if (p.x > W + 12) p.x = -12;
        if (p.y < -12) p.y = H + 12;
        else if (p.y > H + 12) p.y = -12;

        // ── 커서 돋보기 ────────────────────────────────────────────────────
        const revealDist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const reveal = smoothstep(Math.max(0, 1 - revealDist / (cfg.cursorRadius * 0.78)));

        // ── 렌더링 ────────────────────────────────────────────────────────
        const baseAlpha = cfg.bgOpacityMin + (cfg.bgOpacityMax - cfg.bgOpacityMin) * p.z;
        // 반짝임으로 opacity도 파동
        const alpha = (baseAlpha * twinkleFactor) + reveal * cfg.revealOpacityBoost;

        const sz = Math.max(0.3, p.baseSize * twinkleFactor * (1 + reveal * 1.5 * p.z));

        const stretch      = Math.min(1 + spd * PHYSICS.stretchFactor, PHYSICS.maxStretch);
        const stretchAngle = spd > 0.3 ? Math.atan2(p.vy, p.vx) : 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(stretchAngle);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        ctx.beginPath();
        ctx.arc(0, 0, sz, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},${p.s}%,${l}%,${alpha})`;
        ctx.fill();
        ctx.restore();
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
