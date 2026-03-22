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
  holdActive?: boolean;
  onDeath?: () => void;
  onHoldProgress?: (intensity: number) => void;
  onHueChange?: (hue: number) => void;
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

interface BurstSpark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
}

interface Arc {
  x1: number; y1: number;
  x2: number; y2: number;
  life: number; maxLife: number;
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
  const holdActiveRef = useRef(props.holdActive ?? false);
  const onDeathRef = useRef(props.onDeath);
  const onHoldProgressRef = useRef(props.onHoldProgress);
  const onHueChangeRef = useRef(props.onHueChange);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    hiddenNeuronsRef.current = props.hiddenNeurons;
    onActivateRef.current = props.onActivate;
    clearWaveRef.current = props.clearWaveProgress ?? 0;
    isClearedRef.current = props.isCleared ?? false;
    holdActiveRef.current = props.holdActive ?? false;
    onDeathRef.current = props.onDeath;
    onHoldProgressRef.current = props.onHoldProgress;
    onHueChangeRef.current = props.onHueChange;
  }, [props.hiddenNeurons, props.onActivate, props.clearWaveProgress, props.isCleared, props.holdActive, props.onDeath, props.onHoldProgress, props.onHueChange]);

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

    let MAX_SIGNALS = 25;
    let signalCooldown = 0;
    const burstSparks: BurstSpark[] = [];
    const arcs: Arc[] = [];
    let clearBurstDone = false;

    // 포스트 클리어 인터랙션
    let hueOffset = 0; // 스크롤로 조절
    interface RClickConnection {
      fromIdx: number;
      toIdxs: number[];
      life: number;
      maxLife: number;
    }
    const rClickConns: RClickConnection[] = [];

    // 왼클릭 꾹 누르기: 발광 → 소멸
    let holdStartTime = 0; // 0이면 안 누르는 중
    let isDead = false; // 10초 후 암흑

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

    // 우클릭: 뉴런 연결 (클리어 후만) + 컨텍스트 메뉴 항상 차단
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (!isClearedRef.current || clearWaveRef.current < 1) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const neurons = neuronsRef.current;

      // 가장 가까운 뉴런 찾기
      let closest = -1;
      let closestDist = Infinity;
      for (let i = 0; i < neurons.length; i++) {
        const dx = neurons[i].x - cx;
        const dy = neurons[i].y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      }
      if (closest < 0 || closestDist > 80) return;

      // 근처 뉴런들 연결
      const connectRadius = 200;
      const toIdxs: number[] = [];
      const from = neurons[closest];
      for (let i = 0; i < neurons.length; i++) {
        if (i === closest) continue;
        const dx = neurons[i].x - from.x;
        const dy = neurons[i].y - from.y;
        if (Math.sqrt(dx * dx + dy * dy) < connectRadius) {
          toIdxs.push(i);
        }
      }
      if (toIdxs.length === 0) return;

      const life = 180; // 3초 (60fps)
      rClickConns.push({ fromIdx: closest, toIdxs, life, maxLife: life });

      // 불똥 버스트
      for (let s = 0; s < 20; s++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 3;
        const l = 30 + Math.random() * 30;
        burstSparks.push({
          x: from.x, y: from.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: l, maxLife: l,
        });
      }
      // 연결선 위에도 불똥
      for (const ti of toIdxs) {
        const to = neurons[ti];
        for (let s = 0; s < 5; s++) {
          const t = Math.random();
          const l = 20 + Math.random() * 20;
          burstSparks.push({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: l, maxLife: l,
          });
        }
      }
    };
    canvas.addEventListener('contextmenu', handleContextMenu);

    // 스크롤: hue 변경 (클리어 후만)
    const handleWheel = (e: WheelEvent) => {
      if (!isClearedRef.current || clearWaveRef.current < 1) return;
      hueOffset = (hueOffset + e.deltaY * 0.3) % 360;
      if (hueOffset < 0) hueOffset += 360;
      onHueChangeRef.current?.((45 + hueOffset) % 360);
    };
    canvas.addEventListener('wheel', handleWheel, { passive: true });

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

      const cwp = clearWaveRef.current;

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

      // ── 시냅스 (항상 희미하게 + 커서 근처에서 밝게) ──────────────
      const activeSynapses: [number, number, number][] = []; // [i, j, cursorFade]
      const linkSq = cfg.linkDistance * cfg.linkDistance;
      const cursorRSq = cfg.cursorRadius * cfg.cursorRadius;
      const allCleared = isClearedRef.current && cwp >= 1;
      const goldMode = isClearedRef.current && cwp > 0; // clearWave 시작부터 노란색
      const goldHue = (45 + hueOffset) % 360;
      const BASE_LINE_ALPHA = isDark
        ? (allCleared ? 0.08 : 0.04)
        : (allCleared ? 0.06 : 0.035);

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
          const hA = goldMode ? goldHue : (isDark ? ca.darkH : ca.lightH);
          const sA = goldMode ? 65 : (isDark ? ca.darkS : ca.lightS);
          const hB = goldMode ? goldHue : (isDark ? cb.darkH : cb.lightH);
          const sB = goldMode ? 65 : (isDark ? cb.darkS : cb.lightS);
          const lBase = isDark ? (goldMode ? 70 : 65) : 50;

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
      // 홀드 가속: 전기는 1~2초 만에 최고치, 발광은 10초까지 점진적
      let holdAccel = 0;
      if (holdStartTime > 0 && !isDead) {
        const hElapsed = (performance.now() - holdStartTime) / 1000;
        holdAccel = smoothstep(Math.min(hElapsed / 1.5, 1)); // 1.5초 만에 전기 최고치
      }
      const speedMult = 1 + holdAccel * 12; // 최대 13배속
      MAX_SIGNALS = goldMode ? Math.floor(50 + holdAccel * 500) : 25;
      signalCooldown--;

      // 홀드 중: 모든 시냅스에서 신호 대량 생성
      const sigGenCount = holdAccel > 0.01 ? Math.floor(3 + holdAccel * 35) : 1;
      for (let sg = 0; sg < sigGenCount; sg++) {
        if (signalCooldown > 0 && sg === 0) continue;
        if (signals.length >= MAX_SIGNALS) break;

        // 홀드 중이면 랜덤 시냅스에서도 생성
        if (holdAccel > 0.01 && neurons.length > 1) {
          const i = Math.floor(rand(0, neurons.length));
          let j = Math.floor(rand(0, neurons.length));
          if (j === i) j = (j + 1) % neurons.length;
          const dx = neurons[i].x - neurons[j].x;
          const dy = neurons[i].y - neurons[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < cfg.linkDistance) {
            signals.push({
              fromIdx: i, toIdx: j, progress: 0,
              speed: rand(0.06, 0.15) * speedMult,
              colorIdx: neurons[i].colorIdx,
            });
          }
        } else if (activeSynapses.length > 0) {
          const sorted = activeSynapses.sort((a, b) => b[2] - a[2]);
          const pick = sorted[Math.floor(rand(0, Math.min(5, sorted.length)))];
          signals.push({
            fromIdx: pick[0], toIdx: pick[1], progress: 0,
            speed: rand(0.045, 0.1) * speedMult,
            colorIdx: neurons[pick[0]].colorIdx,
          });
        }
        signalCooldown = goldMode
          ? Math.max(1, Math.floor(rand(1, 3) / speedMult))
          : Math.floor(rand(2, 6));
      }

      // ── 전기 신호 렌더링 & 업데이트 ───────────────────────────
      for (let si = signals.length - 1; si >= 0; si--) {
        const sig = signals[si];
        sig.progress += sig.speed * speedMult;

        if (sig.progress > 1) {
          signals.splice(si, 1);
          continue;
        }

        const a = neurons[sig.fromIdx];
        const b = neurons[sig.toIdx];
        const sx = lerp(a.x, b.x, sig.progress);
        const sy = lerp(a.y, b.y, sig.progress);

        const c = PALETTE[sig.colorIdx];
        const h = goldMode ? goldHue : (isDark ? c.darkH : c.lightH);
        const s = goldMode ? 70 : (isDark ? c.darkS : c.lightS);
        const l = isDark ? 80 : 65;

        // 신호의 밝기 — 중간에 가장 밝음
        const intensity = Math.sin(sig.progress * Math.PI);

        // 외부 글로우 (홀드 시 확대)
        const holdBoost = 1 + holdAccel * 1.5;
        const glowR = (3 + intensity * 3) * holdBoost;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        grad.addColorStop(0, `hsla(${h},${s + 15}%,${l}%,${(0.7 + holdAccel * 0.3) * intensity})`);
        grad.addColorStop(0.5, `hsla(${h},${s + 10}%,${l - 5}%,${(0.2 + holdAccel * 0.15) * intensity})`);
        grad.addColorStop(1, `hsla(${h},${s}%,${l - 10}%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 밝은 코어
        const coreR = (0.6 + intensity * 0.6) * holdBoost;
        ctx.beginPath();
        ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${s + 20}%,${Math.min(95, l + 15)}%,${0.9 * intensity})`;
        ctx.fill();

        // 꼬리 트레일 (홀드 시 더 길게)
        const trailCount = 2 + Math.floor(holdAccel * 3);
        for (let ti = 1; ti <= trailCount; ti++) {
          const tp = sig.progress - 0.03 * ti;
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
      const clearBoost = goldMode ? 0.15 : 0;
      for (const n of neurons) {
        const pulse = (Math.sin(frame * n.pulseFreq + n.pulsePhase) + 1) * 0.5;
        const pf = 0.6 + pulse * 0.4;
        const act = n.activationSmooth;

        const c = PALETTE[n.colorIdx];
        const h = goldMode ? goldHue : (isDark ? c.darkH : c.lightH);
        const sat = goldMode ? 65 : (isDark ? c.darkS : c.lightS);
        const baseL = isDark ? 55 + n.rawL * 20 : 40 + n.rawL * 20;
        const l = baseL + act * 30;
        const alpha = (cfg.neuronOpacity * pf) + act * 0.7 + clearBoost;
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
      // ── 히든 뉴런 렌더링 ───────────────────────────────────────
      const hns = hiddenNeuronsRef.current;
      if (hns && hns.length > 0) {
        const GOLD_HUE = goldHue;

        // 활성화된 뉴런 주변 일반 뉴런이 환하게 빛남 + 연결선 & 전기 신호
        const activatedHns = hns.filter(hn => hn.activated);
        const postClear = isClearedRef.current && cwp >= 1;
        const ACTIVATED_AURA_RADIUS = 400;
        const CONNECT_RADIUS = 180;

        for (const ahn of activatedHns) {
          // 커서와 이 노란 뉴런 사이의 거리
          let cursorProximity = 0;
          if (cursorIn) {
            const cdx = ahn.x - mx;
            const cdy = ahn.y - my;
            const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cDist < 250) {
              cursorProximity = smoothstep(1 - cDist / 250);
            }
          }

          for (const n of neurons) {
            const dx = n.x - ahn.x;
            const dy = n.y - ahn.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 넓은 범위 밝기 부스트
            if (dist < ACTIVATED_AURA_RADIUS) {
              const baseBoost = postClear ? 0.2 : 0.5;
              const cursorBoost = postClear ? cursorProximity * 0.4 : 0;
              const boost = smoothstep(1 - dist / ACTIVATED_AURA_RADIUS) * (baseBoost + cursorBoost);
              n.activationSmooth = Math.min(1, n.activationSmooth + boost);
            }

            // 가까운 뉴런과 연결선 (전기 공급 느낌)
            if (dist < CONNECT_RADIUS && dist > 5) {
              const linkFade = 1 - dist / CONNECT_RADIUS;
              const pulse = (Math.sin(frame * 0.02 + dist * 0.01) + 1) * 0.5;
              const baseAlpha = postClear
                ? linkFade * (0.12 + pulse * 0.06 + cursorProximity * 0.18)
                : linkFade * (0.08 + pulse * 0.06);

              ctx.beginPath();
              ctx.moveTo(ahn.x, ahn.y);
              ctx.lineTo(n.x, n.y);
              ctx.strokeStyle = `hsla(${GOLD_HUE}, 70%, ${isDark ? 65 : 55}%, ${baseAlpha})`;
              ctx.lineWidth = 0.5 + linkFade * 0.6;
              ctx.stroke();

              // 전기 신호 파티클 (커서 근처에서 더 빠르게)
              const speedMult = postClear ? (1 + cursorProximity * 3) : 1;
              const sigSpeed = (0.012 + linkFade * 0.008) * speedMult;
              const sigProg = ((frame * sigSpeed + ahn.id * 0.3 + dist * 0.005) % 1);
              const intensity = Math.sin(sigProg * Math.PI);
              if (intensity > 0.15) {
                const sx = lerp(ahn.x, n.x, sigProg);
                const sy = lerp(ahn.y, n.y, sigProg);
                const sigR = 1.5 + intensity * 1.2;
                const sigAlpha = postClear
                  ? (0.45 + cursorProximity * 0.5) * intensity * linkFade
                  : 0.5 * intensity * linkFade;
                const sigGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sigR * 2.5);
                sigGrad.addColorStop(0, `hsla(${GOLD_HUE}, 90%, 88%, ${sigAlpha})`);
                sigGrad.addColorStop(0.4, `hsla(${GOLD_HUE}, 85%, 75%, ${sigAlpha * 0.4})`);
                sigGrad.addColorStop(1, `hsla(${GOLD_HUE}, 80%, 65%, 0)`);
                ctx.fillStyle = sigGrad;
                ctx.beginPath();
                ctx.arc(sx, sy, sigR * 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // 노란 뉴런 페이드 비율 (일반 뉴런과 동시에 전환)
        const goldFade = (isClearedRef.current && cwp > 0.75)
          ? smoothstep(Math.min((cwp - 0.75) / 0.25, 1))
          : 0;

        for (const hn of hns) {
          if (hn.activated) {
            // 페이드 중이거나 완료: 작고 희미한 노란 뉴런으로 전환
            if (goldFade > 0) {
              // 커서 근접도 계산 (반짝임용)
              let cursorGlow = 0;
              if (cursorIn && goldFade >= 1) {
                const cdx = hn.x - mx;
                const cdy = hn.y - my;
                const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cDist < 200) {
                  cursorGlow = smoothstep(1 - cDist / 200);
                }
              }

              const breath = (Math.sin(frame * 0.008 + hn.id * 2.0) + 1) * 0.5;
              const sparkle = cursorGlow > 0
                ? (Math.sin(frame * 0.08 + hn.id * 3.1) + 1) * 0.5 * cursorGlow
                : 0;

              const dimR = 1.8 + breath * 0.5 + sparkle * 2.5;
              const dimAlpha = 0.18 + breath * 0.06 + sparkle * 0.5;

              // 활성 상태에서 dim 상태로 보간
              const p1 = (Math.sin(frame * 0.015 + hn.id * 1.5) + 1) * 0.5;
              const p2 = (Math.sin(frame * 0.023 + hn.id * 0.8) + 1) * 0.5;
              const pulse = p1 * 0.7 + p2 * 0.3;
              const fullSz = 6 + pulse * 2;

              const sz = lerp(fullSz, dimR, goldFade);
              const alpha = lerp(0.85 + pulse * 0.15, dimAlpha, goldFade);

              // Outer glow (페이드에 따라 축소, 커서 근처에서 반짝)
              const outerR = lerp(fullSz * 5, dimR * 4 + sparkle * 8, goldFade);
              const outerAlpha = lerp(0.25 + pulse * 0.12, dimAlpha * 0.6 + sparkle * 0.2, goldFade);
              const gradOuter = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, outerR);
              gradOuter.addColorStop(0, `hsla(${GOLD_HUE}, ${lerp(92, 40 + sparkle * 40, goldFade)}%, ${isDark ? lerp(75, 60 + sparkle * 15, goldFade) : lerp(65, 50 + sparkle * 15, goldFade)}%, ${outerAlpha})`);
              gradOuter.addColorStop(1, `hsla(${GOLD_HUE}, 80%, ${isDark ? 55 : 45}%, 0)`);
              ctx.fillStyle = gradOuter;
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, outerR, 0, Math.PI * 2);
              ctx.fill();

              // Core
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, sz * 0.8, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${GOLD_HUE}, ${lerp(95, 45 + sparkle * 40, goldFade)}%, ${isDark ? lerp(85, 65 + sparkle * 15, goldFade) : lerp(75, 55 + sparkle * 15, goldFade)}%, ${alpha})`;
              ctx.fill();
            } else {
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
            }

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

      // ── 우클릭 연결 렌더링 ──────────────────────────────────────
      for (let ci = rClickConns.length - 1; ci >= 0; ci--) {
        const conn = rClickConns[ci];
        conn.life--;
        if (conn.life <= 0) { rClickConns.splice(ci, 1); continue; }

        const alpha = conn.life / conn.maxLife;
        const fadeIn = Math.min(1, (conn.maxLife - conn.life) / 15);
        const intensity = Math.min(fadeIn, alpha);
        const from = neurons[conn.fromIdx];

        // 연결된 뉴런 밝기 부스트
        from.activationSmooth = Math.min(1, from.activationSmooth + intensity * 0.3);

        for (const ti of conn.toIdxs) {
          const to = neurons[ti];
          to.activationSmooth = Math.min(1, to.activationSmooth + intensity * 0.15);

          // 희미한 연결선
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = `hsla(${goldHue}, 60%, 65%, ${intensity * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // 전기 신호 (연결선 위를 이동하는 밝은 파티클)
          const sigCount = 2 + Math.floor(intensity);
          for (let si = 0; si < sigCount; si++) {
            const sigSpeed = 0.015 + si * 0.008;
            const sigProg = ((frame * sigSpeed + conn.fromIdx * 0.5 + ti * 0.3 + si * 0.33) % 1);
            const sigInt = Math.sin(sigProg * Math.PI);
            if (sigInt > 0.15) {
              const sx = from.x + (to.x - from.x) * sigProg;
              const sy = from.y + (to.y - from.y) * sigProg;
              // 지그재그 오프셋
              const jitter = Math.sin(frame * 0.15 + si * 2) * 3 * intensity;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const nx = -dy / len * jitter;
              const ny = dx / len * jitter;

              const sigR = 2 + sigInt * 2 * intensity;
              const sg = ctx.createRadialGradient(sx + nx, sy + ny, 0, sx + nx, sy + ny, sigR * 2.5);
              sg.addColorStop(0, `hsla(${goldHue}, 95%, 90%, ${sigInt * intensity * 0.8})`);
              sg.addColorStop(0.4, `hsla(${goldHue}, 90%, 75%, ${sigInt * intensity * 0.3})`);
              sg.addColorStop(1, `hsla(${goldHue}, 80%, 65%, 0)`);
              ctx.fillStyle = sg;
              ctx.beginPath();
              ctx.arc(sx + nx, sy + ny, sigR * 2.5, 0, Math.PI * 2);
              ctx.fill();

              // 밝은 코어
              ctx.beginPath();
              ctx.arc(sx + nx, sy + ny, sigR * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${goldHue}, 40%, 95%, ${sigInt * intensity * 0.9})`;
              ctx.fill();
            }
          }

          // 분기 갈래
          if (Math.random() < 0.3 * intensity) {
            const bx = from.x + (to.x - from.x) * (0.2 + Math.random() * 0.6);
            const by = from.y + (to.y - from.y) * (0.2 + Math.random() * 0.6);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (Math.random() - 0.5) * 15, by + (Math.random() - 0.5) * 15);
            ctx.strokeStyle = `hsla(${goldHue}, 85%, 80%, ${intensity * 0.4})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }

          // 지속적 불똥 (연결 유지 중)
          if (conn.life % 3 === 0 && Math.random() < 0.5) {
            const t = Math.random();
            const l = 15 + Math.random() * 15;
            burstSparks.push({
              x: from.x + (to.x - from.x) * t,
              y: from.y + (to.y - from.y) * t,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2 - 0.5,
              life: l, maxLife: l,
            });
          }
        }

        // from 뉴런에서 지속적 스파크
        if (conn.life % 2 === 0) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.3 + Math.random() * 1.5;
          const l = 15 + Math.random() * 15;
          burstSparks.push({
            x: from.x, y: from.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: l, maxLife: l,
          });
        }
      }

      // ── 클리어 버스트 불똥 & 아크 렌더링 ─────────────────────────
      // 불똥
      for (let si = burstSparks.length - 1; si >= 0; si--) {
        const s = burstSparks[si];
        s.x += s.vx; s.y += s.vy;
        s.vy += 0.03; s.vx *= 0.99;
        s.life--;
        if (s.life <= 0) { burstSparks.splice(si, 1); continue; }
        const a = s.life / s.maxLife;
        const r = 0.5 + a * 1.2;
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3);
        sg.addColorStop(0, `hsla(${goldHue}, 90%, 88%, ${a * 0.6})`);
        sg.addColorStop(1, `hsla(${goldHue}, 80%, 65%, 0)`);
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${goldHue}, 95%, 92%, ${a * 0.9})`;
        ctx.fill();
      }
      // 아크
      for (let ai = arcs.length - 1; ai >= 0; ai--) {
        const arc = arcs[ai];
        arc.life--;
        if (arc.life <= 0) { arcs.splice(ai, 1); continue; }
        const a = arc.life / arc.maxLife;
        // 매 프레임 랜덤 지그재그
        const segs = 5 + Math.floor(Math.random() * 4);
        for (let layer = 0; layer < 2; layer++) {
          ctx.beginPath();
          ctx.moveTo(arc.x1, arc.y1);
          for (let s = 1; s < segs; s++) {
            const t = s / segs;
            const jx = (Math.random() - 0.5) * 8;
            const jy = (Math.random() - 0.5) * 8;
            ctx.lineTo(
              arc.x1 + (arc.x2 - arc.x1) * t + jx,
              arc.y1 + (arc.y2 - arc.y1) * t + jy,
            );
          }
          ctx.lineTo(arc.x2, arc.y2);
          ctx.strokeStyle = layer === 0
            ? `hsla(${goldHue}, 90%, 75%, ${a * 0.6})`
            : `hsla(${goldHue}, 80%, 88%, ${a * 0.25})`;
          ctx.lineWidth = layer === 0 ? 1.0 : 0.4;
          ctx.stroke();
        }
      }

      // ── 클리어 시퀀스 ──────────────────────────────────────────
      if (cwp > 0) {
        // 버스트 이벤트 (1회): 모든 뉴런에서 불똥 + 아크
        if (!clearBurstDone) {
          clearBurstDone = true;
          for (const n of neurons) {
            // 불똥
            const count = 3 + Math.floor(Math.random() * 3);
            for (let s = 0; s < count; s++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 2;
              const life = 30 + Math.random() * 30;
              burstSparks.push({
                x: n.x, y: n.y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life, maxLife: life,
              });
            }
            // 펄스
            n.activationSmooth = 1;
          }
          // 근접 뉴런끼리 아크
          for (let i = 0; i < neurons.length; i++) {
            for (let j = i + 1; j < neurons.length; j++) {
              const dx = neurons[i].x - neurons[j].x;
              const dy = neurons[i].y - neurons[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < cfg.linkDistance * 0.8 && Math.random() < 0.3) {
                const life = 20 + Math.floor(Math.random() * 25);
                arcs.push({
                  x1: neurons[i].x, y1: neurons[i].y,
                  x2: neurons[j].x, y2: neurons[j].y,
                  life, maxLife: life,
                });
              }
            }
          }
        }

        // Phase 1 (0 → 0.25): 전체 연결망 밝게 (모든 뉴런 활성화, 체감되게)
        if (cwp <= 0.25) {
          const phase = smoothstep(cwp / 0.25);
          for (const n of neurons) {
            n.activationSmooth = Math.min(1, n.activationSmooth + phase * 0.35);
          }
        }

        // Phase 2 (0.25 → 0.75): 배경 딤 (워드마크+로고 강조)
        if (cwp > 0.2 && cwp <= 0.8) {
          let dimAlpha: number;
          if (cwp <= 0.35) {
            // 딤 페이드인
            dimAlpha = smoothstep((cwp - 0.2) / 0.15) * 0.7;
          } else if (cwp <= 0.65) {
            // 딤 유지
            dimAlpha = 0.7;
          } else {
            // 딤 페이드아웃
            dimAlpha = (1 - smoothstep((cwp - 0.65) / 0.15)) * 0.7;
          }
          ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
          ctx.fillRect(0, 0, W, H);
        }

        // Phase 3 (0.75 → 1.0): 배경 복귀, 뉴런 원래 밝기로
        if (cwp > 0.75) {
          const fadePhase = smoothstep((cwp - 0.75) / 0.25);
          for (const n of neurons) {
            n.activationSmooth *= (1 - fadePhase * 0.85);
          }
        }
      }

      // ── 포스트 클리어: 원래 배경 밝기 유지 ──────────────────────
      if (isClearedRef.current && cwp >= 1) {
        // 일반 뉴런은 원래대로 (추가 조정 없음)
      }

      // ── 왼클릭 꾹 누르기: 발광 → 소멸 ──────────────────────────
      // holdActiveRef로 시작/종료 감지
      if (holdActiveRef.current && holdStartTime === 0 && !isDead && allCleared) {
        holdStartTime = performance.now();
      } else if (!holdActiveRef.current && holdStartTime > 0) {
        holdStartTime = 0;
        onHoldProgressRef.current?.(0);
      }

      if (isDead) {
        // 암흑: 모든 것을 검은색으로 덮기
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, W, H);
      } else if (holdStartTime > 0) {
        const elapsed = (performance.now() - holdStartTime) / 1000;
        const maxGlow = 10;  // 10초에서 최고치
        const deathTime = 20; // 20초에서 소멸

        if (elapsed >= deathTime) {
          isDead = true;
          holdStartTime = 0;
          onDeathRef.current?.();
        } else if (elapsed > 0) {
          // 발광 강도 (0→10초: 점진적 증가)
          const glowPhase = Math.min(elapsed / maxGlow, 1);
          const overdrivePhase = elapsed > maxGlow ? (elapsed - maxGlow) / (deathTime - maxGlow) : 0;
          const intensity = smoothstep(glowPhase);
          onHoldProgressRef.current?.(intensity + overdrivePhase);

          // 모든 뉴런 발광
          for (const n of neurons) {
            n.activationSmooth = Math.min(1, n.activationSmooth + intensity * 0.6);
          }

          // 시냅스는 그대로 — 전기 신호 폭주로 연결 시각화

          // 스파크 생성 (5초부터 불꽃놀이 수준)
          const fireworkPhase = Math.max(0, (elapsed - 3) / 2); // 3초부터 올라가서 5초에 1.0
          const firework = smoothstep(Math.min(fireworkPhase, 1));
          const sparkRate = Math.floor(3 + holdAccel * 10 + firework * 25 + overdrivePhase * 50);
          for (let s = 0; s < sparkRate; s++) {
            const ni = Math.floor(Math.random() * neurons.length);
            const n = neurons[ni];
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * (1.5 + firework * 3 + overdrivePhase * 5);
            const life = 20 + Math.random() * (20 + firework * 20 + overdrivePhase * 25);
            burstSparks.push({
              x: n.x, y: n.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life, maxLife: life,
            });
          }

          // 뉴런 색상 밝아짐 (lightness 부스트)
          // goldHue 기반이라 이미 적용됨, activationSmooth로 밝기 증가

          // 오버드라이브: 뉴런 간 아크
          if (overdrivePhase > 0 && frame % 2 === 0) {
            const arcCount = Math.floor(1 + overdrivePhase * 8);
            for (let a = 0; a < arcCount; a++) {
              const i = Math.floor(Math.random() * neurons.length);
              const j = Math.floor(Math.random() * neurons.length);
              if (i === j) continue;
              const dx = neurons[i].x - neurons[j].x;
              const dy = neurons[i].y - neurons[j].y;
              if (Math.sqrt(dx * dx + dy * dy) < cfg.linkDistance * 1.5) {
                const life = 8 + Math.floor(Math.random() * 12);
                arcs.push({
                  x1: neurons[i].x, y1: neurons[i].y,
                  x2: neurons[j].x, y2: neurons[j].y,
                  life, maxLife: life,
                });
              }
            }
          }

          // 오버드라이브: 화면 전체 밝기 증가
          if (overdrivePhase > 0.2) {
            const whiteAlpha = (overdrivePhase - 0.2) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
            ctx.fillRect(0, 0, W, H);
          }

          // 소멸 직전: 확 밝아졌다가 → 급격한 암전 (시스템 다운)
          if (elapsed > 18) {
            const finalPhase = (elapsed - 18) / 2; // 18~20초
            if (finalPhase < 0.3) {
              // 순간 백색 섬광
              const flashAlpha = Math.sin((finalPhase / 0.3) * Math.PI) * 0.9;
              ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
              ctx.fillRect(0, 0, W, H);
            } else {
              // 급격한 암전
              const darkPhase = smoothstep((finalPhase - 0.3) / 0.7);
              ctx.fillStyle = `rgba(0, 0, 0, ${darkPhase})`;
              ctx.fillRect(0, 0, W, H);
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
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
