import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Play, RotateCcw, LogOut, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { HavenLogo } from "./Logo";
import { useHaven, type Role } from "@/lib/haven-store";
import { Button } from "@/components/ui/button";

interface NavItem { id: string; label: string; icon: LucideIcon }

interface ShellProps {
  role: Role;
  roleName: string;
  avatar: string;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}

export function Shell({ role, roleName, avatar, nav, active, onNavigate, children }: ShellProps) {
  const navigate = useNavigate();
  const { scene, notifications, advance, reset } = useHaven();
  const badge = notifications.filter((n) => n.audience === role || n.audience === "all").length;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-haven-warm/90 px-6 backdrop-blur">
        <HavenLogo size={22} />
        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 hover:bg-muted" aria-label="Notifications">
            <Bell className="h-5 w-5 text-haven-navy" />
            {badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-haven-danger px-1 text-[11px] font-semibold text-white">
                {badge}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-haven-teal/30 text-lg">{avatar}</div>
            <span className="text-sm font-medium text-haven-navy">{roleName}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/" })}>
            <LogOut className="h-4 w-4" /> Switch Role
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-card/40 p-4 md:block">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-haven-navy text-haven-warm"
                      : "text-haven-navy hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-6 py-6 md:px-10 md:py-8">{children}</main>
      </div>

      {scene > 0 && <SceneChip />}

      <div className="fixed bottom-6 right-6 z-40 flex gap-2">
        {scene > 0 && (
          <Button variant="outline" onClick={reset} className="shadow-lg">
            <RotateCcw className="h-4 w-4" /> Reset Demo
          </Button>
        )}
        <Button
          onClick={() => (scene === 0 ? advance() : advance())}
          className="bg-haven-navy text-haven-warm shadow-lg hover:bg-haven-navy-deep"
          disabled={scene >= 5}
        >
          <Play className="h-4 w-4" />
          {scene === 0 ? "Start Demo" : scene >= 5 ? "Demo Complete" : `Advance — Scene ${scene + 1}`}
        </Button>
      </div>
    </div>
  );
}

function SceneChip() {
  const scene = useHaven((s) => s.scene);
  const labels = ["", "Missed Medication", "No Activity Pattern", "Fall Detected", "Responder Assigned", "EMS Escalation"];
  return (
    <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 animate-slide-up rounded-full border border-border bg-card px-5 py-2 shadow-lg">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold text-haven-navy">Scene {scene} of 5</span>
        <span className="text-muted-foreground">· {labels[scene]}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i <= scene ? "bg-haven-teal" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}