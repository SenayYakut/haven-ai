"""
Haven AI — Predictive Elder Care Platform
FastAPI Backend
"""

from __future__ import annotations

import hashlib
import io
import secrets
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional

import qrcode
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Haven AI — Elder Care Platform",
    description="Predictive elder care with emergency QR access, wellness tracking, and smart escalation.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class NotificationPreference(str, Enum):
    sms = "sms"
    call = "call"


class ResponderType(str, Enum):
    ems = "ems"
    fire = "fire"
    hospital = "hospital"
    family = "family"
    neighbor = "neighbor"
    care_coordinator = "care_coordinator"
    other = "other"


class AccessLevel(str, Enum):
    basic = "basic"
    full_clinical = "full_clinical"


class EscalationStatus(str, Enum):
    idle = "idle"
    step0_patient = "step0_patient"
    step1_coordinator = "step1_coordinator"
    step2_family = "step2_family"
    step3_emergency = "step3_emergency"
    resolved = "resolved"


class LocationType(str, Enum):
    watch = "watch"
    wallet = "wallet"
    necklace = "necklace"
    fridge = "fridge"
    bathroom_mirror = "bathroom_mirror"
    front_door = "front_door"
    med_box = "med_box"
    keychain = "keychain"
    bedside = "bedside"
    pet_collar = "pet_collar"
    car = "car"
    building_lobby = "building_lobby"
    senior_center = "senior_center"


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relationship: str


class Medication(BaseModel):
    name: str
    dosage: str
    schedule: str
    missed_last_2_days: bool = False


class WellnessEntry(BaseModel):
    timestamp: datetime
    score: float


class SensorEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    event_type: str
    description: str
    severity: str = "low"  # low / medium / high / critical


class PersonalPin(BaseModel):
    label: str
    pin_hash: str
    responder_type: ResponderType


class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    photo_url: Optional[str] = None
    conditions: list[str] = []
    emergency_contact: EmergencyContact
    pcp_phone: str
    medications: list[Medication] = []
    wellness_score: float = 85.0
    wellness_history: list[WellnessEntry] = []
    last_known_safe_activity: Optional[str] = None
    sensor_events: list[SensorEvent] = []
    patient_phone: str
    notification_preference: NotificationPreference = NotificationPreference.sms
    response_window_minutes: int = 20
    personal_pins: list[PersonalPin] = []
    escalation_status: EscalationStatus = EscalationStatus.idle
    escalation_started_at: Optional[datetime] = None


class PatientCreate(BaseModel):
    name: str
    age: int
    photo_url: Optional[str] = None
    conditions: list[str] = []
    emergency_contact: EmergencyContact
    pcp_phone: str
    medications: list[Medication] = []
    patient_phone: str
    notification_preference: NotificationPreference = NotificationPreference.sms
    response_window_minutes: int = 20


class WellnessUpdate(BaseModel):
    score: float
    last_known_safe_activity: Optional[str] = None


class SensorEventCreate(BaseModel):
    event_type: str
    description: str
    severity: str = "low"


class QRPlacement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    location_type: LocationType
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    active: bool = True


class QRPlacementCreate(BaseModel):
    location_type: LocationType


class ScanLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scanned_at: datetime = Field(default_factory=datetime.utcnow)
    patient_id: str
    pin_used: str
    responder_type: ResponderType
    gps_location: Optional[str] = None
    access_level: AccessLevel


class PinVerifyRequest(BaseModel):
    pin: str
    responder_type: ResponderType
    gps_location: Optional[str] = None


class EmergencyToken(BaseModel):
    token: str
    patient_id: str
    created_at: datetime
    expires_at: datetime
    max_uses: int = 10
    use_count: int = 0
    access_level: AccessLevel


class PatientResponse(BaseModel):
    response: str


class PinRegistryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pin_hash: str
    responder_type: ResponderType
    label: str
    scope: str = "county"  # "county" or patient_id for personal pins


class PinRegistryCreate(BaseModel):
    pin: str
    responder_type: ResponderType
    label: str
    scope: str = "county"


# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------

_patients: dict[str, Patient] = {}
_qr_placements: dict[str, list[QRPlacement]] = {}
_scan_logs: list[ScanLog] = []
_emergency_tokens: dict[str, EmergencyToken] = {}
_pin_registry: list[PinRegistryEntry] = []


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Seed data — Eleanor Tran (demo patient, matches frontend)
# ---------------------------------------------------------------------------

_NOW = datetime.utcnow()

_eleanor = Patient(
    id="eleanor-001",
    name="Eleanor Tran",
    age=78,
    photo_url=None,
    conditions=["Type 2 Diabetes", "Hypertension"],
    emergency_contact=EmergencyContact(name="Sarah Tran", phone="+15551234567", relationship="Daughter (Caregiver)"),
    pcp_phone="+15559876543",
    medications=[
        Medication(name="Metformin", dosage="500mg", schedule="Twice daily", missed_last_2_days=False),
        Medication(name="Lisinopril", dosage="10mg", schedule="Once daily", missed_last_2_days=True),
    ],
    wellness_score=91.0,
    wellness_history=[
        WellnessEntry(timestamp=_NOW - timedelta(hours=72), score=91.0),
    ],
    last_known_safe_activity="Eleanor woke up — bedroom motion at 7:14am",
    sensor_events=[
        SensorEvent(
            timestamp=_NOW - timedelta(hours=4),
            event_type="medication_missed",
            description="Pill box opened but no pills dispensed — morning dose missed",
            severity="medium",
        ),
        SensorEvent(
            timestamp=_NOW - timedelta(hours=2),
            event_type="low_activity",
            description="No kitchen activity for 4 hours — no fridge activity",
            severity="high",
        ),
        SensorEvent(
            timestamp=_NOW - timedelta(minutes=30),
            event_type="fall_detected",
            description="Fall detected in Living Room at 11:42am — no motion for 4 min 12 sec. Stove on 18 min. Faucet running.",
            severity="critical",
        ),
    ],
    patient_phone="+15550001111",
    notification_preference=NotificationPreference.sms,
    response_window_minutes=20,
    escalation_status=EscalationStatus.idle,
)

_patients["eleanor-001"] = _eleanor
_qr_placements["eleanor-001"] = [
    QRPlacement(patient_id="eleanor-001", location_type=LocationType.necklace),
    QRPlacement(patient_id="eleanor-001", location_type=LocationType.fridge),
    QRPlacement(patient_id="eleanor-001", location_type=LocationType.watch),
]

