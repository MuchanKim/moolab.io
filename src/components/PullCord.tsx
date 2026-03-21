'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

const CORD_BASE_LENGTH = 44;
const HANDLE_SIZE = 14;
const TOGGLE_THRESHOLD = 80;
const SPRING_STIFFNESS = 0.15;
const SPRING_DAMPING = 0.7;

export default function PullCord() {
  const { theme, toggle } = useTheme();
  const [pullDistance, setPullDistance] = useState(0);

  const isDragging = useRef(false);
  const hasToggled = useRef(false);
  const startY = useRef(0);
  const currentPull = useRef(0);
  const rafId = useRef<number>(0);
  const handleRef = useRef<HTMLDivElement>(null);

  // Spring animation back to rest
  const animateBack = useCallback(() => {
    const velocity = { current: 0 };

    const tick = () => {
      const displacement = currentPull.current;
      const springForce = -SPRING_STIFFNESS * displacement;
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    hasToggled.current = false;
    startY.current = e.clientY;
    handleRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;

      const delta = Math.max(0, e.clientY - startY.current);
      currentPull.current = delta;
      setPullDistance(delta);

      if (delta >= TOGGLE_THRESHOLD && !hasToggled.current) {
        hasToggled.current = true;
        toggle();
      }
    },
    [toggle],
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    animateBack();
  }, [animateBack]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const isLight = theme === 'light';
  const cordColor = isLight ? 'rgba(60, 50, 40, 0.55)' : 'rgba(210, 200, 190, 0.55)';
  const pullRatio = Math.min(pullDistance / TOGGLE_THRESHOLD, 1);
  const feedbackOpacity = 0.55 + pullRatio * 0.45;
  const activeCordColor = isLight
    ? `rgba(60, 50, 40, ${feedbackOpacity})`
    : `rgba(210, 200, 190, ${feedbackOpacity})`;

  const totalCordLength = CORD_BASE_LENGTH + pullDistance;
  const containerHeight = totalCordLength + HANDLE_SIZE + 4;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 24,
        zIndex: 100,
        width: HANDLE_SIZE + 8,
        height: containerHeight,
        pointerEvents: 'none',
      }}
    >
      {/* Cord */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 1.5,
          height: totalCordLength,
          backgroundColor: activeCordColor,
          transform: 'translateX(-50%)',
        }}
      />
      {/* Handle */}
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
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          borderRadius: '50%',
          backgroundColor: activeCordColor,
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
