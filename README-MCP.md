# PRISM × MCP — Construction AI for Claude Desktop

This branch adds an **MCP (Model Context Protocol) server** to PRISM so that Claude Desktop (or any MCP client) can discover and call all of PRISM's construction AI tools directly in conversation.

---

## What this means

You can open Claude Desktop and say things like:

> *"Create an RFI asking about the rebar spec at grid line C4"*  
> *"Assess this change order — $45,000 for unforeseen rock excavation"*  
> *"What does the contract say about liquidated damages?"*  
> *"Predict delay risk for Foundation, Structure, and MEP phases"*  
> *"Write a formal daily report narrative from yesterday's log"*

Claude will call PRISM's backend automatically, with full access to your uploaded project documents.

---

## Setup

### 1. Start the PRISM backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Install MCP dependencies

```bash
pip install mcp httpx
```

### 3. Configure Claude Desktop

Copy the config below into your Claude Desktop MCP settings file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prism": {
      "command": "python",
      "args": ["C:/Users/Laya Myadam/prism/backend/mcp_server.py"],
      "env": {
        "PRISM_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

> To connect to the deployed cloud backend instead, set:  
> `"PRISM_API_URL": "https://prism-backend-975704476111.us-central1.run.app"`

### 4. Restart Claude Desktop

Claude Desktop will start the MCP server automatically. You should see **PRISM** appear in the tools panel.

---

## Available Tools

| Tool | What it does |
|---|---|
| `ask_project` | Cross-document Q&A with citations |
| `get_dashboard` | Project summary, contract value, key dates |
| `contract_risk_analysis` | Clause-level risk scoring (Critical / High / Medium / Low) |
| `get_obligations` | All contract deadlines and milestones |
| `create_rfi` | Create a new RFI entry |
| `respond_rfi` | AI-generated RFI response referencing project docs |
| `list_rfis` | All RFIs with status and days open |
| `create_change_order` | Create a new CO entry |
| `assess_change_order` | In-scope / risk / recommendation scoring |
| `list_change_orders` | CO waterfall (Original → Approved → Pending → Revised) |
| `predict_delays` | Phase-level delay probability with recovery recommendations |
| `cost_forecast` | EAC, CPI, SPI, cost variance analysis |
| `create_punch_item` | New deficiency / punch list item |
| `generate_daily_narrative` | Formal narrative + delay claim detection |
| `optimize_schedule` | Critical path compression and parallelization |
| `safety_analyze` | PPE + hazard detection from site photo URL |
| `subcontractor_scorecard` | Performance ratings across 5 dimensions |
| `generate_document` | Ready-to-send RFI response / delay notice / CO assessment / weekly summary |

---

## Session flow

All tools require a `session_id`. To get one, hit the PRISM backend directly:

```bash
curl -X POST http://localhost:8000/session/new
# → { "session_id": "abc123" }
```

Then upload your project documents via the PRISM web UI, or use:

```bash
curl -X POST http://localhost:8000/construction/upload-classify \
  -F "session_id=abc123" \
  -F "files[]=@contract.pdf" \
  -F "files[]=@drawings.pdf"

curl -X POST http://localhost:8000/construction/build-project \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc123"}'
```

After that, pass `session_id` to any MCP tool and Claude can answer questions about your specific project.

---

## Architecture

```
Claude Desktop
     │  MCP protocol (stdio)
     ▼
mcp_server.py          ← this file — tool discovery + routing
     │  HTTP (httpx)
     ▼
main.py (FastAPI)      ← all AI logic, FAISS, Groq, Gemini
     │
     ├── FAISS vectorstore  (per-session document index)
     ├── Groq / LLaMA 3.1   (text generation)
     └── Gemini Vision       (blueprint + safety photo analysis)
```

---

## Resources

The MCP server also exposes two resources Claude can read:

- `prism://docs/tools` — full tool reference
- `prism://docs/quickstart` — session setup guide
