"""
PRISM LangChain tools — each tool fetches live data from Supabase / in-memory session.
Tools are bound to a session_id at construction time.
"""
import os, json
from langchain_core.tools import StructuredTool
from pydantic import BaseModel


# ── Data access — Supabase direct (cached client, no httpx loop-back) ─────────

DEMO_SID = "demo"

_supa_client = None

def _supa():
    global _supa_client
    if _supa_client is not None:
        return _supa_client
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
        if url and key:
            _supa_client = create_client(url, key)
    except Exception as e:
        print(f"[agent supa init]: {e}")
    return _supa_client

def _sb_list(table: str, session_id: str) -> list:
    """Query Supabase for both user session and demo session rows."""
    try:
        sb = _supa()
        if not sb:
            return []
        ids = [session_id]
        if session_id != DEMO_SID:
            ids.append(DEMO_SID)
        res = sb.table(table).select("*").in_("session_id", ids).execute()
        return res.data or []
    except Exception as e:
        print(f"[agent sb_list {table}]: {e}")
        return []


def _fmt(rows: list, fields: list[str], limit: int = 8) -> str:
    if not rows:
        return "No records found."
    out = []
    for r in rows[:limit]:
        parts = [f"{f}: {r.get(f, '—')}" for f in fields if r.get(f)]
        out.append(" | ".join(parts))
    return "\n".join(out)


# ── Tool input schemas ─────────────────────────────────────────────────────────

class NoInput(BaseModel):
    pass  # tools receive session_id via closure


# ── Tool factory — returns tools bound to session_id ──────────────────────────

