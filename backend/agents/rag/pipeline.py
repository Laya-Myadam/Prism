"""
Ingestion pipeline — raw text → chunked → embedded → PGVector.
"""
from agents.rag.chunker import smart_chunk
from agents.rag.embedder import embed_batch
from agents.rag.vector_store import upsert_chunks, delete_doc_chunks


def ingest_text(
    session_id: str,
    doc_name: str,
    doc_type: str,
    text: str,
    metadata: dict | None = None,
    replace_existing: bool = True,
) -> dict:
    """
    Full ingestion pipeline:
      1. Delete existing chunks for this doc (if replace_existing)
      2. Smart-chunk the text
      3. Batch-embed all chunks
      4. Upsert into Supabase document_chunks

    Returns: {doc_name, doc_type, chunks, status}
    """
    if replace_existing:
        delete_doc_chunks(session_id, doc_name)

    chunks = smart_chunk(text)
    if not chunks:
        return {"doc_name": doc_name, "doc_type": doc_type, "chunks": 0, "status": "empty"}

    embeddings = embed_batch(chunks)

    count = upsert_chunks(
        session_id = session_id,
        doc_name   = doc_name,
        doc_type   = doc_type,
        chunks     = chunks,
        embeddings = embeddings,
        metadata   = metadata or {"doc_name": doc_name, "doc_type": doc_type},
    )

    return {"doc_name": doc_name, "doc_type": doc_type, "chunks": count, "status": "ok"}
