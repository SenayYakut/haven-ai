import { useEffect, useState } from "react";
import { useHaven } from "@/lib/haven-store";
import { AlertCircle } from "lucide-react";

export function SafetyCheck() {
  const { safetyCheck, markSafe, timeoutSafetyCheck } = useHaven();
  const [n, setN] = useState(15);

  useEffect(() => {
    if (!safetyCheck) { setN(15); return; }
    const i = setInterval(() => {
      setN((c) => {
        if (c <= 1) { clearInterval(i); timeoutSafetyCheck(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [safetyCheck, timeoutSafetyCheck]);

  if (!safetyCheck) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-haven-danger/95 text-white animate-slide-up p-6">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <AlertCircle className="h-20 w-20" />
        <h2 className="text-5xl font-bold leading-tight">Eleanor, are you okay?</h2>
        <p className="text-2xl opacity-90">We detected a possible fall. Please tap below if you're safe.</p>
        <button
          onClick={markSafe}
          className="rounded-2xl bg-white px-16 py-8 text-3xl font-bold text-haven-danger shadow-2xl transition hover:scale-105"
        >
          I'm Okay
        </button>
        <p className="text-xl opacity-80">Calling Haven in {n}s…</p>
      </div>
    </div>
  );
}