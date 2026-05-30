const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const PATIENT_ID = "eleanor-001";

async function post(path: string, body?: unknown) {
  try {
    await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fire-and-forget — never block the UI
  }
}

async function get(path: string) {
  try {
    const r = await fetch(`${API}${path}`);
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

/** Sync demo scene to backend — updates wellness, escalation, logs events */
export function syncScene(scene: number) {
  post(`/patients/${PATIENT_ID}/scene`, { scene });
}

/** Fetch Eleanor's current wellness + 72hr trend */
export function fetchWellness() {
  return get(`/patients/${PATIENT_ID}/wellness`);
}

/** Fetch latest sensor events */
export function fetchSensorEvents() {
  return get(`/patients/${PATIENT_ID}/sensor-events`);
}

/** Patient confirms she's okay — cancels escalation */
export function patientRespond() {
  post(`/patients/${PATIENT_ID}/respond`, { response: "YES" });
}

/** Trigger full escalation ladder from backend */
export function triggerEscalation() {
  post(`/patients/${PATIENT_ID}/escalation/trigger`);
}

/** Escalate to EMS (scene 5) */
export function escalateToEMS() {
  post(`/patients/${PATIENT_ID}/escalation/step3`);
}

/** Verify EMS PIN and get clinical access token */
export async function verifyPin(
  pin: string,
  responderType: string,
  gpsLocation?: string,
): Promise<{ token: string; access_level: string; expires_at: string } | null> {
  try {
    const r = await fetch(`${API}/emergency/${PATIENT_ID}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, responder_type: responderType, gps_location: gpsLocation }),
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

/** Fetch full clinical card using token */
export async function fetchClinicalCard(token: string) {
  return get(`/emergency/${PATIENT_ID}/card/${token}`);
}

/** QR code image URL for Eleanor */
export function qrImageUrl() {
  return `${API}/patients/${PATIENT_ID}/qr?base_url=${encodeURIComponent(API)}`;
}

/** Fetch scan audit logs */
export function fetchScanLogs() {
  return get(`/patients/${PATIENT_ID}/scan-logs`);
}

export { PATIENT_ID, API };
