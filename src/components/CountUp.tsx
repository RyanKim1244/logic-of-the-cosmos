"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(target);
  const lastTarget = useRef(target);
  const animFrame = useRef(0);

  useEffect(() => {
    if (target === lastTarget.current) return;
    const prevTarget = lastTarget.current;
    lastTarget.current = target;

    const startTime = performance.now();
    const startValue = prevTarget;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startValue + eased * (target - startValue)));
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [target, duration]);

  return <span>{count}</span>;
}