def build_tools(session_id: str) -> list:

    def daily_logs(_: str = "") -> str:
        """Fetch construction site daily logs: dates, weather, crew count, work performed, delays, incidents."""
        rows = _sb_list("daily_logs", session_id)
        if not rows:
            return "No daily logs found."
        out = []
        for r in rows[:6]:
            dc = r.get("delay_claims") or []
            if isinstance(dc, str):
                try: dc = json.loads(dc)
                except: dc = []
            out.append(
                f"Date: {r.get('date')} | Weather: {r.get('weather')} | "
                f"Crew: {r.get('crew_count')} | Hours: {r.get('labor_hours')} | "
                f"Work: {str(r.get('work_performed',''))[:180]} | "
                f"Delays: {r.get('delays','None')} | "
                f"Incidents: {r.get('incidents','None')} | "
                f"Claims: {len(dc)} potential delay claim(s)"
            )
        return "\n\n".join(out)

    def rfis(_: str = "") -> str:
        """Fetch all RFIs (Requests for Information): subject, status, priority, assigned to, days open."""
        rows = _sb_list("rfis", session_id)
        return _fmt(rows, ["id","subject","status","priority","assigned_to","days_open","response"])

    def change_orders(_: str = "") -> str:
        """Fetch all change orders: title, amount, status, reason, AI assessment."""
        rows = _sb_list("change_orders", session_id)
        return _fmt(rows, ["id","title","amount","status","reason"])

    def schedule(_: str = "") -> str:
        """Fetch schedule tasks: name, phase, progress %, status, assignee, priority."""
        rows = _sb_list("schedule_tasks", session_id)
        return _fmt(rows, ["name","phase","progress","status","assignee","priority","duration"])

    def punch_list(_: str = "") -> str:
        """Fetch construction punch list items: location, description, priority, status, trade."""
        rows = _sb_list("punch_items", session_id)
        return _fmt(rows, ["description","location","priority","status","trade","category","ball_in_court"])

    def obligations(_: str = "") -> str:
        """Fetch contract obligations: description, due date, responsible party, type, completed status."""
        rows = _sb_list("obligations", session_id)
        return _fmt(rows, ["description","due_date","responsible_party","type","completed"])

    def projects(_: str = "") -> str:
        """Fetch all projects: name, client, value, status, completion %, phase."""
        rows = _sb_list("projects", session_id)
        return _fmt(rows, ["name","client","value","status","completion","phase","rfi","workers"])

    def submittals(_: str = "") -> str:
        """Fetch submittals: title, spec section, status, compliance score, reviewer, flags."""
        rows = _sb_list("submittals", session_id)
        out = []
        for r in rows[:8]:
            flags = r.get("flags") or []
            if isinstance(flags, str):
                try: flags = json.loads(flags)
                except: flags = []
            out.append(
                f"{r.get('title','?')} | Spec: {r.get('spec_section','?')} | "
                f"Status: {r.get('status','?')} | Score: {r.get('compliance_score',0)}% | "
                f"Flags: {len(flags)}"
            )
        return "\n".join(out) if out else "No submittals found."

    def weather_risk_summary(_: str = "") -> str:
        """Analyze weather impact across all daily logs — identify rain/heat days and delay claim potential."""
        rows = _sb_list("daily_logs", session_id)
        if not rows:
            return "No daily logs to analyze."
        weather_days = [r for r in rows if r.get("weather") in ("Rain","Heavy Rain","Extreme Heat","Wind")]
        total_claims = 0
        for r in rows:
            dc = r.get("delay_claims") or []
            if isinstance(dc, str):
                try: dc = json.loads(dc)
                except: dc = []
            total_claims += len(dc)
        lines = [
            f"Total logs: {len(rows)}",
            f"Adverse weather days: {len(weather_days)}",
            f"Total potential delay claims detected: {total_claims}",
        ]
        for r in weather_days:
            lines.append(f"  - {r.get('date')}: {r.get('weather')} — {r.get('delays','No delays noted')}")
        return "\n".join(lines)

    def overdue_tasks(_: str = "") -> str:
        """Find overdue or at-risk schedule tasks and punch items."""
        tasks = _sb_list("schedule_tasks", session_id)
        punch = _sb_list("punch_items", session_id)
        overdue_t = [t for t in tasks if t.get("status") in ("Overdue","At Risk")]
        critical_p = [p for p in punch if p.get("priority") in ("Critical","High") and p.get("status") not in ("Resolved","Closed")]
        out = []
        if overdue_t:
            out.append("OVERDUE / AT-RISK TASKS:")
            for t in overdue_t:
                out.append(f"  - {t.get('name')} ({t.get('phase')}) — {t.get('progress',0)}% done, assigned to {t.get('assignee','?')}")
        if critical_p:
            out.append("\nHIGH/CRITICAL PUNCH ITEMS OPEN:")
            for p in critical_p:
                out.append(f"  - [{p.get('priority')}] {p.get('description','?')[:120]} @ {p.get('location','?')}")
        return "\n".join(out) if out else "No overdue tasks or critical punch items found."

    # ── Property management tools ─────────────────────────────────────────────

    def leases(_: str = "") -> str:
        """Fetch all leases: tenant, property, rent, dates, CAM, renewal options, AI summary."""
        rows = _sb_list("leases", session_id)
        if not rows:
            return "No leases found."
        out = []
        for r in rows[:8]:
            out.append(
                f"Tenant: {r.get('tenant_name','?')} | Property: {r.get('property_address','?')} | "
                f"Rent: ${r.get('monthly_rent',0):,.0f}/mo | "
                f"Term: {r.get('lease_start','?')} → {r.get('lease_end','?')} | "
                f"Status: {r.get('status','?')} | "
                f"CAM: {'Included' if r.get('cam_included') else 'Excluded'} | "
                f"Renewal: {r.get('renewal_options','?')} | "
                f"Summary: {str(r.get('ai_summary',''))[:200]}"
            )
        return "\n\n".join(out)

    def tenants(_: str = "") -> str:
        """Fetch all tenants: name, unit, monthly rent, risk level, risk score, lease end, status."""
        rows = _sb_list("tenants", session_id)
        if not rows:
            return "No tenants found."
        out = []
        for r in rows[:10]:
            out.append(
                f"Tenant: {r.get('name','?')} | Unit: {r.get('unit','?')} | "
                f"Rent: ${r.get('monthly_rent',0):,.0f}/mo | "
                f"Risk: {r.get('risk_level','?')} ({r.get('risk_score','?')}) | "
                f"Lease ends: {r.get('lease_end','?')} | Status: {r.get('status','?')} | "
                f"Details: {str(r.get('risk_details',''))[:180]}"
            )
        return "\n\n".join(out)

    def maintenance(_: str = "") -> str:
        """Fetch maintenance requests: unit, category, priority, status, AI diagnosis, cost."""
        rows = _sb_list("maintenance_requests", session_id)
        if not rows:
            return "No maintenance requests found."
        out = []
        for r in rows[:10]:
            out.append(
                f"[{r.get('priority','?')}] {r.get('category','?')} — Unit {r.get('unit','?')} | "
                f"Status: {r.get('status','?')} | Assigned: {r.get('assigned_to','Unassigned')} | "
                f"Cost: ${r.get('estimated_cost',0):,.0f} | "
                f"Issue: {str(r.get('description',''))[:120]} | "
                f"Diagnosis: {str(r.get('ai_diagnosis',''))[:160]}"
            )
        return "\n\n".join(out)

    def noi_reports(_: str = "") -> str:
        """Fetch NOI reports: property, period, gross rent, NOI, cap rate, AI summary."""
        rows = _sb_list("noi_reports", session_id)
        if not rows:
            return "No NOI reports found."
        out = []
        for r in rows[:6]:
            out.append(
                f"Property: {r.get('property_name','?')} | Period: {r.get('report_period','?')} | "
                f"Gross Rent: ${r.get('gross_potential_rent',0):,.0f} | "
                f"NOI: ${r.get('noi',0):,.0f} | Cap Rate: {r.get('cap_rate',0):.2f}% | "
                f"Summary: {str(r.get('ai_summary',''))[:200]}"
            )
        return "\n\n".join(out)

    def cam_reconciliations(_: str = "") -> str:
        """Fetch CAM reconciliation reports: property, year, total pool, tenant shares, AI summary."""
        rows = _sb_list("cam_reconciliations", session_id)
        if not rows:
            return "No CAM reconciliations found."
        out = []
        for r in rows[:6]:
            tenants_data = r.get("tenants") or r.get("tenants_data") or []
            if isinstance(tenants_data, str):
                try: tenants_data = json.loads(tenants_data)
                except: tenants_data = []
            tenant_summary = ", ".join(
                f"{t.get('name','?')} ${t.get('billable',0):,.0f}"
                for t in tenants_data[:4]
            )
            out.append(
                f"Property: {r.get('property_name','?')} | Year: {r.get('reconcile_year','?')} | "
                f"CAM Pool: ${r.get('total_cam_pool',0):,.0f} | "
                f"Tenants: {tenant_summary} | "
                f"Summary: {str(r.get('ai_summary',''))[:180]}"
            )
        return "\n\n".join(out)

    def tenant_risk_summary(_: str = "") -> str:
        """Summarize tenant risk across all tenants — count by risk level, flag high-risk leases expiring soon."""
        rows = _sb_list("tenants", session_id)
        if not rows:
            return "No tenants found."
        high = [r for r in rows if r.get("risk_level") == "High"]
        medium = [r for r in rows if r.get("risk_level") == "Medium"]
        low = [r for r in rows if r.get("risk_level") == "Low"]
        lines = [
            f"Total tenants: {len(rows)}",
            f"High risk: {len(high)} | Medium risk: {len(medium)} | Low risk: {len(low)}",
        ]
        if high:
            lines.append("\nHIGH RISK TENANTS:")
            for r in high:
                lines.append(f"  - {r.get('name','?')} (Unit {r.get('unit','?')}) — Score: {r.get('risk_score','?')} | Lease ends: {r.get('lease_end','?')}")
        return "\n".join(lines)

    # ── RAG document search ───────────────────────────────────────────────────

    def search_documents(query: str = "") -> str:
        """
        Semantic search over uploaded project documents (contracts, specs, RFIs,
        lease PDFs, daily reports, etc.). Use this when the question refers to
        specific document content, clauses, terms, or details not in structured data.
        """
        if not query:
            return "Provide a search query to find relevant document sections."
        try:
            from agents.rag.retriever import retrieve, format_context
            chunks = retrieve(session_id, query, top_k=5)
            if not chunks:
                return "No relevant document sections found. Documents may not have been ingested yet."
            return format_context(chunks)
        except Exception as e:
            return f"Document search unavailable: {e}"

    # Build StructuredTool list
    tools = [
        # Construction tools
        StructuredTool.from_function(func=daily_logs,           name="get_daily_logs",           description="Get construction site daily logs with weather, crew, work performed, delays, and incidents."),
        StructuredTool.from_function(func=rfis,                 name="get_rfis",                 description="Get all RFIs (Requests for Information) with status and priority."),
        StructuredTool.from_function(func=change_orders,        name="get_change_orders",        description="Get all change orders with amounts, status, and reasons."),
        StructuredTool.from_function(func=schedule,             name="get_schedule",             description="Get all schedule tasks with phase, progress, and status."),
        StructuredTool.from_function(func=punch_list,           name="get_punch_list",           description="Get construction punch list items with priority and status."),
        StructuredTool.from_function(func=obligations,          name="get_obligations",          description="Get contract obligations with due dates and responsible parties."),
        StructuredTool.from_function(func=projects,             name="get_projects",             description="Get all projects with completion percentage and status."),
        StructuredTool.from_function(func=submittals,           name="get_submittals",           description="Get submittals with compliance scores and review status."),
        StructuredTool.from_function(func=weather_risk_summary, name="get_weather_risk",         description="Analyze weather impact days and delay claim potential across all logs."),
        StructuredTool.from_function(func=overdue_tasks,        name="get_overdue_tasks",        description="Find overdue schedule tasks and high/critical open punch items."),
        # Property management tools
        StructuredTool.from_function(func=leases,               name="get_leases",               description="Get all leases with tenant, property, monthly rent, CAM, renewal options, and AI summary."),
        StructuredTool.from_function(func=tenants,              name="get_tenants",              description="Get all tenants with name, unit, rent, risk level, risk score, and lease end date."),
        StructuredTool.from_function(func=maintenance,          name="get_maintenance",          description="Get maintenance requests with unit, category, priority, status, AI diagnosis, and cost."),
        StructuredTool.from_function(func=noi_reports,          name="get_noi_reports",          description="Get NOI reports with gross rent, NOI, cap rate, and AI analysis per property."),
        StructuredTool.from_function(func=cam_reconciliations,  name="get_cam_reconciliations",  description="Get CAM reconciliation reports with total pool and per-tenant billable amounts."),
        StructuredTool.from_function(func=tenant_risk_summary,  name="get_tenant_risk_summary",  description="Summarize tenant risk levels across all tenants and flag high-risk leases."),
        # RAG document search
        StructuredTool.from_function(func=search_documents,     name="search_documents",         description="Semantic search over uploaded project documents (contracts, specs, lease PDFs, reports). Use for specific clauses, terms, or document content."),
    ]
    return tools
