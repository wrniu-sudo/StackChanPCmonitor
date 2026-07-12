import { useEffect, useState } from "react";

/**
 * Returns a value that continuously loops from 1 to 100 and back to 1,
 * driving the dynamic progress-bar animation described in the design spec.
 *
 * @param durationMs time for a full 1 -> 100 sweep
 * @param phase 0..1 offset so multiple bars aren't perfectly in sync
 */
export function useLoopingPercent(durationMs = 4000, phase = 0) {
  const [percent, setPercent] = useState(1);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = ((now - start) / durationMs + phase) % 1;
      setPercent(1 + Math.round(t * 99));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, phase]);

  return percent;
}