# Eleanor's personal PIN for Sarah
_eleanor.personal_pins.append(
    PersonalPin(
        label="Sarah Tran (Daughter / Caregiver)",
        pin_hash=_hash_pin("SARAH123"),
        responder_type=ResponderType.family,
    )
)

# Seed PIN registry
_pin_registry.extend([
    PinRegistryEntry(
        pin_hash=_hash_pin("EMS911"),
        responder_type=ResponderType.ems,
        label="County EMS",
        scope="county",
    ),
    PinRegistryEntry(
        pin_hash=_hash_pin("FIRE411"),
        responder_type=ResponderType.fire,
        label="County Fire",
        scope="county",
    ),
    PinRegistryEntry(
        pin_hash=_hash_pin("HOSP2024"),
        responder_type=ResponderType.hospital,
        label="Regional Hospital",
        scope="county",
    ),
])



# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_patient(patient_id: str) -> Patient:
    p = _patients.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return p


def _resolve_pin(pin: str, patient_id: str) -> tuple[bool, AccessLevel, ResponderType]:
    """
    Returns (valid, access_level, responder_type).
    County-wide pins → full_clinical.
    Personal pins on patient → full_clinical.
    No match → invalid.
    """
    pin_hash = _hash_pin(pin)
    # Check county registry
    for entry in _pin_registry:
        if entry.pin_hash == pin_hash:
            return True, AccessLevel.full_clinical, entry.responder_type
    # Check patient personal pins
    patient = _patients.get(patient_id)
    if patient:
        for pp in patient.personal_pins:
            if pp.pin_hash == pin_hash:
                return True, AccessLevel.full_clinical, pp.responder_type
    return False, AccessLevel.basic, ResponderType.other


def _mock_send_sms(phone: str, message: str) -> None:
    print(f"[SMS → {phone}]: {message}")


def _mock_make_call(phone: str, message: str) -> None:
    print(f"[CALL → {phone}]: {message}")


def _notify_patient(patient: Patient) -> None:
    msg = (
        f"Hi {patient.name.split()[0]}, Haven here. "
        "We noticed some changes in your routine today. "
        "Are you feeling okay? Reply YES or call us back."
    )
    if patient.notification_preference == NotificationPreference.sms:
        _mock_send_sms(patient.patient_phone, msg)
    else:
        _mock_make_call(patient.patient_phone, msg)


# ---------------------------------------------------------------------------
# Architecture Visual Page
# ---------------------------------------------------------------------------


