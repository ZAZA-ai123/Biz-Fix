import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#4f46e5",
          violet: "#7c3aed",
          cyan: "#06b6d4",
          pink: "#ec4899",
          glow: "#818cf8",
        },
      },
      animation: {
        "mesh-1": "mesh1 9s ease-in-out infinite",
        "mesh-2": "mesh2 12s ease-in-out infinite",
        "mesh-3": "mesh3 10s ease-in-out infinite",
        "mesh-4": "mesh4 14s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        mesh1: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(8%, -12%) scale(1.15)" },
          "66%": { transform: "translate(-6%, 8%) scale(0.9)" },
        },
        mesh2: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(-10%, 6%) scale(1.1)" },
          "66%": { transform: "translate(12%, -4%) scale(0.95)" },
        },
        mesh3: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "50%": { transform: "translate(6%, 10%) scale(1.2)" },
        },
        mesh4: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "40%": { transform: "translate(-8%, -8%) scale(0.85)" },
          "80%": { transform: "translate(4%, 6%) scale(1.1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
