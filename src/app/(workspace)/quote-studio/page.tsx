import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { QuoteStudioClient } from "./quote-studio-client";

function QuoteStudioFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function QuoteStudioPage() {
  return (
    <Suspense fallback={<QuoteStudioFallback />}>
      <QuoteStudioClient />
    </Suspense>
  );
}
