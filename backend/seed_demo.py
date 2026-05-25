"""
Seed demo data into Supabase.
Run once: python seed_demo.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    sys.exit("SUPABASE_URL / SUPABASE_SERVICE_KEY not set")

from supabase import create_client
sb = create_client(url, key)

SID = "demo"

def upsert(table, rows):
    for row in rows:
        try:
            sb.table(table).upsert(row).execute()
            print(f"  OK {table}: {row['id']}")
        except Exception as e:
            print(f"  FAIL {table}: {row['id']} -- {e}")

# ── Projects ──────────────────────────────────────────────────────────────────
upsert("projects", [
    {"id":"demo-1","session_id":SID,"name":"Riverside Heights Mixed-Use","client":"Pinnacle Urban Developers","value":"$11.4M","status":"At Risk","completion":61,"phase":"Structure","rfi":12,"workers":34,"start_date":"Jan 2025","end_date":"Dec 2025"},
    {"id":"demo-2","session_id":SID,"name":"Westgate Commercial Tower","client":"BuildRight Properties","value":"$24.8M","status":"On Track","completion":38,"phase":"Foundation","rfi":5,"workers":52,"start_date":"Mar 2025","end_date":"Jun 2026"},
    {"id":"demo-3","session_id":SID,"name":"Lakeside Residential Block C","client":"HomeFirst Developers","value":"$6.2M","status":"On Track","completion":84,"phase":"Finishing","rfi":2,"workers":18,"start_date":"Aug 2024","end_date":"Apr 2025"},
])

# ── Schedule Tasks ─────────────────────────────────────────────────────────────
upsert("schedule_tasks", [
    {"id":"task-1","session_id":SID,"name":"Site Preparation","phase":"Foundation","start_day":0,"duration":10,"progress":100,"assignee":"Marcus R.","status":"Done","priority":"high"},
    {"id":"task-2","session_id":SID,"name":"Excavation & Grading","phase":"Foundation","start_day":8,"duration":14,"progress":100,"assignee":"Carlos M.","status":"Done","priority":"high"},
    {"id":"task-3","session_id":SID,"name":"Foundation Concrete Pour","phase":"Foundation","start_day":20,"duration":12,"progress":75,"assignee":"Marcus R.","status":"In Progress","priority":"high"},
    {"id":"task-4","session_id":SID,"name":"Rebar Installation - Level 1","phase":"Structure","start_day":30,"duration":10,"progress":40,"assignee":"Carlos M.","status":"In Progress","priority":"high"},
    {"id":"task-5","session_id":SID,"name":"Formwork - Level 1","phase":"Structure","start_day":32,"duration":8,"progress":20,"assignee":"James O.","status":"In Progress","priority":"medium"},
    {"id":"task-6","session_id":SID,"name":"MEP Rough-In","phase":"MEP","start_day":40,"duration":20,"progress":0,"assignee":"Ahmed H.","status":"Upcoming","priority":"medium"},
    {"id":"task-7","session_id":SID,"name":"Waterproofing","phase":"Envelope","start_day":45,"duration":8,"progress":0,"assignee":"TBD","status":"Upcoming","priority":"medium"},
    {"id":"task-8","session_id":SID,"name":"Safety Audit","phase":"HSE","start_day":35,"duration":3,"progress":0,"assignee":"Priya N.","status":"Overdue","priority":"high"},
    {"id":"task-9","session_id":SID,"name":"Owner Walkthrough","phase":"Milestone","start_day":60,"duration":1,"progress":0,"assignee":"All","status":"Upcoming","priority":"low"},
])

# ── Daily Logs ─────────────────────────────────────────────────────────────────
upsert("daily_logs", [
    {
        "id":"dl1","session_id":SID,"date":"2025-05-28","weather":"Clear",
        "crew_count":34,"labor_hours":272,
        "work_performed":"Completed Level 3 slab pour (2,400 SF). Installed conduit runs in north wing. Framing crew completed exterior stud walls on east elevation. Mechanical crew roughed in supply ductwork for zones 3A-3D.",
        "delays":"None reported.",
        "incidents":"None",
        "narrative":"Site activities on 5/28 progressed on schedule with the Level 3 concrete pour completed as planned. 34 workers on site logged 272 labor hours across structural, electrical, and mechanical trades. No safety incidents recorded and no delay events observed.",
        "delay_claims":[],
        "weather_impact":False,
    },
    {
        "id":"dl2","session_id":SID,"date":"2025-05-27","weather":"Rain",
        "crew_count":21,"labor_hours":147,
        "work_performed":"Interior work only due to weather. Tile installation in Level 2 restrooms (north side). Electrical panel terminations at boards B-1 through B-4. Drywall taping and mud on Level 1 corridor B.",
        "delays":"Concrete pour on Level 3 deferred to 5/28 due to sustained rain. Crane operations suspended from 08:00 to 13:30. Exterior framing crew stood down for 5.5 hours.",
        "incidents":"Near-miss: Worker slipped on wet ramp access — no injury. Corrective action: anti-slip mat installed at ramp entry.",
        "narrative":"Adverse weather on 5/27 resulted in significant productivity loss. Rain-driven suspension of crane operations and exterior works caused a net delay to the Level 3 pour, which is on the critical path.",
        "delay_claims":["Concrete pour deferred by 1 day due to rain","Crane suspension 08:00-13:30 — 5.5 crew-hours lost"],
        "weather_impact":True,
    },
    {
        "id":"dl3","session_id":SID,"date":"2025-05-26","weather":"Clear",
        "crew_count":38,"labor_hours":304,
        "work_performed":"Reinforcement steel placed and inspected on Level 3 slab (ready for pour). Curtain wall installation progressed on south elevation bays 5-9. MEP rough-in inspections passed on Level 1. Interior framing 85% complete on Level 2.",
        "delays":"Inspections took longer than anticipated — structural engineer arrived 90 minutes late. Concrete delivery rescheduled to 5/28.",
        "incidents":"None",
        "narrative":"Productive day with 38 personnel and 304 labor hours. Rebar inspection passed and Level 3 slab is ready for pour.",
        "delay_claims":["Structural engineer 90-minute late arrival — contractor-caused delay, non-compensable"],
        "weather_impact":False,
    },
])

# ── Punch Items ────────────────────────────────────────────────────────────────
upsert("punch_items", [
    {"id":"p1","session_id":SID,"description":"Ceiling tiles not properly seated in grid. Multiple tiles have visible gaps along the perimeter requiring re-installation per spec section 09513.","location":"Level 3 - East Wing","trade":"Ceiling","priority":"High","status":"Open","ball_in_court":"Contractor","category":"Incomplete Work"},
    {"id":"p2","session_id":SID,"description":"Exit sign above main entrance not illuminated. Emergency lighting circuit appears disconnected at distribution panel.","location":"Ground Floor - Lobby","trade":"Electrical","priority":"Critical","status":"In Progress","ball_in_court":"Contractor","category":"Safety"},
    {"id":"p3","session_id":SID,"description":"Tile grout color inconsistent between north and south walls. Material used does not match the approved color submittal #SUB-047.","location":"Level 2 - Restrooms","trade":"Tile","priority":"Medium","status":"Open","ball_in_court":"Architect","category":"Quality"},
    {"id":"p4","session_id":SID,"description":"HVAC unit curb flashing incomplete on north side. Water infiltration path identified during rain inspection.","location":"Roof Level","trade":"Mechanical","priority":"High","status":"Resolved","ball_in_court":"Inspector","category":"Damage Risk"},
    {"id":"p5","session_id":SID,"description":"Door hardware on rooms 105-109 does not match approved hardware schedule. Lever handles installed vs. specified locksets.","location":"Level 1 - Corridor B","trade":"Doors & Hardware","priority":"Low","status":"Closed","ball_in_court":"Owner","category":"Spec Non-Conformance"},
])

# ── Submittals ─────────────────────────────────────────────────────────────────
upsert("submittals", [
    {"id":"s1","session_id":SID,"title":"Cast-in-Place Concrete Mix Design","spec_section":"03 30 00","submitted_by":"BuildCorp General","reviewer":"Structural Engineer","status":"Approved","date_submitted":"2025-05-01","required_date":"2025-05-15","review_deadline":"2025-05-20","compliance_score":96,"flags":[],"ai_review":"Mix design meets ACI 318 requirements. Fly ash content within allowable limits. Water-cement ratio 0.42 acceptable. Approved without conditions."},
    {"id":"s2","session_id":SID,"title":"Hollow Metal Doors & Frames - Shop Drawings","spec_section":"08 11 13","submitted_by":"Build-Right Doors","reviewer":"Architect","status":"Revise & Resubmit","date_submitted":"2025-05-10","required_date":"2025-05-30","review_deadline":"2025-05-25","compliance_score":62,"flags":["Frame elevation detail missing for type HM-7","Hardware prep for electric strike not shown on doors 205, 207"],"ai_review":"Submittal requires revision. Two critical omissions: frame elevation for HM-7 not provided, electric strike preps absent on corridor doors."},
    {"id":"s3","session_id":SID,"title":"Acoustic Ceiling Tile - Product Data","spec_section":"09 51 13","submitted_by":"Interior Finishes Co.","reviewer":"Architect","status":"Under Review","date_submitted":"2025-05-18","required_date":"2025-06-01","review_deadline":"2025-06-05","compliance_score":0,"flags":[],"ai_review":""},
    {"id":"s4","session_id":SID,"title":"Electrical Conductors - Wire & Cable Product Data","spec_section":"26 05 19","submitted_by":"Volt Electric","reviewer":"Electrical Engineer","status":"Submitted","date_submitted":"2025-05-22","required_date":"2025-06-10","review_deadline":"2025-06-08","compliance_score":0,"flags":[],"ai_review":""},
    {"id":"s5","session_id":SID,"title":"HVAC Ductwork - Shop Drawings","spec_section":"23 05 13","submitted_by":"AirTech Mechanical","reviewer":"MEP Engineer","status":"Pending Submission","date_submitted":"","required_date":"2025-06-20","review_deadline":"2025-06-28","compliance_score":0,"flags":[],"ai_review":""},
])

print("\nDone! All demo data seeded with session_id='demo'.")
