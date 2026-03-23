'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

// ─── 공통 ────────────────────────────────────────────────────────────────────
const MD_BREAKPOINT = 768;

// ─── PullCord 상수 ───────────────────────────────────────────────────────────
const CORD_BASE_LENGTH = 44;
const TOGGLE_THRESHOLD = 80;
const SNAP_THRESHOLD = 160;
const SPRING_STIFFNESS = 0.15;
const SPRING_DAMPING = 0.7;
const GRAVITY = 1.8;

// ─── 음양 다이얼 (모바일) ─────────────────────────────────────────────────────

function RotaryDial() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  // 라이트 → 바늘이 흰색 쪽(위), 다크 → 바늘이 검정 쪽(아래)
  const [rotation, setRotation] = useState(isLight ? 0 : 180);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    setRotation(isLight ? 0 : 180);
  }, [isLight]);

  const handleClick = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setRotation((r) => r + 180);
    setTimeout(() => {
      toggle();
      setTimeout(() => setSpinning(false), 200);
    }, 150);
  }, [toggle, spinning]);

  const SIZE = 38;
  const R = SIZE / 2;
  const TICK_COUNT = 12;

  return (
    <div
      data-pullcord
      style={{
        position: 'fixed',
        bottom: 24,
        right: 20,
        zIndex: 100,
      }}
    >
      <button
        onClick={handleClick}
        aria-label="Toggle dark mode"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background: 'transparent',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: isLight
            ? '0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(0,0,0,0.06), inset 0 0 0 0.5px rgba(255,255,255,0.5)'
            : '0 1px 3px rgba(0,0,0,0.3), 0 4px 14px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(255,255,255,0.12)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ display: 'block' }}
        >
          <defs>
            <clipPath id="dial-clip">
              <circle cx={R} cy={R} r={R} />
            </clipPath>
            {/* 밝은 면 — 반투명 */}
            <linearGradient id="light-half" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgba(255,255,255,${isLight ? 0.7 : 0.35})`} />
              <stop offset="100%" stopColor={`rgba(240,240,240,${isLight ? 0.6 : 0.25})`} />
            </linearGradient>
            {/* 어두운 면 — 우주 딥스페이스 */}
            <linearGradient id="dark-half" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor={`rgba(15,10,35,${isLight ? 0.65 : 0.35})`} />
              <stop offset="50%" stopColor={`rgba(8,8,24,${isLight ? 0.6 : 0.3})`} />
              <stop offset="100%" stopColor={`rgba(3,3,15,${isLight ? 0.6 : 0.3})`} />
            </linearGradient>
            {/* 성운 글로우 */}
            <radialGradient id="nebula-glow" cx="30%" cy="60%" r="45%">
              <stop offset="0%" stopColor="rgba(80,60,180,0.15)" />
              <stop offset="50%" stopColor="rgba(40,80,160,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            {/* 바늘 그림자 */}
            <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodColor="rgba(0,0,0,0.25)" />
            </filter>
            {/* 유리 하이라이트 */}
            <radialGradient id="glass-sheen" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* 가장자리 반사광 */}
            <radialGradient id="edge-light" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </radialGradient>
          </defs>

          {/* 다이얼 본체 */}
          <g clipPath="url(#dial-clip)">
            {/* 밝은 반 (위) */}
            <rect x="0" y="0" width={SIZE} height={R} fill="url(#light-half)" />
            {/* 어두운 반 (아래) — 딥스페이스 */}
            <rect x="0" y={R} width={SIZE} height={R} fill="url(#dark-half)" />
            {/* 성운 */}
            <circle cx={R} cy={R} r={R} fill="url(#nebula-glow)" />
            {/* 별들 — 밝은 별, 희미한 별, 푸른 별 섞어서 */}
            {[
              { cx: 5, cy: R + 3, r: 0.5, o: 1, c: '255,255,255' },
              { cx: 11, cy: R + 7, r: 0.35, o: 0.7, c: '255,255,255' },
              { cx: 8, cy: R + 1.5, r: 0.25, o: 0.45, c: '200,210,255' },
              { cx: 18, cy: R + 9, r: 0.55, o: 0.95, c: '255,255,255' },
              { cx: 25, cy: R + 2.5, r: 0.3, o: 0.6, c: '180,200,255' },
              { cx: 30, cy: R + 6, r: 0.5, o: 0.85, c: '255,255,255' },
              { cx: 33, cy: R + 4, r: 0.25, o: 0.5, c: '220,230,255' },
              { cx: 15, cy: R + 5, r: 0.3, o: 0.65, c: '255,255,255' },
              { cx: 21, cy: R + 5.5, r: 0.4, o: 0.75, c: '200,210,255' },
              { cx: 28, cy: R + 10, r: 0.3, o: 0.55, c: '255,255,255' },
              { cx: 7, cy: R + 10, r: 0.4, o: 0.8, c: '255,255,255' },
              { cx: 35, cy: R + 1.5, r: 0.2, o: 0.4, c: '180,200,255' },
              { cx: 13, cy: R + 11, r: 0.3, o: 0.5, c: '255,255,255' },
              { cx: 23, cy: R + 1, r: 0.2, o: 0.35, c: '220,230,255' },
              { cx: 31, cy: R + 11, r: 0.45, o: 0.7, c: '255,255,255' },
              { cx: 19, cy: R + 2, r: 0.2, o: 0.3, c: '200,210,255' },
              { cx: 10, cy: R + 4.5, r: 0.15, o: 0.25, c: '255,255,255' },
              { cx: 27, cy: R + 7, r: 0.2, o: 0.35, c: '180,200,255' },
            ].map((s, i) => (
              <circle key={`star-${i}`} cx={s.cx} cy={s.cy} r={s.r} fill={`rgba(${s.c},${s.o})`} />
            ))}
            {/* 유리 하이라이트 오버레이 */}
            <circle cx={R} cy={R} r={R} fill="url(#glass-sheen)" />
            {/* 가장자리 반사 */}
            <circle cx={R} cy={R} r={R} fill="url(#edge-light)" />
          </g>

          {/* 눈금 마커 */}
          {Array.from({ length: TICK_COUNT }).map((_, i) => {
            const angle = (i * 360) / TICK_COUNT - 90;
            const rad = (angle * Math.PI) / 180;
            const isCardinal = i % 3 === 0;
            const outerR = R - 1.5;
            const innerR = isCardinal ? R - 5 : R - 4;
            const inTopHalf = i <= 3 || i >= 9;
            return (
              <line
                key={i}
                x1={R + innerR * Math.cos(rad)}
                y1={R + innerR * Math.sin(rad)}
                x2={R + outerR * Math.cos(rad)}
                y2={R + outerR * Math.sin(rad)}
                stroke={inTopHalf ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isCardinal ? 1.5 : 0.8}
                strokeLinecap="round"
              />
            );
          })}

          {/* 바늘 그룹 — 회전 */}
          <g
            style={{
              transformOrigin: `${R}px ${R}px`,
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            filter="url(#needle-shadow)"
          >
            {/* 바늘 본체 (테이퍼드) */}
            <polygon
              points={`${R - 1},${R} ${R + 1},${R} ${R + 0.35},${6.5} ${R - 0.35},${6.5}`}
              fill="rgba(229,57,53,0.9)"
            />
            {/* 바늘 꼬리 (짧은 카운터웨이트) */}
            <polygon
              points={`${R - 1.3},${R} ${R + 1.3},${R} ${R + 0.7},${R + 4.5} ${R - 0.7},${R + 4.5}`}
              fill="rgba(183,28,28,0.85)"
            />
            {/* 바늘 끝 장식 */}
            <circle cx={R} cy={6.5} r="1" fill="rgba(229,57,53,0.9)" />
          </g>

          {/* 중앙 축 (이중 원, 고정 색상) */}
          <circle cx={R} cy={R} r="3" fill="rgba(60,60,60,0.9)" />
          <circle cx={R} cy={R} r="1.5" fill="rgba(100,100,100,0.85)" />

          {/* 베젤 (외곽 링) — 유리 테두리 */}
          <circle
            cx={R} cy={R} r={R - 0.5}
            fill="none"
            stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── PullCord (데스크탑) ─────────────────────────────────────────────────────

function CordPull() {
  const { theme, toggle } = useTheme();
  const [pullDistance, setPullDistance] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const [fallOffset, setFallOffset] = useState(0);
  const [fallOpacity, setFallOpacity] = useState(1);

  const isDragging = useRef(false);
  const hasToggled = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);
  const rafId = useRef<number>(0);
  const handleRef = useRef<HTMLDivElement>(null);

  const animateBack = useCallback(() => {
    const velocity = { current: 0 };
    const tick = () => {
      const springForce = -SPRING_STIFFNESS * currentPull.current;
      velocity.current += springForce;
      velocity.current *= SPRING_DAMPING;
      currentPull.current += velocity.current;

      if (Math.abs(currentPull.current) < 0.5 && Math.abs(velocity.current) < 0.5) {
        currentPull.current = 0;
        setPullDistance(0);
        return;
      }
      setPullDistance(currentPull.current);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const animateFall = useCallback(() => {
    let vy = 0;
    let offset = 0;
    let opacity = 1;

    const tick = () => {
      vy += GRAVITY;
      offset += vy;
      opacity = Math.max(0, 1 - offset / 600);

      setFallOffset(offset);
      setFallOpacity(opacity);

      if (opacity > 0) {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (snapped) return;
    isDragging.current = true;
    hasToggled.current = false;
    startY.current = e.clientY;
    handleRef.current?.setPointerCapture(e.pointerId);
  }, [snapped]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || snapped) return;
      const delta = Math.max(0, e.clientY - startY.current);
      currentPull.current = delta;
      setPullDistance(delta);

      if (delta >= TOGGLE_THRESHOLD && !hasToggled.current) {
        hasToggled.current = true;
        toggle();
      }
      if (delta >= SNAP_THRESHOLD) {
        isDragging.current = false;
        setSnapped(true);
        animateFall();
      }
    },
    [toggle, snapped, animateFall],
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    animateBack();
  }, [animateBack]);

  useEffect(() => {
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, []);

  const isLight = theme === 'light';
  const pullRatio = Math.min(pullDistance / TOGGLE_THRESHOLD, 1);
  const feedbackOpacity = 0.45 + pullRatio * 0.55;

  const cordRGB = isLight ? '60, 50, 40' : '210, 200, 190';
  const handleBg = isLight
    ? `rgba(50, 42, 35, ${feedbackOpacity})`
    : `rgba(220, 210, 200, ${feedbackOpacity})`;
  const handleBorder = isLight
    ? `rgba(40, 32, 25, ${feedbackOpacity * 0.8})`
    : `rgba(240, 230, 220, ${feedbackOpacity * 0.6})`;
  const ringColor = isLight
    ? `rgba(80, 70, 60, ${feedbackOpacity * 0.7})`
    : `rgba(200, 190, 180, ${feedbackOpacity * 0.7})`;
  const beadColor = isLight
    ? `rgba(45, 38, 30, ${feedbackOpacity * 0.9})`
    : `rgba(230, 220, 210, ${feedbackOpacity * 0.9})`;

  const totalCordLength = CORD_BASE_LENGTH + pullDistance;
  const handleTotalH = 34;
  const brokenCordLength = CORD_BASE_LENGTH + SNAP_THRESHOLD * 0.3;
  const containerHeight = snapped
    ? brokenCordLength + 10
    : totalCordLength + handleTotalH + 10;

  return (
    <div
      data-pullcord
      style={{
        position: 'fixed',
        top: 0,
        right: 24,
        zIndex: 100,
        width: 40,
        height: containerHeight,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 1.5,
          height: snapped ? brokenCordLength : totalCordLength,
          backgroundColor: `rgba(${cordRGB}, ${snapped ? 0.3 : feedbackOpacity})`,
          transform: 'translateX(-50%)',
          transition: snapped ? 'height 0.3s ease-out' : 'none',
        }}
      />

      {snapped && (
        <div
          style={{
            position: 'absolute',
            top: brokenCordLength - 3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 3,
            height: 6,
            background: `linear-gradient(to bottom, rgba(${cordRGB}, 0.3), transparent)`,
          }}
        />
      )}

      {!snapped && (
        <div
          ref={handleRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'absolute',
            top: totalCordLength,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            cursor: 'grab',
            touchAction: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${ringColor}`, backgroundColor: 'transparent', marginBottom: 1 }} />
          <div style={{ width: 10, height: 18, borderRadius: 5, backgroundColor: handleBg, border: `1px solid ${handleBorder}`, boxShadow: isLight ? 'inset 1px 1px 2px rgba(255,255,255,0.3)' : 'inset 1px 1px 2px rgba(255,255,255,0.15)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: beadColor, marginTop: 1 }} />
        </div>
      )}

      {snapped && fallOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: brokenCordLength + fallOffset,
            left: '50%',
            transform: `translateX(-50%) rotate(${Math.min(fallOffset * 2, 180)}deg)`,
            opacity: fallOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: 1.5, height: 8, backgroundColor: `rgba(${cordRGB}, ${fallOpacity * 0.5})`, marginBottom: 1 }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${ringColor}`, backgroundColor: 'transparent', marginBottom: 1 }} />
          <div style={{ width: 10, height: 18, borderRadius: 5, backgroundColor: handleBg, border: `1px solid ${handleBorder}` }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: beadColor, marginTop: 1 }} />
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function PullCord() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile ? <RotaryDial /> : <CordPull />;
}
