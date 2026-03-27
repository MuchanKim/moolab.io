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

// 뉴럴 팔레트 — 다크: 순백색 통일, 라이트: 빨파노주
const PALETTE = [
  { darkH: 0, darkS: 0, lightH: 0,   lightS: 70 }, // 다크:흰색  라이트:레드
  { darkH: 0, darkS: 0, lightH: 220, lightS: 65 }, // 다크:흰색  라이트:블루
  { darkH: 0, darkS: 0, lightH: 50,  lightS: 75 }, // 다크:흰색  라이트:옐로
  { darkH: 0, darkS: 0, lightH: 25,  lightS: 72 }, // 다크:흰색  라이트:오렌지
  { darkH: 0, darkS: 0, lightH: 355, lightS: 65 }, // 다크:흰색  라이트:크림슨
  { darkH: 0, darkS: 0, lightH: 210, lightS: 60 }, // 다크:흰색  라이트:스카이블루
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

interface NebulaCloud {
  x: number; y: number; r: number;
  a: number; targetA: number; growSpeed: number;
  dx: number; dy: number; hue: number;
  life: number; decay: number;
}

interface LightMote {
  x: number; y: number; vx: number; vy: number;
  sz: number; life: number; decay: number; phase: number;
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
    const nebulaClouds: NebulaCloud[] = [];
    const lightMotes: LightMote[] = [];
    const activateFrames = new Map<number, number>(); // hn.id → frame

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
          activateFrames.set(hn.id, frameRef.current);
          ripples.push({ x: hn.x, y: hn.y, radius: 0, maxRadius: 200, alpha: 1 });
          // Nebula Bloom: 성운 구름
          for (let nc = 0; nc < 8; nc++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 40;
            nebulaClouds.push({
              x: hn.x + Math.cos(angle) * dist,
              y: hn.y + Math.sin(angle) * dist,
              r: 20 + Math.random() * 35,
              a: 0, targetA: 0.02 + Math.random() * 0.04,
              growSpeed: 0.001 + Math.random() * 0.002,
              dx: Math.cos(angle) * (0.02 + Math.random() * 0.06),
              dy: Math.sin(angle) * (0.02 + Math.random() * 0.06),
              hue: 220 + Math.random() * 40,
              life: 1, decay: 0.001 + Math.random() * 0.002,
            });
          }
          // 빛 먼지
          for (let lm = 0; lm < 20; lm++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 35;
            lightMotes.push({
              x: hn.x + Math.cos(angle) * dist,
              y: hn.y + Math.sin(angle) * dist,
              vx: Math.cos(angle) * (0.05 + Math.random() * 0.25),
              vy: Math.sin(angle) * (0.05 + Math.random() * 0.25),
              sz: 0.2 + Math.random() * 0.3,
              life: 1, decay: 0.002 + Math.random() * 0.006,
              phase: Math.random() * Math.PI * 2,
            });
          }
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

        // 부드러운 활성화 전환 (다크모드에서는 커서 기반 활성화 비활성)
        let targetActivation = 0;
        if (cursorIn && !isDark) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          targetActivation = smoothstep(Math.max(0, 1 - dist / cfg.cursorRadius));
        }
        n.activationSmooth += (targetActivation - n.activationSmooth) * 0.08;
      }

      // ── 커서 중심 아우라 (라이트모드만) ──────────────────
      if (cursorIn && !isDark) {
        const auraR = cfg.cursorRadius * 0.7;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, auraR);
        grad.addColorStop(0, `hsla(220,50%,50%,0.03)`);
        grad.addColorStop(0.5, `hsla(220,40%,45%,0.015)`);
        grad.addColorStop(1, `hsla(220,30%,50%,0)`);
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
      const goldMode = isClearedRef.current && cwp > 0;
      const goldHue = 0; // white-based (achromatic)
      const BASE_LINE_ALPHA = isDark
        ? (allCleared ? 0.08 : 0.04)
        : (allCleared ? 0.06 : 0.035);

      // 다크모드: 시냅스 + 일반 뉴런 렌더링 스킵 (히든 별만 렌더링)
      const skipNeuronRender = isDark;

      for (let i = 0; i < neurons.length && !skipNeuronRender; i++) {
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
          const hA = goldMode ? 0 : (isDark ? ca.darkH : ca.lightH);
          const sA = goldMode ? 0 : (isDark ? ca.darkS : ca.lightS);
          const hB = goldMode ? 0 : (isDark ? cb.darkH : cb.lightH);
          const sB = goldMode ? 0 : (isDark ? cb.darkS : cb.lightS);
          const lBase = isDark ? (goldMode ? 80 : 65) : 50;

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

      // 홀드 중에만 신호 생성 (평상시에는 전기 신호 없음)
      const sigGenCount = holdAccel > 0.01 ? Math.floor(3 + holdAccel * 35) : 0;
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
      for (let si = signals.length - 1; si >= 0 && !skipNeuronRender; si--) {
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
        const h = goldMode ? 0 : (isDark ? c.darkH : c.lightH);
        const s = goldMode ? 0 : (isDark ? c.darkS : c.lightS);
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

      // ── 뉴런 렌더링 (다크모드 스킵) ──────────────────────────────
      const clearBoost = goldMode ? 0.15 : 0;
      for (const n of skipNeuronRender ? [] : neurons) {
        const pulse = (Math.sin(frame * n.pulseFreq + n.pulsePhase) + 1) * 0.5;
        const pf = 0.6 + pulse * 0.4;
        const act = n.activationSmooth;

        const c = PALETTE[n.colorIdx];
        const h = goldMode ? 0 : (isDark ? c.darkH : c.lightH);
        const sat = goldMode ? 0 : (isDark ? c.darkS : c.lightS);
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
      // ── 히든 뉴런 렌더링 (Supernova style) ────────────────────
      const hns = hiddenNeuronsRef.current;
      if (hns && hns.length > 0) {
        const activatedHns = hns.filter(hn => hn.activated);
        const postClear = isClearedRef.current && cwp >= 1;

        // 활성화된 뉴런 주변 일반 뉴런 밝기 부스트
        for (const ahn of activatedHns) {
          // white glow for hidden neurons
          const hnH = 0;
          const hnS = 0;

          for (const n of neurons) {
            const dx = n.x - ahn.x;
            const dy = n.y - ahn.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 300) {
              const boost = smoothstep(1 - dist / 300) * (postClear ? 0.2 : 0.4);
              n.activationSmooth = Math.min(1, n.activationSmooth + boost);
            }
          }
        }

        for (const hn of hns) {
          // 각 히든 뉴런은 일반 별과 같은 팔레트 색상 사용
          const _hnColor2 = PALETTE[hn.id % PW];
          const hh = 0;
          const hs = 0;
          const hl = isDark ? 85 : 70;

          if (hn.activated) {
            // ── 활성화된 히든 별: Soft Bloom ──
            const af = activateFrames.get(hn.id) ?? 0;
            const activateAge = af > 0
              ? Math.min(1, (frame - af) / 80)
              : 1;
            const eased = 1 - Math.pow(1 - activateAge, 3); // ease-out

            const p1 = (Math.sin(frame * 0.015 + hn.id * 1.5) + 1) * 0.5;
            const p2 = (Math.sin(frame * 0.023 + hn.id * 0.8) + 1) * 0.5;
            const pulse = p1 * 0.7 + p2 * 0.3;
            let sz = 1 + eased * 3;

            // Clear wave: 다크모드 수축 소멸 / 라이트모드 기존
            const clearFade = (isClearedRef.current && cwp > 0.75)
              ? smoothstep(Math.min((cwp - 0.75) / 0.25, 1)) : 0;
            const shrinkScale = isDark ? Math.max(0, 1 - clearFade) : 1;
            const intensity = isDark
              ? eased * shrinkScale
              : (1 - clearFade * 0.6) * eased;
            if (isDark && shrinkScale < 0.01) continue; // 완전 소멸 시 스킵
            if (isDark) sz *= shrinkScale; // 수축

            // Wide bloom
            const bloomR = sz * 7 + pulse * 4;
            const bloomGrad = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, bloomR);
            bloomGrad.addColorStop(0, `hsla(0, 0%, 88%, ${intensity * 0.15 + pulse * 0.03})`);
            bloomGrad.addColorStop(0.3, `hsla(0, 0%, 80%, ${intensity * 0.06})`);
            bloomGrad.addColorStop(0.7, `hsla(0, 0%, 75%, ${intensity * 0.02})`);
            bloomGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = bloomGrad;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, bloomR, 0, Math.PI * 2);
            ctx.fill();

            // Mid glow
            const midR = sz * 3.5;
            const midGrad = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, midR);
            midGrad.addColorStop(0, `hsla(0, 0%, 92%, ${intensity * 0.25 + pulse * 0.05})`);
            midGrad.addColorStop(0.5, `hsla(0, 0%, 85%, ${intensity * 0.08})`);
            midGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = midGrad;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, midR, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, sz * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(0, 0%, ${87 + pulse * 8}%, ${intensity * 0.8})`;
            ctx.fill();

            // White-hot center
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, sz * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(0, 0%, 97%, ${intensity * 0.5})`;
            ctx.fill();

          } else {
            // ── 비활성 히든 별: 주변 별보다 살짝 밝은 점 ──
            let hint = 0;
            if (cursorIn) {
              const dx = hn.x - mx;
              const dy = hn.y - my;
              const cursorDist = Math.sqrt(dx * dx + dy * dy);
              if (cursorDist < 140) {
                hint = smoothstep(1 - cursorDist / 140);
              }
            }

            const breath1 = (Math.sin(frame * 0.008 + hn.id * 2.0) + 1) * 0.5;
            const breath2 = (Math.sin(frame * 0.013 + hn.id * 1.3) + 1) * 0.5;
            const breath = breath1 * 0.6 + breath2 * 0.4;

            // 미세한 글로우 (커서 가까울 때만)
            if (hint > 0.1) {
              const glowR = 3 + hint * 6;
              const glowGrad = ctx.createRadialGradient(hn.x, hn.y, 0, hn.x, hn.y, glowR);
              glowGrad.addColorStop(0, `hsla(0,0%,90%,${hint * 0.2})`);
              glowGrad.addColorStop(1, 'transparent');
              ctx.fillStyle = glowGrad;
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, glowR, 0, Math.PI * 2);
              ctx.fill();
            }

            // 코어: 작은 점 (0.4~0.7px) — 주변 별(0.1~0.35)보다 살짝 큼
            const baseAlpha = 0.15 + breath * 0.1 + hint * 0.5;
            const r = 0.4 + hint * 0.3;
            ctx.beginPath();
            ctx.arc(hn.x, hn.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(0,0%,${85 + hint * 10}%,${baseAlpha})`;
            ctx.fill();

            // 커서 hover 시 살짝 밝은 중심
            if (hint > 0.3) {
              ctx.beginPath();
              ctx.arc(hn.x, hn.y, r * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${hh},12%,95%,${hint * 0.5})`;
              ctx.fill();
            }
          }
        }
      }

      // ── 리플 웨이브 렌더링 & 물리 ──────────────────────────────
      for (let ri = ripples.length - 1; ri >= 0; ri--) {
        const rip = ripples[ri];
        rip.radius += 6;
        rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
        if (rip.alpha <= 0) {
          ripples.splice(ri, 1);
          continue;
        }

        // 다크모드: 리플 렌더링 스킵 (Nebula Bloom으로 대체)
        if (!isDark) {
          ctx.save();

          if (rip.radius < 40) {
            const flashAlpha = (1 - rip.radius / 40) * 0.5;
            const flashR = 8 + rip.radius * 0.3;
            const flashGrad = ctx.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, flashR);
            flashGrad.addColorStop(0, `hsla(0, 0%, 97%, ${flashAlpha})`);
            flashGrad.addColorStop(0.5, `hsla(0, 0%, 90%, ${flashAlpha * 0.5})`);
            flashGrad.addColorStop(1, `hsla(0, 0%, 80%, 0)`);
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(rip.x, rip.y, flashR, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.shadowBlur = 8 + rip.alpha * 12;
          ctx.shadowColor = `hsla(0, 0%, 85%, ${rip.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(0, 0%, 70%, ${rip.alpha * 0.4})`;
          ctx.lineWidth = 2 + rip.alpha * 3;
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius + 8 + rip.alpha * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(0, 0%, 60%, ${rip.alpha * 0.15})`;
          ctx.lineWidth = 3 + rip.alpha * 4;
          ctx.stroke();

          ctx.restore();
        }
      }

      // ── Nebula Bloom 렌더링 ──────────────────────────────────────
      for (let ni = nebulaClouds.length - 1; ni >= 0; ni--) {
        const cl = nebulaClouds[ni];
        cl.a = Math.min(cl.targetA, cl.a + cl.growSpeed);
        cl.x += cl.dx; cl.y += cl.dy; cl.r += 0.02;
        cl.life -= cl.decay;
        if (cl.life <= 0) { nebulaClouds.splice(ni, 1); continue; }
        const alpha = cl.a * cl.life;
        const g = ctx.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r);
        g.addColorStop(0, `hsla(${cl.hue}, 12%, 50%, ${alpha})`);
        g.addColorStop(0.5, `hsla(${cl.hue}, 8%, 40%, ${alpha * 0.4})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2); ctx.fill();
      }

      for (let mi = lightMotes.length - 1; mi >= 0; mi--) {
        const m = lightMotes[mi];
        m.x += m.vx + Math.sin(frame * 0.01 + m.phase) * 0.05;
        m.y += m.vy + Math.cos(frame * 0.012 + m.phase) * 0.05;
        m.life -= m.decay;
        if (m.life <= 0) { lightMotes.splice(mi, 1); continue; }
        const twinkle = (Math.sin(frame * 0.03 + m.phase) + 1) * 0.5;
        const a = m.life * (0.3 + twinkle * 0.3);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.sz * m.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 88%, ${a})`; ctx.fill();
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
          ctx.strokeStyle = `hsla(0, 0%, 75%, ${intensity * 0.06})`;
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
              sg.addColorStop(0, `hsla(0, 0%, 95%, ${sigInt * intensity * 0.8})`);
              sg.addColorStop(0.4, `hsla(0, 0%, 85%, ${sigInt * intensity * 0.3})`);
              sg.addColorStop(1, `hsla(0, 0%, 75%, 0)`);
              ctx.fillStyle = sg;
              ctx.beginPath();
              ctx.arc(sx + nx, sy + ny, sigR * 2.5, 0, Math.PI * 2);
              ctx.fill();

              // 밝은 코어
              ctx.beginPath();
              ctx.arc(sx + nx, sy + ny, sigR * 0.4, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(0, 0%, 97%, ${sigInt * intensity * 0.9})`;
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
            ctx.strokeStyle = `hsla(0, 0%, 90%, ${intensity * 0.4})`;
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
        sg.addColorStop(0, `hsla(0, 0%, 93%, ${a * 0.6})`);
        sg.addColorStop(1, `hsla(0, 0%, 75%, 0)`);
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 96%, ${a * 0.9})`;
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
            ? `hsla(0, 0%, 85%, ${a * 0.6})`
            : `hsla(0, 0%, 93%, ${a * 0.25})`;
          ctx.lineWidth = layer === 0 ? 1.0 : 0.4;
          ctx.stroke();
        }
      }

      // ── 클리어 시퀀스 ──────────────────────────────────────────
      if (cwp > 0) {
        if (!clearBurstDone) {
          clearBurstDone = true;

          if (isDark) {
            // 다크모드: 클리어 버스트 없음 (Starfield opacity 전환이 임팩트)
          } else {
            // 라이트모드: 기존 버스트
            for (const n of neurons) {
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
              n.activationSmooth = 1;
            }
          }
        }

        if (!isDark) {
          // 라이트모드: 기존 Phase 1
          if (cwp <= 0.25) {
            const phase = smoothstep(cwp / 0.25);
            for (const n of neurons) {
              n.activationSmooth = Math.min(1, n.activationSmooth + phase * 0.35);
            }
          }
        }

        // Phase 2 (0.25 → 0.75): 배경 딤 (라이트모드만)
        if (!isDark && cwp > 0.2 && cwp <= 0.8) {
          let dimAlpha: number;
          if (cwp <= 0.35) {
            dimAlpha = smoothstep((cwp - 0.2) / 0.15) * 0.7;
          } else if (cwp <= 0.65) {
            dimAlpha = 0.7;
          } else {
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
