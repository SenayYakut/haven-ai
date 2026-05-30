import { createFileRoute } from "@tanstack/react-router";
import { Activity, Cpu, Bell, Clock, Pill, Utensils, Heart } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/haven/Shell";
import { StatusCircle } from "@/components/haven/StatusPill";
import { DeviceGrid } from "@/components/haven/Devices";
import { NotificationList } from "@/components/haven/Notifications";
import { IncomingCall } from "@/components/haven/IncomingCall";
import { SafetyCheck } from "@/components/haven/SafetyCheck";
import { HelpButton } from "@/components/haven/HelpModal";
import { useHaven } from "@/lib/haven-store";

export const Route = createFileRoute("/resident")({
  head: () => ({ meta: [{ title: "Resident — Haven" }] }),
  component: ResidentPage,
});

const nav = [
  { id: "status", label: "Status", icon: Activity },
  { id: "devices", label: "My Devices", icon: Cpu },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: Clock },
];

function ResidentPage() {
  const [tab, setTab] = useState("status");
  return (
    <>
      <Shell role="resident" roleName="Eleanor" avatar="🧓" nav={nav} active={tab} onNavigate={setTab}>
        {tab === "status" && <Status />}
        {tab === "devices" && (
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-semibold text-haven-navy">My Devices</h1>
            <p className="mt-2 text-xl text-muted-foreground">Everything that helps keep you safe.</p>
            <div className="mt-8"><DeviceGrid simple /></div>
          </div>
        )}
        {tab === "alerts" && (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-semibold text-haven-navy">Your Alerts</h1>
            <div className="mt-8"><NotificationList role="resident" large /></div>
          </div>
        )}
        {tab === "history" && <ResidentHistory />}
      </Shell>
      <HelpButton />
      <SafetyCheck />
      <IncomingCall />
    </>
  );
}

function Status() {
  const status = useHaven((s) => s.status);
  return (
    <div className="mx-auto max-w-4xl pb-32">
      <h1 className="text-5xl font-semibold text-haven-navy">Good morning, Eleanor ☀️</h1>

      <div className="mt-12 flex justify-center">
        <StatusCircle level={status} />
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <MedTile />
        <Tile icon={Utensils} title="Upcoming Meals" body="Lunch at 12:30pm" />
        <ContactTile />
      </div>
    </div>
  );
}

function Tile({ icon: Icon, title, body, avatar }: any) {
  return (
    <div className="haven-card p-6">
      <div className="flex items-center gap-3">
        {avatar ? (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-haven-teal/30 text-3xl">{avatar}</div>
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-haven-teal/30 text-haven-navy">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-xl font-semibold text-haven-navy">{title}</h3>
      </div>
      <p className="mt-3 text-lg text-haven-navy/80">{body}</p>
    </div>
  );
}

function MedTile() {
  const [taken, setTaken] = useState(false);
  return (
    <div className="haven-card p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-haven-teal/30 text-haven-navy">
          <Pill className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-haven-navy">Today's Medications</h3>
      </div>
      <p className="mt-3 text-lg text-haven-navy/80">Morning · Lunch · Evening</p>
      <button
        onClick={() => setTaken(true)}
        disabled={taken}
        className={`mt-4 w-full rounded-xl px-4 py-4 text-lg font-bold text-white shadow-lg transition ${taken ? "bg-haven-success" : "bg-haven-navy hover:bg-haven-navy-deep"}`}
      >
        {taken ? "✓ Marked as taken" : "I took them"}
      </button>
    </div>
  );
}

function ContactTile() {
  return (
    <div className="haven-card p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-haven-teal/30 text-3xl">👩</div>
        <h3 className="text-xl font-semibold text-haven-navy">Watching Over You</h3>
      </div>
      <p className="mt-3 text-lg text-haven-navy/80">Your daughter Sarah is your caregiver.</p>
      <button className="mt-4 w-full rounded-xl bg-haven-navy px-4 py-4 text-lg font-bold text-haven-warm shadow-lg hover:bg-haven-navy-deep">
        📞 Call Sarah
      </button>
    </div>
  );
}

function ResidentHistory() {
  const items = [
    { date: "Today", text: "Morning medication reminder" },
    { date: "Yesterday", text: "All medications taken on time" },
    { date: "Mar 3", text: "Missed medication — Sarah called and resolved" },
    { date: "Jan 14", text: "Inactivity alert — you said you were fine" },
    { date: "Nov 2023", text: "Hip strain — visited the hospital, came home in 2 days" },
  ];
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <h1 className="text-4xl font-semibold text-haven-navy">Your History</h1>
      <p className="mt-2 text-xl text-muted-foreground">A simple log of your care.</p>
      <div className="mt-8 space-y-3">
        {items.map((i) => (
          <div key={i.date + i.text} className="haven-card p-5">
            <p className="text-base font-medium uppercase tracking-wider text-muted-foreground">{i.date}</p>
            <p className="mt-1 text-xl text-haven-navy">{i.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}