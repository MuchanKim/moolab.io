'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────

export interface HiddenNeuron {
  id: number;
  zoneX: number;
  zoneY: number;
  x: number;
  y: number;
  activated: boolean;
}

export interface NeuralGameState {
  hiddenNeurons: HiddenNeuron[];
  activatedCount: number;
  isCleared: boolean;
  clearWaveProgress: number;
  activate: (id: number) => void;
  updatePositions: (width: number, height: number) => void;
}

// ── Zone definitions (ratio 0~1) ───────────────────────

// 육각형 배치 (중심 0.5, 0.5 기준, 로고 영역 피해서)
const HEX_CX = 0.5;
const HEX_CY = 0.5;
const HEX_RX = 0.42; // 가로 반지름 (화면 전체 활용)
const HEX_RY = 0.38; // 세로 반지름

const ZONES: [number, number][] = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 60 + 30) * (Math.PI / 180); // 30° 오프셋으로 위/아래 꼭짓점
  return [
    HEX_CX + HEX_RX * Math.cos(angle),
    HEX_CY + HEX_RY * Math.sin(angle),
  ];
});

function createInitialNeurons(): HiddenNeuron[] {
  return ZONES.map(([zoneX, zoneY], i) => ({
    id: i,
    zoneX,
    zoneY,
    x: 0,
    y: 0,
    activated: false,
  }));
}

// ── Hook ───────────────────────────────────────────────

export function useNeuralGame(): NeuralGameState {
  const [hiddenNeurons, setHiddenNeurons] = useState<HiddenNeuron[]>(createInitialNeurons);
  const [clearWaveProgress, setClearWaveProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // derived
  const activatedCount = hiddenNeurons.filter((n) => n.activated).length;
  const isCleared = activatedCount === ZONES.length;

  // ── activate ─────────────────────────────────────────

  const activate = useCallback((id: number) => {
    setHiddenNeurons((prev) =>
      prev.map((n) => (n.id === id && !n.activated ? { ...n, activated: true } : n)),
    );
  }, []);

  // ── updatePositions ──────────────────────────────────

  const updatePositions = useCallback((width: number, height: number) => {
    setHiddenNeurons((prev) =>
      prev.map((n) => ({
        ...n,
        x: n.zoneX * width,
        y: n.zoneY * height,
      })),
    );
  }, []);

  // ── clearWave animation ──────────────────────────────

  useEffect(() => {
    if (!isCleared) return;

    timerRef.current = setTimeout(() => {
      const start = performance.now();
      const duration = 6000; // 블랙홀 흡수 + 폭발 + 새 우주

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setClearWaveProgress(progress);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, 2500); // 하단 UI 축하 애니메이션 후 배경 전환

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isCleared]);

  // ── cleanup on unmount ───────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    hiddenNeurons,
    activatedCount,
    isCleared,
    clearWaveProgress,
    activate,
    updatePositions,
  };
}
