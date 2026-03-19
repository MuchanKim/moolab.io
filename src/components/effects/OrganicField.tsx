'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useTheme } from '@/components/ThemeProvider';

// ── 색상 팔레트 (단순화 — 흰색 위주) ─────────────────────────────────────────
const STAR_PALETTE = [
  { h:   0, s:  0, weight: 5 },  // 순백
  { h:   0, s:  4, weight: 3 },  // 따뜻한 흰색
  { h: 210, s: 18, weight: 2 },  // 파란 별
  { h:  48, s: 22, weight: 1 },  // 황금 별
] as const;
const PALETTE_WEIGHT = STAR_PALETTE.reduce((s, c) => s + c.weight, 0);

function pickColor() {
  let r = Math.random() * PALETTE_WEIGHT;
  for (const c of STAR_PALETTE) {
    r -= c.weight;
    if (r <= 0) return { h: c.h + rand(-4, 4), s: Math.max(0, c.s + rand(-3, 3)) };
  }
  return { h: 0, s: 0 };
}
// ─────────────────────────────────────────────────────────────────────────────

// ── 파라미터 인터페이스 ──────────────────────────────────────────────────────
export interface OrganicFieldConfig {
  count?: number;
  /** home 분포 반경 X/Y — 유기체 기본 크기 */
  homeSpreadX?: number;
  homeSpreadY?: number;
  /** 숨쉬기 주파수 (낮을수록 느리게) */
  breathFreq?: number;
  /** 숨쉬기 진폭 (팽창/수축 비율) */
  breathAmp?: number;
  /** 개별 움직임 반경 (리사주 궤적 크기) */
  noiseAmp?: number;
  /** 커서 따라가는 속도 (0~1) */
  cursorFollowSpeed?: number;
  minSize?: number;
  maxSize?: number;
  lineDistance?: number;
  lineOpacity?: number;
  bgOpacityMin?: number;
  bgOpacityMax?: number;
  hueShiftSpeed?: number;
}
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS: Required<OrganicFieldConfig> = {
  count: 85,
  homeSpreadX: 260,
  homeSpreadY: 190,
  breathFreq: 0.007,       // 약 14초 주기 (2π / 0.007 / 60fps ≈ 15s)
  breathAmp: 0.30,
  noiseAmp: 58,
  cursorFollowSpeed: 0.022,
  minSize: 1.2,
  maxSize: 5.5,
  lineDistance: 90,
  lineOpacity: 0.09,
  bgOpacityMin: 0.14,
  bgOpacityMax: 0.60,
  hueShiftSpeed: 0.04,
};

