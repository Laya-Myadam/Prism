"""PGVector CRUD via Supabase — document_chunks table."""
import os

_client = None


def _sb():
    global _client
    if _client is not None:
        return _client
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
        if url and key:
            _client = create_client(url, key)
    except Exception as e:
        print(f"[vector_store init]: {e}")
    return _client


def upsert_chunks(
    session_id: str,
    doc_name: str,
    doc_type: str,
    chunks: list[str],
    embeddings: list[list[float]],
    metadata: dict | None = None,
) -> int:
    """Insert chunk rows. Returns number of rows inserted."""
    sb = _sb()
    if not sb or not chunks:
        return 0
    rows = [
        {
            "session_id": session_id,
            "doc_name":   doc_name,
            "doc_type":   doc_type,
            "chunk_index": i,
            "content":    chunk,
            "embedding":  emb,
            "metadata":   metadata or {},
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    total = 0
    for i in range(0, len(rows), 50):
        sb.table("document_chunks").insert(rows[i : i + 50]).execute()
        total += len(rows[i : i + 50])
    return total


def search_chunks(
    session_id: str,
    query_embedding: list[float],
    limit: int = 20,
) -> list[dict]:
    """Cosine similarity search via pgvector RPC. Returns rows with similarity score."""
    sb = _sb()
    if not sb:
        return []
    try:
        result = sb.rpc("match_document_chunks", {
            "query_embedding":   query_embedding,
            "match_count":       limit,
            "filter_session_id": session_id,
        }).execute()
        return result.data or []
    except Exception as e:
        print(f"[vector_store search_chunks]: {e}")
        return []


def delete_doc_chunks(session_id: str, doc_name: str) -> None:
    sb = _sb()
    if not sb:
        return
    try:
        sb.table("document_chunks") \
            .delete() \
            .eq("session_id", session_id) \
            .eq("doc_name", doc_name) \
            .execute()
    except Exception as e:
        print(f"[vector_store delete_doc_chunks]: {e}")


def list_docs(session_id: str) -> list[dict]:
    """List distinct documents ingested for a session."""
    sb = _sb()
    if not sb:
        return []
    try:
        result = sb.table("document_chunks") \
            .select("doc_name, doc_type, chunk_index") \
            .eq("session_id", session_id) \
            .execute()
        seen: dict[str, dict] = {}
        for row in (result.data or []):
            name = row["doc_name"]
            if name not in seen:
                seen[name] = {"doc_name": name, "doc_type": row["doc_type"], "chunks": 0}
            seen[name]["chunks"] += 1
        return list(seen.values())
    except Exception as e:
        print(f"[vector_store list_docs]: {e}")
        return []