@app.get("/architecture", tags=["meta"], response_class=HTMLResponse)
def architecture_page():
    """Interactive visual map of Haven's agentic backend architecture."""
    return HTMLResponse(content="""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Haven AI — Backend Architecture</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#060d1a;color:#f1f5f9;min-height:100vh;overflow-x:hidden}
header{padding:32px 40px 0;text-align:center}
header h1{font-size:2rem;font-weight:700;background:linear-gradient(135deg,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header p{color:#64748b;margin-top:6px;font-size:.95rem}
.canvas{position:relative;width:100%;max-width:1100px;margin:40px auto;padding:0 24px 80px}

/* ── Agent cards ── */
.agent{position:absolute;border-radius:14px;padding:16px 18px;border:1px solid;cursor:pointer;transition:transform .2s,box-shadow .2s;z-index:2}
.agent:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.5)}
.agent h3{font-size:.82rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.agent p{font-size:.75rem;line-height:1.4;opacity:.75}
.badge{display:inline-block;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;margin-top:6px}

/* colours */
.sensor   {background:#0c1a2e;border-color:#1d4ed8;color:#93c5fd}
.score    {background:#0c1f14;border-color:#15803d;color:#86efac}
.anomaly  {background:#1c1207;border-color:#d97706;color:#fde68a}
.escalation{background:#1a0a0a;border-color:#dc2626;color:#fca5a5}
.notify   {background:#150d24;border-color:#7c3aed;color:#c4b5fd}
.qr       {background:#071a1a;border-color:#0d9488;color:#5eead4}
.audit    {background:#121212;border-color:#475569;color:#94a3b8}
.patient  {background:#0f172a;border-color:#38bdf8;color:#7dd3fc}

/* SVG arrows layer */
svg.arrows{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1}

/* Pulse animation on sensors */
@keyframes pulse-dot{0%,100%{opacity:1;r:4}50%{opacity:.4;r:6}}
.pulse-dot{animation:pulse-dot 2s infinite}

/* Flow label */
.flow-label{font-size:.68rem;fill:#64748b}

/* Legend */
.legend{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:20px auto 0;max-width:900px;padding:0 24px}
.legend-item{display:flex;align-items:center;gap:6px;font-size:.78rem;color:#94a3b8}
.legend-dot{width:10px;height:10px;border-radius:50%}

/* Step cards at bottom */
.steps{max-width:1100px;margin:0 auto 60px;padding:0 24px}
.steps h2{font-size:1.1rem;font-weight:600;color:#94a3b8;margin-bottom:16px;text-align:center;letter-spacing:.05em;text-transform:uppercase}
.step-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.step-card{background:#0f172a;border-radius:12px;padding:16px;border-left:3px solid}
.step-card .num{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.6;margin-bottom:4px}
.step-card .title{font-size:.9rem;font-weight:600;margin-bottom:4px}
.step-card .desc{font-size:.75rem;color:#64748b;line-height:1.4}
.s0{border-color:#38bdf8}.s1{border-color:#7c3aed}.s2{border-color:#f59e0b}.s3{border-color:#ef4444}.s4{border-color:#dc2626}

/* tooltip */
.tooltip{position:fixed;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px 16px;max-width:260px;font-size:.8rem;line-height:1.5;color:#f1f5f9;pointer-events:none;z-index:100;opacity:0;transition:opacity .15s;box-shadow:0 8px 32px rgba(0,0,0,.6)}
.tooltip.show{opacity:1}
</style>
</head>
<body>
<header>
  <h1>Haven AI — Agentic Backend Architecture</h1>
  <p>Hover any agent to learn what it does · Every box is a live FastAPI component</p>
</header>

<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#1d4ed8"></div>Sensor Agents</div>
  <div class="legend-item"><div class="legend-dot" style="background:#15803d"></div>Wellness Engine</div>
  <div class="legend-item"><div class="legend-dot" style="background:#d97706"></div>Anomaly Detection</div>
  <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Escalation Orchestrator</div>
  <div class="legend-item"><div class="legend-dot" style="background:#7c3aed"></div>Notification Agent</div>
  <div class="legend-item"><div class="legend-dot" style="background:#0d9488"></div>QR Access Agent</div>
  <div class="legend-item"><div class="legend-dot" style="background:#475569"></div>Audit Agent</div>
</div>

<!-- Diagram canvas — positions are % based via inline style -->
<div class="canvas" id="canvas" style="height:620px">

  <!-- Row 1: Sensors -->
  <div class="agent sensor" style="left:2%;top:2%;width:15%"
    data-tip="Smart Watch Agent&#10;Monitors movement, detects falls via accelerometer, tracks activity gaps. Streams events to the Wellness Engine every 30 seconds.">
    <h3>⌚ Watch</h3><p>Motion · Fall detect · Activity</p>
    <span class="badge" style="background:#1d4ed8;color:#bfdbfe">SENSOR</span>
  </div>

  <div class="agent sensor" style="left:20%;top:2%;width:15%"
    data-tip="Pill Box Agent&#10;Detects whether the pill compartment was opened and pills dispensed. Flags missed doses and forwards to Anomaly Detection.">
    <h3>💊 Pill Box</h3><p>Dose dispensed · Missed meds</p>
    <span class="badge" style="background:#1d4ed8;color:#bfdbfe">SENSOR</span>
  </div>

  <div class="agent sensor" style="left:38%;top:2%;width:15%"
    data-tip="Motion Sensor Agent&#10;Passive infrared sensors in kitchen, living room, bathroom. Detects inactivity windows beyond normal baseline patterns.">
    <h3>🏠 Motion</h3><p>Room activity · Inactivity windows</p>
    <span class="badge" style="background:#1d4ed8;color:#bfdbfe">SENSOR</span>
  </div>

  <div class="agent sensor" style="left:56%;top:2%;width:15%"
    data-tip="Door &amp; Appliance Agent&#10;Monitors front door, stove, faucet. Detects hazards like stove left on and generates high-severity events.">
    <h3>🚪 Door / Stove</h3><p>Hazards · Entry events</p>
    <span class="badge" style="background:#1d4ed8;color:#bfdbfe">SENSOR</span>
  </div>

  <div class="agent sensor" style="left:74%;top:2%;width:15%"
    data-tip="Glucose &amp; Vitals Agent&#10;Reads continuous glucose monitor and blood pressure cuff. Feeds readings directly into wellness score calculation.">
    <h3>🩺 Vitals</h3><p>Glucose · Blood pressure</p>
    <span class="badge" style="background:#1d4ed8;color:#bfdbfe">SENSOR</span>
  </div>

  <!-- Row 2: Processing -->
  <div class="agent score" style="left:18%;top:30%;width:22%"
    data-tip="Wellness Scoring Engine&#10;Aggregates all sensor events into a 0–100 wellness score. Computes 72-hour trend. Score drops trigger anomaly checks.&#10;&#10;Endpoint: POST /patients/{id}/wellness">
    <h3>📊 Wellness Engine</h3><p>Aggregates sensor data → 0–100 score · 72hr trend · Baseline comparison</p>
    <span class="badge" style="background:#15803d;color:#bbf7d0">SCORING</span>
  </div>

  <div class="agent anomaly" style="left:50%;top:30%;width:22%"
    data-tip="Anomaly Detection Agent&#10;Compares current patterns against Eleanor's baseline. Flags: missed meds, unusual inactivity, fall events, hazardous appliances.&#10;&#10;Triggers escalation when score &lt; threshold.">
    <h3>🔍 Anomaly Detector</h3><p>Pattern matching · Baseline deviation · Severity scoring</p>
    <span class="badge" style="background:#d97706;color:#fef3c7">DETECTION</span>
  </div>

  <!-- Row 3: Orchestration -->
  <div class="agent escalation" style="left:32%;top:56%;width:26%"
    data-tip="Escalation Orchestrator&#10;The brain of Haven. Manages the full escalation ladder:&#10;Step 0 → Notify patient (20 min window)&#10;Step 1 → Care coordinator&#10;Step 2 → Family (Sarah Tran)&#10;Step 3 → 911 with full context&#10;&#10;Endpoints: /escalation/trigger, /step1, /step2, /step3">
    <h3>🧠 Escalation Orchestrator</h3><p>4-step ladder · 20min patient window · Context assembly · 911 dispatch</p>
    <span class="badge" style="background:#dc2626;color:#fee2e2">ORCHESTRATOR</span>
  </div>

  <!-- Row 4: Output agents -->
  <div class="agent notify" style="left:2%;top:78%;width:18%"
    data-tip="Notification Agent&#10;Sends SMS or voice calls via Twilio. Respects patient preference (SMS vs call). Handles: patient check-in, caregiver alerts, family SOS, 911 briefing.">
    <h3>📱 Notify Agent</h3><p>SMS · Voice call · Twilio · Per-preference</p>
    <span class="badge" style="background:#7c3aed;color:#ede9fe">NOTIFY</span>
  </div>

  <div class="agent qr" style="left:24%;top:78%;width:18%"
    data-tip="QR Access Agent&#10;Generates per-patient QR codes. Validates responder PINs (EMS, Fire, Hospital, Family). Issues time-limited tokens (4hr, 10 uses). Returns tiered clinical cards.&#10;&#10;Endpoints: /emergency/{id}/verify, /card/{token}">
    <h3>🔲 QR Agent</h3><p>QR gen · PIN verify · Token issue · Clinical card</p>
    <span class="badge" style="background:#0d9488;color:#ccfbf1">QR ACCESS</span>
  </div>

  <div class="agent audit" style="left:46%;top:78%;width:18%"
    data-tip="HIPAA Audit Agent&#10;Logs every QR scan, PIN attempt, token use, and escalation action with timestamp, responder type, GPS, and access level. Required for HIPAA compliance.&#10;&#10;Endpoint: GET /scan-logs">
    <h3>📋 Audit Agent</h3><p>HIPAA logging · Scan trail · Access records · Immutable log</p>
    <span class="badge" style="background:#475569;color:#e2e8f0">AUDIT</span>
  </div>

  <div class="agent patient" style="left:68%;top:78%;width:18%"
    data-tip="Patient Response Agent&#10;Listens for Eleanor's YES reply to the check-in SMS. If received within 20 minutes, cancels the escalation ladder entirely. Logs the safe confirmation.&#10;&#10;Endpoint: POST /patients/{id}/respond">
    <h3>👩‍🦳 Patient Agent</h3><p>Self-check · YES response · Cancel escalation · Safe confirm</p>
    <span class="badge" style="background:#38bdf8;color:#0c4a6e">PATIENT</span>
  </div>

  <!-- SVG arrows -->
  <svg class="arrows" id="arrows">
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#334155"/>
      </marker>
      <marker id="arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#dc2626"/>
      </marker>
      <marker id="arr-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#0d9488"/>
      </marker>
    </defs>
  </svg>
</div>

<!-- Escalation steps -->
<div class="steps">
  <h2>Escalation Ladder</h2>
  <div class="step-grid">
    <div class="step-card s0">
      <div class="num">Step 0</div>
      <div class="title" style="color:#38bdf8">Notify Eleanor</div>
      <div class="desc">SMS: "Hi Eleanor, Haven here. Are you feeling okay? Reply YES." — 20 minute response window.</div>
    </div>
    <div class="step-card s1">
      <div class="num">Step 1</div>
      <div class="title" style="color:#c4b5fd">Care Coordinator</div>
      <div class="desc">No response. Coordinator alerted with wellness score and last known activity.</div>
    </div>
    <div class="step-card s2">
      <div class="num">Step 2</div>
      <div class="title" style="color:#fde68a">Family — Sarah</div>
      <div class="desc">Score still declining. Sarah Tran (daughter) notified via SMS with full context.</div>
    </div>
    <div class="step-card s3">
      <div class="num">Step 3</div>
      <div class="title" style="color:#fca5a5">911 Dispatch</div>
      <div class="desc">Fall detected. 911 called with patient name, age, conditions, meds, and last safe activity.</div>
    </div>
    <div class="step-card s4">
      <div class="num">QR Access</div>
      <div class="title" style="color:#f87171">EMS Arrives</div>
      <div class="desc">Paramedic scans QR on Eleanor's necklace. Enters EMS PIN → full clinical card in under 5 seconds.</div>
    </div>
  </div>
</div>

<div class="tooltip" id="tooltip"></div>

<script>
// Draw arrows between agents using element positions
function midpoint(el) {
  const r = el.getBoundingClientRect();
  const cr = document.getElementById('canvas').getBoundingClientRect();
  return {
    x: r.left - cr.left + r.width / 2,
    y: r.top - cr.top + r.height / 2,
    top: r.top - cr.top,
    bottom: r.top - cr.top + r.height,
    left: r.left - cr.left,
    right: r.left - cr.left + r.width,
  };
}

function drawArrow(svg, x1, y1, x2, y2, color='#334155', markerId='arr', dash='') {
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '1.5');
  line.setAttribute('marker-end', `url(#${markerId})`);
  if (dash) line.setAttribute('stroke-dasharray', dash);
  svg.appendChild(line);
}

function renderArrows() {
  const svg = document.getElementById('arrows');
  svg.innerHTML = svg.querySelector('defs').outerHTML;

  const agents = document.querySelectorAll('.agent');
  const map = {};
  agents.forEach(a => { map[a.querySelector('h3').textContent.trim().replace(/[^a-z]/gi,'')] = a; });

  const watch   = document.querySelectorAll('.agent.sensor')[0];
  const pill    = document.querySelectorAll('.agent.sensor')[1];
  const motion  = document.querySelectorAll('.agent.sensor')[2];
  const door    = document.querySelectorAll('.agent.sensor')[3];
  const vitals  = document.querySelectorAll('.agent.sensor')[4];
  const score   = document.querySelector('.agent.score');
  const anomaly = document.querySelector('.agent.anomaly');
  const esc     = document.querySelector('.agent.escalation');
  const notify  = document.querySelector('.agent.notify');
  const qr      = document.querySelector('.agent.qr');
  const audit   = document.querySelector('.agent.audit');
  const patient = document.querySelector('.agent.patient');

  // Sensors → Wellness engine
  [watch, pill, motion].forEach(s => {
    const a = midpoint(s), b = midpoint(score);
    drawArrow(svg, a.x, a.bottom, b.x, b.top, '#1d4ed8', 'arr');
  });
  // Sensors → Anomaly
  [door, vitals].forEach(s => {
    const a = midpoint(s), b = midpoint(anomaly);
    drawArrow(svg, a.x, a.bottom, b.x, b.top, '#1d4ed8', 'arr');
  });
  // Wellness → Anomaly
  { const a = midpoint(score), b = midpoint(anomaly);
    drawArrow(svg, a.right, a.y, b.left, b.y, '#15803d', 'arr'); }
  // Anomaly → Escalation
  { const a = midpoint(anomaly), b = midpoint(esc);
    drawArrow(svg, a.x, a.bottom, b.x, b.top, '#d97706', 'arr'); }
  // Wellness → Escalation
  { const a = midpoint(score), b = midpoint(esc);
    drawArrow(svg, a.x, a.bottom, b.left + 20, b.top, '#15803d', 'arr', '4,3'); }
  // Escalation → outputs
  [notify, qr, audit, patient].forEach(out => {
    const a = midpoint(esc), b = midpoint(out);
    drawArrow(svg, a.x, a.bottom, b.x, b.top, '#dc2626', 'arr-red');
  });
}

// Tooltip
const tooltip = document.getElementById('tooltip');
document.querySelectorAll('.agent').forEach(el => {
  el.addEventListener('mouseenter', e => {
    tooltip.textContent = el.dataset.tip.replace(/&#10;/g,'\\n');
    tooltip.innerHTML = '<strong>' + el.querySelector('h3').innerHTML + '</strong><br><br>' +
      el.dataset.tip.replace(/&#10;/g,'<br>');
    tooltip.classList.add('show');
  });
  el.addEventListener('mousemove', e => {
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top  = (e.clientY - 10) + 'px';
  });
  el.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
});

window.addEventListener('load', renderArrows);
window.addEventListener('resize', renderArrows);
</script>
</body>
</html>""")


