import { Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useHaven } from "@/lib/haven-store";
import { HavenLogo } from "./Logo";

export function IncomingCall() {
  const { incomingCall, answerCall, declineCall } = useHaven();
  const [countdown, setCountdown] = useState(12);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!incomingCall) {
      setCountdown(12);
      setAnswered(false);
      return;
    }
    const i = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(i);
          declineCall();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [incomingCall, declineCall]);

  if (!incomingCall) return null;

  if (answered) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-haven-navy-deep text-haven-warm">
        <div className="max-w-md p-8 text-center">
          <p className="text-3xl font-semibold">Call connected</p>
          <p className="mt-4 text-2xl">Are you okay?</p>
          <p className="mt-2 text-xl opacity-80">Tap YES if you're safe.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => { answerCall(); useHaven.getState().markSafe(); }} className="rounded-xl bg-haven-success px-10 py-5 text-2xl font-bold">
              YES
            </button>
            <button onClick={() => { answerCall(); useHaven.getState().declineCall(); }} className="rounded-xl bg-haven-danger px-10 py-5 text-2xl font-bold">
              NO
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-haven-navy-deep text-haven-warm animate-slide-up">
      <div className="flex flex-col items-center gap-8 p-8 text-center">
        <div className="rounded-2xl bg-haven-warm/10 p-6">
          <HavenLogo size={48} />
        </div>
        <div>
          <p className="text-3xl font-semibold">Haven Safety Check</p>
          <p className="mt-2 text-xl opacity-70">Incoming call · {countdown}s</p>
        </div>
        <div className="flex gap-8">
          <button
            onClick={() => declineCall()}
            className="grid h-20 w-20 place-items-center rounded-full bg-haven-danger shadow-2xl transition hover:scale-105"
            aria-label="Decline"
          >
            <PhoneOff className="h-9 w-9" />
          </button>
          <button
            onClick={() => setAnswered(true)}
            className="grid h-20 w-20 place-items-center rounded-full bg-haven-success shadow-2xl transition hover:scale-105 animate-pulse-ring"
            aria-label="Answer"
          >
            <Phone className="h-9 w-9" />
          </button>
        </div>
      </div>
    </div>
  );
}