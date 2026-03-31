"use client";

export default function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0618]">
      {/* Orb 1 — deep indigo, top-left drift */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-60 animate-mesh-1"
        style={{
          background:
            "radial-gradient(circle, rgba(79,70,229,0.7) 0%, rgba(79,70,229,0) 70%)",
        }}
      />

      {/* Orb 2 — violet, top-right drift */}
      <div
        className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full opacity-50 animate-mesh-2"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.65) 0%, rgba(124,58,237,0) 70%)",
        }}
      />

      {/* Orb 3 — cyan accent, bottom-right */}
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-35 animate-mesh-3"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(6,182,212,0) 70%)",
        }}
      />

      {/* Orb 4 — hot pink, bottom-left */}
      <div
        className="absolute -bottom-20 left-1/4 w-[450px] h-[450px] rounded-full opacity-30 animate-mesh-4"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(236,72,153,0) 70%)",
        }}
      />

      {/* Subtle noise overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(10,6,24,0.6) 100%)",
        }}
      />
    </div>
  );
}
