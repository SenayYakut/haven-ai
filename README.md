# Haven AI — Predictive Elder Care Platform

Haven is a full-stack elder care platform that predicts emergencies before they happen using sensor data, wellness scoring, and a smart escalation ladder. Built for a hackathon.

---

## Problem Statement

**1.4 million older adults live alone in the United States. Every 11 seconds, one of them is treated in an emergency room for a fall. Most of those emergencies were preventable.**

The warning signs were there hours before the crisis — a missed medication, an unopened fridge, an unusual silence in the living room. But nobody saw them. Not the family. Not the doctor. Not the caregiver.

**Today's elder care system is built entirely around response, not prevention.**

Family checks in when they remember. Physicians see patients every 90 days. Emergency services only activate after a crisis is already in progress. There is no infrastructure watching the 23 hours and 45 minutes between touchpoints — the window where every emergency actually begins.

When something does go wrong, first responders arrive blind. No medication list. No medical history. No context. A paramedic standing over an unconscious 78-year-old has no way to know she's diabetic, on blood thinners, and missed her Lisinopril this morning — unless someone thought to leave a note on the fridge.

**The result:** preventable falls become hospitalizations. Hospitalizations become loss of independence. Loss of independence becomes the end of the life someone built.

---

**Haven exists to close that gap.**

Not by responding faster — but by intervening earlier. By watching the silence between check-ins. By noticing that Eleanor hasn't opened her fridge since yesterday and asking her if she's okay before anyone has to call 911.

And if the worst does happen — if a paramedic is standing at her door — Haven makes sure they have everything they need in under 5 seconds, from a QR code on her necklace.

> **The goal is not better emergency care. The goal is fewer emergencies.**

---

## The Solution — Prevent the Emergency Before It Happens

Haven watches **patterns**, not just events.

A missed pill is a data point. A missed pill + no kitchen activity + no fridge opened + lower movement than yesterday = **a person who is declining right now**, before anything catastrophic happens.

Haven acts on that signal before the fall, not after:

- Notifies **Eleanor first** — *"Are you okay? Reply YES."*
- Alerts her caregiver if she doesn't respond
- Contacts family if the pattern keeps declining
- Calls 911 only when necessary — but with full context already prepared

**The goal isn't faster emergency response. The goal is to make most emergencies unnecessary.**

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