# ---------------------------------------------------------------------------
# Live Demo Dashboard
# ---------------------------------------------------------------------------


@app.get("/demo", tags=["meta"], response_class=HTMLResponse)
def demo_dashboard():
    """Auto-refreshing live dashboard — open alongside the frontend to prove it's connected."""
    return HTMLResponse(content="""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Haven AI — Live Backend Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0f172a; color: #f8fafc; padding: 24px; }
  h1 { color: #38bdf8; font-size: 1.4rem; margin-bottom: 4px; }
  .sub { color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
  .pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%;
           background: #22c55e; animation: pulse 1.5s infinite; margin-right: 6px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
  .card h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: .08em;
             color: #64748b; margin-bottom: 12px; }
  .score { font-size: 3rem; font-weight: 700; line-height: 1; }
  .bar-bg { background: #334155; border-radius: 99px; height: 10px; margin: 8px 0; overflow: hidden; }
  .bar { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
  .row { display: flex; justify-content: space-between; padding: 6px 0;
         border-bottom: 1px solid #1e293b; font-size: 0.85rem; }
  .row:last-child { border: none; }
  .label { color: #94a3b8; }
  .val { font-weight: 500; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
  .clear { background: #14532d; color: #86efac; }
  .attention { background: #713f12; color: #fde68a; }
  .emergency { background: #450a0a; color: #fca5a5; }
  .event { padding: 8px 0; border-bottom: 1px solid #334155; font-size: 0.82rem; }
  .event:last-child { border: none; }
  .sev-critical { color: #f87171; }
  .sev-high { color: #fb923c; }
  .sev-medium { color: #fbbf24; }
  .sev-low { color: #94a3b8; }
  .log-row { padding: 6px 0; border-bottom: 1px solid #334155; font-size: 0.8rem; display: flex; gap: 12px; }
  .log-row:last-child { border: none; }
  .refresh { color: #64748b; font-size: 0.75rem; margin-top: 20px; text-align: right; }
  .scene-bar { display: flex; gap: 6px; margin: 8px 0; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: #334155; }
  .dot.active { background: #38bdf8; }
</style>
</head>
<body>
<h1><span class="pulse"></span>Haven AI — Live Backend Dashboard</h1>
<p class="sub">Auto-refreshes every 2 seconds. Open this alongside the frontend demo at <strong>localhost:5173</strong></p>

<div class="grid" id="grid">Loading...</div>
<p class="refresh" id="ts"></p>

<script>
async function refresh() {
  try {
    const [patient, wellness, events, logs] = await Promise.all([
      fetch('/patients/eleanor-001').then(r => r.json()),
      fetch('/patients/eleanor-001/wellness').then(r => r.json()),
      fetch('/patients/eleanor-001/sensor-events').then(r => r.json()),
      fetch('/patients/eleanor-001/scan-logs').then(r => r.json()),
    ]);

    const score = wellness.current_score ?? 0;
    const scoreColor = score > 75 ? '#22c55e' : score > 50 ? '#f59e0b' : '#ef4444';
    const statusClass = patient.escalation_status?.includes('step3') || patient.escalation_status?.includes('emergency') ? 'emergency'
                      : patient.escalation_status === 'idle' ? 'clear' : 'attention';
    const statusLabel = patient.escalation_status?.replace(/_/g, ' ') ?? 'idle';

    const trendRows = (wellness.trend_72hr ?? []).slice(-5).map(e => {
      const t = new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      const w = Math.round(e.score);
      return `<div class="row"><span class="label">${t}</span><span class="val">${w}</span></div>`;
    }).join('');

    const eventRows = (events ?? []).slice(-4).reverse().map(e => `
      <div class="event">
        <span class="sev-${e.severity}">● ${e.severity.toUpperCase()}</span>
        <span style="color:#f8fafc;margin-left:6px">${e.event_type.replace(/_/g,' ')}</span>
        <div style="color:#64748b;margin-top:2px">${e.description}</div>
      </div>`).join('') || '<p style="color:#64748b;font-size:.82rem">No events yet — start the demo</p>';

    const logRows = (logs ?? []).slice(-5).reverse().map(l => `
      <div class="log-row">
        <span style="color:#64748b">${new Date(l.scanned_at).toLocaleTimeString()}</span>
        <span style="color:#f8fafc;text-transform:capitalize">${l.responder_type}</span>
        <span style="color:${l.access_level==='full_clinical'?'#22c55e':'#f59e0b'}">${l.access_level==='full_clinical'?'Full Clinical':'Basic'}</span>
      </div>`).join('') || '<p style="color:#64748b;font-size:.82rem">No scans yet — try QR Access tab</p>';

    document.getElementById('grid').innerHTML = `
      <div class="card">
        <h2>Patient</h2>
        <div class="row"><span class="label">Name</span><span class="val">${patient.name}</span></div>
        <div class="row"><span class="label">Age</span><span class="val">${patient.age}</span></div>
        <div class="row"><span class="label">Escalation</span><span class="val"><span class="badge ${statusClass}">${statusLabel}</span></span></div>
        <div class="row"><span class="label">Last Activity</span><span class="val" style="max-width:160px;text-align:right;font-size:.78rem">${wellness.last_known_safe_activity ?? '—'}</span></div>
      </div>

      <div class="card">
        <h2>Wellness Score (Live)</h2>
        <div class="score" style="color:${scoreColor}">${Math.round(score)}</div>
        <div class="bar-bg"><div class="bar" style="width:${score}%;background:${scoreColor}"></div></div>
        <p style="color:#64748b;font-size:.78rem;margin-bottom:8px">72-hour trend</p>
        ${trendRows}
      </div>

      <div class="card">
        <h2>Sensor Events</h2>
        ${eventRows}
      </div>

      <div class="card">
        <h2>QR Scan Audit Log</h2>
        ${logRows}
      </div>
    `;
    document.getElementById('ts').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch(e) {
    document.getElementById('grid').innerHTML = '<p style="color:#ef4444">Backend not reachable — make sure uvicorn is running on port 8000</p>';
  }
}

refresh();
setInterval(refresh, 2000);
</script>
</body>
</html>
""")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "Haven AI Elder Care Platform",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ---------------------------------------------------------------------------
# Patient CRUD
# ---------------------------------------------------------------------------


