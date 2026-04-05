import os
import json
import pdfplumber
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"


def _extract_text(pdf_path: str, max_chars: int = 6000) -> str:
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
                if len(text) >= max_chars:
                    break
    except Exception:
        return ""
    return text[:max_chars]


def _extract_from_group(docs: list[dict], max_chars_each: int = 4000) -> str:
    combined = ""
    for doc in docs:
        text = _extract_text(doc["path"], max_chars_each)
        if text:
            combined += f"\n\n--- {doc['filename']} ---\n{text}"
    return combined


def _ask_llm(prompt: str, max_tokens: int = 500) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a construction document analyst. Return only valid JSON. No markdown, no explanation."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.0,
        )
        raw = response.choices[0].message.content.strip()
        return raw.replace("```json", "").replace("```", "").strip()
    except Exception:
        return "{}"


# ─────────────────────────────────────────────────────────────────────────────
# EXTRACTION FUNCTIONS — one per document type
# Each returns a dict of extracted fields relevant to that type
# ─────────────────────────────────────────────────────────────────────────────

def _extract_contract_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key contract facts. Return ONLY JSON with these fields (null if not found):
{{
  "project_name": "name of project",
  "project_value": "contract sum",
  "owner": "owner name",
  "general_contractor": "GC name",
  "architect": "architect name",
  "start_date": "start date",
  "completion_date": "completion date",
  "liquidated_damages": "LD rate per day",
  "retention": "retainage percentage",
  "project_location": "project address"
}}
Contract text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_site_visit_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from this site visit or inspection report. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "inspection_date": "date of inspection",
  "inspector_name": "inspector or site manager name",
  "location": "site location or address",
  "issues_found": "summary of main issues found",
  "corrective_actions": "required corrective actions",
  "next_inspection": "next inspection date if mentioned",
  "overall_status": "overall site status — OK / Issues Found / Critical"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_daily_report_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from these daily construction reports. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "report_period": "date range covered by these reports",
  "general_contractor": "GC or contractor name",
  "average_crew_size": "average crew count per day",
  "total_delays_reported": "number of delay events reported",
  "weather_impacts": "any weather-related delays or impacts",
  "work_summary": "brief summary of work completed",
  "open_issues": "any unresolved issues mentioned"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_rfi_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from these RFI documents. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "total_rfis": "total number of RFIs in these documents",
  "open_rfis": "number of open or unanswered RFIs",
  "closed_rfis": "number of answered or closed RFIs",
  "common_topics": "most common subjects or topics across RFIs",
  "oldest_open_rfi": "oldest unanswered RFI date if mentioned",
  "submitting_party": "who is submitting the RFIs"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_change_order_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from these change order documents. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "total_change_orders": "total number of change orders",
  "total_cost_impact": "total additional cost across all COs",
  "total_schedule_impact": "total additional days claimed",
  "largest_change_order": "description of largest single CO",
  "common_causes": "most common reasons for change orders",
  "pending_approval": "number of COs pending approval"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_schedule_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from this project schedule. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "planned_start": "planned start date",
  "planned_completion": "planned completion date",
  "current_status": "On Track / At Risk / Delayed",
  "days_ahead_behind": "how many days ahead or behind schedule",
  "critical_path_activities": ["list of critical path activities"],
  "next_milestone": "next upcoming milestone",
  "float_summary": "summary of schedule float"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_meeting_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from these meeting minutes. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "meeting_dates": "dates of meetings covered",
  "attendees": "key attendees or parties present",
  "key_decisions": "major decisions made",
  "action_items": "list of action items assigned",
  "open_issues": "unresolved issues discussed",
  "next_meeting": "next meeting date if mentioned"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_submittal_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract key facts from these submittal documents. Return ONLY JSON (null if not found):
{{
  "project_name": "project name",
  "total_submittals": "total number of submittals",
  "approved": "number approved",
  "pending_review": "number pending review",
  "rejected": "number rejected or requiring resubmittal",
  "overdue_submittals": "any overdue submittals mentioned",
  "submitting_contractor": "contractor submitting"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


def _extract_general_facts(docs: list[dict]) -> dict:
    text = _extract_from_group(docs)
    prompt = f"""Extract the most important facts from this construction document. Return ONLY JSON (null if not found):
{{
  "project_name": "project name if mentioned",
  "document_summary": "1-2 sentence summary of what this document covers",
  "key_parties": "main parties mentioned",
  "key_dates": "important dates mentioned",
  "main_topics": "main topics or sections covered",
  "action_items": "any action items or next steps mentioned"
}}
Document text: {text}"""
    try:
        return json.loads(_ask_llm(prompt))
    except:
        return {}


# ─────────────────────────────────────────────────────────────────────────────
# RISK FLAGS — scans all available docs
# ─────────────────────────────────────────────────────────────────────────────

def extract_risk_flags(grouped_docs: dict) -> list[dict]:
    priority_types = ["Contract", "Change Orders", "Daily Reports", "Inspection Reports", "RFIs", "Specifications"]
    combined_text = ""
    for doc_type in priority_types:
        docs = grouped_docs.get(doc_type, [])
        if docs:
            text = _extract_from_group(docs, max_chars_each=2000)
            combined_text += f"\n\n=== {doc_type.upper()} ===\n{text}"

    if not combined_text.strip():
        all_docs = [doc for docs in grouped_docs.values() for doc in docs]
        combined_text = _extract_from_group(all_docs[:3], max_chars_each=2000)

    if not combined_text.strip():
        return []

    prompt = f"""You are a senior construction project manager reviewing project documents for risks.
Identify up to 6 real specific risks. Return ONLY a valid JSON array:
[
  {{
    "title": "short risk title (5 words max)",
    "description": "plain English explanation (2 sentences max)",
    "severity": "High / Medium / Low",
    "source": "which document type this came from"
  }}
]
Sort by severity — High first. Return ONLY the JSON array.
Documents: {combined_text[:8000]}"""

    try:
        raw = _ask_llm(prompt, max_tokens=800)
        risks = json.loads(raw)
        severity_order = {"High": 0, "Medium": 1, "Low": 2}
        risks.sort(key=lambda r: severity_order.get(r.get("severity", "Low"), 2))
        return risks
    except:
        return []


# ─────────────────────────────────────────────────────────────────────────────
# PROJECT STATS — simple counts
# ─────────────────────────────────────────────────────────────────────────────

def extract_project_stats(grouped_docs: dict) -> dict:
    return {
        "total_documents": sum(len(v) for v in grouped_docs.values()),
        "contracts":        len(grouped_docs.get("Contract", [])),
        "drawings":         len(grouped_docs.get("Drawings", [])),
        "specs":            len(grouped_docs.get("Specifications", [])),
        "daily_reports":    len(grouped_docs.get("Daily Reports", [])),
        "rfis":             len(grouped_docs.get("RFIs", [])),
        "change_orders":    len(grouped_docs.get("Change Orders", [])),
        "inspections":      len(grouped_docs.get("Inspection Reports", [])),
        "submittals":       len(grouped_docs.get("Submittals", [])),
        "meeting_minutes":  len(grouped_docs.get("Meeting Minutes", [])),
        "schedules":        len(grouped_docs.get("Schedule", [])),
    }


# ─────────────────────────────────────────────────────────────────────────────
# MASTER FUNCTION — adapts to whatever documents are uploaded
# ─────────────────────────────────────────────────────────────────────────────

def build_dashboard(grouped_docs: dict) -> dict:
    """
    Builds a dashboard that adapts to whatever documents are present.
    Instead of always looking for contract fields, it extracts what's
    relevant based on which document types were actually uploaded.
    """
    facts = {}
    extracted_sections = {}

    # Run relevant extraction for each doc type present
    if grouped_docs.get("Contract"):
        data = _extract_contract_facts(grouped_docs["Contract"])
        facts.update({k: v for k, v in data.items() if v})
        extracted_sections["Contract"] = data

    if grouped_docs.get("Inspection Reports"):
        data = _extract_site_visit_facts(grouped_docs["Inspection Reports"])
        extracted_sections["Site Visit / Inspection"] = data
        if not facts.get("project_name"):
            facts["project_name"] = data.get("project_name")

    if grouped_docs.get("Daily Reports"):
        data = _extract_daily_report_facts(grouped_docs["Daily Reports"])
        extracted_sections["Daily Reports"] = data
        if not facts.get("project_name"):
            facts["project_name"] = data.get("project_name")

    if grouped_docs.get("RFIs"):
        data = _extract_rfi_facts(grouped_docs["RFIs"])
        extracted_sections["RFIs"] = data
        if not facts.get("project_name"):
            facts["project_name"] = data.get("project_name")

    if grouped_docs.get("Change Orders"):
        data = _extract_change_order_facts(grouped_docs["Change Orders"])
        extracted_sections["Change Orders"] = data

    if grouped_docs.get("Schedule"):
        data = _extract_schedule_facts(grouped_docs["Schedule"])
        extracted_sections["Schedule"] = data

    if grouped_docs.get("Meeting Minutes"):
        data = _extract_meeting_facts(grouped_docs["Meeting Minutes"])
        extracted_sections["Meeting Minutes"] = data
        if not facts.get("project_name"):
            facts["project_name"] = data.get("project_name")

    if grouped_docs.get("Submittals"):
        data = _extract_submittal_facts(grouped_docs["Submittals"])
        extracted_sections["Submittals"] = data

    # General fallback for any doc type not specifically handled
    for doc_type in ["Drawings", "Specifications", "General"]:
        if grouped_docs.get(doc_type):
            data = _extract_general_facts(grouped_docs[doc_type])
            extracted_sections[doc_type] = data
            if not facts.get("project_name"):
                facts["project_name"] = data.get("project_name")

    # Schedule health — from Schedule or Daily Reports
    schedule_docs = grouped_docs.get("Schedule", []) + grouped_docs.get("Daily Reports", [])
    if schedule_docs and extracted_sections.get("Schedule"):
        s = extracted_sections["Schedule"]
        schedule_health = {
            "status": s.get("current_status", "Unknown"),
            "summary": f"Planned completion: {s.get('planned_completion', 'Unknown')}. {s.get('days_ahead_behind', '')}",
            "days_ahead_behind": s.get("days_ahead_behind", "Unknown"),
            "critical_activities": s.get("critical_path_activities", []),
        }
    elif extracted_sections.get("Daily Reports"):
        d = extracted_sections["Daily Reports"]
        delays = d.get("total_delays_reported", "0")
        schedule_health = {
            "status": "At Risk" if delays and delays != "0" else "Unknown",
            "summary": d.get("work_summary") or "Based on daily reports.",
            "days_ahead_behind": "Unknown",
            "critical_activities": [],
        }
    else:
        schedule_health = {
            "status": "Unknown",
            "summary": "No schedule or daily report documents uploaded.",
            "days_ahead_behind": "Unknown",
            "critical_activities": [],
        }

    return {
        "facts": facts,
        "stats": extract_project_stats(grouped_docs),
        "risks": extract_risk_flags(grouped_docs),
        "schedule_health": schedule_health,
        "extracted_sections": extracted_sections,  # what was actually extracted
        "doc_types_present": list(grouped_docs.keys()),  # which types were uploaded
    }