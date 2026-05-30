import { create } from "zustand";
import { syncScene, triggerEscalation, escalateToEMS as apiEscalateToEMS, patientRespond } from "./api/client";

export type Role = "caregiver" | "resident" | "responder";
export type StatusLevel = "clear" | "attention" | "emergency";
export type ResponderType = "community" | "ems";

export interface Notification {
  id: string;
  scene: number;
  audience: Role | "all";
  severity: "info" | "warning" | "danger";
  icon: string;
  title: string;
  body: string;
  time: string;
  actions?: string[];
  aiGenerated?: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  text: string;
  severity: "info" | "warning" | "danger";
}

interface HavenState {
  scene: number; // 0 = idle, 1..5
  status: StatusLevel;
  notifications: Notification[];
  timeline: TimelineEvent[];
  incomingCall: boolean;
  callAnswered: boolean;
  responderTab: "community" | "ems";
  safetyCheck: boolean; // Scene 3 resident "are you okay?" overlay
  responderType: ResponderType;
  setScene: (n: number) => void;
  advance: () => void;
  reset: () => void;
  setIncomingCall: (v: boolean) => void;
  answerCall: () => void;
  declineCall: () => void;
  setResponderTab: (t: "community" | "ems") => void;
  escalateToEMS: () => void;
  setResponderType: (t: ResponderType) => void;
  markSafe: () => void;
  timeoutSafetyCheck: () => void;
}

const baseTimeline: TimelineEvent[] = [
  { id: "t0", time: "7:14am", text: "Eleanor woke up — bedroom motion", severity: "info" },
  { id: "t1", time: "7:42am", text: "Bathroom motion detected", severity: "info" },
  { id: "t2", time: "8:14am", text: "Front door opened (newspaper)", severity: "info" },
];

export const useHaven = create<HavenState>((set, get) => ({
  scene: 0,
  status: "clear",
  notifications: [],
  timeline: baseTimeline,
  incomingCall: false,
  callAnswered: false,
  responderTab: "community",
  safetyCheck: false,
  responderType: "community",

  setScene: (n) => applyScene(n, set, get),
  advance: () => {
    const next = Math.min(5, get().scene + 1);
    applyScene(next, set, get);
  },
  reset: () =>
    set({
      scene: 0,
      status: "clear",
      notifications: [],
      timeline: baseTimeline,
      incomingCall: false,
      callAnswered: false,
      responderTab: "community",
      safetyCheck: false,
    }),
  setIncomingCall: (v) => set({ incomingCall: v }),
  answerCall: () => set({ incomingCall: false, callAnswered: true }),
  declineCall: () => {
    set({ incomingCall: false, callAnswered: false });
    applyScene(4, set, get);
  },
  setResponderTab: (t) => set({ responderTab: t }),
  escalateToEMS: () => {
    apiEscalateToEMS();
    set({ responderTab: "ems" });
    applyScene(5, set, get);
  },
  setResponderType: (t) => set({ responderType: t, responderTab: t }),
  markSafe: () => {
    patientRespond();
    const tl = [...get().timeline, { id: `safe-${Date.now()}`, time: "Today, 11:43am", text: "Eleanor confirmed she's safe", severity: "info" as const }];
    set({ safetyCheck: false, incomingCall: false, status: "attention", timeline: tl });
  },
  timeoutSafetyCheck: () => set({ safetyCheck: false, incomingCall: true }),
}));

