"""
PRISM MCP Server
Exposes PRISM's construction AI capabilities as MCP tools so that
Claude Desktop (and any other MCP client) can discover and call them.

Usage:
    python mcp_server.py

Requires the PRISM FastAPI backend to be running (default: http://localhost:8000).
Set PRISM_API_URL env var to point at a deployed instance.
"""

import os
import json
import httpx
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

PRISM_API = os.getenv("PRISM_API_URL", "http://localhost:8000")

app = Server("prism")

# ── helpers ────────────────────────────────────────────────────────────────────

async def _post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{PRISM_API}{path}", json=body)
        r.raise_for_status()
        return r.json()


async def _get(path: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{PRISM_API}{path}")
        r.raise_for_status()
        return r.json()


def _text(data: dict) -> list[types.TextContent]:
    return [types.TextContent(type="text", text=json.dumps(data, indent=2))]


# ── tool list ──────────────────────────────────────────────────────────────────

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="ask_project",
            description=(
                "Ask a question about the construction project in natural language. "
                "Searches across all uploaded documents (contracts, drawings, RFIs, specs, "
                "daily reports) and returns an answer with source citations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string", "description": "Active PRISM session ID"},
                    "question": {"type": "string", "description": "The question to ask about the project"},
                },
                "required": ["session_id", "question"],
            },
        ),
        types.Tool(
            name="get_dashboard",
            description=(
                "Get the project dashboard: contract value, parties, key dates, "
                "liquidated damages, and project summary extracted from uploaded documents."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string", "description": "Active PRISM session ID"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="contract_risk_analysis",
            description=(
                "Perform clause-level contract risk analysis. Returns a list of risk items "
                "with severity (Critical / High / Medium / Low), affected clause, explanation, "
                "and recommended action."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string", "description": "Active PRISM session ID"},
                    "contract_text": {"type": "string", "description": "Contract text to analyze (or leave empty to use uploaded contract)"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="get_obligations",
            description=(
                "List all contract obligations extracted for this session: deadlines, "
                "notice requirements, milestones, and compliance items — each with "
                "due date, responsible party, and completion status."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string", "description": "Active PRISM session ID"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="create_rfi",
            description="Create a new RFI (Request for Information) in the project register.",
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "subject": {"type": "string", "description": "RFI subject line"},
                    "question": {"type": "string", "description": "Detailed question or clarification needed (maps to description)"},
                    "submitted_by": {"type": "string", "description": "Name of the submitter"},
                    "trade": {"type": "string", "description": "Trade or discipline (e.g. Structural, MEP, Civil)"},
                    "priority": {"type": "string", "enum": ["Low", "Medium", "High", "Critical"], "description": "Priority level"},
                },
                "required": ["session_id", "subject", "question"],
            },
        ),
        types.Tool(
            name="respond_rfi",
            description=(
                "Generate an AI response to an RFI using the project's uploaded documents. "
                "Returns a professional response with references to relevant spec sections and drawings."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "rfi_id": {"type": "string", "description": "ID of the RFI to respond to"},
                    "question": {"type": "string", "description": "The RFI question (can re-state it here)"},
                },
                "required": ["session_id", "rfi_id"],
            },
        ),
        types.Tool(
            name="list_rfis",
            description="List all RFIs in the project register with status, days open, and response.",
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="create_change_order",
            description="Create a new Change Order (CO) in the project register.",
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "title": {"type": "string", "description": "Change order title"},
                    "description": {"type": "string", "description": "Detailed description of the change"},
                    "amount": {"type": "number", "description": "Dollar amount of the change"},
                    "submitted_by": {"type": "string", "description": "Party submitting the CO"},
                    "reason": {"type": "string", "description": "Reason for the change (owner request, differing conditions, etc.)"},
                },
                "required": ["session_id", "title", "description", "amount"],
            },
        ),
        types.Tool(
            name="assess_change_order",
            description=(
                "AI assessment of a Change Order: checks if it's in-scope or out-of-scope "
                "per the contract, evaluates risk, and provides a recommendation (approve / reject / negotiate)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "co_id": {"type": "string", "description": "ID of the change order to assess"},
                    "description": {"type": "string", "description": "Change order description"},
                    "amount": {"type": "number", "description": "Dollar amount"},
                },
                "required": ["session_id", "co_id"],
            },
        ),
        types.Tool(
            name="list_change_orders",
            description=(
                "List all change orders with status, amounts, and the contract value waterfall "
                "(Original → Approved → Pending → Revised Total)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="predict_delays",
            description=(
                "Predict delay risk by project phase. Returns probability of delay, "
                "estimated days at risk, contributing factors, and recovery recommendations "
                "for each phase."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "phases": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of project phases to analyze (e.g. ['Foundation', 'Structure', 'MEP', 'Finishes'])",
                    },
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="cost_forecast",
            description=(
                "Generate cost forecast: EAC (Estimate at Completion), CPI, SPI, "
                "cost variance, schedule variance, and scenario range (optimistic / likely / pessimistic)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "budget": {"type": "number", "description": "Original budget / BAC"},
                    "actual_cost": {"type": "number", "description": "Actual cost spent to date"},
                    "pct_complete": {"type": "number", "description": "Percentage complete (0-100). If omitted, calculated from earned_value/budget."},
                    "earned_value": {"type": "number", "description": "Earned value (% complete × BAC) — used to derive pct_complete if not provided"},
                },
                "required": ["session_id"],
            },
        ),
        types.Tool(
            name="create_punch_item",
            description="Create a new punch list item (deficiency) in the project.",
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "description": {"type": "string", "description": "Description of the deficiency"},
                    "location": {"type": "string", "description": "Location on site (e.g. 'Level 3 - Grid C4')"},
                    "trade": {"type": "string", "description": "Responsible trade (e.g. Drywall, Electrical)"},
                    "priority": {"type": "string", "enum": ["Low", "Medium", "High", "Critical"]},
                    "ball_in_court": {"type": "string", "enum": ["Contractor", "Owner", "Architect", "Inspector"]},
                },
                "required": ["session_id", "description"],
            },
        ),
        types.Tool(
            name="generate_daily_narrative",
            description=(
                "Generate a formal daily report narrative from a log entry. "
                "Also detects potential delay claims and weather impact events."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "log_id": {"type": "string", "description": "ID of the daily log entry"},
                    "date": {"type": "string", "description": "Date of the log (YYYY-MM-DD)"},
                    "weather": {"type": "string", "description": "Weather conditions"},
                    "crew_count": {"type": "integer", "description": "Total crew on site"},
                    "labor_hours": {"type": "number", "description": "Total labor hours worked"},
                    "work_performed": {"type": "string", "description": "Summary of work performed"},
                    "delays": {"type": "string", "description": "Any delays encountered"},
                    "incidents": {"type": "string", "description": "Any safety incidents"},
                },
                "required": ["session_id", "log_id", "date", "work_performed"],
            },
        ),
        types.Tool(
            name="optimize_schedule",
            description=(
                "AI schedule optimization: analyzes your task list and reorders / compresses it "
                "to find time savings, surfacing critical path and parallelization opportunities."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "tasks": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "duration": {"type": "number"},
                                "dependencies": {"type": "array", "items": {"type": "string"}},
                            },
                        },
                        "description": "List of schedule tasks with durations and dependencies",
                    },
                },
                "required": ["session_id", "tasks"],
            },
        ),
        types.Tool(
            name="safety_analyze",
            description=(
                "Analyze a site photo for safety compliance. Detects PPE violations, "
                "identifies hazards, and returns a safety score with recommended actions. "
                "Pass a publicly accessible image URL."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "image_url": {"type": "string", "description": "URL of the site photo to analyze"},
                },
                "required": ["session_id", "image_url"],
            },
        ),
        types.Tool(
            name="subcontractor_scorecard",
            description=(
                "Generate a performance scorecard for a subcontractor. Rates quality, "
                "schedule adherence, safety, communication, and cost management."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "subcontractor_name": {"type": "string"},
                    "trade": {"type": "string"},
                    "notes": {"type": "string", "description": "Performance observations and notes"},
                },
                "required": ["session_id", "subcontractor_name", "trade"],
            },
        ),
        types.Tool(
            name="generate_document",
            description=(
                "Generate a ready-to-send construction document. Supported types: "
                "'rfi_response', 'delay_notice', 'change_order_assessment', 'weekly_summary'."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "doc_type": {
                        "type": "string",
                        "enum": ["rfi_response", "delay_notice", "change_order_assessment", "weekly_summary"],
                        "description": "Type of document to generate",
                    },
                    "context": {"type": "string", "description": "Relevant context or details for the document"},
                },
                "required": ["session_id", "doc_type"],
            },
        ),
    ]


