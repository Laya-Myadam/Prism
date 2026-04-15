# PRISM — Construction Intelligence Platform

> Upload your contracts, blueprints, RFIs, and daily reports. Get instant AI-powered insights, risk flags, and ready-to-send documents.

**Live Demo:** https://project-11d70901-66cf-42-d3a19.web.app  
**Backend:** https://prism-backend-910843311544.us-central1.run.app

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

## What Is PRISM?

PRISM is a full-stack AI platform purpose-built for construction. It operates in two modes:

| Mode | What It Does |
|------|-------------|
| **General Mode** | Works on any PDF — financial, legal, real estate, or technical documents |
| **Construction Mode** | Purpose-built for construction projects — classification, risk detection, Q&A, document generation |
| **Blueprint CV** | Computer vision analysis of architectural drawings using Gemini Vision AI with OpenCV+LLaMA fallback |
| **Document Q&A** | Cross-document question answering with source citations using FAISS vector search |

---

## Features

### Construction Mode

**Auto Document Classification**
AI reads each uploaded PDF and classifies it into one of 11 types:
`Contract` · `Drawings` · `Specifications` · `Daily Reports` · `RFIs` · `Change Orders` · `Submittals` · `Inspection Reports` · `Meeting Minutes` · `Schedule` · `General`

**Live Project Dashboard**
Extracts from your documents automatically — no manual input:
- Project name, value, owner, GC, architect, dates, liquidated damages, retention
- RFI counts (open vs closed), change order cost exposure
- Schedule health (On Track / At Risk / Delayed)
- Risk flags sorted High / Medium / Low with source document

**Risk Intelligence**
Automatically detects risks across all documents without being asked. Scans in priority order: Contract → Change Orders → Daily Reports → Inspection Reports → RFIs → Specifications.

**Cross-Document Q&A**
Ask questions across all project documents simultaneously. FAISS retrieves relevant chunks using MMR. Every answer cites the source document.

```
"Who is responsible for waterproofing?"
"What are the liquidated damages terms?"
"Are we in delay based on the daily reports?"
"What concrete strength is required at the foundations?"
"Are there any conflicts between specs and drawings?"
```

**Document Generation**
Generates four types of ready-to-send construction documents:

| Document | What It Does |
|----------|-------------|
| RFI Response | Formal response with citations, drawing/spec refs, confidence rating |
| Delay Notice Letter | Formal notice with contract clause refs, cause classification, days claimed |
| Change Order Assessment | In-scope determination, cost reasonableness, schedule impact |
| Weekly Progress Summary | Structured weekly report pulled from your daily reports |

---

### Blueprint CV & Intelligence

Two tabs on the Intelligence page:

**Blueprint / CV Analysis**

Three-layer fallback pipeline:

| Layer | Engine | Capability |
|-------|--------|-----------|
| 1 | Gemini 1.5 Flash | Best quality — reads labels, infers room uses, extracts all metadata |
| 2 | OpenCV + LLaMA | OCR extracts text, CV counts shapes, LLaMA interprets contextually |
| 3 | OpenCV only | Raw contour/line counts, minimal intelligence |

What gets extracted from a floor plan:

- Plain English description (building type, floor, layout summary)
- Drawing type, scale
- Total floor area, room count
- Room list with number, area (m²), likely use
- Objects detected (walls, columns, doors, windows, stairs, MEP)
- Structural elements (column count, load-bearing walls, stair types)
- Labeled dimensions with units
- Floor level references (0.000, -3.300, +1.500)
- Grid/bay spacing
- Door and window counts
- Materials
- Notable features in plain English ("Large central hall", "Curved entrance", "Double staircase")
- Building type (Residential / Office / Mixed-use / Commercial / Institutional)
- Drawing notes

What gets extracted from a site photo:
- Site conditions and progress summary
- Equipment, materials, workers, structures visible
- Safety items (PPE visible)
- Hazards detected
- Progress estimate with reasoning
- Weather conditions

