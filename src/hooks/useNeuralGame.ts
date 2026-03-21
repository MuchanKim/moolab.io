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

const ZONES: [number, number][] = [
  [0.15, 0.20], // top-left
  [0.82, 0.18], // top-right
  [0.50, 0.55], // center (slightly below to avoid logo)
  [0.20, 0.82], // bottom-left
  [0.78, 0.80], // bottom-right
];

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
      const duration = 2500;

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setClearWaveProgress(progress);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, 800);

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
