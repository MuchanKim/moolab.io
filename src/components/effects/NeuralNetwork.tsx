'use client';

import { useEffect, useRef } from 'react';
import { useCursorPosition } from '@/hooks/useCursorPosition';
import { useTheme } from '@/components/ThemeProvider';

export interface NeuralNetworkConfig {
  count?: number;
  linkDistance?: number;
  cursorRadius?: number;
  minSize?: number;
  maxSize?: number;
  driftSpeed?: number;
  neuronOpacity?: number;
  synapseOpacity?: number;
  burstDelay?: number;
  hiddenNeurons?: { id: number; x: number; y: number; activated: boolean }[];
  onActivate?: (id: number) => void;
  clearWaveProgress?: number;
  isCleared?: boolean;
}

const DEFAULTS: Required<Pick<NeuralNetworkConfig, 'count' | 'linkDistance' | 'cursorRadius' | 'minSize' | 'maxSize' | 'driftSpeed' | 'neuronOpacity' | 'synapseOpacity' | 'burstDelay'>> = {
  count: 180,
  linkDistance: 160,
  cursorRadius: 280,
  minSize: 0.8,
  maxSize: 2.4,
  driftSpeed: 0.12,
  neuronOpacity: 0.2,
  synapseOpacity: 0.4,
  burstDelay: 0,
};

// 뉴럴 팔레트 — 다크: 쿨톤 사이버, 라이트: 빨파노주
const PALETTE = [
  { darkH: 210, darkS: 60, lightH: 0,   lightS: 70 }, // 다크:블루    라이트:레드
  { darkH: 185, darkS: 55, lightH: 220, lightS: 65 }, // 다크:시안    라이트:블루
  { darkH: 265, darkS: 45, lightH: 50,  lightS: 75 }, // 다크:바이올렛 라이트:옐로
  { darkH: 235, darkS: 50, lightH: 25,  lightS: 72 }, // 다크:인디고   라이트:오렌지
  { darkH: 195, darkS: 55, lightH: 355, lightS: 65 }, // 다크:스카이   라이트:크림슨
  { darkH: 170, darkS: 50, lightH: 210, lightS: 60 }, // 다크:틸      라이트:스카이블루
] as const;
const PW = PALETTE.length;

interface Neuron {
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
  pulsePhase: number;
  pulseFreq: number;
  // 활성화 상태 (부드러운 전환용)
  activationSmooth: number;
}

