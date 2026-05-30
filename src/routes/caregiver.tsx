import { createFileRoute } from "@tanstack/react-router";
import { Activity, Cpu, Bell, Clock, Phone } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/haven/Shell";
import { StatusPill } from "@/components/haven/StatusPill";
import { DeviceGrid } from "@/components/haven/Devices";
import { NotificationList } from "@/components/haven/Notifications";
import { useHaven } from "@/lib/haven-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/caregiver")({
  head: () => ({ meta: [{ title: "Caregiver — Haven" }] }),
  component: CaregiverPage,
});

const nav = [
  { id: "status", label: "Status", icon: Activity },
  { id: "devices", label: "Devices", icon: Cpu },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: Clock },
];

function CaregiverPage() {
  const [tab, setTab] = useState("status");
  return (
    <Shell role="caregiver" roleName="Sarah Tran" avatar="👩" nav={nav} active={tab} onNavigate={setTab}>
      {tab === "status" && <Status />}
      {tab === "devices" && (
        <Section title="Eleanor's Devices" subtitle="8 connected devices monitoring her home">
          <DeviceGrid />
        </Section>
      )}
      {tab === "alerts" && (
        <Section title="Notifications" subtitle="Live updates from Eleanor's Haven system">
          <NotificationList role="caregiver" />
        </Section>
      )}
      {tab === "history" && <History />}
    </Shell>
  );
}

function Section({ title, subtitle, children }: any) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold text-haven-navy">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Status() {
  const { status, timeline } = useHaven();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Eleanor's Status</p>
          <h1 className="mt-1 text-4xl font-semibold text-haven-navy">Eleanor Tran</h1>
        </div>
        <StatusPill level={status} size="lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Last seen active" value="11:42am" />
        <Stat label="Last meal" value="Yesterday 6:30pm" />
        <Stat label="Morning meds" value={status === "clear" ? "Taken 7:48am" : "Not taken"} warn={status !== "clear"} />
        <Stat label="Sleep quality" value="7h 12m · Good" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="haven-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-haven-navy">Today's Activity</h2>
          <ol className="mt-4 space-y-3 border-l-2 border-border pl-5">
            {timeline.slice().reverse().map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ${
                    e.severity === "danger" ? "bg-haven-danger" : e.severity === "warning" ? "bg-haven-warning" : "bg-haven-teal"
                  }`}
                />
                <p className="text-sm font-medium text-haven-navy">{e.time}</p>
                <p className="text-sm text-muted-foreground">{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="haven-card flex flex-col p-6">
          <h2 className="text-lg font-semibold text-haven-navy">Quick Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">Reach Eleanor directly.</p>
          <Button className="mt-auto bg-haven-navy text-haven-warm hover:bg-haven-navy-deep">
            <Phone className="h-4 w-4" /> Call Eleanor
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`haven-card p-4 ${warn ? "ring-2 ring-haven-warning/40" : ""}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-haven-navy">{value}</p>
    </div>
  );
}

function History() {
  const incidents = [
    { date: "Mar 3, 2026", text: "Missed medication x2 days — resolved by caregiver call" },
    { date: "Jan 14, 2026", text: "Inactivity alert — false alarm confirmed by Eleanor" },
    { date: "Oct 22, 2025", text: "Bathroom motion irregularity — auto-resolved" },
  ];
  const hospitalizations = [
    { date: "Nov 2023", text: "Hip strain — discharged after 2 days, no surgery" },
    { date: "Aug 2022", text: "Mild dehydration — overnight observation" },
  ];
  return (
    <Section title="Eleanor's Medical History" subtitle="Comprehensive record for caregivers">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Conditions">
          <ul className="list-disc pl-5 text-sm text-haven-navy/90">
            <li>Type 2 Diabetes</li>
            <li>Hypertension</li>
          </ul>
        </Card>
        <Card title="Medications">
          <ul className="space-y-1 text-sm text-haven-navy/90">
            <li>Metformin 500mg — Morning</li>
            <li>Lisinopril 10mg — Evening</li>
          </ul>
        </Card>
        <Card title="Allergies"><p className="text-sm text-haven-navy/90">Penicillin</p></Card>
        <Card title="Primary Physician">
          <p className="text-sm text-haven-navy/90">Dr. Nguyen</p>
          <Button size="sm" className="mt-3 bg-haven-navy text-haven-warm hover:bg-haven-navy-deep">
            <Phone className="h-4 w-4" /> Contact
          </Button>
        </Card>
        <Card title="Insurance"><p className="text-sm text-haven-navy/90">Medicare</p></Card>
        <Card title="Past Incidents">
          <ul className="space-y-2 text-sm">
            {incidents.map((i) => (
              <li key={i.date} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium text-haven-navy">{i.date}</p>
                <p className="text-muted-foreground">{i.text}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Hospitalizations" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {hospitalizations.map((i) => (
              <li key={i.date} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium text-haven-navy">{i.date}</p>
                <p className="text-muted-foreground">{i.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

function Card({ title, children, className = "" }: { title: string; children: any; className?: string }) {
  return (
    <div className={`haven-card p-5 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}