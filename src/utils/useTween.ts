import { useEffect, useRef, useState } from 'react';

export function useTween(target: number, ms = 320): number {
  const [val, setVal] = useState(target);
  const ref = useRef({ from: target, to: target, t0: 0, raf: 0 });
  useEffect(() => {
    cancelAnimationFrame(ref.current.raf);
    ref.current.from = val;
    ref.current.to = target;
    ref.current.t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - ref.current.t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = ref.current.from + (ref.current.to - ref.current.from) * e;
      setVal(v);
      if (k < 1) ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}
