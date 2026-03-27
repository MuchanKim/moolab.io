'use client';

import { useRef, useEffect } from 'react';

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function smoothstep(x: number) { return x * x * (3 - 2 * x); }

interface Star {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; twinklePhase: number;
  glow: number;
  // 블랙홀용
  dist: number; ox: number; oy: number;
  absorbed: boolean; targeted: boolean; targetFrame: number;
  fadeStart: number;
}

const BAND_ANGLE = -0.3;
const CURSOR_RADIUS = 120;
const PEAK_TIME = 7;
const BH_START_TIME = 10;

function createStars(w: number, h: number, count: number): Star[] {
  const stars: Star[] = [];
  const bandWidth = h * 0.35;
  const cx = w / 2, cy = h / 2;

  for (let i = 0; i < count; i++) {
    let x = rand(0, w), y = rand(0, h);
    if (Math.random() < 0.7) {
      const bandCenter = h * 0.5 + (x - w * 0.5) * Math.tan(BAND_ANGLE);
      y = bandCenter + (Math.random() - 0.5) * bandWidth * (0.3 + Math.random() * 0.7);
      y = Math.max(0, Math.min(h, y));
    }
    const r = Math.random(), b = r * r;
    const distFromBand = Math.abs(y - (h * 0.5 + (x - w * 0.5) * Math.tan(BAND_ANGLE)));
    const inBand = distFromBand < bandWidth * 0.5;

    stars.push({
      x, y,
      size: b > 0.8 ? rand(0.4, 0.7) : rand(0.1, 0.35),
      brightness: Math.min(1, 0.08 + b * 0.7 + (inBand ? 0.1 : 0)),
      twinkleSpeed: rand(0.003, 0.015),
      twinklePhase: rand(0, Math.PI * 2),
      glow: 0,
      dist: Math.sqrt((x - cx) ** 2 + (y - cy) ** 2),
      ox: 0, oy: 0,
      absorbed: false, targeted: false, targetFrame: 0, fadeStart: 0,
    });
  }
  stars.sort((a, b) => a.dist - b.dist);
  return stars;
}

interface Nebula { x: number; y: number; r: number; hue: number; alpha: number; }
function createNebulas(w: number, h: number): Nebula[] {
  const nebulas: Nebula[] = [];
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.15 + i * 0.18);
    const by = h * 0.5 + (bx - w * 0.5) * Math.tan(BAND_ANGLE) + rand(-30, 30);
    nebulas.push({ x: bx, y: by, r: rand(80, 160), hue: 230 + i * 10, alpha: 0.012 + Math.random() * 0.005 });
  }
  return nebulas;
}

interface BangParticle {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; decay: number;
  trail: { x: number; y: number }[]; maxT: number;
}

interface StarfieldProps {
  count?: number;
  opacity?: number;
  holdElapsed?: number;
  onHoldDeath?: () => void;
  onRebirth?: () => void;
}

