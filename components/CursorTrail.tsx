"use client";

import { useEffect, useRef } from "react";

const TRAIL_LENGTH = 24;
const BRAND_COLORS = [
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#e879f9", // fuchsia-400
  "#38bdf8", // sky-400
  "#06b6d4", // cyan-500
];

interface TrailPoint {
  x: number;
  y: number;
  size: number;
  color: string;
  age: number;
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const mouseRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      mouseRef.current = { x, y };
      trailRef.current.push({
        x,
        y,
        size: 14 + Math.random() * 10,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        age: 0,
      });
      if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();
    };
    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const trail = trailRef.current;
      trail.forEach((pt, i) => {
        const progress = (i + 1) / trail.length;
        ctx.globalAlpha = progress * 0.75;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * progress, 0, Math.PI * 2);
        ctx.fill();
        pt.age++;
      });

      // Remove very old points
      trailRef.current = trailRef.current.filter((p) => p.age < 60);

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas with gooey SVG filter applied — circles melt into each other */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          filter: "url(#goo-cursor)",
          mixBlendMode: "screen",
        }}
      />

      {/* Custom cursor dot */}
      <CursorDot />
    </>
  );
}

function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dotRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={dotRef}
      className="fixed top-0 left-0 w-3 h-3 rounded-full pointer-events-none"
      style={{
        zIndex: 10000,
        background: "radial-gradient(circle, #ffffff 0%, #818cf8 100%)",
        boxShadow: "0 0 10px rgba(129,140,248,0.9), 0 0 20px rgba(79,70,229,0.5)",
        transition: "transform 0.05s linear",
      }}
    />
  );
}