@app.get("/patients", tags=["patients"])
def list_patients():
    return [
        {
            "id": p.id,
            "name": p.name,
            "age": p.age,
            "wellness_score": p.wellness_score,
            "escalation_status": p.escalation_status,
        }
        for p in _patients.values()
    ]


@app.get("/patients/{patient_id}", tags=["patients"])
def get_patient(patient_id: str):
    return _get_patient(patient_id)


@app.post("/patients", tags=["patients"], status_code=201)
def create_patient(body: PatientCreate):
    patient = Patient(**body.model_dump())
    _patients[patient.id] = patient
    _qr_placements[patient.id] = []
    return patient


# ---------------------------------------------------------------------------
# Wellness & Sensor Events
# ---------------------------------------------------------------------------


@app.get("/patients/{patient_id}/wellness", tags=["wellness"])
def get_wellness(patient_id: str):
    p = _get_patient(patient_id)
    return {
        "patient_id": p.id,
        "name": p.name,
        "current_score": p.wellness_score,
        "trend_72hr": p.wellness_history[-5:] if p.wellness_history else [],
        "last_known_safe_activity": p.last_known_safe_activity,
    }


@app.post("/patients/{patient_id}/wellness", tags=["wellness"])
def update_wellness(patient_id: str, body: WellnessUpdate):
    p = _get_patient(patient_id)
    p.wellness_score = body.score
    if body.last_known_safe_activity:
        p.last_known_safe_activity = body.last_known_safe_activity
    p.wellness_history.append(WellnessEntry(timestamp=datetime.utcnow(), score=body.score))
    return {"patient_id": p.id, "new_score": p.wellness_score}