**Document Q&A**
Upload any PDF and ask questions about it — without building a full project. Useful for quick contract review, spec lookup, or report summarisation.

---

### General Mode

| Feature | Description |
|---------|-------------|
| Dynamic Section Discovery | AI reads the document first and identifies what sections actually exist |
| Conversational Q&A | Ask follow-up questions with full conversation memory |
| Multi-Document Comparison | Upload two PDFs and compare side by side on any topic |
| Image Understanding | Extracts and describes images using BLIP vision AI |
| PDF Report Export | Download a formatted report of all insights and Q&A |
| RFI Workspace | Upload project docs and answer RFIs with source citations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + inline styles (dark theme) |
| Fonts | Outfit (display) + JetBrains Mono (labels) |
| Routing | React Router v6 |
| HTTP Client | Axios (typed client in `api/client.ts`) |
| Frontend Deployment | Firebase Hosting |
| Backend | FastAPI + Uvicorn |
| Language | Python 3.11 |
| Primary LLM | LLaMA 3.1 8B Instant via Groq API |
| Vision AI (primary) | Google Gemini 1.5 Flash |
| Vision AI (fallback) | OpenCV + Tesseract OCR + LLaMA contextual analysis |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (384-dim, local CPU) |
| Vector Store | FAISS with MMR retrieval (k=6) |
| PDF Reading | pdfplumber (text) + pypdf (images) |
| Image Captioning | Salesforce BLIP (local, CPU) |
| Text Splitting | LangChain RecursiveCharacterTextSplitter |
| PDF Export | ReportLab |
| Session Persistence | Google Cloud Firestore |
| Backend Deployment | Docker on Google Cloud Run |

---

## Project Structure

```
prism/
├── backend/
│   ├── main.py                     # All FastAPI routes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                        # GROQ_API_KEY, GEMINI_API_KEY
│   ├── core/
│   │   ├── ingestor.py             # PDF reading, chunking, FAISS embedding
│   │   ├── qa_engine.py            # MMR retrieval, memory, confidence scoring
│   │   ├── extractor.py            # Dynamic section discovery + extraction
│   │   ├── detector.py             # LLM-based domain classification
│   │   ├── comparator.py           # Multi-document comparison
│   │   ├── exporter.py             # PDF report generation (ReportLab)
│   │   ├── image_extractor.py      # BLIP image captioning for embedded images
│   │   ├── project_store.py        # Multi-doc FAISS index + source tagging
│   │   └── rfi_engine.py           # Structured RFI query + response formatter
│   └── construction/
│       ├── classifier.py           # Auto-classifies PDFs into 11 types
│       ├── dashboard_engine.py     # Adaptive facts + risk extraction
│       └── doc_generator.py        # RFI, delay notice, CO, weekly summary
│
└── frontend/src/
    ├── App.tsx                     # Router + global session state + localStorage
    ├── api/client.ts               # All API calls — fully typed
    ├── components/
    │   ├── Navbar.tsx
    │   ├── Sidebar.tsx
    │   ├── MetricCard.tsx
    │   ├── RiskCard.tsx
    │   ├── FileUpload.tsx          # PDF dropzone + classify flow
    │   ├── DocClassifier.tsx       # Classification review + type override UI
    │   └── AICopilot.tsx
    └── pages/construction/
        ├── Documents.tsx           # Project Setup + Ask tabs combined
        ├── Dashboard.tsx           # Live project dashboard
        ├── Intelligence.tsx        # Blueprint CV + Document Q&A
        ├── Projects.tsx
        ├── Analytics.tsx
        ├── Workforce.tsx
        ├── Scheduling.tsx
        ├── GenerateDocs.tsx        # Document generation
        └── Settings.tsx
```

---

## API Reference