// 시냅스를 따라 이동하는 전기 신호
interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0 → 1
  speed: number;
  colorIdx: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function smoothstep(x: number) { return x * x * (3 - 2 * x); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function responsiveCount(base: number): number {
  if (typeof window === 'undefined') return base;
  const w = window.innerWidth;
  if (w < 640) return Math.round(base * 0.35);
  if (w < 1024) return Math.round(base * 0.6);
  return base;
}

export function NeuralNetwork(props: NeuralNetworkConfig) {
  const cfg = { ...DEFAULTS, ...props };
  const burstDelay = props.burstDelay ?? 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<Neuron[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  const burstRef = useRef(burstDelay === 0);
  const cursor = useCursorPosition();
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const hiddenNeuronsRef = useRef(props.hiddenNeurons);
  const onActivateRef = useRef(props.onActivate);
  const clearWaveRef = useRef(props.clearWaveProgress ?? 0);
  const isClearedRef = useRef(props.isCleared ?? false);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    hiddenNeuronsRef.current = props.hiddenNeurons;
    onActivateRef.current = props.onActivate;
    clearWaveRef.current = props.clearWaveProgress ?? 0;
    isClearedRef.current = props.isCleared ?? false;
  }, [props.hiddenNeurons, props.onActivate, props.clearWaveProgress, props.isCleared]);

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

    const MAX_SIGNALS = 25;
    let signalCooldown = 0;

    const init = (w: number, h: number) => {
      const count = responsiveCount(cfg.count);

      // 그리드 기반 배치 — 화면 전체를 고르게 채움
      const aspect = w / h;
      const cols = Math.round(Math.sqrt(count * aspect));
      const rows = Math.round(count / cols);
      const cellW = w / cols;
      const cellH = h / rows;
      // 셀 내 랜덤 오프셋 범위 (셀 크기의 40%)
      const jitterX = cellW * 0.4;
      const jitterY = cellH * 0.4;

      const neurons: Neuron[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (neurons.length >= count) break;
          const cx = (col + 0.5) * cellW + rand(-jitterX, jitterX);
          const cy = (row + 0.5) * cellH + rand(-jitterY, jitterY);
          // 화면 밖으로 나가지 않도록 클램프
          const x = Math.max(4, Math.min(w - 4, cx));
          const y = Math.max(4, Math.min(h - 4, cy));
          neurons.push({
            homeX: x, homeY: y,
            x: burstDelay > 0 ? w / 2 + rand(-20, 20) : x,
            y: burstDelay > 0 ? h / 2 + rand(-20, 20) : y,
            vx: 0, vy: 0,
            size: rand(cfg.minSize, cfg.maxSize),
            colorIdx: Math.floor(rand(0, PW)),
            rawL: rand(0, 1),
            wanderAngle: rand(0, Math.PI * 2),
            wanderFreq: rand(0.002, 0.006),
            pulsePhase: rand(0, Math.PI * 2),
            pulseFreq: rand(0.006, 0.02),
            activationSmooth: 0,
          });
        }
      }
      neuronsRef.current = neurons;
      signalsRef.current = [];
    };

    const applySize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width = p.offsetWidth;
      canvas.height = p.offsetHeight;
      init(canvas.width, canvas.height);
    };
    applySize();
    const ro = new ResizeObserver(applySize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const ripples: Ripple[] = [];
    let newStars: {x: number; y: number; size: number; hue: number; phase: number; freq: number}[] = [];

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const hns = hiddenNeuronsRef.current;
      if (!hns) return;
      for (const hn of hns) {
        if (hn.activated) continue;
        const dx = hn.x - cx;
        const dy = hn.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 40) {
          onActivateRef.current?.(hn.id);
          ripples.push({ x: hn.x, y: hn.y, radius: 0, maxRadius: 200, alpha: 1 });
          break;
        }
      }
    };
    canvas.addEventListener('click', handleClick);

    // 커서가 히든 뉴런 위에 있을 때 pointer로 변경
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const hns = hiddenNeuronsRef.current;
      if (!hns) { canvas.style.cursor = 'default'; return; }

      let overHidden = false;
      for (const hn of hns) {
        if (hn.activated) continue;
        const dx = hn.x - cx;
        const dy = hn.y - cy;
        // 커서 힌트 범위 내에서 pointer 표시 (60px 이내)
        if (dx * dx + dy * dy < 60 * 60) {
          overHidden = true;
          break;
        }
      }
      canvas.style.cursor = overHidden ? 'pointer' : 'default';
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!burstRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      frameRef.current += 1;
      const frame = frameRef.current;
      const isDark = themeRef.current === 'dark';
      const neurons = neuronsRef.current;
      const signals = signalsRef.current;

      const rect = canvas.getBoundingClientRect();
      const mx = cursor.current.x - rect.left;
      const my = cursor.current.y - rect.top;
      const cursorIn = mx > -50 && mx < W + 50 && my > -50 && my < H + 50;

      // ── 블랙홀 중력 (물리 오버라이드) ────────────────────────────
      const cwp = clearWaveRef.current;
      if (cwp > 0.15 && cwp < 0.55) {
        const centerX = W / 2;
        const centerY = H / 2;
        const pullPhase = Math.min(1, (cwp - 0.15) / 0.3);
        const pullStrength = 0.01 + pullPhase * 0.12;
        for (const n of neurons) {
          n.vx += (centerX - n.x) * pullStrength;
          n.vy += (centerY - n.y) * pullStrength;
        }
      }

      // ── 물리 업데이트 ──────────────────────────────────────────
      for (const n of neurons) {
        n.wanderAngle += n.wanderFreq;
        n.vx += Math.cos(n.wanderAngle) * cfg.driftSpeed * 0.08;
        n.vy += Math.sin(n.wanderAngle) * cfg.driftSpeed * 0.08;

        n.vx += (n.homeX - n.x) * 0.005;
        n.vy += (n.homeY - n.y) * 0.005;

        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x += n.vx;
        n.y += n.vy;

        // 부드러운 활성화 전환
        let targetActivation = 0;
        if (cursorIn) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          targetActivation = smoothstep(Math.max(0, 1 - dist / cfg.cursorRadius));
        }
        n.activationSmooth += (targetActivation - n.activationSmooth) * 0.08;
      }

      // ── 커서 중심 아우라 (은은한 배경 글로우) ──────────────────
      if (cursorIn) {
        const auraR = cfg.cursorRadius * 0.7;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, auraR);
        const auraH = isDark ? 215 : 220;
        grad.addColorStop(0, `hsla(${auraH},50%,${isDark ? 60 : 50}%,0.03)`);
        grad.addColorStop(0.5, `hsla(${auraH},40%,${isDark ? 55 : 45}%,0.015)`);
        grad.addColorStop(1, `hsla(${auraH},30%,50%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, auraR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 시냅스 + 신호 + 뉴런 렌더링 (페이즈 3-4에서 억제) ──────
      const suppressNormalRendering = cwp >= 0.45;

      if (!suppressNormalRendering) {
      // ── 시냅스 (항상 희미하게 + 커서 근처에서 밝게) ──────────────
      const activeSynapses: [number, number, number][] = []; // [i, j, cursorFade]
      const linkSq = cfg.linkDistance * cfg.linkDistance;
      const cursorRSq = cfg.cursorRadius * cfg.cursorRadius;
      const BASE_LINE_ALPHA = isDark ? 0.04 : 0.035; // 항상 보이는 기본 연결선

      for (let i = 0; i < neurons.length; i++) {
        const a = neurons[i];

        for (let j = i + 1; j < neurons.length; j++) {
          const b = neurons[j];

          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          if (Math.abs(ddx) > cfg.linkDistance || Math.abs(ddy) > cfg.linkDistance) continue;
          const dSq = ddx * ddx + ddy * ddy;
          if (dSq > linkSq) continue;

          const dist = Math.sqrt(dSq);
          const linkFade = 1 - dist / cfg.linkDistance;

          // 커서 근접 부스트 계산
          let cursorFade = 0;
          if (cursorIn) {
            const dax = a.x - mx;
            const day = a.y - my;
            const daDistSq = dax * dax + day * day;
            const dbx = b.x - mx;
            const dby = b.y - my;
            const dbDistSq = dbx * dbx + dby * dby;

            if (daDistSq < cursorRSq && dbDistSq < cursorRSq) {
              const aDist = Math.sqrt(daDistSq);
              const bDist = Math.sqrt(dbDistSq);
              const avgCursorDist = (aDist + bDist) / 2;
              cursorFade = smoothstep(1 - avgCursorDist / cfg.cursorRadius);
            }
          }

          // 기본 알파 (항상) + 커서 부스트
          const baseAlpha = BASE_LINE_ALPHA * linkFade;
          const boostAlpha = cfg.synapseOpacity * linkFade * cursorFade;
          const alpha = baseAlpha + boostAlpha;
          if (alpha < 0.003) continue;

          if (cursorFade > 0.01) {
            activeSynapses.push([i, j, cursorFade]);
          }

          const ca = PALETTE[a.colorIdx];
          const cb = PALETTE[b.colorIdx];
          const hA = isDark ? ca.darkH : ca.lightH;
          const sA = isDark ? ca.darkS : ca.lightS;
          const hB = isDark ? cb.darkH : cb.lightH;
          const sB = isDark ? cb.darkS : cb.lightS;
          const lBase = isDark ? 65 : 50;

          // 시냅스 글로우 (커서 가까울 때만)
          if (cursorFade > 0.15) {
            const glowIntensity = cursorFade * boostAlpha;
            ctx.save();
            ctx.shadowBlur = 4 + cursorFade * 8;
            ctx.shadowColor = `hsla(${hA},${sA}%,${lBase + 10}%,${glowIntensity * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${hA},${sA}%,${lBase}%,${boostAlpha * 0.3})`;
            ctx.lineWidth = 0.8 + cursorFade * 1.0;
            ctx.stroke();
            ctx.restore();
          }

          // 시냅스 본체
          if (cursorFade > 0.05) {
            // 커서 근처: 그래디언트 시냅스
            const synGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            synGrad.addColorStop(0, `hsla(${hA},${sA}%,${lBase}%,${alpha})`);
            synGrad.addColorStop(0.5, `hsla(${lerp(hA, hB, 0.5)},${lerp(sA, sB, 0.5)}%,${lBase + 5}%,${alpha * 1.1})`);
            synGrad.addColorStop(1, `hsla(${hB},${sB}%,${lBase}%,${alpha})`);
            ctx.strokeStyle = synGrad;
          } else {
            // 기본: 단색 희미한 선
            ctx.strokeStyle = `hsla(${hA},${sA * 0.5}%,${lBase}%,${alpha})`;
          }

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineWidth = 0.3 + cursorFade * 0.8;
          ctx.stroke();
        }
      }

      // ── 전기 신호 생성 ─────────────────────────────────────────
      signalCooldown--;
      if (signalCooldown <= 0 && activeSynapses.length > 0 && signals.length < MAX_SIGNALS) {
        // 높은 cursorFade 값의 시냅스에서 우선 생성
        const sorted = activeSynapses.sort((a, b) => b[2] - a[2]);
        const pick = sorted[Math.floor(rand(0, Math.min(5, sorted.length)))];
        signals.push({
          fromIdx: pick[0],
          toIdx: pick[1],
          progress: 0,
          speed: rand(0.045, 0.1),
          colorIdx: neurons[pick[0]].colorIdx,
        });
        signalCooldown = Math.floor(rand(2, 6));
      }

      // ── 전기 신호 렌더링 & 업데이트 ───────────────────────────
      for (let si = signals.length - 1; si >= 0; si--) {
        const sig = signals[si];
        sig.progress += sig.speed;

        if (sig.progress > 1) {
          signals.splice(si, 1);
          continue;
        }

        const a = neurons[sig.fromIdx];
        const b = neurons[sig.toIdx];
        const sx = lerp(a.x, b.x, sig.progress);
        const sy = lerp(a.y, b.y, sig.progress);

        const c = PALETTE[sig.colorIdx];
        const h = isDark ? c.darkH : c.lightH;
        const s = isDark ? c.darkS : c.lightS;
        const l = isDark ? 80 : 65;

        // 신호의 밝기 — 중간에 가장 밝음
        const intensity = Math.sin(sig.progress * Math.PI);

        // 외부 글로우 (작게)
        const glowR = 3 + intensity * 3;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        grad.addColorStop(0, `hsla(${h},${s + 15}%,${l}%,${0.7 * intensity})`);
        grad.addColorStop(0.5, `hsla(${h},${s + 10}%,${l - 5}%,${0.2 * intensity})`);
        grad.addColorStop(1, `hsla(${h},${s}%,${l - 10}%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 밝은 코어 (작게)
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + intensity * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${s + 20}%,${Math.min(95, l + 15)}%,${0.9 * intensity})`;
        ctx.fill();

        // 꼬리 트레일 (짧고 작게)
        for (let ti = 1; ti <= 2; ti++) {
          const tp = sig.progress - 0.04 * ti;
          if (tp < 0) continue;
          const tx = lerp(a.x, b.x, tp);
          const ty = lerp(a.y, b.y, tp);
          const tAlpha = intensity * (1 - ti * 0.4) * 0.25;
          ctx.beginPath();
          ctx.arc(tx, ty, 0.4 + (1 - ti * 0.4) * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${h},${s + 10}%,${l}%,${tAlpha})`;
          ctx.fill();
        }
      }

      // ── 뉴런 렌더링 ─────────────────────────────────────────────
      for (const n of neurons) {
        const pulse = (Math.sin(frame * n.pulseFreq + n.pulsePhase) + 1) * 0.5;
        const pf = 0.6 + pulse * 0.4;
        const act = n.activationSmooth;

        const c = PALETTE[n.colorIdx];
        const h = isDark ? c.darkH : c.lightH;
        const sat = isDark ? c.darkS : c.lightS;
        const baseL = isDark ? 55 + n.rawL * 20 : 40 + n.rawL * 20;
        const l = baseL + act * 30;
        const alpha = (cfg.neuronOpacity * pf) + act * 0.7;
        const sz = n.size * (1 + act * 1.5) * (0.8 + pf * 0.2);

        // 3중 글로우 (활성화 시)
        if (act > 0.05) {
          // 레이어 3: 넓은 아우라
          if (act > 0.15) {
            const auraR = sz * 8;
            const grad3 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, auraR);
            grad3.addColorStop(0, `hsla(${h},${sat + 10}%,${l + 5}%,${act * 0.08})`);
            grad3.addColorStop(1, `hsla(${h},${sat}%,${l}%,0)`);
            ctx.fillStyle = grad3;
            ctx.beginPath();
            ctx.arc(n.x, n.y, auraR, 0, Math.PI * 2);
            ctx.fill();
          }

          // 레이어 2: 중간 헤일로
          const haloR = sz * 4.5;
          const grad2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
          grad2.addColorStop(0, `hsla(${h},${sat + 15}%,${l + 8}%,${act * 0.2})`);
          grad2.addColorStop(0.5, `hsla(${h},${sat + 10}%,${l + 3}%,${act * 0.08})`);
          grad2.addColorStop(1, `hsla(${h},${sat}%,${l}%,0)`);
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
          ctx.fill();

          // 레이어 1: 밝은 내부 글로우
          const innerR = sz * 2.5;
          const grad1 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, innerR);
          grad1.addColorStop(0, `hsla(${h},${sat + 20}%,${Math.min(95, l + 15)}%,${act * 0.45})`);
          grad1.addColorStop(0.6, `hsla(${h},${sat + 10}%,${l + 5}%,${act * 0.15})`);
          grad1.addColorStop(1, `hsla(${h},${sat}%,${l}%,0)`);
          ctx.fillStyle = grad1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, innerR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 코어
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(0.4, sz), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${sat + act * 20}%,${Math.min(95, l + act * 10)}%,${alpha})`;
        ctx.fill();

        // 하이라이트 스팟 (강한 활성화 시 중심에 밝은 점)
        if (act > 0.4) {
          const spotAlpha = (act - 0.4) * 1.2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, sz * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${h},${sat + 10}%,${Math.min(98, l + 25)}%,${spotAlpha})`;
          ctx.fill();
        }
      }
      } // end suppressNormalRendering

      // ── 히든 뉴런 렌더링 ───────────────────────────────────────
      const hns = hiddenNeuronsRef.current;
      if (hns && hns.length > 0) {
        const GOLD_HUE = 45;

        // 활성화된 뉴런 주변 일반 뉴런 상시 환하게
        const activatedHns = hns.filter(hn => hn.activated);
        const ACTIVATED_AURA_RADIUS = 200;
        for (const ahn of activatedHns) {
          for (const n of neurons) {
            const dx = n.x - ahn.x;
            const dy = n.y - ahn.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < ACTIVATED_AURA_RADIUS) {
              const boost = smoothstep(1 - dist / ACTIVATED_AURA_RADIUS) * 0.45;
              n.activationSmooth = Math.min(1, n.activationSmooth + boost);
            }
          }
        }

        // 활성화된 뉴런 간 연결선 (golden gradient + signal particles)
        if (activatedHns.length > 1) {
          const connPulse = (Math.sin(frame * 0.02) + 1) * 0.5;
          const connAlpha = 0.12 + connPulse * 0.1;
          const connWidth = 0.6 + connPulse * 0.6;

          for (let i = 0; i < activatedHns.length; i++) {
            for (let j = i + 1; j < activatedHns.length; j++) {
              const aH = activatedHns[i];
              const bH = activatedHns[j];

              // Golden gradient line
              const synGrad = ctx.createLinearGradient(aH.x, aH.y, bH.x, bH.y);
              synGrad.addColorStop(0, `hsla(${GOLD_HUE}, 90%, ${isDark ? 70 : 60}%, ${connAlpha})`);
              synGrad.addColorStop(0.5, `hsla(${GOLD_HUE + 5}, 95%, ${isDark ? 80 : 70}%, ${connAlpha * 1.3})`);
              synGrad.addColorStop(1, `hsla(${GOLD_HUE}, 90%, ${isDark ? 70 : 60}%, ${connAlpha})`);
              ctx.save();
              ctx.shadowBlur = 6;
              ctx.shadowColor = `hsla(${GOLD_HUE}, 90%, 70%, ${connAlpha * 0.5})`;
              ctx.strokeStyle = synGrad;
              ctx.lineWidth = connWidth;
              ctx.beginPath();
              ctx.moveTo(aH.x, aH.y);
              ctx.lineTo(bH.x, bH.y);
              ctx.stroke();
              ctx.restore();

              // Signal particles traveling between activated neurons
              const sigCount = 2;
              for (let si = 0; si < sigCount; si++) {
                const sigProg = ((frame * 0.008 + si * 0.5 + i * 0.3 + j * 0.7) % 1);
                const sx = lerp(aH.x, bH.x, sigProg);
                const sy = lerp(aH.y, bH.y, sigProg);
                const intensity = Math.sin(sigProg * Math.PI);
                const sigR = 2 + intensity * 1.5;
                const sigGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sigR);
                sigGrad.addColorStop(0, `hsla(${GOLD_HUE}, 95%, 90%, ${0.8 * intensity})`);
                sigGrad.addColorStop(0.5, `hsla(${GOLD_HUE}, 90%, 75%, ${0.3 * intensity})`);
                sigGrad.addColorStop(1, `hsla(${GOLD_HUE}, 85%, 65%, 0)`);
                ctx.fillStyle = sigGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, sigR, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        for (const hn of hns) {
          if (hn.activated) {
            // 활성화된 히든 뉴런: premium 3-layer radial glow
            const p1 = (Math.sin(frame * 0.015 + hn.id * 1.5) + 1) * 0.5;
            const p2 = (Math.sin(frame * 0.023 + hn.id * 0.8) + 1) * 0.5;
            const pulse = p1 * 0.7 + p2 * 0.3;
            const sz = 6 + pulse * 2;

            // Subtle radial light rays
            ctx.save();
            ctx.globalAlpha = 0.06 + pulse * 0.04;
            const rayCount = 12;
            for (let ri = 0; ri < rayCount; ri++) {
              const angle = (ri / rayCount) * Math.PI * 2 + frame * 0.003;
              const rayLen = sz * 6 + Math.sin(frame * 0.01 + ri * 1.2) * sz * 2;
              ctx.beginPath();
              ctx.moveTo(hn.x, hn.y);
              ctx.lineTo(hn.x + Math.cos(angle) * rayLen, hn.y + Math.sin(angle) * rayLen);
              ctx.strokeStyle = `hsla(${GOLD_HUE}, 90%, ${isDark ? 75 : 65}%, 1)`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
            ctx.restore();

            // Layer 3: outer aura
            const auraR = sz * 8;
            const grad3 = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, auraR);
            grad3.addColorStop(0, `hsla(${GOLD_HUE}, 90%, ${isDark ? 70 : 60}%, ${0.12 + pulse * 0.06})`);
            grad3.addColorStop(0.4, `hsla(${GOLD_HUE}, 85%, ${isDark ? 60 : 50}%, ${0.04 + pulse * 0.02})`);
            grad3.addColorStop(1, `hsla(${GOLD_HUE}, 80%, ${isDark ? 55 : 45}%, 0)`);
            ctx.fillStyle = grad3;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, auraR, 0, Math.PI * 2);
            ctx.fill();

            // Layer 2: mid halo
            const haloR = sz * 5;
            const grad2 = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, haloR);
            grad2.addColorStop(0, `hsla(${GOLD_HUE}, 92%, ${isDark ? 75 : 65}%, ${0.25 + pulse * 0.12})`);
            grad2.addColorStop(0.5, `hsla(${GOLD_HUE}, 88%, ${isDark ? 65 : 55}%, ${0.08 + pulse * 0.04})`);
            grad2.addColorStop(1, `hsla(${GOLD_HUE}, 85%, ${isDark ? 55 : 45}%, 0)`);
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, haloR, 0, Math.PI * 2);
            ctx.fill();

            // Layer 1: bright core glow
            const coreGlowR = sz * 2.5;
            const grad1 = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, coreGlowR);
            grad1.addColorStop(0, `hsla(${GOLD_HUE}, 95%, ${isDark ? 90 : 85}%, ${0.6 + pulse * 0.3})`);
            grad1.addColorStop(0.4, `hsla(${GOLD_HUE}, 92%, ${isDark ? 80 : 70}%, ${0.3 + pulse * 0.1})`);
            grad1.addColorStop(1, `hsla(${GOLD_HUE}, 88%, ${isDark ? 65 : 55}%, 0)`);
            ctx.fillStyle = grad1;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, coreGlowR, 0, Math.PI * 2);
            ctx.fill();

            // Solid core
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, sz * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${GOLD_HUE}, 95%, ${isDark ? 85 : 75}%, ${0.85 + pulse * 0.15})`;
            ctx.fill();

            // Inner highlight spot (near-white)
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, sz * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${GOLD_HUE}, 30%, 96%, ${0.7 + pulse * 0.3})`;
            ctx.fill();

          } else {
            // 비활성 히든 뉴런: premium hint system
            let hint = 0;
            let cursorDist = Infinity;
            if (cursorIn) {
              const dx = hn.x - mx;
              const dy = hn.y - my;
              cursorDist = Math.sqrt(dx * dx + dy * dy);
              if (cursorDist < 120) {
                hint = smoothstep(1 - cursorDist / 120);
              }
            }

            // Multi-wave breathing
            const breath1 = (Math.sin(frame * 0.008 + hn.id * 2.0) + 1) * 0.5;
            const breath2 = (Math.sin(frame * 0.013 + hn.id * 1.3) + 1) * 0.5;
            const breath3 = (Math.sin(frame * 0.005 + hn.id * 3.7) + 1) * 0.5;
            const breath = breath1 * 0.5 + breath2 * 0.3 + breath3 * 0.2;
            const baseHint = 0.04 + breath * 0.05;
            const totalHint = Math.max(baseHint, hint);

            if (totalHint > 0.01) {
              const r = 3 + totalHint * 4;

              // Outer soft aura
              const outerR = 20 + totalHint * 12;
              const gradOuter = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, outerR);
              gradOuter.addColorStop(0, `hsla(${GOLD_HUE}, 80%, ${isDark ? 65 : 55}%, ${totalHint * 0.15 + breath * 0.03})`);
              gradOuter.addColorStop(0.5, `hsla(${GOLD_HUE}, 75%, ${isDark ? 55 : 45}%, ${totalHint * 0.05})`);
              gradOuter.addColorStop(1, `hsla(${GOLD_HUE}, 70%, ${isDark ? 50 : 40}%, 0)`);
              ctx.fillStyle = gradOuter;
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, outerR, 0, Math.PI * 2);
              ctx.fill();

              // Inner bright pulse
              const innerR = r * 2.5;
              const gradInner = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, innerR);
              gradInner.addColorStop(0, `hsla(${GOLD_HUE}, 85%, ${isDark ? 75 : 65}%, ${totalHint * 0.4 + breath * 0.08})`);
              gradInner.addColorStop(0.6, `hsla(${GOLD_HUE}, 80%, ${isDark ? 60 : 50}%, ${totalHint * 0.12})`);
              gradInner.addColorStop(1, `hsla(${GOLD_HUE}, 75%, ${isDark ? 50 : 40}%, 0)`);
              ctx.fillStyle = gradInner;
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, innerR, 0, Math.PI * 2);
              ctx.fill();

              // Core dot
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, r, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${GOLD_HUE}, 85%, ${isDark ? 72 : 62}%, ${totalHint * 0.6 + breath * 0.1})`;
              ctx.fill();

              // Orbiting sparkle dots when cursor is close
              if (hint > 0.15 && cursorDist < 100) {
                const orbitCount = 5;
                const orbitR = r * 3 + hint * 8;
                for (let oi = 0; oi < orbitCount; oi++) {
                  const angle = (oi / orbitCount) * Math.PI * 2 + frame * 0.03 + hn.id;
                  const ox = hn.x + Math.cos(angle) * orbitR;
                  const oy = hn.y + Math.sin(angle) * orbitR;
                  const sparkleAlpha = hint * 0.6 * (0.5 + Math.sin(frame * 0.05 + oi * 1.8) * 0.5);
                  const sparkleR = 0.8 + hint * 1.0;
                  ctx.beginPath();
                  ctx.arc(ox, oy, sparkleR, 0, Math.PI * 2);
                  ctx.fillStyle = `hsla(${GOLD_HUE}, 90%, ${isDark ? 85 : 75}%, ${sparkleAlpha})`;
                  ctx.fill();
                }
              }
            }
          }
        }
      }

      // ── 리플 웨이브 렌더링 & 물리 ──────────────────────────────
      for (let ri = ripples.length - 1; ri >= 0; ri--) {
        const rip = ripples[ri];
        rip.radius += 6; // faster expansion
        rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
        if (rip.alpha <= 0) {
          ripples.splice(ri, 1);
          continue;
        }

        ctx.save();

        // Flash effect at origin (bright circle that fades)
        if (rip.radius < 40) {
          const flashAlpha = (1 - rip.radius / 40) * 0.5;
          const flashR = 8 + rip.radius * 0.3;
          const flashGrad = ctx.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, flashR);
          flashGrad.addColorStop(0, `hsla(45, 90%, 95%, ${flashAlpha})`);
          flashGrad.addColorStop(0.5, `hsla(45, 85%, 80%, ${flashAlpha * 0.5})`);
          flashGrad.addColorStop(1, `hsla(45, 80%, 70%, 0)`);
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, flashR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner bright ring
        ctx.shadowBlur = 8 + rip.alpha * 12;
        ctx.shadowColor = `hsla(45, 90%, 70%, ${rip.alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(45, 90%, ${isDark ? 75 : 60}%, ${rip.alpha * 0.4})`;
        ctx.lineWidth = 2 + rip.alpha * 3;
        ctx.stroke();

        // Outer soft ring
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius + 8 + rip.alpha * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(45, 80%, ${isDark ? 65 : 50}%, ${rip.alpha * 0.15})`;
        ctx.lineWidth = 3 + rip.alpha * 4;
        ctx.stroke();

        ctx.restore();

        // 근처 뉴런 부스트
        for (const n of neurons) {
          const dx = n.x - rip.x;
          const dy = n.y - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - rip.radius) < 35) {
            n.activationSmooth += 0.18;
          }
        }
      }

      // ── 클리어 웨이브 (4-phase epic sequence) ──────────────────
      const centerX = W / 2;
      const centerY = H / 2;

      if (cwp > 0) {
        const GOLD_CW = 45;

        // Phase 1 (0 → 0.15): Ripple Pulse — golden shockwave rings from hidden neurons
        if (cwp <= 0.15) {
          const phase1 = cwp / 0.15; // 0→1
          const hns = hiddenNeuronsRef.current;
          if (hns) {
            for (const hn of hns) {
              if (!hn.activated) continue;
              const ringR = phase1 * 150;
              const ringAlpha = (1 - phase1) * 0.4;
              ctx.save();
              ctx.shadowBlur = 12;
              ctx.shadowColor = `hsla(${GOLD_CW}, 90%, 70%, ${ringAlpha * 0.6})`;
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, ringR, 0, Math.PI * 2);
              ctx.strokeStyle = `hsla(${GOLD_CW}, 90%, 75%, ${ringAlpha})`;
              ctx.lineWidth = 2 + (1 - phase1) * 3;
              ctx.stroke();
              ctx.restore();
            }
          }
          // All neurons pulse brighter
          for (const n of neurons) {
            n.activationSmooth = Math.min(1, n.activationSmooth + phase1 * 0.03);
          }
        }

        // Phase 2 (0.15 → 0.45): Black Hole Formation
        if (cwp > 0.15 && cwp <= 0.45) {
          const phase2 = (cwp - 0.15) / 0.3; // 0→1
          const bhRadius = phase2 * 80;
          const bhAlpha = smoothstep(phase2);

          // Dark center
          ctx.beginPath();
          ctx.arc(centerX, centerY, bhRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${bhAlpha})`;
          ctx.fill();

          // Accretion disk (rotating gradient ring)
          for (let ring = 0; ring < 3; ring++) {
            const ringR = bhRadius + 10 + ring * 15;
            const ringAlpha = bhAlpha * (0.3 - ring * 0.08);
            const rotAngle = frame * 0.02 + ring * 0.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringR, rotAngle, rotAngle + Math.PI * 1.5);
            ctx.strokeStyle = `hsla(35, 80%, 60%, ${ringAlpha})`;
            ctx.lineWidth = 3 - ring * 0.5;
            ctx.stroke();
          }

          // Synapses stretch and brighten
          const brightR = Math.max(W, H) * (1 - phase2 * 0.3);
          const brightGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, brightR);
          brightGrad.addColorStop(0, `hsla(${GOLD_CW}, 80%, 70%, ${phase2 * 0.06})`);
          brightGrad.addColorStop(1, `hsla(${GOLD_CW}, 70%, 60%, 0)`);
          ctx.fillStyle = brightGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, brightR, 0, Math.PI * 2);
          ctx.fill();

          // Brighten neurons
          for (const n of neurons) {
            n.activationSmooth = Math.min(1, n.activationSmooth + phase2 * 0.04);
          }
        }

        // Phase 3 (0.45 → 0.55): Collapse & Flash
        if (cwp > 0.45 && cwp <= 0.55) {
          const phase3 = (cwp - 0.45) / 0.1; // 0→1

          // Massive golden glow at center
          const glowR = 120 + phase3 * 200;
          const glowAlpha = (1 - phase3 * 0.5) * 0.5;
          const cGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowR);
          cGrad.addColorStop(0, `hsla(${GOLD_CW}, 95%, ${isDark ? 90 : 85}%, ${glowAlpha})`);
          cGrad.addColorStop(0.3, `hsla(${GOLD_CW}, 90%, ${isDark ? 75 : 65}%, ${glowAlpha * 0.4})`);
          cGrad.addColorStop(1, `hsla(${GOLD_CW}, 80%, ${isDark ? 60 : 50}%, 0)`);
          ctx.fillStyle = cGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, glowR, 0, Math.PI * 2);
          ctx.fill();

          // WHITE FLASH — peaks at cwp ~0.52 (phase3 ~0.7), fades by cwp 0.55
          const flashCenter = 0.7;
          const flashDist = Math.abs(phase3 - flashCenter);
          const flashAlpha = Math.max(0, 1 - flashDist / 0.3) * 0.9;
          if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, W, H);
          }

          // Suppress all neurons
          for (const n of neurons) {
            n.activationSmooth = 0;
          }
        }

        // Phase 4 (0.55 → 1.0): New Universe — stars + aurora
        if (cwp > 0.55) {
          const phase4 = Math.min(1, (cwp - 0.55) / 0.2); // fade-in 0→1 over 0.55→0.75
          const fadeAlpha = smoothstep(phase4);

          // Generate stars once
          if (newStars.length === 0) {
            const starCount = 200 + Math.floor(Math.random() * 100);
            for (let i = 0; i < starCount; i++) {
              const hues = [45, 45, 45, 0, 0, 200, 200, 280]; // warm golds, whites, soft blues
              newStars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: 0.3 + Math.random() * 0.9,
                hue: hues[Math.floor(Math.random() * hues.length)],
                phase: Math.random() * Math.PI * 2,
                freq: 0.01 + Math.random() * 0.03,
              });
            }
          }

          // Render tiny stars with twinkle
          for (const star of newStars) {
            const twinkle = (Math.sin(frame * star.freq + star.phase) + 1) * 0.5;
            const starAlpha = fadeAlpha * (0.3 + twinkle * 0.7);
            const l = star.hue === 0 ? 95 : (star.hue === 200 ? 75 : 80);
            const s = star.hue === 0 ? 0 : 60;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${star.hue}, ${s}%, ${l}%, ${starAlpha})`;
            ctx.fill();
          }

          // Aurora effect — flowing gradient bands
          const auroraAlpha = fadeAlpha;
          for (let a = 0; a < 3; a++) {
            const auroraY = H * (0.2 + a * 0.25) + Math.sin(frame * 0.003 + a * 2) * 40;
            const hue = [45, 200, 280][a];
            const alpha = auroraAlpha * [0.04, 0.03, 0.025][a];

            ctx.beginPath();
            ctx.moveTo(0, auroraY);
            ctx.bezierCurveTo(
              W * 0.25, auroraY + Math.sin(frame * 0.005 + a) * 60,
              W * 0.75, auroraY - Math.sin(frame * 0.004 + a * 1.5) * 50,
              W, auroraY + Math.sin(frame * 0.006 + a * 0.7) * 30
            );
            ctx.lineTo(W, auroraY + 80);
            ctx.bezierCurveTo(
              W * 0.75, auroraY + 80 - Math.sin(frame * 0.004 + a * 1.5) * 40,
              W * 0.25, auroraY + 80 + Math.sin(frame * 0.005 + a) * 50,
              0, auroraY + 80
            );
            ctx.closePath();
            ctx.fillStyle = `hsla(${hue}, 60%, 55%, ${alpha})`;
            ctx.fill();
          }

          // Suppress normal neuron rendering
          for (const n of neurons) {
            n.activationSmooth = 0;
          }
        }
      }

      // ── 포스트 클리어: 뉴 유니버스 유지 ──────────────────────────
      if (isClearedRef.current && clearWaveRef.current >= 1) {
        // Keep rendering new universe (handled by Phase 4 above which runs when cwp > 0.55)
        // Suppress all normal neurons
        for (const n of neurons) {
          n.activationSmooth = 0;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
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
        pointerEvents: props.hiddenNeurons ? 'auto' : 'none',
        cursor: 'default',
      }}
    />
  );
}
