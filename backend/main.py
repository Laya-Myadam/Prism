import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from core.ingestor import ingest_pdf
from core.qa_engine import ask_question, reset_memory
from core.extractor import extract_key_info
from core.detector import detect_domain
from core.comparator import compare_documents
from core.exporter import export_to_pdf
from core.project_store import build_project_index, save_project_files, get_source_citations
from core.rfi_engine import answer_rfi
from construction.classifier import classify_all_documents, group_by_type
from construction.dashboard_engine import build_dashboard
from construction.doc_generator import generate_document

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="Prism API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Upload directory ──────────────────────────────────────────────────────────
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ── In-memory session store ───────────────────────────────────────────────────
# Keyed by session_id — stores vectorstores, chat history, insights etc.
sessions: dict = {}


def get_session(session_id: str) -> dict:
    if session_id not in sessions:
        sessions[session_id] = {
            "vectorstore": None,
            "vectorstore_b": None,
            "filename": None,
            "filename_b": None,
            "domain": None,
            "insights": {},
            "chat_history": [],
            "project_vectorstore": None,
            "project_files": [],
            "rfi_log": [],
            "rfi_counter": 1,
            "classified_docs": [],
            "grouped_docs": {},
            "dashboard": {},
            "generated_docs": [],
        }
    return sessions[session_id]


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    session_id: str
    question: str

class InsightsRequest(BaseModel):
    session_id: str
    domain: Optional[str] = "Auto Detect"

class CompareRequest(BaseModel):
    session_id: str
    topic: str

class ExportRequest(BaseModel):
    session_id: str

class RFIRequest(BaseModel):
    session_id: str
    rfi_number: str
    subject: str
    question: str
    drawing_ref: Optional[str] = ""
    spec_ref: Optional[str] = ""
    submitted_by: Optional[str] = ""

class BuildProjectRequest(BaseModel):
    session_id: str
    classified_docs: list

class GenerateDocRequest(BaseModel):
    session_id: str
    doc_type: str
    form_data: dict

class AskProjectRequest(BaseModel):
    session_id: str
    question: str


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Prism API running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/session/new")
def new_session():
    session_id = str(uuid.uuid4())
    get_session(session_id)
    return {"session_id": session_id}

@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "cleared"}


# ─────────────────────────────────────────────────────────────────────────────
# GENERAL MODE — DOCUSENSE FEATURES
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/general/upload")
async def upload_document(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    domain_override: str = Form(default="Auto Detect")
):
    """Upload and index a single PDF document."""
    session = get_session(session_id)

    # Save file
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Ingest
    vectorstore, image_count, text_chunks = ingest_pdf(str(file_path))

    # Domain detection
    if domain_override == "Auto Detect":
        domain = detect_domain(str(file_path))
    else:
        domain = domain_override

    # Store in session
    session["vectorstore"] = vectorstore
    session["filename"] = file.filename
    session["domain"] = domain
    session["insights"] = {}
    session["chat_history"] = []
    reset_memory()

    return {
        "status": "success",
        "filename": file.filename,
        "domain": domain,
        "text_chunks": text_chunks,
        "image_count": image_count,
    }


