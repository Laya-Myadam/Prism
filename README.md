# PRISM — Gen AI Construction Intelligence Platform

> Upload your contracts, blueprints, RFIs, and daily reports. Get instant AI-powered insights, risk flags, and ready-to-send documents.

**Live Demo:** https://project-11d70901-66cf-42-d3a19.web.app  
**Backend API:** https://prism-backend-819128954762.us-central1.run.app

<img width="1911" height="971" alt="Screenshot 2026-04-15 132724" src="https://github.com/user-attachments/assets/af75d5da-acb5-4aa1-8a3e-73b2ae6ad46a" />
<img width="1887" height="964" alt="Screenshot 2026-04-15 132733" src="https://github.com/user-attachments/assets/838b0c5c-8fe0-4ece-9386-39424963f9e0" />
<img width="1915" height="979" alt="Screenshot 2026-04-15 132740" src="https://github.com/user-attachments/assets/8988b67e-4c71-4a40-b203-347f5ef1d035" />
<img width="1908" height="971" alt="Screenshot 2026-04-15 132749" src="https://github.com/user-attachments/assets/0c9bae21-3382-4f84-b995-cd204076a45c" />
<img width="1916" height="959" alt="Screenshot 2026-04-15 132759" src="https://github.com/user-attachments/assets/a5064b31-dadc-4907-8e89-3359e6056d14" />
<img width="1908" height="977" alt="Screenshot 2026-04-15 132806" src="https://github.com/user-attachments/assets/28d68cde-1b41-40b0-a97e-2273ffeaad6a" />
<img width="1914" height="971" alt="Screenshot 2026-04-15 132828" src="https://github.com/user-attachments/assets/46899854-5e19-4a5c-86d4-856f5a28d925" />
<img width="1908" height="976" alt="Screenshot 2026-04-15 132849" src="https://github.com/user-attachments/assets/b11e72ab-2db4-4e95-b262-69ad441f308e" />
<img width="1908" height="975" alt="Screenshot 2026-04-15 132900" src="https://github.com/user-attachments/assets/1b155330-58e0-482e-8643-efa53f3c71e0" />

---

## Features

### Core
- **Auto Document Classification** — AI classifies uploads: Contract, Drawings, Specs, RFIs, Daily Reports, Change Orders, and more
- **Live Project Dashboard** — Extracts project name, value, parties, dates, and LDs from your contract automatically
- **Risk Intelligence** — Detects risks across all project documents without being asked
- **Cross-Document Q&A** — Ask questions across all project docs with source citations

### AI Features
| Feature | Description |
|---------|-------------|
| **Document Generation** | RFI responses, delay notices, change order assessments, weekly summaries |
| **Contract Risk Analysis** | Clause-level risk scoring with severity ratings and suggested actions |
| **Cost Forecasting** | EAC, CPI, variance analysis, and scenario range from project data |
| **Predictive Delay Risk** | Phase-by-phase delay probability with recovery recommendations |
| **Schedule Optimization** | AI reorders and compresses your task list to save time |
| **NL Task Entry** | Add schedule tasks in plain English — AI parses dates, durations, dependencies |
| **Subcontractor Scorecard** | Quality, schedule, safety, communication, and cost scoring per sub |
| **Meeting Intelligence** | Upload meeting PDFs → action items, decisions, risks, follow-ups |
| **Spec Compliance** | Check submittals against spec requirements with compliance scoring |
| **Blueprint CV** | Computer vision analysis of drawings using Gemini Vision AI |
| **Safety AI** | PPE compliance detection, hazard identification, site safety scoring |

### Authentication
Demo mode with 4 role-based profiles — no sign-up required:
- **Marcus Rivera** — Project Manager
- **Sarah Kim** — Site Engineer
- **Ahmed Hassan** — Quantity Surveyor
- **Priya Nair** — Safety Officer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Inline styles · Outfit + JetBrains Mono fonts |
| Routing | React Router v7 |
| Backend | FastAPI + Uvicorn · Python 3.11 |
| LLM | LLaMA 3.1 8B Instant via Groq API |
| Vision AI | Gemini 2.0 Flash |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 (384-dim, local CPU) |
| Vector Store | FAISS with MMR retrieval |
| PDF Reading | pdfplumber + pypdf |
| Frontend Hosting | Firebase Hosting |
| Backend Hosting | Google Cloud Run |

---

## Project Structure

```
prism/
├── backend/
│   ├── main.py                  # All FastAPI routes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railpack.json
│   └── .env                     # GROQ_API_KEY, GEMINI_API_KEY
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # Router + localStorage auth + session state
    │   ├── firebase.ts          # Firebase SDK config
    │   ├── api/client.ts        # Typed API client
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── AICopilot.tsx
    │   │   ├── FileUpload.tsx
    │   │   ├── DocClassifier.tsx
    │   │   ├── MetricCard.tsx
    │   │   └── RiskCard.tsx
    │   └── pages/
    │       ├── auth/
    │       │   └── Login.tsx    # 4 dummy role cards
    │       └── construction/
    │           ├── Dashboard.tsx
    │           ├── Projects.tsx
    │           ├── Documents.tsx
    │           ├── GenerateDocs.tsx
    │           ├── Analytics.tsx
    │           ├── Scheduling.tsx
    │           ├── Workforce.tsx
    │           ├── Intelligence.tsx
    │           ├── Safety.tsx
    │           └── Settings.tsx
    ├── firebase.json            # Firebase Hosting config
    └── .env.production          # VITE_API_URL → Cloud Run
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free)
- [Gemini API key](https://aistudio.google.com) (free)

### Backend

```bash
cd prism/backend

python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `.env`:
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

## API Reference

### Session
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/session/new` | Create session — returns `session_id` |

### Construction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/construction/upload-classify` | Upload + auto-classify docs |
| POST | `/construction/build-project` | Build FAISS index + generate dashboard |
| GET | `/construction/dashboard/{id}` | Get project dashboard |
| POST | `/construction/ask` | Ask across all project docs |
| POST | `/construction/generate` | Generate RFI / delay notice / CO / weekly summary |
| POST | `/construction/contract-risk` | Clause-level contract risk analysis |
| POST | `/construction/cost-forecast` | EAC, CPI, cost variance forecast |
| POST | `/construction/predict-delays` | Phase-level delay probability |
| POST | `/construction/optimize-schedule` | AI schedule compression |
| POST | `/construction/nl-task` | Parse natural language task |
| POST | `/construction/subcontractor-score` | Subcontractor performance scorecard |
| POST | `/construction/meeting-intelligence` | Extract actions/decisions from meeting PDF |
| POST | `/construction/spec-compliance` | Check submittal against spec |
| POST | `/construction/safety-analyze` | PPE + hazard analysis from site photo |
| POST | `/construction/analyze-blueprint` | Blueprint/drawing CV analysis |

---

## Known Limitations

- Scanned PDFs need OCR first — use [ilovepdf.com](https://ilovepdf.com) to convert
- Sessions are in-memory — redeploying the backend clears active sessions
- Very large PDFs (100+ pages) take longer on first embed
- Safety photo analysis requires Gemini Vision — falls back to demo data if unavailable

---

## Built With

[FastAPI](https://fastapi.tiangolo.com) · [React](https://react.dev) · [LangChain](https://langchain.com) · [FAISS](https://github.com/facebookresearch/faiss) · [Groq](https://groq.com) · [Gemini](https://deepmind.google/technologies/gemini) · [Firebase](https://firebase.google.com) · [Cloud Run](https://cloud.google.com/run)
