"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type PaintSplotTransitionProps = {
  active: boolean;
  onCoverComplete: () => void;
  onRevealComplete: () => void;
};

const SPLOT_D =
  "M5 52 Q18 12 38 30 T62 14 T90 38 T96 64 T74 90 T36 96 T8 72 Z";

export function PaintSplotTransition({
  active,
  onCoverComplete,
  onRevealComplete,
}: PaintSplotTransitionProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `paint-grad-${uid}`;
  const coverMaskId = `paint-cover-${uid}`;
  const revealMaskId = `paint-reveal-${uid}`;
  const [phase, setPhase] = useState<"idle" | "cover" | "reveal">("idle");
  const coverFired = useRef(false);
  const revealFired = useRef(false);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      coverFired.current = false;
      revealFired.current = false;
    } else {
      coverFired.current = false;
      revealFired.current = false;
      setPhase("cover");
    }
  }, [active]);

  const afterCover = useCallback(() => {
    if (coverFired.current) return;
    coverFired.current = true;
    onCoverComplete();
    setPhase("reveal");
  }, [onCoverComplete]);

  const afterReveal = useCallback(() => {
    if (revealFired.current) return;
    revealFired.current = true;
    onRevealComplete();
    setPhase("idle");
  }, [onRevealComplete]);

  if (!active && phase === "idle") return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="45%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <mask
            id={coverMaskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100"
            height="100"
          >
            <rect x="0" y="0" width="100" height="100" fill="black" />
            {phase === "cover" && (
              <motion.g
                initial={{ x: -55, y: 8, scale: 0.22, rotate: -10 }}
                animate={{ x: 28, y: -2, scale: 3.4, rotate: 22 }}
                transition={{
                  duration: 0.78,
                  ease: [0.34, 1.45, 0.52, 1],
                }}
                onAnimationComplete={() => afterCover()}
                style={{ transformOrigin: "40px 50px" }}
              >
                <path d={SPLOT_D} fill="white" />
              </motion.g>
            )}
          </mask>
          <mask
            id={revealMaskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100"
            height="100"
          >
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {phase === "reveal" && (
              <motion.g
                initial={{ x: 50, y: 50, scale: 0.18, rotate: 0 }}
                animate={{ x: 50, y: 50, scale: 4.2, rotate: 28 }}
                transition={{
                  duration: 0.68,
                  ease: [0.19, 1, 0.22, 1],
                }}
                onAnimationComplete={() => afterReveal()}
                style={{ transformOrigin: "50px 50px" }}
              >
                <path
                  d={SPLOT_D}
                  fill="black"
                  transform="translate(-40, -50)"
                />
              </motion.g>
            )}
          </mask>
        </defs>
        {phase === "cover" && (
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={`url(#${gradId})`}
            mask={`url(#${coverMaskId})`}
          />
        )}
        {phase === "reveal" && (
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={`url(#${gradId})`}
            mask={`url(#${revealMaskId})`}
          />
        )}
      </svg>
    </div>
  );
}
