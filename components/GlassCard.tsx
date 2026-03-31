"use client";

import { useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import clsx from "clsx";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function GlassCard({
  children,
  className,
  glowColor = "rgba(129,140,248,0.18)",
  onClick,
  isSelected = false,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [9, -9]), {
    stiffness: 350,
    damping: 35,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-9, 9]), {
    stiffness: 350,
    damping: 35,
  });
  const scale = useSpring(isHovered ? 1.018 : 1, {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
      const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(xNorm);
      mouseY.set(yNorm);
      setGlowPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
      }}
      className={clsx(
        "relative overflow-hidden rounded-2xl",
        "bg-white/[0.07] backdrop-blur-xl",
        "border transition-colors duration-300",
        isSelected
          ? "border-indigo-400/50 shadow-[0_0_30px_rgba(79,70,229,0.25)]"
          : "border-white/[0.12] hover:border-white/20",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Magnetic radial glow that follows cursor */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${glowPos.x}px ${glowPos.y}px, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Specular shine — top-left edge catch */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%)",
        }}
      />

      {/* Bottom edge glow line */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(129,140,248,0.4), transparent)",
          opacity: isHovered ? 1 : 0.3,
          transition: "opacity 0.3s",
        }}
      />

      {/* Content lifted in Z space */}
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
}