export function Starfield({ count = 3000, opacity = 1, holdElapsed = 0, onHoldDeath, onRebirth }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const frameRef = useRef(0);
  const opacityRef = useRef(opacity);
  const opacityTargetRef = useRef(opacity);
  const holdElapsedRef = useRef(holdElapsed);
  const onHoldDeathRef = useRef(onHoldDeath);
  const onRebirthRef = useRef(onRebirth);
  const bhFrameRef = useRef(0);
  const bhPhaseRef = useRef<'idle' | 'active' | 'runaway' | 'singularity' | 'bang' | 'dead' | 'rebirth'>('idle');
  const rebirthMotesRef = useRef<{ x: number; y: number; vx: number; vy: number; sz: number; life: number; decay: number; phase: number }[]>([]);
  const pullPowerRef = useRef(0);
  const bangPartsRef = useRef<BangParticle[]>([]);
  const bangBeatsRef = useRef<{ delay: number; power: number; fired: boolean }[]>([]);
  const deathFiredRef = useRef(false);
  const freezeFrameRef = useRef(0);

  useEffect(() => { opacityTargetRef.current = opacity; }, [opacity]);
  useEffect(() => { holdElapsedRef.current = holdElapsed; }, [holdElapsed]);
  useEffect(() => { onHoldDeathRef.current = onHoldDeath; }, [onHoldDeath]);
  useEffect(() => { onRebirthRef.current = onRebirth; }, [onRebirth]);

  // Hold elapsed 변화 감지 → phase 전환
  useEffect(() => {
    if (holdElapsed > 0 && bhPhaseRef.current === 'idle') {
      bhPhaseRef.current = 'active';
    }
  }, [holdElapsed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0, CX = 0, CY = 0;

    const applySize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      const dpr = window.devicePixelRatio || 1;
      W = p.offsetWidth; H = p.offsetHeight;
      CX = W / 2; CY = H / 2;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(W, H, count);
      nebulasRef.current = createNebulas(W, H);
      bhPhaseRef.current = 'idle';
      bhFrameRef.current = 0;
      bangPartsRef.current = [];
      deathFiredRef.current = false;
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
      if (!W) { rafId = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      opacityRef.current += (opacityTargetRef.current - opacityRef.current) * 0.08;
      const gOp = opacityRef.current;

      frameRef.current++;
      const frame = frameRef.current;
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const cursorActive = mx > -50 && mx < W + 50 && my > -50 && my < H + 50;
      const elapsed = holdElapsedRef.current;
      const phase = bhPhaseRef.current;
      const stars = starsRef.current;
      const MAXD = Math.sqrt(CX * CX + CY * CY);

      // ── pullPower 계산 (sqrt 커브: 초반 빠르게) ──
      const pullPower = elapsed > 0 ? Math.sqrt(Math.min(1, elapsed / BH_START_TIME)) : 0;
      pullPowerRef.current = pullPower;

      // ── Phase 전환 ──
      if (phase === 'active' && pullPower >= 1) {
        bhPhaseRef.current = 'runaway';
        bhFrameRef.current = frame;
      }
      if (phase === 'runaway' && stars.every(s => s.absorbed)) {
        bhPhaseRef.current = 'singularity';
        bhFrameRef.current = frame;
      }
      if (phase === 'singularity' && frame - bhFrameRef.current > 60) {
        bhPhaseRef.current = 'bang';
        bhFrameRef.current = frame;
        const beats: { delay: number; power: number; fired: boolean }[] = [];
        let beatT = 0;
        for (let i = 0; i < 50; i++) {
          const progress = i / 49;
          const interval = i < 3 ? 20 : i < 8 ? 12 : i < 15 ? 6 : i < 25 ? 3 : i < 35 ? 2 : 1;
          beats.push({ delay: beatT, power: 0.3 + progress * 0.8, fired: false });
          beatT += interval;
        }
        bangBeatsRef.current = beats;
      }
      if (phase === 'bang') {
        const allFired = bangBeatsRef.current.every(b => b.fired);
        const bangAge = frame - bhFrameRef.current;
        const lastDelay = bangBeatsRef.current[bangBeatsRef.current.length - 1]?.delay ?? 0;
        if (allFired && bangAge - lastDelay > 40) {
          bhPhaseRef.current = 'dead';
          if (!deathFiredRef.current) { deathFiredRef.current = true; onHoldDeathRef.current?.(); }
        }
      }

      const useFrame = (phase === 'idle' || phase === 'active') ? frame : frame;

      // ── 별 밝기 배율 ──
      let starBrMult = gOp;
      if (phase === 'active') starBrMult = gOp + pullPower * (1 - gOp);
      else if (phase !== 'idle') starBrMult = 1;

      // ── 성운 ──
      const nebFade = phase === 'runaway' ? Math.max(0, 1 - ((frame - bhFrameRef.current) / 120)) : (phase === 'active' || phase === 'idle') ? 1 : 0;
      if (nebFade > 0) {
        for (const nb of nebulasRef.current) {
          const pulse = (Math.sin(useFrame * 0.002 + nb.hue) + 1) * 0.5;
          const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r + pulse * 20);
          g.addColorStop(0, `hsla(${nb.hue}, 20%, 35%, ${(nb.alpha + pulse * 0.003) * starBrMult * nebFade})`);
          g.addColorStop(0.6, `hsla(${nb.hue + 10}, 15%, 25%, ${nb.alpha * 0.4 * starBrMult * nebFade})`);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(nb.x, nb.y, nb.r + pulse * 20, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ── Cascade Swallow (active + runaway) ──
      if (phase === 'active' && pullPower > 0.005) {
        // 타겟팅: pullPower 기반
        const count = Math.max(3, Math.floor(3 + pullPower * 10));
        const radius = 150 + pullPower * MAXD;
        for (let c = 0; c < count; c++) {
          const target = stars.find(s => !s.absorbed && !s.targeted && s.dist < radius);
          if (target) { target.targeted = true; target.targetFrame = frame; }
        }
      }
      if (phase === 'runaway') {
        const runAge = frame - bhFrameRef.current;
        // 폭주: 남은 별 전부 타겟팅
        if (runAge % 2 === 0) {
          let cnt = 0;
          for (const s of stars) {
            if (!s.absorbed && !s.targeted) { s.targeted = true; s.targetFrame = frame; cnt++; if (cnt > 15) break; }
          }
        }
        if (runAge > 60) {
          for (const s of stars) { if (!s.absorbed && !s.targeted) { s.targeted = true; s.targetFrame = frame; } }
        }
      }

      // 흡수 물리
      if (phase === 'active' || phase === 'runaway') {
        const baseSpeed = 2 + pullPower * 6;
        const runawayBoost = phase === 'runaway'
          ? smoothstep(Math.min(1, (frame - bhFrameRef.current) / 180)) * 25 : 0;
        const swallowSpeed = baseSpeed + runawayBoost;

        for (const s of stars) {
          if (s.absorbed || !s.targeted) continue;
          const dx = s.x + s.ox - CX, dy = s.y + s.oy - CY;
          const d = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const localAge = frame - s.targetFrame;
          const spin = smoothstep(Math.min(1, localAge / 20)) * 0.04 * (80 / (d + 8));
          const pull = swallowSpeed * smoothstep(Math.min(1, localAge / 25));
          const directPull = phase === 'runaway' && runawayBoost > 5 ? runawayBoost * 0.12 : 0;

          if (d < 4) { s.absorbed = true; continue; }
          s.ox += (Math.cos(angle + spin) * Math.max(0, d - pull - directPull) - dx) * 0.06;
          s.oy += (Math.sin(angle + spin) * Math.max(0, d - pull - directPull) - dy) * 0.06;
        }
      }

      // ── 별 렌더 ──
      for (const s of stars) {
        if (s.absorbed) continue;
        const tw = (Math.sin(useFrame * s.twinkleSpeed + s.twinklePhase) + 1) * 0.5;
        const twAmt = (1 - s.brightness) * 0.5;
        let a = s.brightness * (1 - twAmt + twAmt * tw) * starBrMult;

        // 커서 (active/idle만)
        if (phase === 'idle' || phase === 'active') {
          let target = 0;
          if (cursorActive) {
            const dx = s.x - mx, dy = s.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CURSOR_RADIUS) target = smoothstep(1 - dist / CURSOR_RADIUS);
          }
          s.glow += (target - s.glow) * 0.06;
          a = Math.min(1, a + s.glow * 0.2);
        }

        const drawX = s.x + s.ox, drawY = s.y + s.oy;
        if (a < 0.01) continue;
        const l = Math.min(98, 70 + a * 28);

        // 밝기 높을 때 글로우
        if (a > 0.4 && starBrMult > 0.7) {
          const gr = s.size * 3 + a * 3;
          const ga = (a - 0.4) * 0.1;
          const gg = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, gr);
          gg.addColorStop(0, `hsla(0,0%,${l}%,${ga})`); gg.addColorStop(1, 'transparent');
          ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(drawX, drawY, gr, 0, Math.PI * 2); ctx.fill();
        }

        ctx.beginPath(); ctx.arc(drawX, drawY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, ${l}%, ${a})`; ctx.fill();
      }

      // ── 특이점 (고요 + 작은 빛) ──
      if (phase === 'singularity') {
        const age = frame - bhFrameRef.current;
        const dotR = smoothstep(Math.min(1, age / 60)) * 3;
        const dotA = smoothstep(Math.min(1, age / 60)) * 0.8;
        ctx.beginPath(); ctx.arc(CX, CY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0,0%,97%,${dotA})`; ctx.fill();
        const gg = ctx.createRadialGradient(CX, CY, 0, CX, CY, dotR * 5);
        gg.addColorStop(0, `hsla(0,0%,90%,${dotA * 0.2})`); gg.addColorStop(1, 'transparent');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(CX, CY, dotR * 5, 0, Math.PI * 2); ctx.fill();
      }

      // ── 빅뱅 (Heartbeat) ──
      if (phase === 'bang') {
        const bangAge = frame - bhFrameRef.current;
        const bp = bangPartsRef.current;
        const beats = bangBeatsRef.current;

        // 박동 발사
        for (const beat of beats) {
          if (beat.fired || bangAge < beat.delay) continue;
          beat.fired = true;
          const count = Math.floor(100 + beat.power * 400);
          const maxSpd = 15 + beat.power * 50;
          for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2); const spd = rand(3, maxSpd);
            bp.push({ x: CX, y: CY,
              vx: Math.cos(angle) * spd + rand(-0.3, 0.3),
              vy: Math.sin(angle) * spd + rand(-0.3, 0.3),
              sz: rand(0.15, 0.5 + beat.power * 2.5),
              life: 1, decay: rand(0.001, 0.006),
              trail: [], maxT: Math.floor(3 + spd * 0.5) });
          }
        }

        // 플래시 (각 박동 시)
        for (const beat of beats) {
          if (!beat.fired) continue;
          const flashAge = bangAge - beat.delay;
          if (flashAge < 0 || flashAge > 12) continue;
          const fa = flashAge < 3 ? smoothstep(flashAge / 3) * beat.power : beat.power * Math.pow(0.75, flashAge - 3);
          if (fa > 0.005) {
            const fr = 15 + beat.power * 40;
            const fg = ctx.createRadialGradient(CX, CY, 0, CX, CY, fr);
            fg.addColorStop(0, `hsla(30, 12%, 100%, ${Math.min(1, fa)})`);
            fg.addColorStop(0.4, `hsla(20, 8%, 90%, ${fa * 0.25})`);
            fg.addColorStop(1, 'transparent');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(CX, CY, fr, 0, Math.PI * 2); ctx.fill();
          }
        }

        // 파티클 렌더
        for (let i = bp.length - 1; i >= 0; i--) {
          const p = bp[i];
          p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > p.maxT) p.trail.shift();
          p.x += p.vx; p.y += p.vy; p.vx *= 0.997; p.vy *= 0.997; p.life -= p.decay;
          if (p.life <= 0) { bp.splice(i, 1); continue; }
          const hue = 240 - p.life * 220; // 냉각: 흰→보라
          const lit = 55 + p.life * 37;

          // 트레일
          if (p.trail.length > 1 && p.sz > 0.25) {
            ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (const pt of p.trail) ctx.lineTo(pt.x, pt.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `hsla(${hue},6%,${lit - 15}%,${p.life * 0.12})`;
            ctx.lineWidth = p.sz * 0.3 * p.life; ctx.stroke();
          }
          // 글로우
          if (p.sz > 0.7 && p.life > 0.3) {
            const gr = p.sz * 2 * p.life;
            const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
            gg.addColorStop(0, `hsla(${hue},6%,${lit}%,${p.life * 0.06})`);
            gg.addColorStop(1, 'transparent');
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, gr, 0, Math.PI * 2); ctx.fill();
          }
          // 코어
          ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * p.life, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue},6%,${lit}%,${p.life * 0.8})`; ctx.fill();
        }

        // 모든 박동 끝난 후 서서히 암흑
        const allFired = beats.every(b => b.fired);
        if (allFired) {
          const lastDelay = beats[beats.length - 1]?.delay ?? 0;
          const sinceLastBeat = bangAge - lastDelay;
          if (sinceLastBeat > 10) {
            const dark = smoothstep(Math.min(1, (sinceLastBeat - 10) / 20));
            ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, W, H);
          }
        }
      }

      if (phase === 'dead') {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        // 즉시 rebirth 시작 (10f)
        if (frame - bhFrameRef.current > 10) {
          bhPhaseRef.current = 'rebirth';
          bhFrameRef.current = frame;
          rebirthMotesRef.current = [];
        }
      }

      // ── Rebirth (Calm Rise) ──
      if (phase === 'rebirth') {
        const age = frame - bhFrameRef.current;
        const riseDur = 80;
        const riseP = smoothstep(Math.min(1, age / riseDur));
        const ey = H * 0.82 - (H * 0.82 - CY) * riseP;

        // 로고 트리거: 별이 중앙 근처 도달
        const logoTrigger = riseDur - 25;
        const logoStarted = age >= logoTrigger;

        // 별: 로고 시작 후 15f에 걸쳐 완전 소멸
        const emberFadeOut = logoStarted ? smoothstep(Math.min(1, (age - logoTrigger) / 15)) : 0;
        const emberA = (age < 10 ? smoothstep(age / 10) : 1) * (1 - emberFadeOut);

        // 은은한 반짝임
        const twinkle = (Math.sin(age * 0.06) + 1) * 0.5;
        const brightness = emberA * (0.75 + twinkle * 0.25);

        // 별 점만 (글로우 없음)
        if (brightness > 0.005) {
          ctx.beginPath(); ctx.arc(CX, ey, 0.55, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(0,0%,95%,${brightness})`; ctx.fill();
        }

        // 로고 등장 신호
        if (age === logoTrigger) { onRebirthRef.current?.(); }

        // 검정 배경 유지 (별 복귀 없음)
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
