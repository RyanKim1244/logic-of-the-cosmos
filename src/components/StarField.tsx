"use client";

import { useEffect, useRef } from "react";

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
      phase: number;
    }

    const stars: Star[] = [];

    const resize = () => {
      width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.parentElement?.offsetHeight || 600;
      canvas.width = width;
      canvas.height = height;
    };

    const initStars = () => {
      stars.length = 0;
      const count = Math.floor((width * height) / 3000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = Math.sin(time * 0.001 * star.speed + star.phase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
      }

      // Subtle shooting star
      if (Math.random() < 0.002) {
        const sx = Math.random() * width;
        const sy = Math.random() * height * 0.5;
        const gradient = ctx.createLinearGradient(sx, sy, sx + 80, sy + 30);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.6)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 80, sy + 30);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initStars();
    animationId = requestAnimationFrame(draw);

    const handleResize = () => {
      resize();
      initStars();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
