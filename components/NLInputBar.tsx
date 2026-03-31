"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Zap } from "lucide-react";

interface Suggestion {
  label: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  { label: "Add 500 units of Widget X", prompt: "Add 500 units of Widget X" },
  { label: "Add Design Phase", prompt: "Add 1 Design Phase" },
  { label: "New quote for Startup Co", prompt: "New quote for Startup Co" },
];

interface ParsedCommand {
  type: "add_item" | "new_quote" | "unknown";
  qty?: number;
  product?: string;
  client?: string;
}

export function parseNLCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase().trim();

  // "new quote for <client>"
  const newQuoteMatch = lower.match(/new quote (?:for\s+)?(.+)/);
  if (newQuoteMatch) {
    return { type: "new_quote", client: newQuoteMatch[1].trim() };
  }

  // "add <qty> units of <product>"  or  "add <qty> <product>"
  const addWithQtyMatch = lower.match(
    /add\s+(\d+)\s+(?:units?\s+of\s+|x\s+)?(.+)/
  );
  if (addWithQtyMatch) {
    return {
      type: "add_item",
      qty: parseInt(addWithQtyMatch[1], 10),
      product: addWithQtyMatch[2].trim(),
    };
  }

  // "add <product>" (qty = 1)
  const addSimpleMatch = lower.match(/add\s+(.+)/);
  if (addSimpleMatch) {
    return { type: "add_item", qty: 1, product: addSimpleMatch[1].trim() };
  }

  return { type: "unknown" };
}

interface NLInputBarProps {
  onAddItem: (product: string, qty: number) => void;
  onNewQuote: (client: string) => void;
  selectedQuoteClient?: string;
}

export default function NLInputBar({
  onAddItem,
  onNewQuote,
  selectedQuoteClient,
}: NLInputBarProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const cmd = parseNLCommand(trimmed);

    if (cmd.type === "add_item" && cmd.product && cmd.qty) {
      const label = cmd.product
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      onAddItem(label, cmd.qty);
      setFeedback(`✓ Added ${cmd.qty}× ${label}`);
    } else if (cmd.type === "new_quote" && cmd.client) {
      const label = cmd.client
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      onNewQuote(label);
      setFeedback(`✓ New quote for ${label}`);
    } else {
      setFeedback("🤔 Try: 'Add 500 units of Widget X'");
    }

    setValue("");
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setValue("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mb-3 mx-auto w-fit px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: "rgba(79,70,229,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(129,140,248,0.4)",
              boxShadow: "0 4px 24px rgba(79,70,229,0.4)",
            }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion chips */}
      <AnimatePresence>
        {isFocused && !value && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex gap-2 flex-wrap justify-center"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s.prompt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(s.prompt);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input bar */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 2px rgba(129,140,248,0.55), 0 8px 40px rgba(79,70,229,0.4)"
            : "0 4px 24px rgba(0,0,0,0.3)",
        }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        <motion.div
          animate={{ rotate: isFocused ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles
            size={18}
            className="text-indigo-400 shrink-0"
            strokeWidth={1.5}
          />
        </motion.div>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            selectedQuoteClient
              ? `Add items to ${selectedQuoteClient}'s quote…`
              : "Add 500 units of Widget X · New quote for Acme…"
          }
          className="nl-input flex-1 bg-transparent text-white/90 placeholder:text-white/35 text-sm outline-none"
        />

        {/* Live character count hint */}
        {value.length > 0 && (
          <span className="text-white/30 text-xs shrink-0 tabular-nums">
            {value.length}
          </span>
        )}

        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={!value.trim()}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-30 transition-opacity"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: value.trim()
              ? "0 0 16px rgba(79,70,229,0.5)"
              : "none",
          }}
        >
          <Send size={14} className="text-white" strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* Hint line */}
      <p className="text-center text-white/25 text-xs mt-2 select-none">
        <Zap size={10} className="inline mr-1 mb-0.5" strokeWidth={2} />
        Press Enter · Natural language commands
      </p>
    </div>
  );
}
