"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="grainy-radial flex min-h-dvh flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF1C6A] to-[#9B04DB] text-lg font-bold text-white shadow-lg">
          B
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in to Biz-Fix</h1>
        <p className="mt-2 text-sm text-white/60">
          Quote from prompts and POs—then refine in Quote Studio.
        </p>
      </div>
      <SignIn
        routing="hash"
        forceRedirectUrl="/onboarding"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "rounded-3xl border border-white/30 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "h-11 w-full rounded-xl border-border/80 bg-white text-[15px] hover:bg-muted/40 font-medium",
            formButtonPrimary:
              "h-11 w-full rounded-xl bg-gradient-to-r from-[#FF1C6A] to-[#9B04DB] text-[15px] font-semibold",
            footerActionLink: "text-[#9B04DB] font-medium",
          },
        }}
      />
    </div>
  );
}
