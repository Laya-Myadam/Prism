"""
PRISM Guardrail Layers

Execution order for every /agent/chat request:
  1. Prompt injection detection  (input)
  2. Topic guardrail             (input)
  3. Agent runs (if both pass)
  4. Output content moderation   (output)
  5. JSON schema validation      (output)
"""
import re
from pydantic import BaseModel, Field


# ── 1. Prompt Injection Detection ─────────────────────────────────────────────

_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompt|rules?|constraints?)",
    r"forget\s+(your|all|everything|previous)",
    r"you\s+are\s+now\s+(a\s+)?(new|different|another|free|unrestricted)",
    r"(pretend|act|behave)\s+(like|as\s+if|as\s+though)\s+you",
    r"pretend\s+you\s+(have|are|can|don't|do\s+not)",
    r"act\s+as\s+(if\s+you\s+)?(are|have\s+no|were)",
    r"your\s+(new\s+)?(instructions?|rules?|role|persona)\s+(are|is)",
    r"do\s+not\s+(follow|obey|adhere\s+to)\s+(your|the|previous)",
    r"(jailbreak|dan\s+mode|dev\s+mode|developer\s+mode)",
    r"(system|system\s+prompt)\s*[:=]\s*",
    r"</?(system|instructions?|prompt)>",
    r"<\|?(im_start|im_end|endoftext)\|?>",
    r"override\s+(your\s+)?(safety|guidelines?|instructions?|rules?)",
    r"disregard\s+(all|any|your|previous|the)",
    r"new\s+persona\s*:",
    r"respond\s+(only|always)\s+as",
    r"(no\s+restrictions?|without\s+restrictions?|unrestricted\s+mode)",
]

_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]


def check_injection(question: str) -> tuple[bool, str]:
    """Returns (is_safe, rejection_reason). is_safe=True means no injection detected."""
    for pattern in _INJECTION_RE:
        if pattern.search(question):
            return False, (
                "Your message was flagged as a potential prompt injection attempt and was blocked. "
                "Please ask a genuine question about your construction or property data."
            )
    return True, ""


# ── 2. Topic Guardrail ────────────────────────────────────────────────────────

# Domain-specific keywords — presence of any of these confirms on-topic intent
_DOMAIN_KEYWORDS = {
    # construction
    "construction", "project", "projects", "rfi", "rfis", "change order", "change orders",
    "daily log", "daily logs", "schedule", "task", "tasks", "punch list", "punch",
    "submittal", "submittals", "obligation", "obligations", "crew", "labor", "workers",
    "weather", "delay", "delays", "risk", "risks", "site", "work performed", "overdue",
    "incident", "safety", "inspection", "drawing", "spec", "contract", "bid",
    "completion", "progress", "milestone", "deadline", "phase", "budget",
    # property management
    "lease", "leases", "tenant", "tenants", "rent", "cam", "noi", "maintenance",
    "repair", "property", "properties", "unit", "landlord", "vacancy", "cap rate",
    "reconciliation", "eviction", "occupancy", "invoice", "amenity",
}

_BLOCKED_KEYWORDS = {
    "recipe", "cooking", "baking", "food", "restaurant",
    "movie", "film", "tv show", "music", "song", "album",
    "sport", "football", "basketball", "cricket", "nba", "nfl",
    "dating", "relationship", "romance",
    "politics", "election", "president",
    "stock market", "cryptocurrency", "bitcoin", "forex",
    "joke", "riddle", "poem", "story", "fiction",
    "homework", "essay", "thesis",
    "social media", "instagram", "tiktok", "twitter",
}


def check_topic(question: str) -> tuple[bool, str]:
    """Returns (is_allowed, rejection_reason). is_allowed=True means on-topic."""
    q = question.lower().strip()

    if len(q) < 3:
        return False, "Please ask a specific question about your construction or property management data."

    blocked_hits = [kw for kw in _BLOCKED_KEYWORDS if kw in q]
    # Only domain-specific keywords (not generic query words) confirm on-topic intent
    domain_hits = [kw for kw in _DOMAIN_KEYWORDS if kw in q]

    if blocked_hits and not domain_hits:
        return False, (
            "PRISM handles construction and property management only. "
            f"Your question appears to be about: {', '.join(blocked_hits)}. "
            "Try asking about RFIs, schedules, maintenance, leases, or project status."
        )

    return True, ""


# ── 3. Output Content Moderation ──────────────────────────────────────────────

_HARMFUL_PATTERNS = [
    r"\b(how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|explosive|weapon|poison))\b",
    r"\b(suicide|self[\-\s]harm|self[\-\s]destruct)\b",
    r"\b(hack|exploit|malware|ransomware|phishing|keylogger)\b",
    # slurs — kept minimal, pattern-based
    r"\b(n[i1]gg[ae]r|f[a4]gg[o0]t|c[u\*]nt)\b",
]

_HARMFUL_RE = [re.compile(p, re.IGNORECASE) for p in _HARMFUL_PATTERNS]

# Construction-industry terms that look like false positives
_SAFE_EXCEPTIONS = [
    "kill switch", "bomb inspection", "bomb shelter", "blast radius",
    "hack day", "weapon storage locker", "self-destruct sequence test",
]


def check_output(answer: str) -> tuple[bool, str]:
    """
    Returns (is_safe, result).
    If safe: result = original answer.
    If unsafe: result = replacement message.
    """
    scrubbed = answer.lower()
    for exc in _SAFE_EXCEPTIONS:
        scrubbed = scrubbed.replace(exc, "")

    for pattern in _HARMFUL_RE:
        if pattern.search(scrubbed):
            return False, (
                "The agent's response was flagged by content moderation and could not be returned. "
                "Please rephrase your question."
            )

    return True, answer


# ── 4. JSON Schema Validation ─────────────────────────────────────────────────

class ReasoningStep(BaseModel):
    thought: str = ""
    action: str = ""
    observation: str = ""


class AgentResponse(BaseModel):
    answer: str
    steps: list[ReasoningStep] = Field(default_factory=list)
    agent_used: str = ""
    tools_called: list[str] = Field(default_factory=list)
    guardrail_layer: str = ""  # populated only when a guard fired


def validate_response(raw: dict) -> AgentResponse:
    """Coerces raw agent dict into AgentResponse, never raises."""
    try:
        return AgentResponse(**raw)
    except Exception:
        return AgentResponse(
            answer=str(raw.get("answer", "No answer generated.")),
            steps=[],
            agent_used=str(raw.get("agent_used", "")),
            tools_called=(
                raw.get("tools_called", [])
                if isinstance(raw.get("tools_called"), list)
                else []
            ),
        )


# ── Combined pipeline ─────────────────────────────────────────────────────────

class GuardRejection(Exception):
    def __init__(self, message: str, layer: str):
        self.message = message
        self.layer = layer
        super().__init__(message)


def run_input_guards(question: str) -> None:
    """
    Runs injection + topic checks.
    Raises GuardRejection on first failure — agent is never called.
    """
    ok, reason = check_injection(question)
    if not ok:
        raise GuardRejection(reason, "prompt_injection")

    ok, reason = check_topic(question)
    if not ok:
        raise GuardRejection(reason, "off_topic")


def run_output_guards(raw: dict) -> AgentResponse:
    """
    Validates schema then moderates content.
    Always returns a valid AgentResponse.
    """
    validated = validate_response(raw)

    ok, result = check_output(validated.answer)
    if not ok:
        validated.answer = result
        validated.guardrail_layer = "output_moderation"

    return validated
