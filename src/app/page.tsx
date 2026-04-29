import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Bot,
  Gauge,
  Layers,
  PencilRuler,
  Sparkles,
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    const user = await currentUser();
    const companyName = user?.publicMetadata?.companyName as string | undefined;
    redirect(companyName ? "/chat" : "/onboarding");
  }

  return (
    <div className="grainy-radial relative min-h-dvh overflow-x-hidden text-white">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF1C6A] to-[#9B04DB] text-base font-bold shadow-lg">
            B
          </div>
          <span className="text-lg font-semibold tracking-tight">Biz-Fix</span>
        </div>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
        >
          Sign in
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-12 text-center sm:px-10 sm:pt-20">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden />
            AI-native quoting for vendors
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Turn a sentence into a closed-deal-ready quote.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-white/80 sm:text-lg">
            Describe the project. Biz-Fix plans, retrieves, structures, and prices a quote in
            seconds — with margin guardrails, vendor-aware swaps, and a studio for the last mile.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-xl shadow-black/20 transition hover:bg-white/90"
            >
              Get started free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur transition hover:bg-white/15"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-white/20">
                  <f.icon className="size-5" aria-hidden />
                </div>
                <div className="text-base font-semibold">{f.title}</div>
                <p className="mt-1.5 text-sm text-white/80">{f.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-28 sm:px-10">
          <div className="rounded-3xl border border-white/25 bg-white/10 p-8 backdrop-blur sm:p-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
              How it works
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              From prompt to PDF in five steps.
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-5">
              {steps.map((s, i) => (
                <li key={s} className="flex flex-col gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div className="text-sm font-medium">{s}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-10 text-center text-xs text-white/60 sm:px-10">
        © {new Date().getFullYear()} Biz-Fix · Built for vendors who quote fast.
      </footer>
    </div>
  );
}

const features = [
  {
    title: "AI quote pipeline",
    copy: "Plan → retrieve → structure → build → save. Quotes assemble themselves.",
    icon: Bot,
  },
  {
    title: "Catalog intelligence",
    copy: "Tier-aware product matching with vendor preferences and stock signals.",
    icon: Layers,
  },
  {
    title: "Margin guardrails",
    copy: "Floors, premium logic, and bulk discount rules — applied automatically.",
    icon: Gauge,
  },
  {
    title: "Quote Studio",
    copy: "Refine in chat. Lock line items. Export a branded PDF in one click.",
    icon: PencilRuler,
  },
];

const steps = [
  "Describe the project",
  "Plan & retrieve",
  "Auto-structure",
  "Refine in studio",
  "Export & send",
];
