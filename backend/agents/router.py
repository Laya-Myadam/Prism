"""
Smart model routing — picks the right Groq model tier based on question complexity.

Tier 1  llama-3.3-70b-versatile               complex reasoning, risk, multi-hop
Tier 2  meta-llama/llama-4-scout-17b-16e-instruct   balanced — ambiguous questions
Tier 3  llama-3.1-8b-instant                  simple lookups, count/list/status
"""

MODELS = {
    "complex":  "llama-3.3-70b-versatile",
    "balanced": "meta-llama/llama-4-scout-17b-16e-instruct",
    "fast":     "llama-3.1-8b-instant",
}

MODEL_LIST = [MODELS["complex"], MODELS["balanced"], MODELS["fast"]]

_COMPLEX_SIGNALS = {
    "analyze", "analyse", "explain", "compare", "assess", "evaluate",
    "predict", "forecast", "why", "what causes", "impact of", "risk of",
    "recommend", "strategy", "trend", "correlation", "breakdown",
    "comprehensive", "detailed", "summarize all", "what should",
    "how should", "what would happen", "what is the likelihood",
    "give me a full", "deep dive",
}

_SIMPLE_SIGNALS = {
    "show", "list", "what are", "how many", "count", "any open",
    "any pending", "status", "get", "fetch", "display", "give me",
    "is there", "are there", "do we have",
}

# These agent types always use the full model — their output is high-stakes
_ALWAYS_COMPLEX_AGENTS = {"risk"}


def select_model(question: str, agent_type: str) -> str:
    """
    Returns the best model name for this question + agent type combination.
    Falls back through tiers automatically on rate-limit (handled in orchestrator).
    """
    if agent_type in _ALWAYS_COMPLEX_AGENTS:
        return MODELS["complex"]

    q            = question.lower()
    complex_hits = sum(1 for s in _COMPLEX_SIGNALS if s in q)
    simple_hits  = sum(1 for s in _SIMPLE_SIGNALS if s in q)
    word_count   = len(question.split())

    if complex_hits > 0 or word_count > 25:
        return MODELS["complex"]

    if simple_hits > 0 and complex_hits == 0 and word_count <= 15:
        return MODELS["fast"]

    return MODELS["balanced"]


def tier_name(model: str) -> str:
    return {v: k for k, v in MODELS.items()}.get(model, "unknown")


def fallback_models(primary: str) -> list[str]:
    """Return all models starting from primary, for rate-limit fallback."""
    all_models = MODEL_LIST
    try:
        idx = all_models.index(primary)
        return all_models[idx:]
    except ValueError:
        return all_models
