"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const PHRASES = [
  "Waking up the database...",
  "Thinking...",
  "Spluttering through POs...",
  "Cross-referencing competitors...",
  "Polishing the quotes...",
  "Finding the best deals...",
  "Almost there... probably.",
] as const;

export function ThinkingOrb({
  className,
  labelClassName,
  detail,
}: {
  className?: string;
  labelClassName?: string;
  detail?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((v) => (v + 1) % PHRASES.length);
    }, 1500);
    return () => window.clearInterval(t);
  }, []);

  const jitter = reduceMotion
    ? {}
    : {
        x: [0, -1, 1, -1, 1, 0],
        y: [0, 1, -1, 1, -1, 0],
        rotate: [0, -0.6, 0.6, -0.4, 0.4, 0],
      };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <motion.div
        className="relative grid place-items-center"
        animate={jitter}
        transition={{
          duration: 0.55,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
          repeatDelay: 0.35,
        }}
      >
        <motion.div
          className={cn(
            "size-20 rounded-full border border-border bg-card",
            "shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_12px_40px_rgba(79,70,229,0.15)]"
          )}
          animate={
            reduceMotion
              ? {}
              : {
                  scale: [1, 1.06, 0.99, 1.04, 1],
                }
          }
          transition={{ duration: 1.8, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute -inset-[40%] opacity-90 blur-2xl"
              animate={reduceMotion ? {} : { rotate: [0, 360] }}
              transition={{ duration: 10, ease: "linear", repeat: reduceMotion ? 0 : Infinity }}
            >
              <div className="absolute left-[10%] top-[10%] h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.5),transparent_65%)]" />
              <div className="absolute left-[45%] top-[0%] h-[130px] w-[130px] rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.45),transparent_62%)]" />
              <div className="absolute left-[15%] top-[45%] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle_at_45%_55%,rgba(236,72,153,0.35),transparent_60%)]" />
            </motion.div>
            <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay">
              <svg className="h-full w-full">
                <filter id="orbNoise">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.9"
                    numOctaves="2"
                    stitchTiles="stitch"
                  />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#orbNoise)" />
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className={cn("text-center", labelClassName)}
        animate={jitter}
        transition={{
          duration: 0.55,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Infinity,
          repeatDelay: 0.55,
        }}
        role="status"
        aria-live="polite"
      >
        <motion.p
          key={idx}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="text-sm font-medium text-foreground"
        >
          {PHRASES[idx]}
        </motion.p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </motion.div>
    </div>
  );
}
