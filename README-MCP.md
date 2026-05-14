# PRISM × MCP — Construction AI for Claude Desktop

This branch adds an **MCP (Model Context Protocol) server** to PRISM so that Claude Desktop can discover and call all of PRISM's construction AI tools directly in conversation — no UI required.

---

## What you can do

Open Claude Desktop and talk to your construction project in plain English:

> *"Create an RFI asking about the rebar spec at grid line C4"*  
> *"Assess this change order — $45,000 for unforeseen rock excavation"*  
> *"What does the contract say about liquidated damages?"*  
> *"Predict delay risk for Foundation, Structure, and MEP phases"*  
> *"Write a formal daily report narrative from yesterday's log"*  
> *"List all open RFIs and their days open"*

Claude calls the PRISM backend automatically and returns structured results.

---

## Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt
```

### 2. Start the PRISM backend

```bash
uvicorn main:app --reload --port 8000
```

Leave this terminal open.

### 3. Configure Claude Desktop

Find your Claude Desktop config file. On Windows it is typically at:

```
C:\Users\<YourName>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json
```

Open it and add the `mcpServers` block alongside any existing keys:

```json
{
  "mcpServers": {
    "prism": {
      "command": "C:/Users/<YourName>/prism/backend/venv/Scripts/python.exe",
      "args": ["C:/Users/<YourName>/prism/backend/mcp_server.py"],
      "env": {
        "PRISM_API_URL": "http://localhost:8000"
      }
    }
  },
  "preferences": {
    ...existing preferences...
  }
}
```

> **Important:** Use the full path to your venv Python, not just `python`. Claude Desktop runs outside your terminal environment and won't find the venv Python otherwise.

> To connect to the deployed cloud backend instead, set:  
> `"PRISM_API_URL": "https://prism-backend-975704476111.us-central1.run.app"`

### 4. Restart Claude Desktop

Fully quit Claude Desktop — right-click the system tray icon → **Quit** (closing the window is not enough). Reopen it.

Go to **Settings → Developer** to confirm PRISM shows a green connected status.

---

## Quick smoke test

Get a session ID:

```powershell
Invoke-WebRequest -Uri http://localhost:8000/session/new -Method POST -UseBasicParsing | Select-Object -ExpandProperty Content
```

Then in Claude Desktop chat:

> *"Using PRISM, call list_rfis with session_id \<your-session-id\>"*

You should see Claude make a tool call and return the RFI list (empty on a fresh session — that's correct).

---

## Available Tools

| Tool | What it does |
|---|---|
| `ask_project` | Cross-document Q&A with citations across all uploaded docs |
| `get_dashboard` | Project summary, contract value, parties, key dates |
| `contract_risk_analysis` | Clause-level risk scoring (Critical / High / Medium / Low) |
| `get_obligations` | All contract deadlines, notice requirements, milestones |
| `create_rfi` | Create a new RFI entry |
| `respond_rfi` | AI-generated RFI response referencing project documents |
| `list_rfis` | All RFIs with status and days open |
| `create_change_order` | Create a new change order entry |
| `assess_change_order` | In-scope / risk / recommendation scoring |
| `list_change_orders` | CO waterfall (Original → Approved → Pending → Revised) |
| `predict_delays` | Phase-level delay probability with recovery recommendations |
| `cost_forecast` | EAC, CPI, SPI, cost and schedule variance |
| `create_punch_item` | New deficiency / punch list item |
| `generate_daily_narrative` | Formal narrative + delay claim detection from a log entry |
| `optimize_schedule` | Critical path compression and parallelization opportunities |
| `safety_analyze` | PPE + hazard detection from a site photo URL |
| `subcontractor_scorecard` | Performance ratings across quality, schedule, safety, cost, communication |
| `generate_document` | Ready-to-send RFI response / delay notice / CO assessment / weekly summary |

---

## Session flow

All tools require a `session_id`. A session holds your uploaded documents and project index.

1. **Create a session** — `POST /session/new` → `{ session_id }`
2. **Upload documents** — use the PRISM web UI or `POST /construction/upload-classify`
3. **Build the index** — `POST /construction/build-project { session_id }`
4. **Use any MCP tool** — pass `session_id` and Claude does the rest

---

## Architecture

```
Claude Desktop
     │  MCP protocol (stdio)
     ▼
mcp_server.py          ← tool discovery + routing (this branch)
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

The MCP server also exposes two resources Claude can read at any time:

- `prism://docs/tools` — full tool reference
- `prism://docs/quickstart` — session setup guide

---

Built on the [Model Context Protocol](https://modelcontextprotocol.io) · [FastAPI](https://fastapi.tiangolo.com) · [Groq](https://groq.com) · [Gemini](https://deepmind.google/technologies/gemini)