# ── tool handlers ──────────────────────────────────────────────────────────────

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:

    if name == "ask_project":
        result = await _post("/construction/ask", {
            "session_id": arguments["session_id"],
            "question": arguments["question"],
        })
        return _text(result)

    if name == "get_dashboard":
        result = await _get(f"/construction/dashboard/{arguments['session_id']}")
        return _text(result)

    if name == "contract_risk_analysis":
        body = {"session_id": arguments["session_id"]}
        if "contract_text" in arguments:
            body["contract_text"] = arguments["contract_text"]
        result = await _post("/construction/contract-risk", body)
        return _text(result)

    if name == "get_obligations":
        result = await _get(f"/construction/obligations/{arguments['session_id']}")
        return _text(result)

    if name == "create_rfi":
        body = {
            "session_id": arguments["session_id"],
            "subject": arguments["subject"],
            "description": arguments.get("question", arguments.get("description", "")),
            "submitted_by": arguments.get("submitted_by", "GC"),
            "assigned_to": arguments.get("trade", "Architect"),
            "priority": arguments.get("priority", "Medium"),
            "date_submitted": arguments.get("date_submitted", ""),
            "date_due": arguments.get("date_due", ""),
        }
        result = await _post("/construction/rfi-register/create", body)
        return _text(result)

    if name == "respond_rfi":
        result = await _post("/construction/rfi-register/respond", arguments)
        return _text(result)

    if name == "list_rfis":
        result = await _get(f"/construction/rfi-register/{arguments['session_id']}")
        return _text(result)

    if name == "create_change_order":
        result = await _post("/construction/co-register/create", arguments)
        return _text(result)

    if name == "assess_change_order":
        result = await _post("/construction/co-register/assess", arguments)
        return _text(result)

    if name == "list_change_orders":
        result = await _get(f"/construction/co-register/{arguments['session_id']}")
        return _text(result)

    if name == "predict_delays":
        body = {"session_id": arguments["session_id"]}
        if "phases" in arguments:
            body["phases"] = arguments["phases"]
        result = await _post("/construction/predict-delays", body)
        return _text(result)

    if name == "cost_forecast":
        budget = arguments.get("budget", 0)
        actual_cost = arguments.get("actual_cost", arguments.get("spent", 0))
        earned_value = arguments.get("earned_value", 0)
        pct_complete = arguments.get("pct_complete", round(earned_value / budget * 100, 1) if budget else 0)
        body = {
            "session_id": arguments["session_id"],
            "budget": budget,
            "spent": actual_cost,
            "pct_complete": pct_complete,
        }
        result = await _post("/construction/cost-forecast", body)
        return _text(result)

    if name == "create_punch_item":
        result = await _post("/construction/punch/create", arguments)
        return _text(result)

    if name == "generate_daily_narrative":
        result = await _post("/construction/daily-log/ai-summary", arguments)
        return _text(result)

    if name == "optimize_schedule":
        result = await _post("/construction/optimize-schedule", arguments)
        return _text(result)

    if name == "safety_analyze":
        result = await _post("/construction/safety-analyze", arguments)
        return _text(result)

    if name == "subcontractor_scorecard":
        result = await _post("/construction/subcontractor-score", arguments)
        return _text(result)

    if name == "generate_document":
        result = await _post("/construction/generate", arguments)
        return _text(result)

    return _text({"error": f"Unknown tool: {name}"})


