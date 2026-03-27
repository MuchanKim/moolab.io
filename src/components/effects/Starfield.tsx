'use client';

import { useRef, useEffect } from 'react';

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function smoothstep(x: number) { return x * x * (3 - 2 * x); }

interface Star {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; twinklePhase: number;
  glow: number;
}

const BAND_ANGLE = -0.3; // 은하수 띠 기울기
const CURSOR_RADIUS = 120;

function createStars(w: number, h: number, count: number): Star[] {
  const stars: Star[] = [];
  const bandWidth = h * 0.35;

  for (let i = 0; i < count; i++) {
    let x = rand(0, w), y = rand(0, h);

    // 70% 별을 은하수 밴드 안에 집중
    if (Math.random() < 0.7) {
      const bandCenter = h * 0.5 + (x - w * 0.5) * Math.tan(BAND_ANGLE);
      y = bandCenter + (Math.random() - 0.5) * bandWidth * (0.3 + Math.random() * 0.7);
      y = Math.max(0, Math.min(h, y));
    }

    const r = Math.random(), b = r * r;
    // 밴드 안의 별은 약간 더 밝음
    const distFromBand = Math.abs(y - (h * 0.5 + (x - w * 0.5) * Math.tan(BAND_ANGLE)));
    const inBand = distFromBand < bandWidth * 0.5;
    const bBoost = inBand ? 0.1 : 0;

    stars.push({
      x, y,
      size: b > 0.8 ? rand(0.4, 0.7) : rand(0.1, 0.35),
      brightness: Math.min(1, 0.08 + b * 0.7 + bBoost),
      twinkleSpeed: rand(0.003, 0.015),
      twinklePhase: rand(0, Math.PI * 2),
      glow: 0,
    });
  }
  return stars;
}

// 성운 클러스터 (정적 위치, 매 리사이즈 시 재생성)
interface Nebula { x: number; y: number; r: number; hue: number; alpha: number; }

function createNebulas(w: number, h: number): Nebula[] {
  const nebulas: Nebula[] = [];
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.15 + i * 0.18);
    const by = h * 0.5 + (bx - w * 0.5) * Math.tan(BAND_ANGLE) + rand(-30, 30);
    nebulas.push({
      x: bx, y: by,
      r: rand(80, 160),
      hue: 230 + i * 10,
      alpha: 0.012 + Math.random() * 0.005,
    });
  }
  return nebulas;
}

interface StarfieldProps {
  count?: number;
  /** Global brightness multiplier (0~1). Changes are animated smoothly. */
  opacity?: number;
}

export function Starfield({ count = 3000, opacity = 1 }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const frameRef = useRef(0);
  const opacityRef = useRef(opacity);
  const opacityTargetRef = useRef(opacity);

  useEffect(() => { opacityTargetRef.current = opacity; }, [opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const applySize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = p.offsetWidth * dpr;
      canvas.height = p.offsetHeight * dpr;
      canvas.style.width = `${p.offsetWidth}px`;
      canvas.style.height = `${p.offsetHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(p.offsetWidth, p.offsetHeight, count);
      nebulasRef.current = createNebulas(p.offsetWidth, p.offsetHeight);
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = { x: -999, y: -999 }; };
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', handleLeave);

    let rafId = 0;

    const draw = () => {
      const p = canvas.parentElement;
      if (!p) { rafId = requestAnimationFrame(draw); return; }
      const W = p.offsetWidth, H = p.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Smooth opacity transition
      opacityRef.current += (opacityTargetRef.current - opacityRef.current) * 0.08;
      const gOp = opacityRef.current;

      frameRef.current++;
      const frame = frameRef.current;
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const cursorActive = mx > -50 && mx < W + 50 && my > -50 && my < H + 50;

      // ── 은하수 성운 그라디언트 ──
      for (const nb of nebulasRef.current) {
        const pulse = (Math.sin(frame * 0.002 + nb.hue) + 1) * 0.5;
        const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r + pulse * 20);
        g.addColorStop(0, `hsla(${nb.hue}, 20%, 35%, ${(nb.alpha + pulse * 0.003) * gOp})`);
        g.addColorStop(0.6, `hsla(${nb.hue + 10}, 15%, 25%, ${nb.alpha * 0.4 * gOp})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, nb.r + pulse * 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 별 렌더링 ──
      for (const s of starsRef.current) {
        const twinkle = (Math.sin(frame * s.twinkleSpeed + s.twinklePhase) + 1) * 0.5;
        const twinkleAmt = (1 - s.brightness) * 0.5;
        const bright = s.brightness * (0.6 + twinkle * 0.4) * gOp;

        // 커서: opacity만
        let target = 0;
        if (cursorActive) {
          const dx = s.x - mx, dy = s.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CURSOR_RADIUS) target = smoothstep(1 - dist / CURSOR_RADIUS);
        }
        s.glow += (target - s.glow) * 0.06;

        const alpha = Math.min(1, bright + s.glow * 0.2);
        if (alpha < 0.01) continue;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, ${70 + bright * 28}%, ${alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mouseleave', handleLeave);
      ro.disconnect();
    };
  }, [count]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />;
}