function applyScene(n: number, set: any, get: any) {
  const state = get();
  if (n === 0) {
    get().reset();
    return;
  }
  // Sync to backend (fire-and-forget)
  syncScene(n);
  if (n === 1) triggerEscalation();
  const notes = [...state.notifications];
  const timeline = [...state.timeline];
  let status: StatusLevel = state.status;
  let incomingCall = state.incomingCall;
  let responderTab = state.responderTab;

  if (n >= 1) {
    status = "attention";
    if (!notes.find((x) => x.scene === 1)) {
      notes.push({
        id: "n1c",
        scene: 1,
        audience: "caregiver",
        severity: "warning",
        icon: "Pill",
        title: "Missed morning medication",
        body: "Eleanor's pill box was opened but no pills were dispensed. She's taken her morning dose on time 94% of days this month.",
        time: "Today, 9:31am",
        actions: ["Send Reminder", "Call Eleanor", "Dismiss"],
        aiGenerated: true,
      });
      notes.push({
        id: "n1r",
        scene: 1,
        audience: "resident",
        severity: "info",
        icon: "Pill",
        title: "Good morning Eleanor!",
        body: "Don't forget your morning pills 💊",
        time: "9:31am",
        actions: ["I took them"],
      });
      timeline.push({ id: "tn1", time: "9:31am", text: "Morning medication not taken", severity: "warning" });
    }
  }
  if (n >= 2) {
    if (!notes.find((x) => x.scene === 2)) {
      notes.push({
        id: "n2",
        scene: 2,
        audience: "caregiver",
        severity: "warning",
        icon: "Activity",
        title: "Unusual pattern detected",
        body: "Eleanor hasn't been in the kitchen since 7:15am (normally active by 9am). No fridge activity. Morning medication still not taken. She did not respond to the earlier reminder.",
        time: "Today, 11:30am",
        actions: ["Call Eleanor Now", "I'll visit her", "Contact backup"],
        aiGenerated: true,
      });
      timeline.push({ id: "tn2", time: "11:30am", text: "No kitchen activity for 4 hours", severity: "warning" });
    }
  }
  if (n >= 3) {
    status = "emergency";
    // Scene 3 first triggers the resident safety check; call kicks in after timeout.
    if (!notes.find((x) => x.scene === 3)) {
      notes.push({
        id: "n3",
        scene: 3,
        audience: "all",
        severity: "danger",
        icon: "AlertTriangle",
        title: "Possible fall detected — Living Room",
        body: "Eleanor's smartwatch detected a fall at 11:42am. A loud impact sound was recorded. No motion for 4 min 12 sec. Stove left on (18 min). Faucet running in kitchen.",
        time: "Today, 11:42am",
        aiGenerated: true,
      });
      timeline.push({ id: "tn3", time: "11:42am", text: "Fall detected — Living Room", severity: "danger" });
    }
  }
  if (n >= 4) {
    if (!notes.find((x) => x.scene === 4)) {
      notes.push({
        id: "n4",
        scene: 4,
        audience: "caregiver",
        severity: "danger",
        icon: "Users",
        title: "Community Responder dispatched",
        body: "Haven has contacted a Community Responder and they are being dispatched to Eleanor's home. You will be updated as the situation develops.",
        time: "Today, 11:48am",
        aiGenerated: true,
      });
      notes.push({
        id: "n4r",
        scene: 4,
        audience: "responder",
        severity: "warning",
        icon: "ClipboardList",
        title: "New case assigned — Eleanor Tran, 78",
        body: "Eleanor, 78, at 142 Maple Street, was flagged at 11:42am following a detected fall in the living room. She has not responded to automated check-ins or a direct call. Stove on for 22 minutes. No motion for 8 minutes. History: Type 2 Diabetes, Hypertension.",
        time: "Today, 11:48am",
        aiGenerated: true,
      });
      timeline.push({ id: "tn4", time: "11:48am", text: "Community Responder assigned", severity: "danger" });
    }
  }
  if (n >= 5) {
    responderTab = "ems";
    if (!notes.find((x) => x.scene === 5)) {
      notes.push({
        id: "n5",
        scene: 5,
        audience: "caregiver",
        severity: "danger",
        icon: "Siren",
        title: "Emergency Services en route — ETA 7 min",
        body: "Emergency services have been contacted and are en route to Eleanor's home. ETA: 7 minutes. We will continue to update you.",
        time: "Today, 11:52am",
        aiGenerated: true,
      });
      notes.push({
        id: "n5r",
        scene: 5,
        audience: "responder",
        severity: "danger",
        icon: "Siren",
        title: "Escalated to Emergency Services",
        body: "Acuity level upgraded. EMS dispatched. ETA 7 minutes. Active hazards: stove on (26 min), faucet running.",
        time: "Today, 11:52am",
        aiGenerated: true,
      });
      timeline.push({ id: "tn5", time: "11:52am", text: "Escalated to EMS — en route", severity: "danger" });
    }
  }

  set({
    scene: n,
    status,
    notifications: notes,
    timeline,
    incomingCall: n === 3 ? state.incomingCall : false,
    safetyCheck: n === 3 ? true : false,
    responderTab,
  });
}