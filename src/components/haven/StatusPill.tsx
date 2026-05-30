import type { StatusLevel } from "@/lib/haven-store";

const map = {
  clear: { dot: "bg-haven-success", text: "All Clear", emoji: "🟢", ring: "ring-haven-success/30" },
  attention: { dot: "bg-haven-warning", text: "Needs Attention", emoji: "🟡", ring: "ring-haven-warning/30" },
  emergency: { dot: "bg-haven-danger", text: "Emergency", emoji: "🔴", ring: "ring-haven-danger/30" },
};

export function StatusPill({ level, size = "md" }: { level: StatusLevel; size?: "md" | "lg" }) {
  const s = map[level];
  const sizing = size === "lg" ? "text-2xl px-6 py-3" : "text-base px-4 py-1.5";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-card ring-2 ${s.ring} ${sizing} font-semibold text-haven-navy`}>
      <span className={`relative inline-block h-3 w-3 rounded-full ${s.dot}`}>
        {level === "emergency" && <span className={`absolute inset-0 rounded-full ${s.dot} animate-pulse-ring`} />}
      </span>
      {s.text}
    </span>
  );
}

export function StatusCircle({ level, label }: { level: StatusLevel; label?: string }) {
  const s = map[level];
  const labels = {
    clear: "You're all good",
    attention: "Someone is checking on you",
    emergency: "Help is on the way",
  };
  const color = level === "clear" ? "bg-haven-success" : level === "attention" ? "bg-haven-warning" : "bg-haven-danger";
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative grid h-44 w-44 place-items-center rounded-full ${color} text-white shadow-2xl`}>
        <span className="text-6xl">{s.emoji}</span>
        {level === "emergency" && <span className={`absolute inset-0 rounded-full ${color} animate-pulse-ring`} />}
      </div>
      <p className="text-3xl font-semibold text-haven-navy">{label ?? labels[level]}</p>
    </div>
  );
}