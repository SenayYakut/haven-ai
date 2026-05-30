import { Watch, Pill, Plug, Lightbulb, DoorOpen, Camera, Thermometer, Bath, Wrench, Wand2, X } from "lucide-react";
import { useState } from "react";
import { useHaven } from "@/lib/haven-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const devices = [
  { icon: Watch, name: "Smart Watch", detail: "Heart rate: 72bpm · 340 steps", simple: "Connected ✓" },
  { icon: Pill, name: "Smart Pill Box", detail: "Morning dose: ⚠️ Not taken", simple: "Check device", warnFromScene: 1 },
  { icon: Plug, name: "Smart Plugs", detail: "Kitchen: active · Bedroom: active", simple: "Connected ✓" },
  { icon: Lightbulb, name: "Smart Lights", detail: "Living room: on since 7am", simple: "Connected ✓" },
  { icon: DoorOpen, name: "Door Sensor", detail: "Last opened: 8:14am", simple: "Connected ✓" },
  { icon: Camera, name: "Indoor Camera", detail: "Active · motion detection on", simple: "Connected ✓" },
  { icon: Thermometer, name: "Environment Sensor", detail: "Temp: 71°F · CO2: normal", simple: "Connected ✓" },
  { icon: Bath, name: "Bathroom Motion Sensor", detail: "Last triggered: 7:42am", simple: "Connected ✓" },
];

export function DeviceGrid({ simple = false }: { simple?: boolean }) {
  const scene = useHaven((s) => s.scene);
  const [aaaOpen, setAaaOpen] = useState<string | null>(null);
  const [troubleshootFor, setTroubleshootFor] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  return (
    <>
    <div className={`grid gap-4 ${simple ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
      {devices.map((d) => {
        const Icon = d.icon;
        const warn = d.warnFromScene !== undefined && scene >= d.warnFromScene;
        return (
          <div key={d.name} className={`haven-card p-5 ${warn && !simple ? "ring-2 ring-haven-warning/40" : ""}`}>
            <div className="flex items-start gap-4">
              <div className={`grid place-items-center rounded-lg p-3 ${warn ? "bg-haven-warning/20 text-haven-navy" : "bg-haven-teal/20 text-haven-navy"}`}>
                <Icon className={simple ? "h-8 w-8" : "h-6 w-6"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-haven-navy ${simple ? "text-xl" : "text-base"}`}>{d.name}</h3>
                  <span className={`inline-block h-2 w-2 rounded-full ${warn ? "bg-haven-warning" : "bg-haven-success"}`} />
                </div>
                <p className={`mt-1 text-muted-foreground ${simple ? "text-lg" : "text-sm"}`}>
                  {simple ? (warn ? "Check device" : "Connected ✓") : d.detail}
                </p>
              </div>
            </div>

            {warn && !simple && (
              <div className="mt-4 rounded-lg border-l-4 border-haven-warning bg-haven-warning/10 p-3">
                <p className="text-sm font-semibold text-haven-navy">⚠️ This sensor needs attention</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTroubleshootFor(troubleshootFor === d.name ? null : d.name)}>
                    <Wrench className="h-3.5 w-3.5" /> Troubleshoot
                  </Button>
                  <Button size="sm" className="bg-haven-navy text-haven-warm hover:bg-haven-navy-deep" onClick={() => setAaaOpen(d.name)}>
                    <Wand2 className="h-3.5 w-3.5" /> Request AAA Assist
                  </Button>
                </div>
                {troubleshootFor === d.name && (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-haven-navy/80">
                    <li>Check that the device has power and the indicator light is on.</li>
                    <li>Confirm Wi-Fi connectivity (Haven hub light should be solid green).</li>
                    <li>Re-pair the device by holding the button for 5 seconds.</li>
                    <li>If issue persists, request AAA Assist for an in-home technician.</li>
                  </ol>
                )}
                {confirmed === d.name && (
                  <p className="mt-3 text-sm font-medium text-haven-success">✓ AAA technician dispatched — ETA within 24 hours.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <Dialog open={!!aaaOpen} onOpenChange={(o) => !o && setAaaOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request AAA Assist</DialogTitle>
          <DialogDescription>
            A Haven AAA technician will be dispatched to Eleanor's home to fix the
            <span className="font-medium text-haven-navy"> {aaaOpen}</span>. Estimated arrival: within 24 hours. Confirm?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAaaOpen(null)}>Cancel</Button>
          <Button className="bg-haven-navy text-haven-warm hover:bg-haven-navy-deep" onClick={() => { setConfirmed(aaaOpen); setAaaOpen(null); }}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}