@app.get("/patients/{patient_id}/sensor-events", tags=["sensors"])
def get_sensor_events(patient_id: str):
    p = _get_patient(patient_id)
    return p.sensor_events


@app.post("/patients/{patient_id}/sensor-events", tags=["sensors"], status_code=201)
def log_sensor_event(patient_id: str, body: SensorEventCreate):
    p = _get_patient(patient_id)
    event = SensorEvent(timestamp=datetime.utcnow(), **body.model_dump())
    p.sensor_events.append(event)
    return event


# ---------------------------------------------------------------------------
# Scene sync — frontend demo scene → backend state
# ---------------------------------------------------------------------------

class SceneSync(BaseModel):
    scene: int


_SCENE_SCORE = {0: 91.0, 1: 77.0, 2: 68.0, 3: 55.0, 4: 48.0, 5: 38.0}
_SCENE_STATUS = {0: "clear", 1: "attention", 2: "attention", 3: "emergency", 4: "emergency", 5: "emergency"}


@app.post("/patients/{patient_id}/scene", tags=["demo"])
def sync_scene(patient_id: str, body: SceneSync):
    """
    Called by the frontend whenever the demo scene advances.
    Updates wellness score, escalation status, and logs sensor events.
    """
    p = _get_patient(patient_id)
    scene = body.scene
    p.wellness_score = _SCENE_SCORE.get(scene, p.wellness_score)
    p.wellness_history.append(WellnessEntry(timestamp=datetime.utcnow(), score=p.wellness_score))

    if scene == 1:
        p.sensor_events.append(SensorEvent(
            timestamp=datetime.utcnow(),
            event_type="medication_missed",
            description="Morning medication not taken at 9:31am",
            severity="medium",
        ))
        p.escalation_status = EscalationStatus.step0_patient
        _notify_patient(p)

    elif scene == 2:
        p.sensor_events.append(SensorEvent(
            timestamp=datetime.utcnow(),
            event_type="low_activity",
            description="No kitchen activity for 4 hours — no fridge activity since 7:15am",
            severity="high",
        ))
        p.escalation_status = EscalationStatus.step1_coordinator

    elif scene == 3:
        p.sensor_events.append(SensorEvent(
            timestamp=datetime.utcnow(),
            event_type="fall_detected",
            description="Fall detected in Living Room — no motion for 4 min 12 sec. Stove on 18 min.",
            severity="critical",
        ))
        p.escalation_status = EscalationStatus.step2_family
        _mock_send_sms(p.emergency_contact.phone, f"Haven Alert: {p.name} may have fallen. Please check immediately.")

    elif scene >= 4:
        p.escalation_status = EscalationStatus.step3_emergency

    return {
        "scene": scene,
        "wellness_score": p.wellness_score,
        "escalation_status": p.escalation_status,
    }


# ---------------------------------------------------------------------------
# Escalation — Step 0 (notify patient first)
# ---------------------------------------------------------------------------


@app.get("/patients/{patient_id}/escalation", tags=["escalation"])
def get_escalation_status(patient_id: str):
    p = _get_patient(patient_id)
    return {
        "patient_id": p.id,
        "escalation_status": p.escalation_status,
        "escalation_started_at": p.escalation_started_at,
        "response_window_minutes": p.response_window_minutes,
    }


@app.post("/patients/{patient_id}/escalation/trigger", tags=["escalation"])
def trigger_escalation(patient_id: str):
    """
    Full escalation ladder:
    Step 0 → notify patient (20 min window)
    Step 1 → care coordinator
    Step 2 → family
    Step 3 → 911
    """
    p = _get_patient(patient_id)

    # Step 0: notify patient first
    p.escalation_status = EscalationStatus.step0_patient
    p.escalation_started_at = datetime.utcnow()
    _notify_patient(p)

    return {
        "message": f"Escalation started. Notified {p.name} via {p.notification_preference}.",
        "step": 0,
        "next_step_at": (p.escalation_started_at + timedelta(minutes=p.response_window_minutes)).isoformat(),
        "escalation_status": p.escalation_status,
    }


@app.post("/patients/{patient_id}/escalation/step1", tags=["escalation"])
def escalate_to_coordinator(patient_id: str):
    p = _get_patient(patient_id)
    p.escalation_status = EscalationStatus.step1_coordinator
    msg = (
        f"Haven Alert: {p.name} has not responded. "
        f"Wellness score: {p.wellness_score}. "
        f"Last safe activity: {p.last_known_safe_activity}. Please check in."
    )
    _mock_send_sms("+15550002222", msg)
    return {"message": "Care coordinator notified", "step": 1, "escalation_status": p.escalation_status}


