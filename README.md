<div align="center">

# ◈ PRISM

### AI-Native Construction Intelligence Platform

*Upload your contracts, drawings, RFIs, and daily reports — get instant insights, risk flags, delay claim detection, and ready-to-send documents. Built for how construction actually works.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-00a8f0?style=for-the-badge&logo=firebase&logoColor=white)](https://project-11d70901-66cf-42-d3a19.web.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://prism-backend-975704476111.us-central1.run.app)
[![React](https://img.shields.io/badge/React%2019-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MCP](https://img.shields.io/badge/MCP-Claude%20Desktop-orange?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)

</div>

---

## MCP Integration — Talk to Your Project in Claude Desktop

This branch adds an **MCP (Model Context Protocol) server** so Claude Desktop can call all of PRISM's construction AI tools directly in conversation — no UI required.

> *"Create an RFI asking about the rebar spec at grid line C4"*  
> *"Assess this change order — $45,000 for unforeseen rock excavation"*  
> *"What does the contract say about liquidated damages?"*  
> *"Predict delay risk for Foundation, Structure, and MEP phases"*

### MCP Setup

**1. Start the PRISM backend**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**2. Add to Claude Desktop config**

Find your config file at:
```
C:\Users\<YourName>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json
```

Add the `mcpServers` block:
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
  }
}
```

> Use the full path to your **venv Python** — not just `python`. Claude Desktop runs outside your terminal and won't find the venv otherwise.

**3. Restart Claude Desktop** (fully quit via system tray → Quit, then reopen)

**4. Verify** — Settings → Developer → PRISM should show green/connected

### MCP Tools

| Tool | What it does |
|---|---|
| `ask_project` | Cross-document Q&A with citations |
| `get_dashboard` | Project summary, contract value, key dates |
| `contract_risk_analysis` | Clause-level risk scoring |
| `get_obligations` | All contract deadlines and milestones |
| `create_rfi` / `respond_rfi` / `list_rfis` | Full RFI lifecycle |
| `create_change_order` / `assess_change_order` / `list_change_orders` | Full CO lifecycle |
| `predict_delays` | Phase-level delay probability |
| `cost_forecast` | EAC, CPI, SPI, variance analysis |
| `create_punch_item` | New deficiency item |
| `generate_daily_narrative` | Formal narrative + delay claim detection |
| `optimize_schedule` | Critical path compression |
| `safety_analyze` | PPE + hazard detection from site photo |
| `subcontractor_scorecard` | Performance ratings across 5 dimensions |
| `generate_document` | Ready-to-send RFI / delay notice / CO / weekly summary |

---

<div align="center">

## What PRISM Does

</div>

Most construction software is just digital paperwork. PRISM is different — it reads your documents, understands your project, and works like an expert assistant that never sleeps.

Upload a contract and PRISM extracts every obligation, deadline, and risk clause. Upload a daily report and it writes the formal narrative, flags potential delay claims, and detects weather impact events. Upload an RFI and it drafts a professional response referencing your project documents. It connects the dots across your entire document stack so you don't have to.

---

## Screenshots

<img width="1911" alt="Dashboard" src="https://github.com/user-attachments/assets/af75d5da-acb5-4aa1-8a3e-73b2ae6ad46a" />
<img width="1887" alt="Documents" src="https://github.com/user-attachments/assets/838b0c5c-8fe0-4ece-9386-39424963f9e0" />
<img width="1915" alt="Risk Intelligence" src="https://github.com/user-attachments/assets/8988b67e-4c71-4a40-b203-347f5ef1d035" />
<img width="1908" alt="Contract Analysis" src="https://github.com/user-attachments/assets/0c9bae21-3382-4f84-b995-cd204076a45c" />
<img width="1916" alt="Scheduling" src="https://github.com/user-attachments/assets/a5064b31-dadc-4907-8e89-3359e6056d14" />
<img width="1908" alt="Safety AI" src="https://github.com/user-attachments/assets/28d68cde-1b41-40b0-a97e-2273ffeaad6a" />
<img width="1914" alt="RFI Register" src="https://github.com/user-attachments/assets/46899854-5e19-4a5c-86d4-856f5a28d925" />
<img width="1908" alt="Change Orders" src="https://github.com/user-attachments/assets/b11e72ab-2db4-4e95-b262-69ad441f308e" />
<img width="1908" alt="Obligations" src="https://github.com/user-attachments/assets/1b155330-58e0-482e-8643-efa53f3c71e0" />

---

## Features

### Document Intelligence
Upload any construction document — PRISM classifies it, indexes it, and makes it queryable across your whole project.

| Capability | What it does |
|---|---|
| **Auto Classification** | AI identifies document type: Contract, Drawing, RFI, Spec, Daily Report, Change Order, or Meeting Minutes |
| **Cross-Document Q&A** | Ask questions in plain English and get answers with source citations across all uploaded documents |
| **Project Dashboard** | Automatically extracts project name, contract value, parties, key dates, and liquidated damages |
| **Risk Intelligence** | Continuously scans all documents for risks — surfaced without being asked |

---

### Contract & Compliance

| Capability | What it does |
|---|---|
| **Contract Risk Analysis** | Clause-level risk scoring with severity ratings (Critical / High / Medium / Low) and recommended actions |
| **Obligations Tracker** | Extracts every deadline, notice requirement, and milestone from the contract — color-coded by urgency, never miss a date |
| **Spec Compliance** | Checks submittals against specification requirements with a compliance score and line-by-line gap analysis |

---

### Project Administration — with AI

These are the tools construction teams use every day. PRISM adds AI on top of each one.

| Tool | What makes it different |
|---|---|
| **RFI Register** | Full log with status tracking, days-open counter, and AI-generated responses that reference your project documents |
| **Change Order Register** | Contract value waterfall (Original → Approved → Pending → Revised), AI clause assessment with in-scope/risk/recommendation scoring, one-click approve or reject |
| **Punch List** | Priority-scored deficiency tracking with ball-in-court workflow (Contractor / Owner / Architect / Inspector) and AI auto-categorization across all open items |
| **Submittals** | Ball-in-court status tracking, days-in-review counter, AI pre-review with compliance scoring and red-flag detection |
| **Daily Log** | Structured daily entry → AI writes the formal narrative, automatically detects potential delay claims, and flags weather impact events |

---

### Cost & Schedule Intelligence

| Capability | What it does |
|---|---|
| **Cost Forecasting** | EAC, CPI, SPI, cost variance analysis, and scenario range from your project data |
| **Predictive Delay Risk** | Phase-by-phase delay probability with recovery recommendations |
| **Schedule Optimization** | AI reorders and compresses your task list to find time savings |
| **Natural Language Task Entry** | Add schedule items in plain English — AI parses dates, durations, and dependencies |

---

### Safety & Field

| Capability | What it does |
|---|---|
| **Safety AI** | Upload a site photo — detects PPE compliance, identifies hazards, generates a safety score |
| **Blueprint Analysis** | Gemini Vision reads drawing sheets — counts components, flags coordination issues, extracts dimensions |
| **Meeting Intelligence** | Upload a meeting PDF → extracts action items, decisions, risks, and follow-ups |
| **Subcontractor Scorecard** | Rates each subcontractor on quality, schedule, safety, communication, and cost |
| **Document Generation** | One-click generation of RFI responses, delay notices, change order assessments, and weekly summaries |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite |
| **Styling** | Inline styles — zero dependencies · Outfit + JetBrains Mono |
| **Routing** | React Router v7 |
| **Backend** | FastAPI · Uvicorn · Python 3.11 |
| **LLM** | LLaMA 3.1 8B Instant via Groq API |
| **Vision AI** | Gemini 2.0 Flash |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 (384-dim, CPU) |
| **Vector Store** | FAISS with MMR retrieval |
| **PDF Parsing** | pdfplumber + pypdf |
| **MCP Server** | Python MCP SDK · httpx |
| **Frontend Hosting** | Firebase Hosting |
| **Backend Hosting** | Google Cloud Run |

---

## Demo Access

No sign-up required. Choose a role at the login screen:

| Role | Profile |
|---|---|
| **Project Manager** | Marcus Rivera — full access |
| **Site Engineer** | Sarah Kim — field and scheduling focus |
| **Quantity Surveyor** | Ahmed Hassan — cost and contracts focus |
| **Safety Officer** | Priya Nair — safety and compliance focus |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier available)
- [Gemini API key](https://aistudio.google.com) (free tier available)

### Backend

```bash
cd prism/backend

python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=your_gemini_key_here
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd prism/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Deployment

### Frontend — Firebase Hosting

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend — Google Cloud Run

```powershell
cd backend
gcloud run deploy prism-backend `
  --source . `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars "GROQ_API_KEY=...,GROQ_MODEL=llama-3.1-8b-instant,GEMINI_API_KEY=..." `
  --memory 2Gi `
  --timeout 300
```

---

## Project Structure

```
prism/
├── backend/
│   ├── main.py              ← All FastAPI routes (single file)
│   ├── mcp_server.py        ← MCP server — exposes tools to Claude Desktop
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                 ← GROQ_API_KEY · GEMINI_API_KEY
│
└── frontend/
    └── src/
        ├── App.tsx           ← Router · localStorage auth · session state
        ├── api/client.ts     ← Typed API client
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── Navbar.tsx
        │   ├── AICopilot.tsx
        │   └── ...
        └── pages/construction/
            ├── Dashboard.tsx
            ├── Documents.tsx
            ├── RFIRegister.tsx
            ├── ChangeOrders.tsx
            ├── Obligations.tsx
            ├── PunchList.tsx
            ├── Submittals.tsx
            ├── DailyLog.tsx
            ├── Scheduling.tsx
            ├── Analytics.tsx
            ├── Intelligence.tsx
            ├── Safety.tsx
            ├── GenerateDocs.tsx
            └── ...
```

---

## API Reference

### Session
| Method | Endpoint | Description |
|---|---|---|
| POST | `/session/new` | Create session — returns `session_id` |

### Documents & Q&A
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/upload-classify` | Upload + auto-classify documents |
| POST | `/construction/build-project` | Build FAISS index + generate dashboard |
| GET | `/construction/dashboard/{id}` | Get project dashboard |
| POST | `/construction/ask` | Cross-document Q&A with citations |

### AI Analysis
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/generate` | Generate RFI / delay notice / CO / weekly summary |
| POST | `/construction/contract-risk` | Clause-level contract risk analysis |
| POST | `/construction/cost-forecast` | EAC, CPI, variance forecast |
| POST | `/construction/predict-delays` | Phase-level delay probability |
| POST | `/construction/optimize-schedule` | AI schedule compression |
| POST | `/construction/nl-task` | Parse natural language task |
| POST | `/construction/subcontractor-score` | Subcontractor performance scorecard |
| POST | `/construction/meeting-intelligence` | Extract actions/decisions from meeting PDF |
| POST | `/construction/spec-compliance` | Check submittal against spec |
| POST | `/construction/safety-analyze` | PPE + hazard analysis from site photo |
| POST | `/construction/analyze-blueprint` | Blueprint/drawing computer vision analysis |

### RFI Register
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/rfi-register/create` | Create new RFI |
| GET | `/construction/rfi-register/{id}` | List all RFIs |
| POST | `/construction/rfi-register/respond` | AI-generate RFI response |
| PUT | `/construction/rfi-register/update` | Update RFI status or response |

### Change Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/co-register/create` | Create new change order |
| GET | `/construction/co-register/{id}` | List all change orders |
| POST | `/construction/co-register/assess` | AI assessment of change order |
| PUT | `/construction/co-register/update` | Approve / reject / update |

### Contract Obligations
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/obligations/extract` | Extract obligations from contract |
| GET | `/construction/obligations/{id}` | List all obligations |
| PUT | `/construction/obligations/complete` | Toggle obligation complete |

### Punch List
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/punch/create` | Create punch item |
| GET | `/construction/punch/{id}` | List all punch items |
| POST | `/construction/punch/ai-categorize` | AI categorize open items |
| PUT | `/construction/punch/update` | Update status / ball-in-court |

### Submittals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/submittals/create` | Create new submittal |
| GET | `/construction/submittals/{id}` | List all submittals |
| POST | `/construction/submittals/ai-review` | AI pre-review with compliance scoring |
| PUT | `/construction/submittals/update` | Update status |

### Daily Log
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/daily-log/create` | Create daily log entry |
| GET | `/construction/daily-log/{id}` | List all daily logs |
| POST | `/construction/daily-log/ai-summary` | Generate narrative + detect delay claims |

---

## Known Limitations

- **Scanned PDFs** need OCR pre-processing — [ilovepdf.com](https://ilovepdf.com) works well
- **Sessions are in-memory** on the backend — redeployment clears active sessions
- **Large PDFs** (100+ pages) take longer on first embed
- **Safety photo analysis** requires Gemini Vision — falls back to demo data if key is absent
- **MCP session persistence** — each Claude Desktop conversation needs an active session ID; sessions reset on backend restart

---

<div align="center">

Built with [FastAPI](https://fastapi.tiangolo.com) · [React](https://react.dev) · [LangChain](https://langchain.com) · [FAISS](https://github.com/facebookresearch/faiss) · [Groq](https://groq.com) · [Gemini](https://deepmind.google/technologies/gemini) · [Firebase](https://firebase.google.com) · [Cloud Run](https://cloud.google.com/run) · [MCP](https://modelcontextprotocol.io)

</div>