@app.post("/general/upload-b")
async def upload_document_b(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a second PDF for comparison."""
    session = get_session(session_id)

    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    vectorstore_b, _, _ = ingest_pdf(str(file_path))
    session["vectorstore_b"] = vectorstore_b
    session["filename_b"] = file.filename

    return {"status": "success", "filename": file.filename}


@app.post("/general/insights")
def extract_insights(req: InsightsRequest):
    """Extract key insights from the uploaded document."""
    session = get_session(req.session_id)

    if not session["vectorstore"]:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    domain = req.domain if req.domain != "Auto Detect" else session.get("domain", "General")
    insights = extract_key_info(session["vectorstore"], domain)
    session["insights"] = insights

    return {"insights": insights, "domain": domain}


@app.post("/general/ask")
def ask_document(req: QuestionRequest):
    """Ask a question about the uploaded document."""
    session = get_session(req.session_id)

    if not session["vectorstore"]:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    session["chat_history"].append({"role": "user", "content": req.question})
    answer = ask_question(session["vectorstore"], req.question, session["chat_history"])
    session["chat_history"].append({"role": "assistant", "content": answer})

    return {"answer": answer, "chat_history": session["chat_history"]}


@app.post("/general/compare")
def compare_docs(req: CompareRequest):
    """Compare two uploaded documents on a topic."""
    session = get_session(req.session_id)

    if not session["vectorstore"]:
        raise HTTPException(status_code=400, detail="No primary document uploaded.")
    if not session["vectorstore_b"]:
        raise HTTPException(status_code=400, detail="No second document uploaded.")

    result = compare_documents(session["vectorstore"], session["vectorstore_b"], req.topic)
    return {
        "doc_a": session["filename"],
        "doc_b": session["filename_b"],
        "doc_a_summary": result["doc_a_summary"],
        "doc_b_summary": result["doc_b_summary"],
        "comparison": result["comparison"],
    }


@app.post("/general/export")
def export_report(req: ExportRequest):
    """Export a PDF report of insights and Q&A."""
    session = get_session(req.session_id)

    if not session["vectorstore"]:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")

    pdf_bytes = export_to_pdf(
        filename=session["filename"],
        domain=session["domain"],
        insights=session["insights"],
        chat_history=session["chat_history"],
    )

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prism_report_{session['filename']}"
        }
    )


@app.post("/general/clear-chat")
def clear_chat(req: QuestionRequest):
    """Clear chat history for a session."""
    session = get_session(req.session_id)
    session["chat_history"] = []
    reset_memory()
    return {"status": "cleared"}


# ─────────────────────────────────────────────────────────────────────────────
# GENERAL MODE — RFI RESPONDER
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/general/rfi/upload-project")
async def upload_rfi_project(
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
):
    """Upload multiple docs for RFI project workspace."""
    session = get_session(session_id)

    uploaded = []
    for file in files:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        uploaded.append({"path": str(file_path), "filename": file.filename})

    project_vs = build_project_index(uploaded)
    session["project_vectorstore"] = project_vs
    session["project_files"] = uploaded
    session["rfi_log"] = []
    session["rfi_counter"] = 1

    return {"status": "success", "files": [f["filename"] for f in uploaded]}


@app.post("/general/rfi/answer")
def answer_rfi_endpoint(req: RFIRequest):
    """Answer an RFI from the project document set."""
    session = get_session(req.session_id)

    if not session["project_vectorstore"]:
        raise HTTPException(status_code=400, detail="No project documents uploaded.")

    rfi_input = {
        "rfi_number": req.rfi_number,
        "subject": req.subject,
        "question": req.question,
        "drawing_ref": req.drawing_ref,
        "spec_ref": req.spec_ref,
        "submitted_by": req.submitted_by,
    }

    result = answer_rfi(session["project_vectorstore"], rfi_input)
    session["rfi_log"].append(result)
    session["rfi_counter"] += 1

    return result


@app.get("/general/rfi/log/{session_id}")
def get_rfi_log(session_id: str):
    """Get all RFIs answered in this session."""
    session = get_session(session_id)
    return {
        "rfi_log": session["rfi_log"],
        "rfi_counter": session["rfi_counter"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRUCTION MODE — PROJECT SETUP
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/construction/upload-classify")
async def upload_and_classify(
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
):
    """Upload project docs and auto-classify each one."""
    session = get_session(session_id)

    uploaded = []
    for file in files:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        uploaded.append({"path": str(file_path), "filename": file.filename})

    classified = classify_all_documents(uploaded)

    return {
        "status": "success",
        "classified": classified,
    }


@app.post("/construction/build-project")
def build_project(req: BuildProjectRequest):
    """Build the combined FAISS index and generate dashboard."""
    session = get_session(req.session_id)

    path_dicts = [
        {"path": doc["path"], "filename": doc["filename"]}
        for doc in req.classified_docs
    ]

    project_vs = build_project_index(path_dicts)
    grouped = group_by_type(req.classified_docs)
    dashboard = build_dashboard(grouped)

    # ── Extract plain English key insights from all project docs ──────────────
    # Detect domain from the most important doc available
    # Priority: Contract > Specifications > Drawings > first available
    priority = ["Contract", "Specifications", "Drawings", "Daily Reports", "General"]
    primary_doc_path = None
    for doc_type in priority:
        if grouped.get(doc_type):
            primary_doc_path = grouped[doc_type][0]["path"]
            break
    if not primary_doc_path and path_dicts:
        primary_doc_path = path_dicts[0]["path"]

    project_insights = {}
    if primary_doc_path:
        try:
            domain = detect_domain(primary_doc_path)
            project_insights = extract_key_info(project_vs, domain)
        except Exception:
            project_insights = {}

    dashboard["project_insights"] = project_insights

    session["project_vectorstore"] = project_vs
    session["project_files"] = path_dicts
    session["classified_docs"] = req.classified_docs
    session["grouped_docs"] = grouped
    session["dashboard"] = dashboard
    session["chat_history"] = []
    reset_memory()

    return {
        "status": "success",
        "dashboard": dashboard,
        "files_indexed": len(path_dicts),
    }


@app.get("/construction/dashboard/{session_id}")
def get_dashboard(session_id: str):
    """Get the project dashboard data."""
    session = get_session(session_id)

    if not session["dashboard"]:
        raise HTTPException(status_code=400, detail="No project built yet.")

    return session["dashboard"]


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRUCTION MODE — ASK YOUR PROJECT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/construction/ask")
def ask_project(req: AskProjectRequest):
    """Ask a question across all project documents."""
    session = get_session(req.session_id)

    if not session["project_vectorstore"]:
        raise HTTPException(status_code=400, detail="No project built yet.")

    session["chat_history"].append({"role": "user", "content": req.question})
    answer = ask_question(
        session["project_vectorstore"],
        req.question,
        session["chat_history"]
    )
    session["chat_history"].append({"role": "assistant", "content": answer})

    return {
        "answer": answer,
        "chat_history": session["chat_history"]
    }


@app.post("/construction/clear-chat")
def clear_construction_chat(req: AskProjectRequest):
    """Clear construction chat history."""
    session = get_session(req.session_id)
    session["chat_history"] = []
    reset_memory()
    return {"status": "cleared"}


# ─────────────────────────────────────────────────────────────────────────────
# CONSTRUCTION MODE — GENERATE DOCUMENTS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/construction/generate")
def generate_doc(req: GenerateDocRequest):
    """Generate a formatted construction document."""
    session = get_session(req.session_id)

    if not session["project_vectorstore"]:
        raise HTTPException(status_code=400, detail="No project built yet.")

    project_facts = session["dashboard"].get("facts", {})

    result = generate_document(
        doc_type=req.doc_type,
        project_vectorstore=session["project_vectorstore"],
        project_facts=project_facts,
        form_data=req.form_data,
    )

    doc_entry = {
        "type": req.doc_type,
        "content": result,
        "form_data": req.form_data,
    }
    session["generated_docs"].append(doc_entry)

    return {"status": "success", "document": result, "type": req.doc_type}


@app.get("/construction/generated-docs/{session_id}")
def get_generated_docs(session_id: str):
    """Get all generated documents for a session."""
    session = get_session(session_id)
    return {"generated_docs": session["generated_docs"]}