@app.post("/patients/{patient_id}/escalation/step2", tags=["escalation"])
def escalate_to_family(patient_id: str):
    p = _get_patient(patient_id)
    p.escalation_status = EscalationStatus.step2_family
    msg = (
        f"Haven Alert: {p.name} has not responded and wellness score is declining ({p.wellness_score}). "
        f"Please check on them immediately."
    )
    _mock_send_sms(p.emergency_contact.phone, msg)
    return {
        "message": f"Family ({p.emergency_contact.name}) notified",
        "step": 2,
        "escalation_status": p.escalation_status,
    }


@app.post("/patients/{patient_id}/escalation/step3", tags=["escalation"])
def escalate_to_emergency(patient_id: str):
    p = _get_patient(patient_id)
    p.escalation_status = EscalationStatus.step3_emergency
    context = {
        "patient": p.name,
        "age": p.age,
        "conditions": p.conditions,
        "medications": [m.name for m in p.medications],
        "last_known_safe_activity": p.last_known_safe_activity,
        "wellness_score": p.wellness_score,
        "pcp_phone": p.pcp_phone,
    }
    print(f"[911 DISPATCH]: Emergency call triggered for {p.name}. Context: {context}")
    return {
        "message": "911 contacted with full patient context",
        "step": 3,
        "patient_context": context,
        "escalation_status": p.escalation_status,
    }


@app.post("/patients/{patient_id}/respond", tags=["escalation"])
def patient_self_response(patient_id: str, body: PatientResponse):
    """Patient replies YES to Haven check-in, cancelling pending escalation."""
    p = _get_patient(patient_id)
    if body.response.strip().upper() in ("YES", "Y", "OK", "OKAY", "FINE"):
        p.escalation_status = EscalationStatus.resolved
        return {
            "message": f"{p.name} confirmed safe. Escalation cancelled.",
            "logged_at": datetime.utcnow().isoformat(),
            "escalation_status": p.escalation_status,
        }
    return {
        "message": "Response received but not a clear affirmative. Monitoring continues.",
        "escalation_status": p.escalation_status,
    }


# ---------------------------------------------------------------------------
# QR Code Generation
# ---------------------------------------------------------------------------


@app.get("/patients/{patient_id}/qr", tags=["qr"], response_class=StreamingResponse)
def get_patient_qr(patient_id: str, base_url: str = Query(default="http://localhost:8000")):
    """Returns a QR code PNG pointing to /emergency/{patient_id}."""
    _get_patient(patient_id)  # validate exists
    url = f"{base_url}/emergency/{patient_id}"
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


# ---------------------------------------------------------------------------
# QR Placement Registry
# ---------------------------------------------------------------------------


@app.post("/patients/{patient_id}/qr-placements", tags=["qr"], status_code=201)
def register_qr_placement(patient_id: str, body: QRPlacementCreate):
    _get_patient(patient_id)
    placement = QRPlacement(patient_id=patient_id, location_type=body.location_type)
    _qr_placements.setdefault(patient_id, []).append(placement)
    return placement


@app.get("/patients/{patient_id}/qr-placements", tags=["qr"])
def list_qr_placements(patient_id: str):
    _get_patient(patient_id)
    return _qr_placements.get(patient_id, [])


# ---------------------------------------------------------------------------
# Emergency QR Access System
# ---------------------------------------------------------------------------


