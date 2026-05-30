import { useState } from "react";
import { Phone, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() => { setCalling(null); setOpen(true); }}
        className="fixed right-6 top-20 z-30 flex items-center gap-2 rounded-2xl bg-haven-danger px-6 py-4 text-xl font-bold text-white shadow-2xl transition hover:scale-105"
        aria-label="Get help"
      >
        <AlertCircle className="h-6 w-6" /> 🆘 Get Help
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Who would you like to contact?</DialogTitle>
          </DialogHeader>
          {calling ? (
            <div className="grid place-items-center gap-4 py-8 text-center">
              <Phone className="h-12 w-12 text-haven-success animate-pulse-ring" />
              <p className="text-2xl font-semibold text-haven-navy">Calling {calling}…</p>
              <button onClick={() => { setCalling(null); setOpen(false); }} className="mt-2 rounded-xl bg-haven-danger px-6 py-3 text-lg font-semibold text-white">
                End call
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              {[
                { label: "📞 Call Sarah (your daughter)", who: "Sarah", color: "bg-haven-navy" },
                { label: "📞 Call Haven Response Team", who: "Haven Response", color: "bg-haven-teal text-haven-navy" },
                { label: "🚨 Call 911", who: "911", color: "bg-haven-danger" },
              ].map((b) => (
                <button
                  key={b.who}
                  onClick={() => setCalling(b.who)}
                  className={`w-full rounded-2xl ${b.color} px-6 py-5 text-left text-xl font-bold text-white shadow-lg transition hover:scale-[1.02]`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}