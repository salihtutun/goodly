import { useEffect, useState } from "react";

/**
 * useCountUp — animates a number from 0 to `target` with an ease-out curve.
 *
 * Used on the public audit results page so the score ring and revenue
 * figures feel "computed live" instead of appearing as static text.
 * requestAnimationFrame-based; no dependencies.
 *
 * @param {number} target   final value
 * @param {number} duration animation length in ms (default 1200)
 * @param {number} delay    ms to wait before starting (for staggered reveals)
 * @returns {number} the current animated value (integer)
 */
export function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Number(target) || 0;
    if (end === 0) {
      setValue(0);
      return;
    }
    let raf;
    let start;
    const tick = (now) => {
      if (start === undefined) start = now;
      const t = Math.min(1, (now - start) / duration);
      // cubic ease-out — fast start, gentle landing
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
