import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate a number from 0 to `value` on mount / when value changes.
 * Respects prefers-reduced-motion (jumps straight to the value).
 */
export function useCountUp(value = 0, { duration = 900, decimals = 0 } = {}) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0);
  const rafRef = useRef();
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const factor = 10 ** decimals;
  return Math.round(display * factor) / factor;
}

export default useCountUp;
