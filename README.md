# Haven AI — Predictive Elder Care Platform

Haven is a full-stack elder care platform that predicts emergencies before they happen using sensor data, wellness scoring, and a smart escalation ladder. Built for a hackathon.

---

## The Problem

Every 11 seconds, an older adult is treated in an emergency room for a fall. Most emergencies are predictable — missed medications, unusual inactivity, declining wellness — but caregivers and first responders have no real-time visibility until it's too late.

## The Solution

Haven monitors Eleanor's daily patterns and acts before a crisis becomes a catastrophe:

- Detects anomalies (missed meds, no activity, falls)
- Notifies the **patient first** — before calling anyone else
- Escalates intelligently: patient → care coordinator → family → 911
- Gives first responders instant clinical access via a **QR code on her necklace**

---

## Demo Flow

| Scene | What Happens | Backend |
|-------|-------------|---------|
| Start | Eleanor's wellness score: 91 | Baseline logged |
| 1 | Morning meds missed | SMS sent to Eleanor, score → 77 |
| 2 | No kitchen activity for 4 hours | Care coordinator alerted, score → 68 |
| 3 | Fall detected in living room | Family notified, 911 context prepared, score → 55 |
| 4 | Community responder dispatched | Responder case opened |
| 5 | EMS escalation | Full clinical context transmitted |

**QR Access Demo:** Responder arrives → scans QR on Eleanor's necklace → enters PIN `EMS911` → gets full clinical card instantly.

---

## Features

### Predictive Wellness Scoring
- Real-time score (0–100) based on sensor events
- 72-hour trend tracking
- Automatic escalation when score drops below threshold

### Smart Escalation Ladder
```
Step 0 → Notify Eleanor first ("Are you okay?")
Step 1 → Care Coordinator
Step 2 → Family (Sarah Tran)
Step 3 → 911 with full patient context
```

### Emergency QR Access System
- One QR code per patient — works on watch, necklace, fridge, wallet, door
- **Level 1 (no PIN):** Name, conditions, emergency contact, PCP phone
- **Level 2 (PIN required):** Full clinical card — medications, missed meds, wellness trend, sensor events
- Time-limited tokens (4 hours, 10 uses max)
- HIPAA audit trail on every scan

### PIN Registry
| PIN | Type |
|-----|------|
| `EMS911` | County EMS |
| `FIRE411` | County Fire |
| `HOSP2024` | Regional Hospital |
| `SARAH123` | Sarah Tran (family) |

### QR Placement Registry
Track everywhere a patient's QR has been placed: watch, necklace, fridge, front door, med box, wallet, and more.

---

## Tech Stack

**Frontend**
- React 19, TanStack Router, TanStack Query
- Zustand (state management)
- Tailwind CSS, shadcn/ui, Radix UI
- Vite 7, TypeScript

**Backend**
- FastAPI (Python)
- Pydantic v2
- qrcode + Pillow (QR generation)
- In-memory storage (hackathon demo)
- Uvicorn

---

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
npm install --legacy-peer-deps
npm run dev
```

### Links
| | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
| Live demo dashboard | http://localhost:8000/demo |

---

## Project Structure

```
haven-ai/
├── src/
│   ├── routes/
│   │   ├── index.tsx          # Role selection
│   │   ├── caregiver.tsx      # Caregiver dashboard (Sarah)
│   │   ├── resident.tsx       # Resident dashboard (Eleanor)
│   │   └── responder.tsx      # Responder dashboard + QR access
│   ├── components/haven/      # Core UI components
│   ├── lib/
│   │   ├── haven-store.ts     # Zustand state + demo scenes
│   │   └── api/client.ts      # Backend API integration
│   └── styles.css
└── backend/
    ├── main.py                # FastAPI app (all endpoints)
    ├── demo_simulator.py      # CLI demo runner
    └── requirements.txt
```

---

## API Endpoints

```bash
# Patient
GET  /patients                              # List patients
GET  /patients/eleanor-001                  # Get Eleanor
GET  /patients/eleanor-001/wellness         # Wellness + 72hr trend
GET  /patients/eleanor-001/sensor-events    # Sensor event log

# Escalation
POST /patients/eleanor-001/escalation/trigger   # Step 0 — notify patient
POST /patients/eleanor-001/respond              # Patient replies "YES"
POST /patients/eleanor-001/escalation/step1     # → Care coordinator
POST /patients/eleanor-001/escalation/step2     # → Family
POST /patients/eleanor-001/escalation/step3     # → 911

# QR Emergency Access
GET  /patients/eleanor-001/qr                   # QR code PNG
GET  /emergency/eleanor-001                     # PIN entry page (HTML)
POST /emergency/eleanor-001/verify              # Verify PIN → token
GET  /emergency/eleanor-001/card/{token}        # Full clinical card

# Audit
GET  /patients/eleanor-001/scan-logs            # HIPAA scan log
GET  /scan-logs                                 # All scans (admin)

# Demo
GET  /demo                                      # Live dashboard (auto-refresh)
```

---

## Built With ❤️ for the Hackathon

Haven demonstrates that elder care doesn't have to be reactive. With the right sensors, smart escalation, and instant responder access, we can protect the people who matter most.
