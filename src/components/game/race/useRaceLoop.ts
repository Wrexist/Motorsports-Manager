import { useEffect, useRef } from "react";

const intervalMs: Record<1 | 2 | 5, number> = {
  1: 850,
  2: 450,
  5: 180,
};

/**
 * Drives discrete race replay ticks in JS — do not bind Framer Motion to this interval.
 */
export function useRaceLoop(opts: {
  enabled: boolean;
  speed: 0 | 1 | 2 | 5;
  onTick: () => void;
}): void {
  const tick = useRef(opts.onTick);
  tick.current = opts.onTick;

  useEffect(() => {
    if (!opts.enabled || opts.speed === 0) return;
    const ms = intervalMs[opts.speed];
    const id = window.setInterval(() => {
      tick.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [opts.enabled, opts.speed]);
}
