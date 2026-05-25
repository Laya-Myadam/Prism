"""
Retrieval pipeline:
  1. Embed query
  2. Vector search → top-20 candidates (pgvector)
  3. Rerank → top-5
     a. Cohere Rerank API  (if COHERE_API_KEY is set)
     b. Hybrid score: 70% vector cosine + 30% BM25 keyword overlap
"""
import os
from agents.rag.embedder import embed_one
from agents.rag.vector_store import search_chunks


# ── BM25-style keyword scoring (no extra deps) ────────────────────────────────

def _bm25_scores(query: str, candidates: list[dict]) -> list[float]:
    query_terms = set(query.lower().split())
    scores = []
    for c in candidates:
        words = c.get("content", "").lower().split()
        if not words:
            scores.append(0.0)
            continue
        tf = sum(1 for w in words if w in query_terms) / len(words)
        scores.append(tf)
    return scores


# ── Cohere reranker (optional) ────────────────────────────────────────────────

def _cohere_rerank(query: str, candidates: list[dict], top_k: int) -> list[dict]:
    api_key = os.getenv("COHERE_API_KEY")
    if not api_key:
        return []
    try:
        import cohere
        co = cohere.Client(api_key)
        docs = [c["content"] for c in candidates]
        response = co.rerank(
            model="rerank-english-v3.0",
            query=query,
            documents=docs,
            top_n=top_k,
        )
        reranked = []
        for r in response.results:
            item = candidates[r.index].copy()
            item["rerank_score"] = r.relevance_score
            reranked.append(item)
        return reranked
    except Exception as e:
        print(f"[retriever cohere_rerank]: {e}")
        return []


# ── Public API ────────────────────────────────────────────────────────────────

def retrieve(
    session_id: str,
    question: str,
    top_k: int = 5,
    candidates_k: int = 20,
) -> list[dict]:
    """
    Returns top_k most relevant document chunks for the question.
    Falls back to empty list if no documents have been ingested.
    """
    query_emb  = embed_one(question)
    candidates = search_chunks(session_id, query_emb, limit=candidates_k)
    if not candidates:
        return []
    if len(candidates) <= top_k:
        return candidates

    # Try Cohere first
    reranked = _cohere_rerank(question, candidates, top_k)
    if reranked:
        return reranked

    # Hybrid fallback: 70% cosine + 30% BM25
    bm25 = _bm25_scores(question, candidates)
    for i, c in enumerate(candidates):
        c["hybrid_score"] = 0.7 * c.get("similarity", 0.0) + 0.3 * bm25[i]
    candidates.sort(key=lambda c: c.get("hybrid_score", 0.0), reverse=True)
    return candidates[:top_k]


def format_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a prompt-ready context block."""
    if not chunks:
        return ""
    parts = []
    for c in chunks:
        score = c.get("rerank_score") or c.get("hybrid_score") or c.get("similarity", 0.0)
        parts.append(
            f"[Source: {c.get('doc_name', 'document')} | Relevance: {score:.2f}]\n"
            f"{c.get('content', '')}"
        )
    return "\n\n---\n\n".join(parts)