### Session
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/session/new` | Create session — returns `session_id` |
| DELETE | `/session/{id}` | Clear all session data |

### General Mode
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/general/upload` | Upload + index PDF. Form: `session_id`, `file`, `domain_override` |
| POST | `/general/upload-b` | Upload second PDF for comparison |
| POST | `/general/insights` | Extract key insights. Body: `session_id`, `domain` |
| POST | `/general/ask` | Ask question. Body: `session_id`, `question` |
| POST | `/general/compare` | Compare two docs. Body: `session_id`, `topic` |
| POST | `/general/export` | Export PDF report |
| POST | `/general/rfi/upload-project` | Upload docs for RFI workspace |
| POST | `/general/rfi/answer` | Answer an RFI |
| GET | `/general/rfi/log/{id}` | Get all RFIs in session |

### Construction Mode
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/construction/upload-classify` | Upload + auto-classify docs |
| POST | `/construction/build-project` | Build FAISS index + generate dashboard |
| GET | `/construction/dashboard/{id}` | Get project dashboard (returns `{}` if not built) |
| POST | `/construction/ask` | Ask across all project docs |
| POST | `/construction/clear-chat` | Clear chat history |
| POST | `/construction/generate` | Generate construction document |
| GET | `/construction/generated-docs/{id}` | Get all generated documents |
| POST | `/construction/analyze-blueprint` | Analyze blueprint/site photo. Form: `session_id`, `file`, `mode` |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key → [console.groq.com](https://console.groq.com) (free)
- Gemini API key → [aistudio.google.com](https://aistudio.google.com) (free tier)
- Tesseract OCR → [UB-Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) (Windows, optional — for blueprint OCR fallback)

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

Open http://localhost:5173

---

## Production Deployment

### Backend — Google Cloud Run

```bash
cd prism/backend
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

gcloud run deploy prism-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --port 8080

# Set environment variables
gcloud run services update prism-backend \
  --region us-central1 \
  --set-env-vars "GROQ_API_KEY=xxx,GEMINI_API_KEY=xxx"
```

### Frontend — Firebase Hosting

```bash
cd prism/frontend

# Create frontend/.env.production
echo "VITE_API_URL=https://YOUR_CLOUD_RUN_URL.run.app" > .env.production

npm run build
firebase deploy --only hosting
```

### Session Persistence — Firestore

Cloud Run containers restart and lose in-memory data. PRISM uses Firestore to persist dashboard data and chat history across restarts. The FAISS vectorstore stays in-memory — re-upload required after a cold start.

```bash
gcloud services enable firestore.googleapis.com
pip install google-cloud-firestore  # add to requirements.txt

# Grant Cloud Run access to Firestore
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_COMPUTE_SA@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## Performance

| Task | Time | Notes |
|------|------|-------|
| PDF ingestion + chunking | 2–5s | pdfplumber extraction |
| Embedding generation | 10–30s | Cached after first run |
| Document classification | < 1s | Per file |
| Dashboard generation | 8–15s | Depends on doc count |
| Q&A response | < 1s | FAISS + LLaMA |
| Document generation | 3–8s | LLaMA with project context |
| Blueprint CV (Gemini) | 3–8s | Gemini 1.5 Flash API |
| Blueprint CV (OpenCV+LLaMA) | 5–12s | Local CV + Groq |

---

## Known Limitations

- **Scanned PDFs** — need OCR first, use [ilovepdf.com](https://ilovepdf.com)
- **Cold starts** — FAISS vectorstore is in-memory, re-upload required after Cloud Run restart
- **Gemini free tier** — ~50 requests/day, falls back to OpenCV+LLaMA automatically
- **Large PDFs** — 100+ pages take longer on first embed
- **Password-protected PDFs** — must be unlocked before uploading

---

## Roadmap

- [ ] Persistent FAISS storage (Cloud Storage / Pinecone)
- [ ] OCR pipeline for scanned documents
- [ ] Streaming LLM responses
- [ ] Multi-user project workspaces
- [ ] Scope Gap Detector — auto-compare specs vs drawings
- [ ] Gantt chart generation from schedule documents
- [ ] Mobile app (React Native)

---

Built with FastAPI · React · LLaMA 3.1 · Gemini Vision · FAISS · Google Cloud