# ── resources ──────────────────────────────────────────────────────────────────

@app.list_resources()
async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="prism://docs/tools",
            name="PRISM Tool Reference",
            description="Full reference of all PRISM MCP tools and their parameters",
            mimeType="text/plain",
        ),
        types.Resource(
            uri="prism://docs/quickstart",
            name="PRISM Quickstart",
            description="How to start a PRISM session and upload documents",
            mimeType="text/plain",
        ),
    ]


@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "prism://docs/tools":
        return (
            "PRISM MCP Tools\n"
            "===============\n\n"
            "Session: All tools require a session_id. Create one with POST /session/new.\n\n"
            "ask_project          — Cross-document Q&A with citations\n"
            "get_dashboard        — Project summary, contract value, key dates\n"
            "contract_risk_analysis — Clause-level risk scoring\n"
            "get_obligations      — All contract deadlines and milestones\n"
            "create_rfi           — New RFI entry\n"
            "respond_rfi          — AI-generated RFI response\n"
            "list_rfis            — All RFIs with status\n"
            "create_change_order  — New CO entry\n"
            "assess_change_order  — In-scope/risk/recommendation scoring\n"
            "list_change_orders   — CO waterfall and status\n"
            "predict_delays       — Phase delay probability\n"
            "cost_forecast        — EAC, CPI, SPI, variance\n"
            "create_punch_item    — New deficiency item\n"
            "generate_daily_narrative — Formal narrative + delay claim detection\n"
            "optimize_schedule    — Critical path compression\n"
            "safety_analyze       — PPE + hazard detection from site photo\n"
            "subcontractor_scorecard — Performance ratings\n"
            "generate_document    — Ready-to-send RFI/delay/CO/summary docs\n"
        )
    if uri == "prism://docs/quickstart":
        return (
            "PRISM Quickstart\n"
            "================\n\n"
            "1. Create a session:\n"
            "   POST /session/new  →  { session_id: 'abc123' }\n\n"
            "2. Upload documents:\n"
            "   POST /construction/upload-classify  (multipart, field: files[])\n\n"
            "3. Build the project index:\n"
            "   POST /construction/build-project  { session_id }\n\n"
            "4. Use any PRISM tool with that session_id.\n\n"
            "Backend URL (local): http://localhost:8000\n"
            "Backend URL (cloud): https://prism-backend-975704476111.us-central1.run.app\n"
        )
    return "Resource not found."


# ── entry point ────────────────────────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
