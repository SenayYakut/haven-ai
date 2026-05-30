import { createFileRoute } from "@tanstack/react-router";
import { Activity, Cpu, Bell, Clock, MapPin, ChevronDown, Sparkles, Check, QrCode, ShieldCheck, FileText } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/haven/Shell";
import { NotificationList } from "@/components/haven/Notifications";
import { useHaven } from "@/lib/haven-store";
import { Button } from "@/components/ui/button";
import { verifyPin, fetchClinicalCard, qrImageUrl, fetchScanLogs } from "@/lib/api/client";

export const Route = createFileRoute("/responder")({
  head: () => ({ meta: [{ title: "Responder — Haven" }] }),
  component: ResponderPage,
});

const nav = [
  { id: "cases", label: "Cases", icon: Activity },
  { id: "qr", label: "QR Access", icon: QrCode },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Cpu },
];

function ResponderPage() {
  const [tab, setTab] = useState("cases");
  return (
    <Shell role="responder" roleName="Haven Network" avatar="🚑" nav={nav} active={tab} onNavigate={setTab}>
      {tab === "cases" && <Cases />}
      {tab === "qr" && <QRAccessPanel />}
      {tab === "alerts" && (
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold text-haven-navy">Alerts</h1>
          <div className="mt-6"><NotificationList role="responder" /></div>
        </div>
      )}
      {tab === "history" && (
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold text-haven-navy">Case History</h1>
          <p className="mt-2 text-muted-foreground">Past incidents for Eleanor Tran.</p>
          <div className="mt-6 haven-card divide-y divide-border">
            {[
              { date: "Mar 3, 2026", trigger: "Missed medication", acuity: "Low", responder: "Caregiver (Sarah)", outcome: "Resolved" },
              { date: "Jan 14, 2026", trigger: "Inactivity alert", acuity: "Moderate", responder: "Community Village", outcome: "False alarm" },
              { date: "Oct 22, 2025", trigger: "Bathroom motion irregular", acuity: "Low", responder: "Auto-resolved", outcome: "Resolved" },
            ].map((c) => (
              <div key={c.date} className="grid grid-cols-2 gap-2 p-4 md:grid-cols-5">
                <span className="text-sm font-medium text-haven-navy">{c.date}</span>
                <span className="text-sm text-muted-foreground">{c.trigger}</span>
                <span className="text-sm">{c.acuity}</span>
                <span className="text-sm text-muted-foreground">{c.responder}</span>
                <span className="text-sm font-medium text-haven-success">{c.outcome}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "settings" && (
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold text-haven-navy">Settings</h1>
        </div>
      )}
    </Shell>
  );
}

function Cases() {
  const { responderTab, setResponderTab, scene, escalateToEMS } = useHaven();
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-haven-navy">Active Cases</h1>
      </div>

      <div className="mt-6 inline-flex rounded-xl border border-border bg-card p-1">
        {[
          { id: "community", label: "Community Responder" },
          { id: "ems", label: "Emergency Services" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setResponderTab(t.id as any)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              responderTab === t.id ? "bg-haven-navy text-haven-warm" : "text-haven-navy hover:bg-muted"
            }`}
          >
            {t.label}
            {t.id === "ems" && scene >= 5 && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-haven-danger animate-pulse-ring" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {scene < 4 ? (
          <div className="haven-card grid place-items-center p-16 text-center text-muted-foreground">
            <p>No cases currently assigned. Advance the demo to scene 4 to receive Eleanor's case.</p>
          </div>
        ) : (
          <CaseCard isEMS={responderTab === "ems"} onEscalate={escalateToEMS} />
        )}
      </div>
    </div>
  );
}

function CaseCard({ isEMS, onEscalate }: { isEMS: boolean; onEscalate: () => void }) {
  const [open, setOpen] = useState(true);
  const [enRoute, setEnRoute] = useState(false);
  return (
    <div className="haven-card animate-slide-up overflow-hidden">
      <div className={`flex items-center justify-between p-5 ${isEMS ? "bg-haven-danger/10" : "bg-haven-warning/10"}`}>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-haven-teal/30 text-3xl">🧓</div>
          <div>
            <h2 className="text-xl font-semibold text-haven-navy">Eleanor Tran, 78</h2>
            <p className="text-sm text-muted-foreground">142 Maple Street · {isEMS ? "ETA: 7 min" : "List Assist → Community Village → EMS"}</p>
          </div>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${isEMS ? "bg-haven-danger text-white" : "bg-haven-warning/40 text-haven-navy"}`}>
          {isEMS ? "🔴 Emergency" : "🟡 Moderate–High"}
        </span>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {!isEMS && <EscalationLadder current="village" />}
          {isEMS && <EscalationLadder current="ems" />}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Incident Summary</p>
            <p className="mt-2 text-sm leading-relaxed text-haven-navy">
              Eleanor, 78, residing at 142 Maple Street, was flagged at 11:42am following a detected fall in the
              living room. She has not responded to automated check-ins or a direct call. The stove has been on for
              {isEMS ? " 26 " : " 22 "}minutes. No motion detected for {isEMS ? "12" : "8"} minutes. Her medical history
              includes Type 2 Diabetes and Hypertension. Preferred language: English.
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Generated by Haven AI
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Fall location" value="Living Room" />
            <Info label="Inactivity" value={isEMS ? "12 min" : "8 min"} />
            <Info label="🔥 Active hazard" value="Stove on" />
            <Info label="💧 Active hazard" value="Faucet running" />
          </div>

          {isEMS && (
            <div className="haven-card overflow-hidden bg-haven-navy/5 p-0">
              <div className="grid place-items-center bg-gradient-to-br from-haven-teal/30 to-haven-navy/10 p-12">
                <MapPin className="h-12 w-12 text-haven-danger animate-pulse-ring" />
                <p className="mt-3 text-sm font-medium text-haven-navy">142 Maple Street</p>
                <p className="text-xs text-muted-foreground">GPS pin · static map</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left"
          >
            <span className="font-semibold text-haven-navy">Medical History</span>
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <Row label="Conditions" value="Type 2 Diabetes, Hypertension" />
              <Row label="Medications" value="Metformin, Lisinopril" />
              <Row label="Allergies" value="Penicillin" />
              <Row label="Primary Physician" value="Dr. Nguyen" />
              <Row label="Insurance" value="Medicare" />
              <Row label="Preferred Language" value="English" />
              <Row label="Cultural notes" value="Vietnamese-American background, family-oriented" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setEnRoute(true)}
            disabled={enRoute}
            className="w-full bg-haven-success text-white hover:opacity-90"
          >
            {enRoute ? (<><Check className="h-4 w-4" /> En Route Confirmed</>) : "Confirm En Route"}
          </Button>
          {!isEMS && (
            <Button onClick={onEscalate} className="w-full bg-haven-danger text-white hover:opacity-90">
              Escalate to EMS
            </Button>
          )}
          <Button variant="outline" className="w-full">Mark Resolved</Button>
        </div>
      </div>
    </div>
  );
}

function EscalationLadder({ current }: { current: "fire" | "list" | "village" | "ems" }) {
  const tiers = [
    { id: "fire", label: "Local Fire/EMS" },
    { id: "list", label: "List Assist" },
    { id: "village", label: "Community Village" },
    { id: "ems", label: "Emergency Services" },
  ] as const;
  const idx = tiers.findIndex((t) => t.id === current);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalation Tier</p>
      <div className="mt-3 flex items-center gap-2">
        {tiers.map((t, i) => {
          const active = i === idx;
          const passed = i < idx;
          return (
            <div key={t.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${
                  active
                    ? "border-haven-danger bg-haven-danger text-white shadow-lg"
                    : passed
                    ? "border-haven-warning/50 bg-haven-warning/20 text-haven-navy"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {t.label}
              </div>
              {i < tiers.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-haven-navy">{value}</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-haven-navy">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QR Emergency Access Panel
// ---------------------------------------------------------------------------

function QRAccessPanel() {
  const [pin, setPin] = useState("");
  const [responderType, setResponderType] = useState("ems");
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  async function handleVerify() {
    setLoading(true);
    setError("");
    setCard(null);
    const result = await verifyPin(pin, responderType);
    if (!result) {
      setError("Invalid PIN. Basic access only.");
      setLoading(false);
      return;
    }
    const clinicalCard = await fetchClinicalCard(result.token);
    setCard(clinicalCard);
    setLoading(false);
  }

  async function handleShowLogs() {
    const data = await fetchScanLogs();
    setLogs(data ?? []);
    setShowLogs(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-haven-navy">Emergency QR Access</h1>
        <p className="mt-1 text-muted-foreground">Eleanor's QR code gives responders instant access to her medical record.</p>
      </div>

      {/* QR Code display */}
      <div className="haven-card flex flex-col items-center gap-4 p-8">
        <QrCode className="h-6 w-6 text-haven-teal" />
        <p className="text-sm font-semibold text-haven-navy">Eleanor Tran — Scan to access emergency record</p>
        <img
          src={qrImageUrl()}
          alt="Eleanor QR code"
          className="h-48 w-48 rounded-xl border border-border"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <p className="text-xs text-muted-foreground">Place on: watch · necklace · fridge · front door · wallet</p>
      </div>

      {/* PIN verification */}
      <div className="haven-card space-y-4 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-haven-teal" />
          <h2 className="text-lg font-semibold text-haven-navy">Responder PIN Verification</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Demo PINs: <code className="rounded bg-muted px-1">EMS911</code> · <code className="rounded bg-muted px-1">FIRE411</code> · <code className="rounded bg-muted px-1">SARAH123</code>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-haven-navy focus:outline-none focus:ring-2 focus:ring-haven-teal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Responder Type</label>
            <select
              value={responderType}
              onChange={(e) => setResponderType(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-haven-navy focus:outline-none focus:ring-2 focus:ring-haven-teal"
            >
              <option value="ems">EMS</option>
              <option value="fire">Fire</option>
              <option value="hospital">Hospital</option>
              <option value="family">Family</option>
              <option value="care_coordinator">Care Coordinator</option>
            </select>
          </div>
        </div>
        {error && <p className="rounded-lg bg-haven-danger/10 px-4 py-2 text-sm text-haven-danger">{error}</p>}
        <Button
          onClick={handleVerify}
          disabled={loading || !pin}
          className="w-full bg-haven-navy text-haven-warm hover:opacity-90"
        >
          {loading ? "Verifying…" : "Unlock Full Clinical Record"}
        </Button>
      </div>

      {/* Clinical card result */}
      {card && (
        <div className="haven-card space-y-4 p-6 animate-slide-up">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-haven-success" />
            <h2 className="text-lg font-semibold text-haven-navy">Full Clinical Card — Access Granted</h2>
            <span className="ml-auto rounded-full bg-haven-success/20 px-3 py-0.5 text-xs font-semibold text-haven-success">
              {card.uses_remaining} uses remaining
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Name" value={card.patient?.name} />
            <Row label="Age" value={String(card.patient?.age)} />
            <Row label="PCP Phone" value={card.patient?.pcp_phone} />
            <Row label="Emergency Contact" value={`${card.patient?.emergency_contact?.name} — ${card.patient?.emergency_contact?.phone}`} />
          </div>
          {card.clinical && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wellness Score</p>
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-haven-danger transition-all"
                      style={{ width: `${card.clinical.wellness_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-haven-danger">{card.clinical.wellness_score}</span>
                </div>
              </div>
              {card.clinical.missed_medications?.length > 0 && (
                <div className="rounded-lg border border-haven-warning/50 bg-haven-warning/10 p-3">
                  <p className="text-xs font-semibold text-haven-warning">⚠ Missed Medications (last 2 days)</p>
                  <p className="mt-1 text-sm text-haven-navy">{card.clinical.missed_medications.join(", ")}</p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medications</p>
                <div className="space-y-1">
                  {card.clinical.medications?.map((m: any) => (
                    <div key={m.name} className="flex justify-between text-sm">
                      <span className="text-haven-navy">{m.name} {m.dosage}</span>
                      <span className="text-muted-foreground">{m.schedule}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Known Safe Activity</p>
                <p className="text-sm text-haven-navy">{card.clinical.last_known_safe_activity}</p>
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground">Token expires: {new Date(card.expires_at).toLocaleTimeString()}</p>
        </div>
      )}

      {/* Audit log */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">HIPAA audit trail logged for every scan.</p>
        <Button variant="outline" size="sm" onClick={handleShowLogs}>View Scan Logs</Button>
      </div>
      {showLogs && (
        <div className="haven-card divide-y divide-border p-0 overflow-hidden">
          {logs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No scans yet.</p>}
          {logs.map((log: any) => (
            <div key={log.id} className="grid grid-cols-3 gap-2 p-4 text-sm">
              <span className="text-muted-foreground">{new Date(log.scanned_at).toLocaleTimeString()}</span>
              <span className="font-medium text-haven-navy capitalize">{log.responder_type}</span>
              <span className={`font-semibold ${log.access_level === "full_clinical" ? "text-haven-success" : "text-haven-warning"}`}>
                {log.access_level === "full_clinical" ? "Full Clinical" : "Basic"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}