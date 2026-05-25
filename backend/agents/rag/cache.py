"""
Semantic caching — skip the LLM entirely when a near-identical question
was already answered. Threshold 0.92 = very high similarity required.
"""
import os

_client = None
SIMILARITY_THRESHOLD = 0.92


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
        print(f"[cache init]: {e}")
    return _client


def get_cached(session_id: str, question: str) -> dict | None:
    """
    Returns a cached AgentResponse dict when similarity >= threshold, else None.
    Near-zero latency path — no LLM call needed.
    """
    sb = _sb()
    if not sb:
        return None
    try:
        from agents.rag.embedder import embed_one
        emb    = embed_one(question)
        result = sb.rpc("match_semantic_cache", {
            "query_embedding":      emb,
            "similarity_threshold": SIMILARITY_THRESHOLD,
            "filter_session_id":    session_id,
            "match_count":          1,
        }).execute()

        if not result.data:
            return None

        row = result.data[0]
        sb.table("semantic_cache") \
            .update({"hit_count": row.get("hit_count", 0) + 1, "last_hit_at": "now()"}) \
            .eq("id", str(row["id"])) \
            .execute()

        return {
            "answer":          row["answer"],
            "steps":           [],
            "agent_used":      (row.get("agent_used") or "") + " (cached)",
            "tools_called":    row.get("tools_called") or [],
            "guardrail_layer": "semantic_cache",
        }
    except Exception as e:
        print(f"[cache get_cached]: {e}")
        return None


def store_cached(session_id: str, question: str, response: dict) -> None:
    """Persist a successful agent response so future identical questions hit the cache."""
    sb = _sb()
    if not sb:
        return
    # Don't cache error responses or guardrail rejections
    answer = response.get("answer", "")
    if not answer or "error" in answer.lower()[:30] or response.get("guardrail_layer"):
        return
    try:
        from agents.rag.embedder import embed_one
        emb = embed_one(question)
        sb.table("semantic_cache").insert({
            "session_id":         session_id,
            "question":           question,
            "question_embedding": emb,
            "answer":             answer,
            "agent_used":         response.get("agent_used", ""),
            "tools_called":       response.get("tools_called", []),
        }).execute()
    except Exception as e:
        print(f"[cache store_cached]: {e}")
