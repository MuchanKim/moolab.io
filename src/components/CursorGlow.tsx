'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);

  const springX = useSpring(x, { stiffness: 70, damping: 22 });
  const springY = useSpring(y, { stiffness: 70, damping: 22 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0"
      style={{ top: '72px', overflow: 'hidden' }}
    >
      <motion.div
        style={{
          position: 'absolute',
          width: 720,
          height: 720,
          borderRadius: '50%',
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          background:
            'radial-gradient(circle, rgba(111,187,116,0.11) 0%, rgba(111,187,116,0.04) 45%, transparent 70%)',
        }}
      />
    </motion.div>
  );
}
