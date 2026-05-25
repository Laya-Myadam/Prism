<div align="center">

# ◈ PRISM

### AI Construction & Property Management Intelligence Platform

*Two domains. One platform. Document-aware AI that works like an expert who never sleeps.*

Upload contracts, drawings, RFIs, daily reports, leases, and maintenance requests — get instant insights, risk flags, delay claim detection, approval workflows, and ready-to-send documents. Built for how construction and property management actually works.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-00a8f0?style=for-the-badge&logo=firebase&logoColor=white)](https://project-11d70901-66cf-42-d3a19.web.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://prism-backend-975704476111.us-central1.run.app)
[![React](https://img.shields.io/badge/React%2019-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph)
[![MCP](https://img.shields.io/badge/MCP-Claude%20Desktop-orange?style=for-the-badge&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)

</div>

---

## What PRISM Does

Most construction and property management software is just digital paperwork. PRISM is different — it reads your documents, understands your project, and acts like an expert assistant with full context of your entire document stack.

**Construction side:** Upload a contract and PRISM extracts every obligation, deadline, and risk clause. Upload a daily report and it writes the formal narrative, flags potential delay claims, and detects weather impact events. Upload an RFI and it drafts a professional response referencing your indexed documents.

**Property management side:** Upload a lease PDF and PRISM extracts every key term — rent escalations, CAM caps, renewal options, TI allowances. Score tenant creditworthiness with AI. Forecast NOI and cap rates. Track maintenance orders with AI diagnosis. Everything that gets submitted — leases, high-priority maintenance, CAM bills, NOI reports, high-risk tenants — flows through a human approval queue before activation.

---

## Platform Overview

| Domain | Pages | DB Tables |
|---|---|---|
| **Construction** | Dashboard · Documents · Projects · RFI Register · Change Orders · Obligations · Punch List · Submittals · Daily Log · Scheduling · Analytics · Intelligence · Safety · Generate Docs · Knowledge Graph | rfis · change_orders · obligations · punch_items · submittals · daily_logs · workers · projects · schedule_tasks |
| **Property Management** | Lease Abstraction · Tenant Risk · NOI Forecaster · Maintenance Orders · CAM Reconciliation · Daily Log · Unit Turnover · Approval Queue | leases · tenants · maintenance_requests · noi_reports · cam_reconciliations · pm_daily_logs · unit_turnovers · approvals |
| **Shared** | Settings | user_settings |

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

### Construction — Document Intelligence

Upload any construction document — PRISM classifies it, indexes it, and makes it queryable across your whole project.

| Capability | What it does |
|---|---|
| **Auto Classification** | AI identifies document type: Contract, Drawing, RFI, Spec, Daily Report, Change Order, or Meeting Minutes |
| **Cross-Document Q&A** | Ask questions in plain English — get answers with source citations across all uploaded documents |
| **Project Dashboard** | Automatically extracts project name, contract value, parties, key dates, and liquidated damages |
| **Risk Intelligence** | Continuously scans all documents for risks and surfaces them without being asked |
| **Knowledge Graph** | Entity-relationship visualization — people, companies, obligations, clauses, and how they connect |

---

### Construction — Contract & Compliance

| Capability | What it does |
|---|---|
| **Contract Risk Analysis** | Clause-level risk scoring with severity ratings (Critical / High / Medium / Low) and recommended actions |
| **Obligations Tracker** | Extracts every deadline, notice requirement, and milestone — color-coded by urgency, never miss a date |
| **Spec Compliance** | Checks submittals against specification requirements with a compliance score and line-by-line gap analysis |

---

### Construction — Project Administration (AI-augmented)

| Tool | What makes it different |
|---|---|
| **RFI Register** | Full log with status tracking, days-open counter, and AI-generated responses referencing your project documents |
| **Change Order Register** | Contract value waterfall (Original → Approved → Pending → Revised), AI clause assessment, one-click approve/reject |
| **Punch List** | Priority-scored deficiency tracking with ball-in-court workflow and AI auto-categorization |
| **Unit Turnover Checklist** | 25-point inspection checklist auto-saved to DB on every toggle — tracks all saved units with In Progress / Complete status |
| **Submittals** | Ball-in-court tracking, days-in-review counter, AI pre-review with compliance scoring and red-flag detection |
| **Daily Log** | Structured entry → AI writes the formal narrative, detects delay claims, flags weather impact events |
| **Projects** | Create and manage projects with live status, completion %, phase, RFI count, and workers — all DB-persisted |
| **Scheduling** | Gantt-style task management with phase grouping, Kanban view, natural language task entry — DB-persisted |
| **Workforce** | Crew management, trade tracking, daily rate, and attendance — persisted per session |

---

### Construction — Cost & Schedule Intelligence

| Capability | What it does |
|---|---|
| **Cost Forecasting** | EAC, CPI, SPI, cost variance analysis, and scenario range from your project data |
| **Predictive Delay Risk** | Phase-by-phase delay probability with recovery recommendations |
| **Schedule Optimization** | AI reorders and compresses your task list to find time savings |
| **Natural Language Task Entry** | Add schedule items in plain English — AI parses dates, durations, and dependencies |
| **Subcontractor Scorecard** | Rates subcontractors on quality, schedule, safety, communication, and cost |
| **Meeting Intelligence** | Upload a meeting PDF → extracts action items, decisions, risks, and follow-ups |

---

### Construction — Safety & Field

| Capability | What it does |
|---|---|
| **Safety AI** | Upload a site photo — detects PPE compliance, identifies hazards, generates a safety score |
| **Blueprint Analysis** | Gemini Vision reads drawing sheets — counts components, flags coordination issues, extracts dimensions |
| **Document Generation** | One-click generation of RFI responses, delay notices, change order assessments, and weekly summaries |

---

### Property Management — Lease Abstraction

| Capability | What it does |
|---|---|
| **AI Lease Parsing** | Upload any lease PDF — extracts rent, escalations, CAM cap, TI allowance, renewal options, termination clauses |
| **Key Term Summary** | Plain-English summary of every lease alongside the raw extracted data |
| **Approval Gate** | Every abstracted lease is submitted to the Approval Queue before status becomes Active |
| **Status Tracking** | Pending Approval → Active / Rejected — shown inline on each lease row |

---

### Property Management — Tenant Risk Scoring

| Capability | What it does |
|---|---|
| **AI Credit Assessment** | Scores each tenant across 5 risk dimensions — payment history, financial stability, business type, lease terms, references |
| **Risk Level Classification** | Low / Medium / High with detailed narrative |
| **Auto-Escalation** | High-risk tenants are automatically submitted to the Approval Queue for supervisor review |
| **Manual Escalation** | One-click escalate button for any tenant flagged as high risk without a pending approval |

---

### Property Management — NOI Forecaster

| Capability | What it does |
|---|---|
| **NOI Calculation** | Gross potential rent → vacancy loss → other income → effective gross → operating expenses → NOI |
| **Cap Rate Analysis** | Automatic cap rate with AI performance benchmarking |
| **AI Recommendations** | Actionable suggestions to improve NOI based on the property's numbers |
| **Approval Gate** | Every NOI report requires supervisor approval before it can be Published |

---

### Property Management — Maintenance Orders

| Capability | What it does |
|---|---|
| **Work Order Tracking** | Full maintenance lifecycle — Open → In Progress → Resolved with vendor assignment and cost tracking |
| **AI Diagnosis** | AI assesses the issue, estimates root cause, and recommends resolution approach |
| **Dispatch Approval** | High-priority maintenance orders require dispatch approval before work begins |
| **Approval Status** | Awaiting Dispatch / Dispatch Approved / Dispatch Rejected — shown inline on each order |

---

### Property Management — CAM Reconciliation

| Capability | What it does |
|---|---|
| **Pro-Rata Allocation** | Calculates each tenant's CAM share based on leasable area |
| **Cap Enforcement** | Applies CAM cap percentages and flags tenants over cap |
| **AI Summary** | Narrative explaining the reconciliation, variances, and billing recommendations |
| **Approval Gate** | Every CAM reconciliation requires supervisor sign-off before billing goes out |

---

### Property Management — Unit Turnover

| Capability | What it does |
|---|---|
| **25-Point Checklist** | Covers all rooms, systems, appliances, and exterior items |
| **Auto-Save on Toggle** | Every checkbox change is debounced 800ms and persisted to Supabase — no Save button needed |
| **Multi-Unit Management** | Switch between units; each unit's checklist is independently saved and loaded from DB |
| **Completion Tracking** | Saved units strip shows Complete (green) or In Progress (amber) status across all units |
| **Notes** | Free-text notes field per unit — also auto-saved |

---

### Human Guardrails — Approval Queue

Every significant action flows through a supervisor approval layer. No AI decision takes effect without a human sign-off.

| Trigger | Type | Approval Required | Status Transition |
|---|---|---|---|
| Lease abstracted | `lease` | Supervisor | Pending → Active / Rejected |
| High-priority maintenance | `maintenance` | Dispatch manager | Pending → Dispatch Approved / Open |
| CAM reconciliation run | `cam` | Supervisor | Pending → Finalized / Draft |
| NOI report generated | `noi` | Supervisor | Pending → Published / Draft |
| High-risk tenant added | `tenant` | Supervisor | Pending → Reviewed / Action Required |

The Approval Queue page shows:
- Stats cards: Total · Pending · Approved · Rejected
- Pending tab with full context cards (type, title, description, submitted by, date, reference ID)
- Approve / Reject with a notes modal — review notes are stored and shown on the record
- History tab with all resolved approvals and reviewer identity + timestamp

---

### AI Copilot — Streaming Multi-Agent Chat

Every page has a floating AI Copilot panel powered by a **LangGraph multi-agent system** with real-time token streaming.

| Feature | Detail |
|---|---|
| **Multi-Agent Routing** | Keyword supervisor routes to the right specialist — SiteOps, RFI & Contracts, Schedule & Punch, Risk & Analysis, or Property Management |
| **SSE Token Streaming** | Token-by-token output via Server-Sent Events — text appears as it generates, no waiting |
| **Live Tool Chips** | Yellow pulsing chips show tools being called in real time; turn green when complete |
| **Smart Model Routing** | Simple questions → LLaMA 3.1 8B (fast). Complex analysis → LLaMA 3.3 70B. Falls back automatically on rate limit |
| **Cross-Session Memory** | Key facts extracted from conversations and stored in Supabase — surfaced as context in future sessions |
| **Semantic Cache** | Repeat questions answered instantly from cache (0.92 cosine similarity threshold) — no LLM call needed |
| **Feedback Buttons** | 👍 / 👎 on every response — stored in Supabase for continuous evaluation |
| **RAG Integration** | All specialists can call `search_documents` to answer questions grounded in your uploaded documents |

**Specialists:**

| Agent | Handles |
|---|---|
| **SiteOps** | Daily logs, weather risk, crew, project status |
| **RFI & Contracts** | RFIs, change orders, obligations, submittals |
| **Schedule & Punch** | Tasks, overdue items, punch list, progress |
| **Risk & Analysis** | Weather impact, delay claims, compliance, general questions |
| **Property** | Leases, tenants, maintenance, NOI, CAM |

---

### Guardrails — Safe AI at Every Layer

Four layers of protection run on every input and output before the agent ever sees a message.

| Layer | What it catches |
|---|---|
| **Prompt Injection Detection** | 17 regex patterns — jailbreaks, role-play overrides, "ignore previous instructions", DAN, system prompt leaks |
| **Topic Guardrail** | Off-domain questions (recipes, politics, general coding) are rejected with a clear message |
| **Output Moderation** | Harmful content patterns blocked on the way out — with construction-safe exceptions (e.g. "explosive" in a demolition context is fine) |
| **JSON Schema Validation** | Every agent response coerced to `AgentResponse` Pydantic schema — malformed outputs never reach the UI |

---

### RAG Pipeline — Document-Grounded Answers

| Component | Detail |
|---|---|
| **Embeddings** | `fastembed` with `BAAI/bge-small-en-v1.5` (384-dim, ONNX, CPU-only — no GPU needed) |
| **Vector Store** | PGVector in Supabase — `document_chunks` table with `pgvector` extension |
| **Chunking** | Smart chunking: section-aware for contracts, paragraph-aware for reports, 512-token overlap fallback |
| **Hybrid Retrieval** | 70% cosine similarity + 30% BM25 keyword score — best of both worlds |
| **Reranking** | Cohere Rerank API (optional) for precision boost; falls back to hybrid score if key absent |
| **Semantic Cache** | Cache hits at ≥0.92 cosine similarity skip the LLM entirely — stored in `semantic_cache` table |
| **Cross-Session Memory** | LLM extracts key facts after each answer and stores them in `agent_memory` — recalled by future sessions |

---

### Evaluation & Observability

| Feature | Detail |
|---|---|
| **RAGAS Metrics** | `faithfulness`, `answer_relevancy`, `context_precision` — run with `python -m eval.ragas_eval --mlflow` |
| **Benchmark Runner** | 20 Q&A pairs across all 5 agents — scores routing accuracy, tool accuracy, keyword hit rate, latency |
| **MLflow Tracking** | `--mlflow` flag on both eval scripts logs all metrics to `prism-benchmark` / `prism-ragas` experiments — view at `mlflow ui` |
| **DVC Pipelines** | `dvc repro` runs the full eval pipeline (benchmark → ragas) and tracks data + output versions |
| **Local Trace Logging** | Every agent run logged to `agent_traces` in Supabase — latency, model, tools called, estimated cost |
| **Human Feedback** | `POST /eval/feedback` stores 👍/👎 with session and message ID — queryable via `GET /eval/feedback/{session_id}` |
| **LangSmith** | Set `LANGCHAIN_TRACING_V2=true` + `LANGCHAIN_API_KEY` in `.env` for full LangSmith trace dashboard |
| **E2E Tests** | 25 Playwright tests covering auth, navigation, copilot, and RFI — run with `npm run test:e2e` from `frontend/` |

---

### MCP Integration — Talk to Your Project in Claude Desktop

This branch adds an **MCP (Model Context Protocol) server** so Claude Desktop can call all of PRISM's construction AI tools directly in conversation — no UI required.

> *"Create an RFI asking about the rebar spec at grid line C4"*
> *"Assess this change order — $45,000 for unforeseen rock excavation"*
> *"What does the contract say about liquidated damages?"*
> *"Predict delay risk for Foundation, Structure, and MEP phases"*

| MCP Tool | What it does |
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

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite |
| **Styling** | Inline styles — zero CSS dependencies · Outfit + JetBrains Mono |
| **Routing** | React Router v7 |
| **Backend** | FastAPI · Uvicorn · Python 3.11 |
| **Database** | Supabase (PostgreSQL) — 15 tables, all RLS disabled (service key) |
| **LLM** | LLaMA 3.1 8B Instant via Groq API |
| **LLM Router** | LLaMA 3.1 8B (fast) · LLaMA 4 Scout 17B (balanced) · LLaMA 3.3 70B (complex) via Groq |
| **Multi-Agent** | LangGraph 1.x `create_react_agent` — 5 specialist agents with keyword supervisor routing |
| **Vision AI** | Gemini 2.0 Flash (primary) · Groq LLaMA 4 Scout vision via frame extraction (fallback) |
| **Embeddings** | fastembed `BAAI/bge-small-en-v1.5` (384-dim, ONNX, CPU-only) |
| **Vector Store** | PGVector in Supabase + FAISS (legacy document Q&A) |
| **RAG** | Hybrid BM25 + cosine retrieval · Cohere Rerank (optional) · semantic cache |
| **Evaluation** | RAGAS · LangSmith · local Supabase trace logging |
| **MLOps** | MLflow experiment tracking · DVC data + pipeline versioning |
| **E2E Testing** | Playwright (25 tests — auth, navigation, copilot, RFI) |
| **PDF Parsing** | pdfplumber + pypdf |
| **MCP Server** | Python MCP SDK · httpx |
| **Frontend Hosting** | Firebase Hosting |
| **Backend Hosting** | Google Cloud Run |

---

## Project Structure

```
prism/
├── backend/
│   ├── main.py                  ← All FastAPI routes (single file)
│   ├── mcp_server.py            ← MCP server — exposes tools to Claude Desktop
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── supabase_schema.sql      ← Core 15 tables (run in Supabase SQL editor)
│   ├── supabase_rag_schema.sql  ← RAG tables: document_chunks, semantic_cache, agent_memory
│   ├── supabase_eval_schema.sql ← Eval tables: agent_traces, eval_feedback
│   ├── agents/
│   │   ├── orchestrator.py      ← LangGraph multi-agent graph + SSE streaming
│   │   ├── tools.py             ← All LangChain tools (DB + RAG)
│   │   ├── guardrails.py        ← 4-layer input/output safety pipeline
│   │   ├── router.py            ← Smart model selection by question complexity
│   │   ├── tracer.py            ← Local trace logging to Supabase
│   │   └── rag/
│   │       ├── embedder.py      ← fastembed singleton
│   │       ├── chunker.py       ← Smart/section/paragraph chunking
│   │       ├── vector_store.py  ← PGVector upsert + search via Supabase RPC
│   │       ├── retriever.py     ← Hybrid BM25 + cosine retrieval + Cohere rerank
│   │       ├── cache.py         ← Semantic cache at 0.92 threshold
│   │       ├── memory.py        ← Cross-session memory extract + retrieve
│   │       └── pipeline.py      ← ingest_text() orchestrator
│   ├── eval/
│   │   ├── ragas_eval.py        ← RAGAS metrics (faithfulness, relevancy, precision) + MLflow logging
│   │   ├── runner.py            ← Benchmark runner (20 Q&A pairs, all 5 agents) + MLflow logging
│   │   └── benchmark.json       ← Ground truth Q&A dataset
│   ├── dvc.yaml                 ← DVC pipeline (benchmark + ragas stages, reproducible eval)
│   └── .env                     ← GROQ_API_KEY · GEMINI_API_KEY · SUPABASE_URL · SUPABASE_SERVICE_KEY
│
└── frontend/
    ├── public/
    ├── firebase.json
    ├── .firebaserc
    ├── playwright.config.ts      ← E2E test config (Chromium, auto-start dev server)
    ├── tests/
    │   └── e2e/
    │       ├── auth.spec.ts      ← Login + role selection tests
    │       ├── navigation.spec.ts← Sidebar navigation tests (all 9 pages)
    │       ├── copilot.spec.ts   ← AI Copilot panel tests
    │       └── rfi.spec.ts       ← RFI Register tests
    └── src/
        ├── App.tsx               ← Router · localStorage auth · session/project state
        ├── components/
        │   ├── Sidebar.tsx       ← Collapsible nav — construction + PM groups
        │   ├── Navbar.tsx        ← Page title · AI status chip · user badge
        │   └── AICopilot.tsx     ← Streaming AI Copilot — SSE token stream, tool chips, 👍👎 feedback
        └── pages/
            ├── Login.tsx         ← Demo role picker + auth state init
            ├── construction/
            │   ├── Dashboard.tsx        ← Project overview, risk cards, key metrics
            │   ├── Documents.tsx        ← Upload, classify, build FAISS index
            │   ├── Projects.tsx         ← Project CRUD — DB-persisted + demo projects
            │   ├── RFIRegister.tsx      ← RFI lifecycle with AI response generation
            │   ├── ChangeOrders.tsx     ← CO waterfall + AI clause assessment
            │   ├── Obligations.tsx      ← Contract deadline tracker
            │   ├── PunchList.tsx        ← Deficiency tracking + Unit Turnover checklist
            │   ├── Submittals.tsx       ← Ball-in-court + AI pre-review
            │   ├── DailyLog.tsx         ← Structured log + AI narrative + delay detection
            │   ├── Scheduling.tsx       ← Gantt + Kanban + NL task entry — DB-persisted
            │   ├── Analytics.tsx        ← Cost forecast · delay risk · schedule optimization
            │   ├── Intelligence.tsx     ← Blueprint CV · 3D vis · materials forecasting
            │   ├── Safety.tsx           ← PPE detection · hazard scoring from site photo
            │   ├── GenerateDocs.tsx     ← One-click document generation
            │   ├── Workforce.tsx        ← Crew management + daily rate tracking
            │   └── KnowledgeGraph.tsx   ← Entity-relationship graph visualization
            └── property/
                ├── LeaseAbstraction.tsx ← PDF lease parsing + approval submission
                ├── TenantRisk.tsx       ← AI credit scoring + auto-escalation
                ├── NOIForecaster.tsx    ← NOI/cap rate + approval gate
                ├── MaintenanceOrders.tsx← Work orders + AI diagnosis + dispatch approval
                ├── CAMReconciliation.tsx← Pro-rata CAM + cap enforcement + approval
                ├── PMDailyLog.tsx       ← Property daily activity log
                └── Approvals.tsx        ← Supervisor approval queue (all types)
```

---

## Supabase Schema

Run these SQL files in the Supabase SQL editor in order:

1. `backend/supabase_schema.sql` — core 15 tables
2. `backend/supabase_rag_schema.sql` — RAG tables + PGVector RPCs
3. `backend/supabase_eval_schema.sql` — traces + feedback tables

> **Requires pgvector extension** — enable in Supabase Dashboard → Database → Extensions → `vector`.

### Construction Tables

**`rfis`** — RFI Register
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| subject, description, response | text | |
| status | text | Open / Responded / Closed |
| priority | text | Low / Medium / High / Critical |
| submitted_by, assigned_to | text | |
| date_submitted, date_due, date_responded | text | |
| days_open | integer | |

**`change_orders`** — Change Order Register
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| title, description, reason | text | |
| amount | numeric | |
| status | text | Pending / Approved / Rejected |
| submitted_by | text | |
| assessment | jsonb | AI assessment result |

**`obligations`** — Contract Obligations
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| description, due_date, responsible_party, type | text | |
| completed | boolean | |

**`punch_items`** — Punch List
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| description, location, trade, category | text | |
| priority | text | Low / Medium / High / Critical |
| status | text | Open / In Progress / Resolved |
| ball_in_court | text | Contractor / Owner / Architect / Inspector |

**`submittals`** — Submittals Register
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| title, spec_section, submitted_by, reviewer | text | |
| status | text | Pending Review / Approved / Rejected / Revise & Resubmit |
| date_submitted, required_date, review_deadline | text | |
| compliance_score | numeric | |
| flags | jsonb | Red flags from AI review |
| ai_review | text | Full AI review narrative |

**`daily_logs`** — Construction Daily Log
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| date, weather, work_performed, delays, incidents | text | |
| crew_count | integer | |
| labor_hours | numeric | |
| narrative | text | AI-generated formal narrative |
| delay_claims | jsonb | Detected delay claims |
| weather_impact | text | |

**`workers`** — Workforce
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| name, trade, role, company, phone, email | text | |
| status | text | Active / Inactive |
| start_date | text | |
| daily_rate | numeric | |

**`projects`** — Project Registry
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| name, client, value, phase | text | |
| status | text | On Track / At Risk / Delayed |
| completion | integer | 0–100 |
| rfi, workers | integer | |
| start_date, end_date | text | |

**`schedule_tasks`** — Scheduling
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| name, phase, assignee | text | |
| start_day, duration, progress | integer | |
| status | text | Upcoming / In Progress / Done / Delayed |
| priority | text | low / medium / high / critical |

---

### Property Management Tables

**`leases`** — Lease Abstraction
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| property_address, tenant_name, permitted_use | text | |
| lease_start, lease_end | text | |
| monthly_rent, security_deposit, ti_allowance | numeric | |
| rent_escalation, cam_cap, renewal_options, termination_clause | text | |
| cam_included | boolean | |
| ai_summary | text | Plain-English lease summary |
| status | text | Pending Approval / Active / Rejected |

**`tenants`** — Tenant Risk
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| name, unit, email, phone | text | |
| move_in, lease_end | text | |
| monthly_rent | numeric | |
| risk_score | text | AI score string |
| risk_level | text | Low / Medium / High |
| risk_details | text | AI assessment narrative |
| status | text | Active / Reviewed / Action Required |

**`maintenance_requests`** — Maintenance Orders
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| unit, tenant_name, category, description | text | |
| priority | text | Low / Medium / High / Emergency |
| status | text | Open / In Progress / Resolved / Dispatch Approved |
| assigned_to | text | |
| date_submitted, date_due, date_resolved | text | |
| ai_diagnosis | text | AI root cause and recommendation |
| estimated_cost | numeric | |

**`noi_reports`** — NOI Forecaster
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| property_name, report_period | text | |
| gross_potential_rent, vacancy_loss, other_income | numeric | |
| effective_gross, operating_expenses, noi | numeric | |
| cap_rate | numeric | |
| ai_summary, ai_recommendations | text | |

**`cam_reconciliations`** — CAM Reconciliation
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| property_name, reconcile_year | text | |
| total_cam_pool, total_leasable | numeric | |
| tenants_data | jsonb | Per-tenant allocation breakdown |
| ai_summary | text | |

**`pm_daily_logs`** — Property Daily Log
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| property_address, date | text | |
| activities, maintenance_notes, tenant_interactions, occupancy_notes | text | |
| ai_summary | text | |

**`unit_turnovers`** — Unit Turnover Checklist
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| unit | text | Unit identifier |
| checked_items | jsonb | Array of completed checklist item IDs |
| notes | text | Free-text notes |
| completed | boolean | |
| completed_at | timestamptz | |
| updated_at | timestamptz | Auto-updated on save |

**`approvals`** — Human Approval Queue
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| session_id | text | |
| type | text | lease / maintenance / cam / noi / tenant |
| reference_id | text | FK to the source record's id |
| title, description | text | |
| status | text | Pending / Approved / Rejected |
| requested_by | text | |
| review_notes | text | Reviewer's notes |
| reviewed_by | text | |
| created_at | timestamptz | |
| reviewed_at | timestamptz | |

**`user_settings`** — Per-User Preferences
| Column | Type | Notes |
|---|---|---|
| uid | text PK | Firebase/auth UID |
| session_id | text | |
| notifications | boolean | In-app alerts |
| auto_risk | boolean | Auto-scan on upload |
| email_alerts | boolean | Email overdue alerts |
| updated_at | timestamptz | |

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
| GET | `/construction/dashboard/{session_id}` | Get project dashboard |
| POST | `/construction/ask` | Cross-document Q&A with citations |

### AI Analysis — Construction
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/contract-risk` | Clause-level contract risk analysis |
| POST | `/construction/cost-forecast` | EAC, CPI, SPI, variance forecast |
| POST | `/construction/predict-delays` | Phase-level delay probability |
| POST | `/construction/optimize-schedule` | AI schedule compression |
| POST | `/construction/nl-task` | Parse natural language task |
| POST | `/construction/subcontractor-score` | Subcontractor performance scorecard |
| POST | `/construction/meeting-intelligence` | Extract actions/decisions from meeting PDF |
| POST | `/construction/spec-compliance` | Check submittal against spec |
| POST | `/construction/safety-analyze` | PPE + hazard analysis from site photo |
| POST | `/construction/analyze-blueprint` | Blueprint/drawing computer vision analysis |
| POST | `/construction/generate` | Generate RFI / delay notice / CO / weekly summary |
| POST | `/construction/knowledge-graph` | Build entity-relationship graph from documents |

### RFI Register
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/rfi-register/create` | Create new RFI |
| GET | `/construction/rfi-register/{session_id}` | List all RFIs |
| POST | `/construction/rfi-register/respond` | AI-generate RFI response |
| PUT | `/construction/rfi-register/update` | Update RFI status or response |

### Change Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/co-register/create` | Create new change order |
| GET | `/construction/co-register/{session_id}` | List all change orders |
| POST | `/construction/co-register/assess` | AI assessment of change order |
| PUT | `/construction/co-register/update` | Approve / reject / update |

### Contract Obligations
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/obligations/extract` | Extract obligations from contract |
| GET | `/construction/obligations/{session_id}` | List all obligations |
| PUT | `/construction/obligations/complete` | Toggle obligation complete |

### Punch List
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/punch/create` | Create punch item |
| GET | `/construction/punch/{session_id}` | List all punch items |
| POST | `/construction/punch/ai-categorize` | AI categorize open items |
| PUT | `/construction/punch/update` | Update status / ball-in-court |

### Submittals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/submittals/create` | Create new submittal |
| GET | `/construction/submittals/{session_id}` | List all submittals |
| POST | `/construction/submittals/ai-review` | AI pre-review with compliance scoring |
| PUT | `/construction/submittals/update` | Update status |

### Daily Log — Construction
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/daily-log/create` | Create daily log entry |
| GET | `/construction/daily-log/{session_id}` | List all daily logs |
| POST | `/construction/daily-log/ai-summary` | Generate narrative + detect delay claims |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/projects/create` | Create new project |
| GET | `/construction/projects/{session_id}` | List all projects |
| PUT | `/construction/projects/update` | Update project status / completion |

### Scheduling
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/schedule/create` | Create new schedule task |
| GET | `/construction/schedule/{session_id}` | List all schedule tasks |
| PUT | `/construction/schedule/update` | Update task status / progress |

### Workforce
| Method | Endpoint | Description |
|---|---|---|
| POST | `/construction/workers/create` | Add worker |
| GET | `/construction/workers/{session_id}` | List all workers |
| PUT | `/construction/workers/update` | Update worker details |
| DELETE | `/construction/workers/delete/{id}` | Remove worker |

### Property Management — Leases
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/leases/abstract` | AI extract lease terms from PDF |
| GET | `/pm/leases/{session_id}` | List all leases |
| PUT | `/pm/leases/update` | Update lease status |

### Property Management — Tenants
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/tenants/add` | Add tenant + AI risk score |
| GET | `/pm/tenants/{session_id}` | List all tenants |

### Property Management — Maintenance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/maintenance/create` | Create maintenance order + AI diagnosis |
| GET | `/pm/maintenance/{session_id}` | List all maintenance orders |
| PUT | `/pm/maintenance/update` | Update status / assignment |

### Property Management — NOI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/noi/forecast` | Run NOI forecast + AI recommendations |
| GET | `/pm/noi/{session_id}` | List all NOI reports |

### Property Management — CAM
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/cam/reconcile` | Run CAM reconciliation + AI summary |
| GET | `/pm/cam/{session_id}` | List all CAM reconciliations |

### Property Management — Daily Log
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/daily-log/create` | Create property daily log |
| GET | `/pm/daily-log/{session_id}` | List all property daily logs |
| POST | `/pm/daily-log/ai-summary` | Generate AI summary |

### Property Management — Unit Turnover
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pm/turnover/save` | Upsert checklist state for a unit |
| GET | `/pm/turnover/{session_id}` | List all saved unit turnovers |
| GET | `/pm/turnover/{session_id}/{unit}` | Get specific unit checklist state |

### Approvals (Human Guardrails)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/approvals/request` | Submit record for approval |
| GET | `/approvals/{session_id}` | List all approvals |
| PUT | `/approvals/review` | Approve or reject — cascades to source record |

### User Settings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/user/settings/{uid}` | Get user preferences |
| PUT | `/user/settings/save` | Save preferences (upsert) |

### AI Copilot — Multi-Agent
| Method | Endpoint | Description |
|---|---|---|
| POST | `/agent/chat` | Single-turn agent response (blocking) |
| POST | `/agent/stream` | SSE streaming agent response — yields `meta \| token \| tool_start \| tool_end \| done \| error` |

### RAG — Document Ingestion & Search
| Method | Endpoint | Description |
|---|---|---|
| POST | `/rag/ingest` | Chunk, embed, and upsert a document into PGVector |
| GET | `/rag/docs/{session_id}` | List all ingested documents |
| DELETE | `/rag/docs/{session_id}/{doc_name}` | Remove a document from the vector store |
| POST | `/rag/search` | Semantic search across ingested documents |

### Evaluation & Feedback
| Method | Endpoint | Description |
|---|---|---|
| POST | `/eval/feedback` | Store 👍/👎 rating on an agent response |
| GET | `/eval/feedback/{session_id}` | List all feedback for a session |
| GET | `/eval/traces/{session_id}` | List agent trace logs for a session |

---

## Testing

### E2E Tests (Playwright)

25 tests covering auth, sidebar navigation, AI Copilot, and RFI Register.

```bash
cd frontend
npm run test:e2e           # headless, all tests
npm run test:e2e:ui        # Playwright UI mode (interactive)
npm run test:e2e:report    # open last HTML report
```

**Against production:**
```powershell
$env:PLAYWRIGHT_BASE_URL = "https://your-app.web.app"
$env:CI = "true"
npx playwright test
```

### Eval Pipeline (MLflow + DVC)

```bash
cd backend

# Run benchmark only
python -m eval.runner --session_id demo --mlflow

# Run RAGAS only
python -m eval.ragas_eval --session_id demo --mlflow

# Run full pipeline (both stages, tracks data versions)
dvc repro

# View metrics in MLflow UI
mlflow ui   # open http://localhost:5000
```

---

## MCP Setup

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

**3. Restart Claude Desktop** — fully quit via system tray → Quit, then reopen

**4. Verify** — Settings → Developer → PRISM should show green/connected

---

## Demo Access

No sign-up required. Choose a role at the login screen:

| Role | Profile |
|---|---|
| **Project Manager** | Marcus Rivera — full access to all modules |
| **Site Engineer** | Sarah Kim — field and scheduling focus |
| **Quantity Surveyor** | Ahmed Hassan — cost and contracts focus |
| **Safety Officer** | Priya Nair — safety and compliance focus |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [Groq API key](https://console.groq.com) (free tier available)
- [Gemini API key](https://aistudio.google.com) (free tier available)

### 1. Run the Supabase schema

Open the Supabase SQL editor for your project and run `backend/supabase_schema.sql` — creates all 15 tables and disables RLS.

### 2. Backend

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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Optional
COHERE_API_KEY=your_cohere_key_here
LANGCHAIN_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true
```

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

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
  --set-env-vars "GROQ_API_KEY=...,GROQ_MODEL=llama-3.1-8b-instant,GEMINI_API_KEY=...,SUPABASE_URL=...,SUPABASE_SERVICE_KEY=..." `
  --memory 4Gi `
  --timeout 300
```

> Use `4Gi` — fastembed loads ONNX models at startup and will OOM at 2Gi.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | backend/.env | LLaMA 3.1 / 3.3 / 4 Scout via Groq (LLM + vision fallback) |
| `GROQ_MODEL` | backend/.env | Default fast model: `llama-3.1-8b-instant` |
| `GEMINI_API_KEY` | backend/.env | Vision AI — blueprints, safety photos, video walkthroughs |
| `SUPABASE_URL` | backend/.env | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | backend/.env | Service role key (bypasses RLS) |
| `COHERE_API_KEY` | backend/.env | Optional — enables Cohere Rerank for RAG precision |
| `LANGCHAIN_API_KEY` | backend/.env | Optional — enables LangSmith tracing |
| `LANGCHAIN_TRACING_V2` | backend/.env | Set to `true` to activate LangSmith |
| `VITE_API_URL` | frontend/.env.production | Backend URL (Cloud Run URL in prod) |

---

## Data Persistence Model

| Feature | Storage | Fallback |
|---|---|---|
| RFIs, Change Orders, Obligations, Punch, Submittals, Daily Logs | Supabase | None (requires session) |
| Projects | Supabase + DEMO_PROJECTS constants | Demo always shown |
| Schedule Tasks | Supabase | Static INITIAL_TASKS |
| Leases, Tenants, Maintenance, NOI, CAM, PM Daily Logs | Supabase | Demo data if empty |
| Unit Turnover | Supabase (auto-save on toggle, debounced 800ms) | None |
| Approvals | Supabase | None |
| User Settings | Supabase + localStorage | localStorage only if Supabase unreachable |
| FAISS Vector Index | In-memory per session | Rebuild on next upload |
| Session State | localStorage (frontend) + in-memory (backend) | New session on refresh |

---

## Known Limitations

- **Scanned PDFs** need OCR pre-processing — [ilovepdf.com](https://ilovepdf.com) works well
- **FAISS index is in-memory** — redeployment clears active sessions (documents need re-upload)
- **PGVector RAG** persists across restarts; FAISS legacy Q&A does not
- **Large PDFs** (100+ pages) take longer on first embed
- **Gemini free tier** hits daily quota quickly — video analysis and blueprint CV automatically fall back to Groq vision (frame extraction)
- **fastembed ONNX models** load at cold start — Cloud Run needs `4Gi` memory minimum
- **MCP session persistence** — each Claude Desktop conversation needs an active session ID; sessions reset on backend restart
- **RAGAS eval** requires documents to be ingested first (`/rag/ingest`) — run on a session with real documents for meaningful scores

---

<div align="center">

Built with [FastAPI](https://fastapi.tiangolo.com) · [React](https://react.dev) · [Supabase](https://supabase.com) · [LangGraph](https://langchain-ai.github.io/langgraph) · [FAISS](https://github.com/facebookresearch/faiss) · [Groq](https://groq.com) · [Gemini](https://deepmind.google/technologies/gemini) · [fastembed](https://github.com/qdrant/fastembed) · [RAGAS](https://docs.ragas.io) · [MLflow](https://mlflow.org) · [DVC](https://dvc.org) · [Playwright](https://playwright.dev) · [Firebase](https://firebase.google.com) · [Cloud Run](https://cloud.google.com/run) · [MCP](https://modelcontextprotocol.io)

</div>
