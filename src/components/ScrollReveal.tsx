"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

type ObserverCallback = (entry: IntersectionObserverEntry) => void;

const callbacks = new Map<Element, ObserverCallback>();

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target);
          if (cb) cb(entry);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 50px 0px" }
    );
  }
  return sharedObserver;
}

function observe(el: Element, cb: ObserverCallback) {
  callbacks.set(el, cb);
  getSharedObserver().observe(el);
}

function unobserve(el: Element) {
  callbacks.delete(el);
  getSharedObserver().unobserve(el);
}

export default function ScrollReveal({ children, delay = 0, direction = "up" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observe(el, (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        unobserve(el);
      }
    });

    return () => unobserve(el);
  }, []);

  const getTransform = () => {
    if (direction === "up") return "translateY(20px)";
    if (direction === "left") return "translateX(-20px)";
    if (direction === "right") return "translateX(20px)";
    return "none";
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : getTransform(),
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
