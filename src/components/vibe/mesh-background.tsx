import React from "react";

/** Subtle canvas for a light, enterprise SaaS shell (not a dark hero). */
export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--canvas)]" />
      <div className="absolute inset-0 opacity-[0.55]">
        <div className="absolute -left-[20%] -top-[30%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.09),transparent_68%)] blur-3xl" />
        <div className="absolute -right-[15%] top-[10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.07),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[25%] h-[50%] w-[60%] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)] blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,transparent_28%,transparent_100%)]" />
    </div>
  );
}
