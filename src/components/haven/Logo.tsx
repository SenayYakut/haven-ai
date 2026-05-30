import { Heart, Home } from "lucide-react";

export function HavenLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid place-items-center rounded-xl bg-haven-navy text-haven-warm" style={{ width: size + 12, height: size + 12 }}>
        <Home size={size * 0.7} strokeWidth={2.2} />
        <Heart size={size * 0.35} fill="currentColor" className="absolute text-haven-teal" style={{ top: "55%", left: "50%", transform: "translate(-50%, -50%)" }} />
      </div>
      <span className="text-xl font-semibold tracking-tight text-haven-navy">Haven</span>
    </div>
  );
}