interface Particle {
  homeX: number;    // 중심에서의 상대 좌표
  homeY: number;
  x: number;        // 최종 화면 좌표 (매 프레임 계산)
  y: number;
  z: number;        // depth 0~1
  baseSize: number;
  h: number;
  s: number;
  rawL: number;     // 0~1 정규화 밝기
  hueSpeed: number;
  // 리사주 기반 독립 궤적
  noiseAngle1: number;
  noiseSpeed1: number;
  noiseAngle2: number;
  noiseSpeed2: number;
  noiseRadius: number;
  // 개별 숨쉬기 위상 (파티클마다 미세하게 다름)
  localBreathPhase: number;
  // 타원 변형
  baseAspect: number;   // 기본 가로세로 비율
  rotation: number;
  rotationSpeed: number;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// 가우시안 분포 — 중심에 밀집, 가장자리로 갈수록 희박
function gaussian(): number {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function OrganicField(props: OrganicFieldConfig) {
  const cfg = { ...DEFAULTS, ...props };
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const ptsRef     = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);
  const frameRef   = useRef(0);
  const orgXRef    = useRef<number | null>(null);  // 유기체 중심
  const orgYRef    = useRef<number | null>(null);
  const cursor     = useCursorPosition();
  const { theme }  = useTheme();
  const themeRef   = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initParticles = (w: number, h: number) => {
      // 중심은 최초 한 번만 설정 (resize 시 재설정 X)
      if (orgXRef.current === null) orgXRef.current = w / 2;
      if (orgYRef.current === null) orgYRef.current = h / 2;

      ptsRef.current = Array.from({ length: cfg.count }, () => {
        const z = Math.pow(Math.random(), 0.75);
        const { h: sh, s: ss } = pickColor();
        return {
          homeX: gaussian() * cfg.homeSpreadX,
          homeY: gaussian() * cfg.homeSpreadY,
          x: 0,
          y: 0,
          z,
          baseSize: cfg.minSize + (cfg.maxSize - cfg.minSize) * z,
          h: sh,
          s: ss,
          rawL: Math.random(),
          hueSpeed:      rand(-cfg.hueShiftSpeed, cfg.hueShiftSpeed),
          noiseAngle1:   rand(0, Math.PI * 2),
          noiseSpeed1:   rand(0.005, 0.015),
          noiseAngle2:   rand(0, Math.PI * 2),
          noiseSpeed2:   rand(0.003, 0.010),
          noiseRadius:   rand(cfg.noiseAmp * 0.35, cfg.noiseAmp),
          localBreathPhase: rand(0, Math.PI * 2),
          baseAspect:    rand(0.55, 1.65),
          rotation:      rand(0, Math.PI * 2),
          rotationSpeed: rand(-0.006, 0.006),
        };
      });
    };

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

      frameRef.current += 1;
      const frame  = frameRef.current;
      const isDark = themeRef.current === 'dark';
      const pts    = ptsRef.current;

      // ── 유기체 중심: 커서를 향해 부드럽게 lerp ────────────────────────────
      const canvasRect = canvas.getBoundingClientRect();
      const cx = cursor.current.x - canvasRect.left;
      const cy = cursor.current.y - canvasRect.top;
      const inCanvas = cx > 0 && cx < W && cy > 0 && cy < H;
      const targetX = inCanvas ? cx : W / 2;
      const targetY = inCanvas ? cy : H / 2;

      if (orgXRef.current === null) orgXRef.current = W / 2;
      if (orgYRef.current === null) orgYRef.current = H / 2;
      orgXRef.current += (targetX - orgXRef.current) * cfg.cursorFollowSpeed;
      orgYRef.current += (targetY - orgYRef.current) * cfg.cursorFollowSpeed;
      const orgX = orgXRef.current;
      const orgY = orgYRef.current;

      // ── 글로벌 숨쉬기 ─────────────────────────────────────────────────────
      const breatheT    = frame * cfg.breathFreq;
      const globalSin   = Math.sin(breatheT);          // -1 ~ 1
      const breatheNorm = (globalSin + 1) * 0.5;       // 0 ~ 1 (0 = 수축, 1 = 팽창)

      // ── 위치 계산 ─────────────────────────────────────────────────────────
      for (const p of pts) {
        // 개별 숨쉬기 (글로벌과 혼합)
        const localSin  = Math.sin(breatheT * 1.4 + p.localBreathPhase);
        const blended   = globalSin * 0.75 + localSin * 0.25;
        const scale     = 1 + blended * cfg.breathAmp;

        // 리사주 궤적 — 각 파티클의 독립적 꿈틀거림
        p.noiseAngle1 += p.noiseSpeed1;
        p.noiseAngle2 += p.noiseSpeed2;
        const nx = Math.cos(p.noiseAngle1) * p.noiseRadius
                 + Math.cos(p.noiseAngle2) * p.noiseRadius * 0.42;
        const ny = Math.sin(p.noiseAngle1) * p.noiseRadius
                 + Math.sin(p.noiseAngle2) * p.noiseRadius * 0.42;

        p.x = orgX + p.homeX * scale + nx;
        p.y = orgY + p.homeY * scale + ny;

        p.rotation += p.rotationSpeed;
      }

      // ── 연결선 (batch) ────────────────────────────────────────────────────
      const lineRGB = isDark ? '255,255,255' : '20,20,20';
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${lineRGB},${cfg.lineOpacity})`;
      ctx.lineWidth   = 0.5;
      const lineSq    = cfg.lineDistance * cfg.lineDistance;
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

      // ── 파티클 렌더링 ─────────────────────────────────────────────────────
      for (const p of pts) {
        // hue drift
        p.h = (p.h + p.hueSpeed + 360) % 360;

        // 밝기 + 숨쉬기 연동 (팽창 시 밝아짐)
        const baseL = isDark
          ? 70 + p.rawL * 30     // 다크: 70~100% (흰별)
          :  3 + p.rawL * 20;    // 라이트: 3~23% (검정)
        const l      = baseL * (0.6 + 0.4 * breatheNorm);

        // opacity + 숨쉬기 연동
        const alpha  = (cfg.bgOpacityMin + (cfg.bgOpacityMax - cfg.bgOpacityMin) * p.z)
                     * (0.55 + 0.45 * breatheNorm);

        // 크기: 팽창 시 커지고, 수축 시 작아짐
        const size   = Math.max(0.3, p.baseSize * (0.55 + 0.9 * breatheNorm));

        // 타원 aspect: 수축 시 찌그러짐, 팽창 시 원에 가까워짐
        const aspect = p.baseAspect + (1 - p.baseAspect) * breatheNorm;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(aspect, 1 / aspect);
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
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
