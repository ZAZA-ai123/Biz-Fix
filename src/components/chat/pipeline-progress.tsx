"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "plan",      label: "Planning" },
  { id: "retrieve",  label: "Searching" },
  { id: "structure", label: "Structuring" },
  { id: "build",     label: "Building" },
  { id: "save",      label: "Saving" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export type PipelineStep = StepId | "done" | null;

export function PipelineProgress({ activeStep }: { activeStep: PipelineStep }) {
  return (
    <AnimatePresence>
      {activeStep && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mr-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[11px] backdrop-blur-sm"
        >
          {STEPS.map((step, i) => {
            const stepIndex = STEPS.findIndex((s) => s.id === activeStep);
            const isDone = activeStep === "done" || i < stepIndex;
            const isActive = step.id === activeStep;

            return (
              <div key={step.id} className="flex items-center gap-1">
                <div
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-200",
                    isDone
                      ? "bg-emerald-500/80 text-white"
                      : isActive
                        ? "bg-white/25 text-white ring-2 ring-white/20"
                        : "bg-white/8 text-white/30"
                  )}
                >
                  {isDone ? (
                    <Check className="size-2.5" />
                  ) : isActive ? (
                    <Loader2 className="size-2.5 animate-spin" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium transition-colors duration-200",
                    isDone ? "text-white/60" : isActive ? "text-white/90" : "text-white/20"
                  )}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-0.5 text-white/15 select-none">›</span>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
