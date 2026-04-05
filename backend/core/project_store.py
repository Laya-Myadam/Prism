import os
import pdfplumber
import streamlit as st
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from core.image_extractor import extract_images_from_pdf


# ── Shared embeddings (same model as ingestor.py) ─────────────────────────────
def _get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )


# ── Ingest a single PDF and tag every chunk with its filename ─────────────────
def _ingest_single_pdf(pdf_path: str, filename: str, embeddings) -> FAISS:
    """
    Exactly like ingestor.py but adds 'filename' to every chunk's metadata.
    This is what lets the RFI engine tell you WHICH document the answer came from.
    """
    all_documents = []

    # 1. Extract text
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                all_documents.append(Document(
                    page_content=page_text,
                    metadata={
                        "source": "text",
                        "page": page_num,
                        "filename": filename      # ← key addition
                    }
                ))

    # 2. Extract and describe images
    image_data = extract_images_from_pdf(pdf_path)
    for img in image_data:
        all_documents.append(Document(
            page_content=img["text"],
            metadata={
                "source": "image",
                "page": img["page_num"],
                "image_index": img["image_index"],
                "filename": filename              # ← key addition
            }
        ))

    if not all_documents:
        raise ValueError(f"Could not extract any content from {filename}.")

    # 3. Chunk — same settings as ingestor.py
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " "]
    )
    text_docs = [d for d in all_documents if d.metadata["source"] == "text"]
    image_docs = [d for d in all_documents if d.metadata["source"] == "image"]
    chunked_text = splitter.split_documents(text_docs)
    final_docs = chunked_text + image_docs

    # 4. Build FAISS index for this single file
    return FAISS.from_documents(final_docs, embeddings)


# ── Build a combined FAISS index from multiple PDFs ───────────────────────────
def build_project_index(pdf_paths: list[dict]) -> FAISS:
    """
    Takes a list of dicts: [{"path": "/data/uploads/specs.pdf", "filename": "specs.pdf"}, ...]
    Returns one merged FAISS vectorstore covering all documents.

    Usage in app.py:
        project_vs = build_project_index([
            {"path": str(path_a), "filename": "specs.pdf"},
            {"path": str(path_b), "filename": "drawings.pdf"},
        ])
    """
    if not pdf_paths:
        raise ValueError("No documents provided to build project index.")

    embeddings = _get_embeddings()

    # Build index for first doc
    first = pdf_paths[0]
    combined_index = _ingest_single_pdf(first["path"], first["filename"], embeddings)

    # Merge remaining docs into it
    for doc in pdf_paths[1:]:
        doc_index = _ingest_single_pdf(doc["path"], doc["filename"], embeddings)
        combined_index.merge_from(doc_index)       # FAISS native merge — no re-embedding

    return combined_index


# ── Get source citations from retrieved chunks ────────────────────────────────
def get_source_citations(docs: list) -> list[str]:
    """
    Given a list of retrieved LangChain Documents,
    returns a clean list of unique 'filename — page X' citation strings.

    Usage in rfi_engine.py:
        docs = retriever.invoke(question)
        citations = get_source_citations(docs)
    """
    seen = set()
    citations = []
    for doc in docs:
        filename = doc.metadata.get("filename", "Unknown document")
        page = doc.metadata.get("page", "?")
        key = f"{filename} — page {page}"
        if key not in seen:
            seen.add(key)
            citations.append(key)
    return citations


# ── Save uploaded files to disk and return path dicts ─────────────────────────
def save_project_files(uploaded_files: list, upload_dir: str = "data/uploads") -> list[dict]:
    """
    Takes Streamlit uploaded file objects, saves them to disk,
    and returns the list of path dicts ready for build_project_index().

    Usage in app.py:
        pdf_paths = save_project_files(uploaded_files)
        project_vs = build_project_index(pdf_paths)
    """
    Path(upload_dir).mkdir(parents=True, exist_ok=True)
    path_dicts = []
    for f in uploaded_files:
        dest = Path(upload_dir) / f.name
        dest.write_bytes(f.getbuffer())
        path_dicts.append({"path": str(dest), "filename": f.name})
    return path_dicts