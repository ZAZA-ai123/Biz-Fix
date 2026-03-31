"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number; id: number };

const MAX_POINTS = 22;
const BRAND_FILL = "rgba(99, 102, 241, 0.55)";
const BRAND_FILL_2 = "rgba(217, 70, 239, 0.4)";

export function CursorTrailGoo() {
  const [points, setPoints] = useState<Point[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const flush = useCallback(() => {
    rafRef.current = null;
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    idRef.current += 1;
    setPoints((prev) => {
      const next = [{ ...p, id: idRef.current }, ...prev].slice(0, MAX_POINTS);
      return next;
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [flush]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPoints((prev) => (prev.length ? prev.slice(0, -1) : prev));
    }, 45);
    return () => clearInterval(t);
  }, []);

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[5] h-screen w-screen overflow-visible"
      aria-hidden
    >
      <defs>
        <filter
          id="cursor-goo"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g filter="url(#cursor-goo)">
        {points.map((pt, i) => {
          const r = 10 + i * 1.2;
          const fill = i % 3 === 0 ? BRAND_FILL_2 : BRAND_FILL;
          return (
            <circle
              key={pt.id}
              cx={pt.x}
              cy={pt.y}
              r={r}
              fill={fill}
              opacity={0.35 + (i / MAX_POINTS) * 0.45}
            />
          );
        })}
      </g>
    </svg>
  );
}
