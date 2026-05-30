# Haven AI — Demo Guide

A step-by-step walkthrough for demoing Haven to judges or stakeholders.

---

## Setup (30 seconds)

Open two terminal windows and run:

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
npm install --legacy-peer-deps
npm run dev
```

Then open these three tabs in your browser:

| Tab | URL | Purpose |
|-----|-----|---------|
| 1 | http://localhost:5173 | Frontend app |
| 2 | http://localhost:8000/demo | Live backend dashboard |
| 3 | http://localhost:8000/architecture | System architecture |

---

## The Story

> *Eleanor Tran, 78, lives alone in San Jose. Her daughter Sarah checks in when she can. This morning, something is wrong.*

---

## Scene-by-Scene Walkthrough

### Scene 0 — All Clear
- Open **Tab 1** → click **Caregiver**
- Eleanor's wellness score shows **91** on **Tab 2**
- Everything is normal. Haven is watching quietly.

---

### Scene 1 — Missed Medication
**Click "Start Demo"** (bottom right corner)

- Eleanor's pill box was opened but no pills dispensed
- Haven sends Eleanor an SMS first: *"Hi Eleanor, are you feeling okay?"*
- Wellness score drops to **77** on the live dashboard
- Caregiver Sarah gets a notification: *"Missed morning medication"*

> **Key message:** Haven notifies the patient first — before calling anyone else.

---

### Scene 2 — Unusual Pattern
**Click "Advance — Scene 2"**

- No kitchen activity for 4 hours. No fridge opened.
- Haven's anomaly detector flags this as out-of-baseline
- Score drops to **68**
- Care coordinator alerted

> **Key message:** Haven sees patterns, not just events. Absence of activity is a signal.

---

### Scene 3 — Fall Detected
**Click "Advance — Scene 3"**

- Smartwatch detects a fall in the living room at 11:42am
- No motion for 4 minutes 12 seconds
- Stove left on for 18 minutes. Faucet running.
- Score drops to **55** — emergency threshold crossed
- Eleanor's safety check overlay appears (resident view)
- Family notified: *"Eleanor may have fallen. Please check immediately."*

> **Key message:** Haven detected the fall AND the hazards — giving responders a full picture before they arrive.

---

### Scene 4 — Responder Dispatched
**Click "Advance — Scene 4"**

- Community responder assigned to Eleanor's case
- Switch to **Responder** role to see the case card
- AI-generated incident summary ready

---

### Scene 5 — EMS Escalation
**Click "Advance — Scene 5"** or click **"Escalate to EMS"** in the responder view

- EMS dispatched, ETA 7 minutes
- Full patient context transmitted to dispatch

---

## The QR Demo (Most Impressive Feature)

**Switch to Responder role → click "QR Access" in the left sidebar**

### Step 1 — Show the QR code
- Eleanor's QR code is displayed — generated live by the backend
- *"This QR lives on her necklace, watch, fridge, and front door"*

### Step 2 — Simulate paramedic arriving
- Type PIN: **`EMS911`**
- Select responder type: **EMS**
- Click **"Unlock Full Clinical Record"**

### Step 3 — Show what the paramedic sees instantly
- ✅ Name, age, conditions
- ✅ Wellness score with trend bar
- ✅ Missed medications highlighted in orange
- ✅ Last known safe activity
- ✅ Full sensor event log

### Step 4 — Show the audit trail
- Click **"View Scan Logs"**
- Every scan is timestamped and logged for HIPAA compliance

> **Key message:** A paramedic who has never met Eleanor gets her full clinical picture in under 5 seconds — just by scanning a $0.02 QR code.

---

## Other PINs to Demo

| PIN | Who |
|-----|-----|
| `EMS911` | County EMS |
| `FIRE411` | County Fire Department |
| `HOSP2024` | Regional Hospital |
| `SARAH123` | Sarah Tran (Eleanor's daughter) |

---

## Live Backend Dashboard (Tab 2)

Keep **http://localhost:8000/demo** open while clicking through scenes. The judges can watch in real time:

- Wellness score dropping scene by scene
- New sensor events appearing
- Escalation status changing
- QR scan logs populating

Refreshes automatically every 2 seconds.

---

## Architecture Page (Tab 3)

Open **http://localhost:8000/architecture** for a visual map of every backend agent.

Hover over any box to explain what it does during your pitch.

Great for the technical Q&A portion of judging.

---

## CLI Demo (Optional)

If you want to demo entirely from the terminal:

```bash
cd backend
python3 demo_simulator.py
```

Prints a color-coded walkthrough of the full escalation + QR flow with live API responses.

---

## Talking Points

- **"Haven is predictive, not reactive"** — it catches a bad day before it becomes a tragedy
- **"Step 0 is the most important step"** — we ask Eleanor first, before calling anyone
- **"The QR code costs $0.02 and works everywhere"** — watch, necklace, fridge, wallet, door
- **"Every access is HIPAA-logged"** — responders are accountable, patients are protected
- **"No app to download"** — QR opens a web page, works on any phone

---

## Reset the Demo

Click **"Reset Demo"** (bottom right) to go back to Scene 0 and start fresh.

Or restart the backend to reset the wellness score to 91:
```bash
# Ctrl+C to stop, then:
python3 -m uvicorn main:app --reload --port 8000
```
