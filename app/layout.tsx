import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Uby — Quotes & Orders",
  description: "Glassmorphic business automation dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-[#0a0618]">
        {/* SVG filter defs — used by CursorTrail & PaintSplot gooey effects */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            {/* Cursor trail gooey merge */}
            <filter id="goo-cursor" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -8"
                result="goo"
              />
            </filter>
            {/* Paint splot gooey merge */}
            <filter id="goo-splot" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10"
                result="goo"
              />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
