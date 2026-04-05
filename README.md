# ▲ Prism — AI Document Intelligence Platform

> Upload any document. See every angle.

Prism is a full-stack AI platform that extracts insights, answers questions, and generates professional documents from any PDF — in seconds. Built with FastAPI, React, LLaMA 3.1, and FAISS.


---

## What Is Prism?

Prism operates in two modes:

| Mode | What It Does |
|------|-------------|
| **General Mode** | Works on any PDF — financial, legal, real estate, investment, or general documents |
| **Construction Mode** | Purpose-built for construction, architecture, and real estate projects |

---

## Features

### General Mode
- **Dynamic Section Discovery** — AI reads the document first and identifies what sections actually exist — no hardcoded templates
- **Conversational Q&A** — Ask follow-up questions with full conversation memory (5-exchange sliding window)
- **Multi-Document Comparison** — Upload two PDFs and compare them side by side on any topic
- **Image Understanding** — Extracts and describes charts, diagrams, and floor plans using BLIP vision AI
- **Confidence Scoring** — Every answer includes High / Medium / Low confidence based on vector similarity
- **PDF Report Export** — Download a professionally formatted report of all insights and Q&A

### Construction Mode
- **Auto Document Classification** — AI classifies each uploaded file: Contract, Drawings, Specs, RFIs, Daily Reports, Change Orders, and more
- **Live Project Dashboard** — Extracts project name, value, parties, dates, and LDs from your contract automatically
- **Adaptive Extraction** — Dashboard adapts to whatever documents you upload — site visit reports, daily logs, RFI logs, meeting minutes
- **Risk Flags** — Detects risks automatically from your documents without being asked
- **Cross-Document Q&A** — Ask questions across all project documents simultaneously with source citations
- **Document Generation** — Generates four types of ready-to-send construction documents:
  - RFI Response
  - Delay Notice Letter
  - Change Order Assessment
  - Weekly Progress Summary
- **Plain English Summary** — Every project gets a plain English breakdown of key sections

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | FastAPI + Uvicorn |
| LLM | LLaMA 3.1 8B via Groq API |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Vector Store | FAISS (MMR retrieval, k=6) |
| Vision AI | Salesforce/blip-image-captioning-base |
| PDF Reading | pdfplumber + pypdf |
| Text Splitting | LangChain RecursiveCharacterTextSplitter |
| PDF Export | ReportLab |

---

## Project Structure

```
prism/
├── backend/
│   ├── main.py                        # All FastAPI routes
│   ├── requirements.txt
│   ├── .env                           # GROQ_API_KEY goes here
│   ├── core/
│   │   ├── ingestor.py                # PDF reading, chunking, FAISS embedding
│   │   ├── qa_engine.py               # MMR retrieval, memory, confidence scoring
│   │   ├── extractor.py               # Dynamic section discovery + extraction
│   │   ├── detector.py                # LLM-based domain classification
│   │   ├── comparator.py              # Multi-document comparison
│   │   ├── exporter.py                # PDF report generation
│   │   ├── image_extractor.py         # Image extraction + BLIP captioning
│   │   ├── project_store.py           # Multi-doc FAISS index with source tagging
│   │   └── rfi_engine.py              # Structured RFI query + response formatter
│   └── construction/
│       ├── classifier.py              # Auto-classifies docs into 11 types
│       ├── dashboard_engine.py        # Adaptive project facts + risk extraction
│       └── doc_generator.py           # RFI, delay notice, CO assessment, weekly summary
│
└── frontend/
    ├── src/
    │   ├── App.tsx                    # Router + global session state
    │   ├── api/client.ts              # All API calls — fully typed
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   └── Sidebar.tsx
    │   └── pages/
    │       ├── Home.tsx               # Mode selector landing page
    │       ├── general/
    │       │   ├── KeyInsights.tsx
    │       │   ├── AskAnything.tsx
    │       │   ├── Compare.tsx
    │       │   └── Export.tsx
    │       └── construction/
    │           ├── Setup.tsx
    │           ├── Dashboard.tsx
    │           ├── AskProject.tsx
    │           └── GenerateDocs.tsx
    ├── tailwind.config.js
    └── package.json
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free Groq API key → [console.groq.com](https://console.groq.com)

### Backend

```bash
cd prism/backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Add your Groq API key
echo GROQ_API_KEY=your_key_here > .env

# Start the backend
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd prism/frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

Open **http://localhost:5173**

---

## API Reference

### Session
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session/new` | POST | Create a new session |
| `/session/{id}` | DELETE | Clear a session |

### General Mode
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/general/upload` | POST | Upload and index a PDF |
| `/general/upload-b` | POST | Upload a second PDF for comparison |
| `/general/insights` | POST | Extract key insights |
| `/general/ask` | POST | Ask a question |
| `/general/compare` | POST | Compare two documents on a topic |
| `/general/export` | POST | Export session as PDF report |
| `/general/rfi/upload-project` | POST | Upload project docs for RFI workspace |
| `/general/rfi/answer` | POST | Answer an RFI |
| `/general/rfi/log/{id}` | GET | Get all RFIs in session |

### Construction Mode
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/construction/upload-classify` | POST | Upload and auto-classify docs |
| `/construction/build-project` | POST | Build FAISS index + dashboard |
| `/construction/dashboard/{id}` | GET | Get project dashboard |
| `/construction/ask` | POST | Ask across all project docs |
| `/construction/generate` | POST | Generate a construction document |
| `/construction/generated-docs/{id}` | GET | Get all generated documents |

---

## Performance

| Task | Time |
|------|------|
| PDF ingestion + chunking | 2–5 seconds |
| Embedding generation | 10–30 seconds (cached after first run) |
| Domain detection | < 1 second |
| Key insight extraction | 10–15 seconds |
| Q&A response | < 1 second |
| Document classification | < 1 second per file |
| Dashboard generation | 8–15 seconds |
| Document generation | 3–8 seconds |

---

## Models

**LLaMA 3.1 8B via Groq** — All language tasks: extraction, Q&A, classification, document generation. Free tier at console.groq.com. Responses under 1 second.

**sentence-transformers/all-MiniLM-L6-v2** — 384-dimensional semantic embeddings. Runs locally on CPU. Downloads once (~90MB).

**Salesforce/blip-image-captioning-base** — Describes images, charts, and diagrams inside PDFs. Runs locally on CPU. Downloads once (~900MB).

---

## Known Limitations

- Scanned PDFs need OCR first — use [ilovepdf.com](https://ilovepdf.com) to convert
- Sessions are in-memory — restarting the backend clears all data
- Very large PDFs (100+ pages) take longer on first embed
- Password-protected PDFs must be unlocked before uploading

---

## Planned

- [ ] OCR support for scanned documents
- [ ] Persistent session storage
- [ ] Streaming responses
- [ ] InvestIQ mode for financial documents
- [ ] Lease Abstraction tool
- [ ] Scope Gap Detector
- [ ] Docker deployment

---

## Built With

- [FastAPI](https://fastapi.tiangolo.com)
- [React](https://react.dev)
- [LangChain](https://langchain.com)
- [FAISS](https://github.com/facebookresearch/faiss)
- [Groq](https://groq.com)
- [HuggingFace](https://huggingface.co)
- [Tailwind CSS](https://tailwindcss.com)
