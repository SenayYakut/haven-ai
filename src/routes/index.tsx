import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { HavenLogo } from "@/components/haven/Logo";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useHaven } from "@/lib/haven-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haven — Safety, dignity, and independence" },
      { name: "description", content: "AI-powered elder safety and fall detection platform for residents, caregivers, and responders." },
      { property: "og:title", content: "Haven — Elder Safety Platform" },
      { property: "og:description", content: "Safety, dignity, and independence for those you love." },
    ],
  }),
  component: Index,
});

function Index() {
  const reset = useHaven((s) => s.reset);
  const setResponderType = useHaven((s) => s.setResponderType);
  const navigate = useNavigate();
  const [step, setStep] = useState<"role" | "responder">("role");
  useEffect(() => { reset(); }, [reset]);

  const roles = [
    { to: "/caregiver", emoji: "👨‍👩‍👧", title: "I'm a Caregiver", sub: "Sarah, Eleanor's daughter", tint: "from-haven-teal/20 to-haven-teal/5" },
    { to: "/resident", emoji: "🧓", title: "I'm a Resident", sub: "Eleanor, 78", tint: "from-haven-warning/20 to-haven-warning/5" },
  ] as const;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-haven-warm to-haven-teal/10 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <HavenLogo size={48} />
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-haven-navy md:text-5xl">
            Safety, dignity, and independence for those you love.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {step === "role" ? "Choose a role to explore the Haven demo." : "What type of responder are you?"}
          </p>
        </div>

        {step === "role" ? (
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {roles.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className={`group haven-card relative overflow-hidden p-8 transition hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${r.tint}`}
              >
                <div className="text-6xl">{r.emoji}</div>
                <h2 className="mt-6 text-2xl font-semibold text-haven-navy">{r.title}</h2>
                <p className="mt-1 text-muted-foreground">{r.sub}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-haven-navy">
                  Enter dashboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
            <button
              onClick={() => setStep("responder")}
              className="group haven-card relative overflow-hidden p-8 text-left transition hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-haven-danger/15 to-haven-danger/5"
            >
              <div className="text-6xl">🚑</div>
              <h2 className="mt-6 text-2xl font-semibold text-haven-navy">I'm a Responder</h2>
              <p className="mt-1 text-muted-foreground">Haven Response Network</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-haven-navy">
                Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        ) : (
          <div className="mt-16">
            <button onClick={() => setStep("role")} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-haven-navy hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { type: "community" as const, emoji: "🏘️", title: "Community Responder", sub: "Living-in-Place Village", tint: "from-haven-warning/20 to-haven-warning/5" },
                { type: "ems" as const, emoji: "🚨", title: "Emergency Services", sub: "EMS / 911", tint: "from-haven-danger/20 to-haven-danger/5" },
              ].map((r) => (
                <button
                  key={r.type}
                  onClick={() => { setResponderType(r.type); navigate({ to: "/responder" }); }}
                  className={`group haven-card relative overflow-hidden p-8 text-left transition hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${r.tint}`}
                >
                  <div className="text-6xl">{r.emoji}</div>
                  <h2 className="mt-6 text-2xl font-semibold text-haven-navy">{r.title}</h2>
                  <p className="mt-1 text-muted-foreground">{r.sub}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-haven-navy">
                    Enter dashboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-16 text-center text-sm text-muted-foreground">
          Demo · Use "Switch Role" inside any dashboard to jump between views.
        </p>
      </div>
    </div>
  );
}
