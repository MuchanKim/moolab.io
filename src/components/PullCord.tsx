'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const CORD_BASE_LENGTH = 44;
const TOGGLE_THRESHOLD = 80;
const SNAP_THRESHOLD = 160;
const SPRING_STIFFNESS = 0.15;
const SPRING_DAMPING = 0.7;
const GRAVITY = 1.8;

export default function PullCord() {
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

  // 스프링 복귀 애니메이션
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

  // 손잡이만 떨어지는 애니메이션
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
      {/* ── 끈 ────────────────────────────────── */}
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

      {/* 끊어진 끈 끝 */}
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

      {/* ── 손잡이 (정상 상태) ──────────────── */}
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

      {/* ── 떨어지는 손잡이 ──────────────────── */}
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
          {/* 끊어진 끈 조각 */}
          <div style={{ width: 1.5, height: 8, backgroundColor: `rgba(${cordRGB}, ${fallOpacity * 0.5})`, marginBottom: 1 }} />
          {/* 고리 */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${ringColor}`, backgroundColor: 'transparent', marginBottom: 1 }} />
          {/* 몸통 */}
          <div style={{ width: 10, height: 18, borderRadius: 5, backgroundColor: handleBg, border: `1px solid ${handleBorder}` }} />
          {/* 구슬 */}
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: beadColor, marginTop: 1 }} />
        </div>
      )}
    </div>
  );
}
