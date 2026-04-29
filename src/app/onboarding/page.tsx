"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Building2, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [name, setName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    // If already onboarded, go straight to chat
    if (user.publicMetadata?.companyName) {
      router.replace("/chat");
      return;
    }
    // Pre-fill name from Clerk profile if available
    if (user.fullName) setName(user.fullName);
  }, [isLoaded, user, router]);

  function onFile(f: File | null) {
    setLogoError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setLogoError("Only image files are supported (PNG, JPG, WebP).");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setLogoError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max size is 4 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logoDataUrl }),
      });
      if (!res.ok) throw new Error("Failed to save company");
      // Reload user to pick up updated publicMetadata
      await user?.reload();
      router.push("/chat");
    } catch {
      setSubmitError("Something went wrong saving your workspace. Please try again.");
      setBusy(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="grainy-radial flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="grainy-radial flex min-h-dvh flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-12">
      <form
        onSubmit={onSubmit}
        className="relative z-[1] w-full max-w-lg rounded-3xl border border-white/30 bg-white/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8"
      >
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFEFBA] to-[#9B04DB] text-white shadow-md">
            <Building2 className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Your company</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This appears in the workspace and chat sidebar. You can change it later in settings.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            placeholder="e.g. Riverside Interiors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="mt-6 space-y-2">
          <Label>Company logo</Label>
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFile(e.dataTransfer.files[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 transition-colors",
              drag
                ? "border-[#FF1C6A] bg-pink-50/50"
                : "border-border/70 bg-muted/30 hover:border-[#9B04DB]/50 hover:bg-muted/50"
            )}
          >
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="" className="h-20 w-auto max-w-[200px] object-contain" />
            ) : (
              <>
                <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium text-foreground">Drop an image or click to upload</span>
                <span className="text-xs text-muted-foreground">PNG or JPG, up to 4 MB</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </button>
          {logoError && (
            <p className="text-xs font-medium text-destructive" role="alert">{logoError}</p>
          )}
          {logoDataUrl && (
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => { setLogoDataUrl(null); setLogoError(null); }}>
              Remove logo
            </Button>
          )}
        </div>

        <Button type="submit" disabled={!name.trim() || busy} className="mt-8 h-11 w-full rounded-xl gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Creating workspace…" : "Continue to chat"}
        </Button>
        {submitError && (
          <p className="mt-3 text-center text-xs font-medium text-destructive" role="alert">{submitError}</p>
        )}
      </form>
    </div>
  );
}
