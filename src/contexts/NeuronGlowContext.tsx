'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface NeuronGlow {
  hue: number;
  active: boolean;
}

const NeuronGlowContext = createContext<{
  glow: NeuronGlow;
  setGlow: (g: NeuronGlow) => void;
}>({
  glow: { hue: 45, active: false },
  setGlow: () => {},
});

export function NeuronGlowProvider({ children }: { children: ReactNode }) {
  const [glow, setGlow] = useState<NeuronGlow>({ hue: 45, active: false });

  return (
    <NeuronGlowContext.Provider value={{ glow, setGlow }}>
      {children}
    </NeuronGlowContext.Provider>
  );
}

export function useNeuronGlow() {
  return useContext(NeuronGlowContext);
}