@app.get("/emergency/{patient_id}", tags=["emergency"], response_class=HTMLResponse)
def emergency_landing(patient_id: str):
    """
    The URL embedded in the patient's QR code.
    Returns a PIN entry page (HTML) that responders see when they scan the QR.
    Level 1 (no PIN) is shown immediately; Level 2 requires PIN entry.
    """
    p = _get_patient(patient_id)
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Haven — Emergency Access: {p.name}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
  .card {{ background: #1e293b; border-radius: 16px; padding: 24px; max-width: 420px;
           margin: 20px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }}
  h1 {{ color: #ef4444; margin: 0 0 4px; font-size: 1.4rem; }}
  h2 {{ color: #94a3b8; margin: 0 0 16px; font-size: 0.95rem; font-weight: 400; }}
  .badge {{ display: inline-block; background: #374151; border-radius: 6px;
             padding: 4px 10px; font-size: 0.8rem; margin: 2px; }}
  .section {{ margin: 16px 0; padding-top: 16px; border-top: 1px solid #334155; }}
  label {{ display: block; margin-bottom: 6px; color: #94a3b8; font-size: 0.85rem; }}
  input {{ width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #475569;
           background: #0f172a; color: #f8fafc; font-size: 1.1rem; letter-spacing: 4px;
           box-sizing: border-box; }}
  button {{ width: 100%; padding: 14px; background: #ef4444; color: white; border: none;
            border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 12px; }}
  button:hover {{ background: #dc2626; }}
  .info-row {{ display: flex; justify-content: space-between; margin: 8px 0; }}
  .info-label {{ color: #94a3b8; font-size: 0.85rem; }}
  .info-val {{ color: #f8fafc; font-size: 0.9rem; font-weight: 500; }}
  #result {{ margin-top: 16px; padding: 16px; border-radius: 8px; display: none; }}
  .success {{ background: #14532d; border: 1px solid #16a34a; }}
  .error {{ background: #450a0a; border: 1px solid #ef4444; }}
  pre {{ white-space: pre-wrap; word-break: break-word; font-size: 0.82rem;
         background: #0f172a; padding: 12px; border-radius: 8px; color: #94a3b8; }}
</style>
</head>
<body>
<div class="card">
  <h1>🚨 Haven Emergency Access</h1>
  <h2>Patient Information</h2>

  <div class="info-row"><span class="info-label">Name</span><span class="info-val">{p.name}</span></div>
  <div class="info-row"><span class="info-label">Age</span><span class="info-val">{p.age}</span></div>
  <div class="info-row"><span class="info-label">PCP Phone</span><span class="info-val">{p.pcp_phone}</span></div>
  <div class="info-row"><span class="info-label">Emergency Contact</span>
    <span class="info-val">{p.emergency_contact.name} — {p.emergency_contact.phone}</span></div>

  <div class="section">
    <label>Conditions</label>
    {"".join(f'<span class="badge">{c}</span>' for c in p.conditions)}
  </div>

  <div class="section">
    <h2 style="margin:0 0 12px">🔐 Full Clinical Access (PIN Required)</h2>
    <label for="pin">Enter Responder PIN</label>
    <input type="password" id="pin" placeholder="Enter PIN" maxlength="20">
    <select id="responder_type" style="width:100%;padding:10px;margin-top:8px;border-radius:8px;
      border:1px solid #475569;background:#0f172a;color:#f8fafc;">
      <option value="ems">EMS</option>
      <option value="fire">Fire</option>
      <option value="hospital">Hospital</option>
      <option value="family">Family</option>
      <option value="care_coordinator">Care Coordinator</option>
      <option value="other">Other</option>
    </select>
    <button onclick="verifyPin()">Unlock Full Record</button>
  </div>

  <div id="result"></div>
</div>

<script>
async function verifyPin() {{
  const pin = document.getElementById('pin').value;
  const responder_type = document.getElementById('responder_type').value;
  const resultDiv = document.getElementById('result');
  resultDiv.style.display = 'none';

  const resp = await fetch('/emergency/{patient_id}/verify', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{ pin, responder_type }})
  }});

  const data = await resp.json();
  resultDiv.style.display = 'block';

  if (resp.ok) {{
    resultDiv.className = 'success';
    const cardResp = await fetch('/emergency/{patient_id}/card/' + data.token);
    const card = await cardResp.json();
    resultDiv.innerHTML = '<strong>✅ Access Granted</strong><pre>' + JSON.stringify(card, null, 2) + '</pre>';
  }} else {{
    resultDiv.className = 'error';
    resultDiv.innerHTML = '<strong>❌ ' + (data.detail || 'Invalid PIN') + '</strong>';
  }}
}}
</script>
</body>
</html>
"""
    return HTMLResponse(content=html)


@app.post("/emergency/{patient_id}/verify", tags=["emergency"])
def verify_emergency_pin(patient_id: str, body: PinVerifyRequest):
    """Validates responder PIN and returns a time-limited access token."""
    p = _get_patient(patient_id)
    valid, access_level, responder_type = _resolve_pin(body.pin, patient_id)

    if not valid:
        # Still log the failed attempt
        _scan_logs.append(
            ScanLog(
                patient_id=patient_id,
                pin_used="INVALID",
                responder_type=body.responder_type,
                gps_location=body.gps_location,
                access_level=AccessLevel.basic,
            )
        )
        raise HTTPException(status_code=401, detail="Invalid PIN — basic access only via /emergency/{patient_id}")

    token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    _emergency_tokens[token] = EmergencyToken(
        token=token,
        patient_id=patient_id,
        created_at=now,
        expires_at=now + timedelta(hours=4),
        access_level=access_level,
    )

    # Log scan
    _scan_logs.append(
        ScanLog(
            patient_id=patient_id,
            pin_used=_hash_pin(body.pin)[:8] + "...",
            responder_type=responder_type,
            gps_location=body.gps_location,
            access_level=access_level,
        )
    )

    return {
        "token": token,
        "access_level": access_level,
        "responder_type": responder_type,
        "expires_at": _emergency_tokens[token].expires_at.isoformat(),
        "patient_id": patient_id,
    }


@app.get("/emergency/{patient_id}/card/{token}", tags=["emergency"])
def get_emergency_card(patient_id: str, token: str):
    """Returns full patient context card. Requires valid unexpired token."""
    entry = _emergency_tokens.get(token)
    now = datetime.utcnow()

    if not entry:
        raise HTTPException(status_code=404, detail="Token not found")
    if entry.patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Token does not match patient")
    if now > entry.expires_at:
        raise HTTPException(status_code=401, detail="Token expired")
    if entry.use_count >= entry.max_uses:
        raise HTTPException(status_code=401, detail="Token max uses reached")

    entry.use_count += 1
    p = _get_patient(patient_id)

    card: dict[str, Any] = {
        "access_level": entry.access_level,
        "generated_at": now.isoformat(),
        "expires_at": entry.expires_at.isoformat(),
        "uses_remaining": entry.max_uses - entry.use_count,
        "patient": {
            "name": p.name,
            "age": p.age,
            "photo_url": p.photo_url,
            "conditions": p.conditions,
            "emergency_contact": p.emergency_contact.model_dump(),
            "pcp_phone": p.pcp_phone,
        },
    }

    if entry.access_level == AccessLevel.full_clinical:
        card["clinical"] = {
            "medications": [m.model_dump() for m in p.medications],
            "missed_medications": [m.name for m in p.medications if m.missed_last_2_days],
            "wellness_score": p.wellness_score,
            "wellness_trend_72hr": [w.model_dump() for w in p.wellness_history[-5:]],
            "last_known_safe_activity": p.last_known_safe_activity,
            "sensor_events": [e.model_dump() for e in p.sensor_events[-10:]],
        }

    return card


# ---------------------------------------------------------------------------
# Scan Logs (HIPAA audit trail)
# ---------------------------------------------------------------------------


@app.get("/patients/{patient_id}/scan-logs", tags=["audit"])
def get_patient_scan_logs(patient_id: str):
    _get_patient(patient_id)
    return [log for log in _scan_logs if log.patient_id == patient_id]


@app.get("/scan-logs", tags=["audit"])
def get_all_scan_logs():
    return _scan_logs


# ---------------------------------------------------------------------------
# PIN Registry
# ---------------------------------------------------------------------------


@app.get("/pins/registry", tags=["pins"])
def list_pin_registry():
    return [
        {
            "id": e.id,
            "responder_type": e.responder_type,
            "label": e.label,
            "scope": e.scope,
        }
        for e in _pin_registry
    ]


@app.post("/pins/registry", tags=["pins"], status_code=201)
def add_pin(body: PinRegistryCreate):
    entry = PinRegistryEntry(
        pin_hash=_hash_pin(body.pin),
        responder_type=body.responder_type,
        label=body.label,
        scope=body.scope,
    )
    _pin_registry.append(entry)
    return {"id": entry.id, "label": entry.label, "responder_type": entry.responder_type, "scope": entry.scope}


@app.post("/patients/{patient_id}/pins", tags=["pins"], status_code=201)
def add_personal_pin(patient_id: str, body: PinRegistryCreate):
    p = _get_patient(patient_id)
    pp = PersonalPin(
        label=body.label,
        pin_hash=_hash_pin(body.pin),
        responder_type=body.responder_type,
    )
    p.personal_pins.append(pp)
    return {"label": pp.label, "responder_type": pp.responder_type}
