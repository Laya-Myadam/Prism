"""
Observability layer for PRISM agents.

LangSmith (automatic):
  Set in .env:
    LANGCHAIN_TRACING_V2=true
    LANGCHAIN_API_KEY=ls__...
    LANGCHAIN_PROJECT=prism
  LangChain/LangGraph pick these up automatically — no code changes needed.

Local tracing:
  Every agent run logs to Supabase agent_traces table:
  session_id, question, answer, agent_type, model, tools, latency_ms, cost_usd, cached
"""
import os

# Per-1K-token cost in USD (Groq pricing, approximate)
_TOKEN_COST = {
    "llama-3.3-70b-versatile":                     {"in": 0.00059, "out": 0.00079},
    "meta-llama/llama-4-scout-17b-16e-instruct":   {"in": 0.00011, "out": 0.00034},
    "llama-3.1-8b-instant":                        {"in": 0.00005, "out": 0.00008},
}
_WORD_TO_TOKEN = 1.35  # rough words-to-tokens multiplier

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
    except Exception:
        pass
    return _client


def estimate_cost(model: str, question: str, answer: str) -> float:
    costs  = _TOKEN_COST.get(model, {"in": 0.0001, "out": 0.0001})
    in_tok = len(question.split()) * _WORD_TO_TOKEN
    out_tok = len(answer.split()) * _WORD_TO_TOKEN
    return round(in_tok / 1000 * costs["in"] + out_tok / 1000 * costs["out"], 7)


def log_trace(
    session_id:  str,
    question:    str,
    answer:      str,
    agent_type:  str,
    model:       str,
    tools_called: list,
    latency_ms:  int,
    cached:      bool = False,
) -> None:
    """Write a trace to Supabase. Best-effort — never raises."""
    sb = _sb()
    if not sb:
        return
    try:
        sb.table("agent_traces").insert({
            "session_id":   session_id,
            "question":     question[:500],
            "answer":       answer[:1000],
            "agent_type":   agent_type,
            "model":        model,
            "tools_called": tools_called,
            "latency_ms":   latency_ms,
            "cost_usd":     estimate_cost(model, question, answer),
            "cached":       cached,
        }).execute()
    except Exception as e:
        print(f"[tracer]: {e}")


def get_traces(session_id: str, limit: int = 50) -> list[dict]:
    """Fetch recent traces for a session."""
    sb = _sb()
    if not sb:
        return []
    try:
        result = sb.table("agent_traces") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return result.data or []
    except Exception as e:
        print(f"[tracer get_traces]: {e}")
        return []


def get_trace_summary(session_id: str) -> dict:
    """Aggregate metrics: total runs, avg latency, total cost, cache hit rate."""
    traces = get_traces(session_id, limit=500)
    if not traces:
        return {"total": 0, "avg_latency_ms": 0, "total_cost_usd": 0, "cache_hit_rate": 0}
    total      = len(traces)
    cached     = sum(1 for t in traces if t.get("cached"))
    avg_lat    = round(sum(t.get("latency_ms", 0) for t in traces) / total)
    total_cost = round(sum(t.get("cost_usd", 0) for t in traces), 5)
    return {
        "total":           total,
        "avg_latency_ms":  avg_lat,
        "total_cost_usd":  total_cost,
        "cache_hit_rate":  round(cached / total, 3),
        "by_model":        _count_by(traces, "model"),
        "by_agent":        _count_by(traces, "agent_type"),
    }


def _count_by(traces: list[dict], field: str) -> dict:
    counts: dict = {}
    for t in traces:
        k = t.get(field, "unknown")
        counts[k] = counts.get(k, 0) + 1
    return counts
