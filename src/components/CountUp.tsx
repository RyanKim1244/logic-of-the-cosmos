"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const lastTarget = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;

    // If target changed and we already animated, re-animate from current value
    if (hasAnimated.current && target === lastTarget.current) return;
    lastTarget.current = target;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const startValue = count;

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.round(startValue + eased * (target - startValue)));
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, count]);

  return <span ref={ref}>{count}</span>;
}
