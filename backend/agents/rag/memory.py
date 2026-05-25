"""
Cross-session agent memory.
After each successful response, key facts are extracted and stored.
On each new question, relevant memories are retrieved and injected
into the specialist's system prompt.
"""
import os

_client = None
MEMORY_RELEVANCE_THRESHOLD = 0.60


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
        print(f"[memory init]: {e}")
    return _client


def store_memory(
    session_id: str,
    content: str,
    memory_type: str = "fact",
    importance: float = 0.7,
) -> None:
    sb = _sb()
    if not sb or not content.strip():
        return
    try:
        from agents.rag.embedder import embed_one
        emb = embed_one(content)
        sb.table("agent_memory").insert({
            "session_id":  session_id,
            "memory_type": memory_type,
            "content":     content,
            "embedding":   emb,
            "importance":  importance,
        }).execute()
    except Exception as e:
        print(f"[memory store_memory]: {e}")


def retrieve_memories(session_id: str, question: str, top_k: int = 4) -> list[str]:
    """Return relevant memory strings for injection into the agent system prompt."""
    sb = _sb()
    if not sb:
        return []
    try:
        from agents.rag.embedder import embed_one
        emb    = embed_one(question)
        result = sb.rpc("match_agent_memory", {
            "query_embedding":   emb,
            "filter_session_id": session_id,
            "match_count":       top_k,
        }).execute()
        return [
            row["content"]
            for row in (result.data or [])
            if row.get("similarity", 0) >= MEMORY_RELEVANCE_THRESHOLD
        ]
    except Exception as e:
        print(f"[memory retrieve_memories]: {e}")
        return []


def extract_and_store(session_id: str, question: str, answer: str, llm) -> None:
    """
    Use LLM to pull 1-3 concrete facts from the agent answer and store them.
    Skips generic/empty answers to avoid noisy memories.
    Runs synchronously — keep it fast (short prompt).
    """
    if len(answer) < 80 or any(
        phrase in answer.lower()
        for phrase in ("no records", "no data", "no answer", "rate limit", "error")
    ):
        return
    try:
        import json
        prompt = (
            "Extract 1-3 specific facts from this AI answer worth remembering for future "
            "conversations (names, numbers, dates, statuses, decisions). "
            "Return ONLY a JSON array of short strings. If nothing specific, return [].\n\n"
            f"Q: {question}\nA: {answer[:600]}\n\nJSON:"
        )
        raw     = llm.invoke(prompt).content.strip()
        start   = raw.find("[")
        end     = raw.rfind("]") + 1
        if start < 0 or end <= start:
            return
        facts = json.loads(raw[start:end])
        for fact in facts[:3]:
            if isinstance(fact, str) and len(fact) > 20:
                store_memory(session_id, fact)
    except Exception as e:
        print(f"[memory extract_and_store]: {e}")
