"""
Haven AI — Demo Simulator
Walks through the full escalation ladder + QR emergency access flow.
Run: python demo_simulator.py
Requires the server to be running: uvicorn main:app --reload --port 8000
"""

import time
import httpx

BASE = "http://localhost:8000"
PATIENT_ID = "margaret-001"

RESET = "\033[0m"
BOLD = "\033[1m"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
DIM = "\033[2m"


def divider(title: str = "") -> None:
    width = 60
    if title:
        pad = (width - len(title) - 2) // 2
        print(f"\n{CYAN}{'─' * pad} {title} {'─' * pad}{RESET}")
    else:
        print(f"{DIM}{'─' * width}{RESET}")


def step(label: str, detail: str = "") -> None:
    print(f"\n{BOLD}{YELLOW}▶ {label}{RESET}")
    if detail:
        print(f"  {DIM}{detail}{RESET}")


def ok(msg: str) -> None:
    print(f"  {GREEN}✔ {msg}{RESET}")


def warn(msg: str) -> None:
    print(f"  {YELLOW}⚠ {msg}{RESET}")


def err(msg: str) -> None:
    print(f"  {RED}✖ {msg}{RESET}")


def show(data, indent: int = 2) -> None:
    import json
    print(f"{DIM}{json.dumps(data, indent=indent, default=str)}{RESET}")


def pause(seconds: float = 1.0) -> None:
    time.sleep(seconds)


# ---------------------------------------------------------------------------

