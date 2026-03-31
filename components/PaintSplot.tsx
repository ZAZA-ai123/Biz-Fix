"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Point } from "@/types";

interface Blob {
  offsetX: number;
  offsetY: number;
  size: number;
  delay: number;
  borderRadius: string;
  rotate: number;
}

// Cartoony ink-splat blobs: center mass + radiating drips
const BLOBS: Blob[] = [
  // Large central mass
  { offsetX: 0, offsetY: 0, size: 280, delay: 0, borderRadius: "50%", rotate: 0 },
  { offsetX: 0, offsetY: 0, size: 260, delay: 0.04, borderRadius: "60% 40% 55% 45% / 45% 60% 40% 55%", rotate: 30 },
  // Drips radiating outward
  { offsetX: 180, offsetY: -60, size: 160, delay: 0.07, borderRadius: "50% 60% 40% 70% / 60% 45% 55% 40%", rotate: -20 },
  { offsetX: -160, offsetY: -80, size: 140, delay: 0.09, borderRadius: "70% 30% 60% 40% / 40% 70% 30% 60%", rotate: 45 },
  { offsetX: 100, offsetY: 180, size: 150, delay: 0.11, borderRadius: "40% 60% 70% 30% / 50% 40% 60% 50%", rotate: -15 },
  { offsetX: -120, offsetY: 160, size: 130, delay: 0.13, borderRadius: "60% 50% 35% 65% / 55% 45% 65% 35%", rotate: 60 },
  { offsetX: 220, offsetY: 100, size: 120, delay: 0.15, borderRadius: "45% 55% 65% 35% / 35% 65% 45% 55%", rotate: -40 },
  { offsetX: -200, offsetY: 60, size: 110, delay: 0.17, borderRadius: "55% 45% 40% 60% / 65% 35% 55% 45%", rotate: 25 },
  // Splatter dots
  { offsetX: 300, offsetY: -120, size: 80, delay: 0.19, borderRadius: "50%", rotate: 0 },
  { offsetX: -280, offsetY: -140, size: 70, delay: 0.21, borderRadius: "50%", rotate: 0 },
  { offsetX: 60, offsetY: 280, size: 90, delay: 0.23, borderRadius: "50%", rotate: 0 },
  { offsetX: -80, offsetY: -240, size: 65, delay: 0.25, borderRadius: "50%", rotate: 0 },
  // Far fill blobs to ensure full coverage
  { offsetX: 0, offsetY: 0, size: 600, delay: 0.2, borderRadius: "45% 55% 50% 50% / 50% 45% 55% 50%", rotate: 10 },
  { offsetX: 0, offsetY: 0, size: 800, delay: 0.32, borderRadius: "50%", rotate: 0 },
];

const GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 35%, #a855f7 65%, #ec4899 100%)";

interface PaintSplotProps {
  isVisible: boolean;
  origin: Point;
  onMidpoint: () => void;
  onComplete: () => void;
}

export default function PaintSplot({
  isVisible,
  origin,
  onMidpoint,
  onComplete,
}: PaintSplotProps) {
  useEffect(() => {
    if (!isVisible) return;

    // State change fires at the midpoint of the animation
    const midTimer = setTimeout(onMidpoint, 750);
    // Full animation ends and overlay is removed
    const endTimer = setTimeout(onComplete, 1600);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(endTimer);
    };
  }, [isVisible, onMidpoint, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 1000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeIn" } }}
        >
          {/* Gooey container — blobs merge into one organic splat shape */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              filter: "url(#goo-splot)",
            }}
          >
            {BLOBS.map((blob, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280 - i * 8,
                  damping: 18,
                  delay: blob.delay,
                }}
                style={{
                  position: "absolute",
                  left: origin.x + blob.offsetX - blob.size / 2,
                  top: origin.y + blob.offsetY - blob.size / 2,
                  width: blob.size,
                  height: blob.size,
                  borderRadius: blob.borderRadius,
                  background: GRADIENT,
                  rotate: blob.rotate,
                  transformOrigin: "center center",
                }}
              />
            ))}
          </div>

          {/* Ripple ring at click origin */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: origin.x - 40,
              top: origin.y - 40,
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.8)",
            }}
          />

          {/* "Pop" text label */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            style={{
              position: "absolute",
              left: origin.x - 70,
              top: origin.y - 60,
              pointerEvents: "none",
            }}
            className="text-white font-black text-lg tracking-tight select-none"
          >
            ✦ Converting!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