def main():
    client = httpx.Client(base_url=BASE, timeout=10)

    divider("HAVEN AI — DEMO SIMULATOR")
    print(f"{MAGENTA}Predictive Elder Care Platform{RESET}")
    print(f"{DIM}Patient: Margaret Ellis, 78 | Hackathon Demo{RESET}")
    pause()

    # ------------------------------------------------------------------
    divider("SYSTEM STATUS — WELLNESS DECLINING")
    step("Fetch Margaret's current wellness score")
    r = client.get(f"/patients/{PATIENT_ID}/wellness")
    r.raise_for_status()
    data = r.json()
    show(data)
    score = data["current_score"]
    warn(f"Wellness score: {score} — declining trend over 72 hours")
    pause()

    # ------------------------------------------------------------------
    divider("STEP 0 — PATIENT SELF-NOTIFICATION")
    step(
        "System notifies Margaret FIRST (before anyone else)",
        "Haven sends SMS: 'Hi Margaret, are you feeling okay? Reply YES.'"
    )
    r = client.post(f"/patients/{PATIENT_ID}/escalation/trigger")
    r.raise_for_status()
    resp = r.json()
    show(resp)
    ok(f"SMS sent to Margaret. Waiting up to {resp.get('next_step_at', '20 min')} for response.")
    pause(1.5)

    # ------------------------------------------------------------------
    divider("STEP 0 — NO RESPONSE (20 min elapsed, simulated)")
    warn("No response received from Margaret. Proceeding to Step 1.")
    pause()

    # ------------------------------------------------------------------
    divider("STEP 1 — CARE COORDINATOR NOTIFIED")
    step("Notifying care coordinator with wellness context")
    r = client.post(f"/patients/{PATIENT_ID}/escalation/step1")
    r.raise_for_status()
    show(r.json())
    ok("Care coordinator alerted via SMS.")
    pause(1.5)

    # ------------------------------------------------------------------
    divider("STEP 2 — WELLNESS KEEPS DECLINING → FAMILY NOTIFIED")
    step(
        "Score dropped further. Notifying daughter Susan.",
        f"Emergency contact: {data.get('name', 'Margaret')} — Susan Ellis"
    )
    r = client.post(f"/patients/{PATIENT_ID}/escalation/step2")
    r.raise_for_status()
    show(r.json())
    ok("Susan (daughter) notified via SMS.")
    pause(1.5)

    # ------------------------------------------------------------------
    divider("STEP 3 — FALL DETECTED → 911 CALLED")
    step(
        "CRITICAL: Fall detected near bathroom. No movement after impact.",
        "Dispatching 911 with full patient context."
    )
    r = client.post(f"/patients/{PATIENT_ID}/escalation/step3")
    r.raise_for_status()
    resp = r.json()
    show(resp)
    print(f"\n  {RED}{BOLD}🚨 911 contacted. Full context transmitted.{RESET}")
    pause(2)

    # ------------------------------------------------------------------
    divider("QR EMERGENCY ACCESS FLOW")
    step(
        "Paramedic arrives. Scans QR code on Margaret's necklace.",
        f"QR points to: {BASE}/emergency/{PATIENT_ID}"
    )
    pause()

    # Generate QR
    step("Generating QR code for Margaret's necklace")
    r = client.get(f"/patients/{PATIENT_ID}/qr", params={"base_url": BASE})
    if r.status_code == 200:
        path = "/tmp/margaret_qr.png"
        with open(path, "wb") as f:
            f.write(r.content)
        ok(f"QR code saved to {path}")
    else:
        warn("QR code generation skipped (check server)")
    pause()

    # Level 1 — basic access (no PIN)
    divider("LEVEL 1 — BASIC ACCESS (No PIN)")
    step(
        "Responder sees name, conditions, emergency contact, PCP phone.",
        "No PIN required — visible immediately on QR scan."
    )
    r = client.get(f"/patients/{PATIENT_ID}")
    p = r.json()
    basic = {
        "name": p["name"],
        "age": p["age"],
        "conditions": p["conditions"],
        "emergency_contact": p["emergency_contact"],
        "pcp_phone": p["pcp_phone"],
    }
    show(basic)
    pause()

    # Level 2 — full clinical (PIN required)
    divider("LEVEL 2 — FULL CLINICAL ACCESS (EMS PIN)")
    step(
        "Paramedic enters EMS PIN: EMS911",
        "POST /emergency/{patient_id}/verify"
    )
    r = client.post(
        f"/emergency/{PATIENT_ID}/verify",
        json={"pin": "EMS911", "responder_type": "ems", "gps_location": "37.7749,-122.4194"},
    )
    r.raise_for_status()
    token_data = r.json()
    token = token_data["token"]
    show(token_data)
    ok(f"Token issued. Valid 4 hours. Max 10 uses.")
    pause()

    # Fetch clinical card
    step("Fetching full clinical card with token")
    r = client.get(f"/emergency/{PATIENT_ID}/card/{token}")
    r.raise_for_status()
    card = r.json()
    show(card)
    ok("Full clinical context delivered instantly to paramedic.")
    pause()

    # ------------------------------------------------------------------
    divider("AUDIT TRAIL — SCAN LOGS")
    step("Every QR scan is HIPAA-logged automatically")
    r = client.get(f"/patients/{PATIENT_ID}/scan-logs")
    r.raise_for_status()
    show(r.json())
    pause()

    # ------------------------------------------------------------------
    divider("QR PLACEMENT REGISTRY")
    step("Registering additional QR placements for Margaret")
    for loc in ["watch", "front_door", "med_box"]:
        r = client.post(f"/patients/{PATIENT_ID}/qr-placements", json={"location_type": loc})
        if r.status_code == 201:
            ok(f"QR registered: {loc}")
        pause(0.3)

    r = client.get(f"/patients/{PATIENT_ID}/qr-placements")
    r.raise_for_status()
    show(r.json())
    pause()

    # ------------------------------------------------------------------
    divider("DEMO COMPLETE")
    print(f"\n{GREEN}{BOLD}Haven AI successfully demonstrated:{RESET}")
    print(f"  {GREEN}✔{RESET} Predictive wellness monitoring")
    print(f"  {GREEN}✔{RESET} Step 0: Patient self-notification before escalation")
    print(f"  {GREEN}✔{RESET} Full 4-step escalation ladder (patient → coordinator → family → 911)")
    print(f"  {GREEN}✔{RESET} QR emergency access with two-level PIN security")
    print(f"  {GREEN}✔{RESET} Time-limited tokens (4hr, 10-use max)")
    print(f"  {GREEN}✔{RESET} HIPAA audit trail on every scan")
    print(f"  {GREEN}✔{RESET} QR placement registry (watch, necklace, fridge, door...)")
    print(f"\n{CYAN}API docs: {BASE}/docs{RESET}\n")

    client.close()


if __name__ == "__main__":
    main()
