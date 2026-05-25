"""
PRISM Multi-Agent Orchestrator  (LangGraph 1.x / LangChain 1.x compatible)

Architecture:
  User question
       ↓
  Supervisor (classifies intent via LLM)
       ↓
  Specialist Agent (LangGraph ReAct loop with PRISM tools)
  ├── SiteOps Agent  → daily logs, weather risk, projects
  ├── RFI Agent      → RFIs, change orders, obligations
  ├── Schedule Agent → tasks, overdue, punch list
  └── Risk Agent     → all tools (general / risk)
       ↓
  Structured response {answer, steps, agent_used, tools_called}
"""
import os
import time
from typing import TypedDict, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, END

from agents.tools import build_tools
from agents.router import select_model, fallback_models, MODEL_LIST as MODELS


def _llm(model: str | None = None) -> ChatGroq:
    return ChatGroq(model=model or MODELS[0], api_key=os.getenv("GROQ_API_KEY"), temperature=0.0)


# ── LangGraph state ───────────────────────────────────────────────────────────

class AgentState(TypedDict):
    question: str
    session_id: str
    agent_type: str
    answer: str
    steps: list
    tools_called: list
    error: str


# ── Specialist config ─────────────────────────────────────────────────────────

SPECIALIST_MAP = {
    "site_ops":  "Site Operations (daily logs, weather, crew, project status)",
    "rfi":       "RFI & Contracts (RFIs, change orders, obligations, submittals)",
    "schedule":  "Schedule & Punch (tasks, overdue items, punch list, progress)",
    "risk":      "Risk & Analysis (weather risk, delay claims, compliance, general questions)",
    "property":  "Property Management (leases, tenants, maintenance, NOI, CAM)",
}

_RAG = ["search_documents"]

SPECIALIST_TOOLS = {
    "site_ops":  ["get_daily_logs", "get_weather_risk", "get_projects", "get_overdue_tasks"] + _RAG,
    "rfi":       ["get_rfis", "get_change_orders", "get_obligations", "get_submittals"] + _RAG,
    "schedule":  ["get_schedule", "get_overdue_tasks", "get_punch_list", "get_projects"] + _RAG,
    "risk":      ["get_weather_risk", "get_daily_logs", "get_rfis", "get_overdue_tasks",
                  "get_submittals", "get_change_orders", "get_schedule", "get_punch_list"] + _RAG,
    "property":  ["get_leases", "get_tenants", "get_maintenance", "get_noi_reports",
                  "get_cam_reconciliations", "get_tenant_risk_summary"] + _RAG,
}


# ── Supervisor node ───────────────────────────────────────────────────────────

_PROPERTY_KEYWORDS = {
    "lease", "leases", "tenant", "tenants", "rent", "cam", "noi",
    "maintenance", "repair", "property", "cap rate", "occupancy",
    "landlord", "unit", "reconciliation", "evict", "vacancy",
}
_RFI_KEYWORDS = {
    "rfi", "rfis", "change order", "change orders", "obligation",
    "obligations", "submittal", "submittals", "approval", "approvals",
    "contract",
}
_SCHEDULE_KEYWORDS = {
    "schedule", "task", "tasks", "overdue", "punch list", "punch",
    "timeline", "completion", "deadline", "milestone",
}
_RISK_KEYWORDS = {
    "risk", "delay claim", "delay", "compliance", "weather impact",
    "incident",
}
_SITE_OPS_KEYWORDS = {
    "daily log", "daily logs", "crew", "weather", "site", "work performed",
    "labor", "project status", "projects",
}


def _keyword_route(question: str) -> str:
    q = question.lower()
    scores = {
        "property": sum(1 for kw in _PROPERTY_KEYWORDS if kw in q),
        "rfi":      sum(1 for kw in _RFI_KEYWORDS if kw in q),
        "schedule": sum(1 for kw in _SCHEDULE_KEYWORDS if kw in q),
        "risk":     sum(1 for kw in _RISK_KEYWORDS if kw in q),
        "site_ops": sum(1 for kw in _SITE_OPS_KEYWORDS if kw in q),
    }
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "risk"


def supervisor_node(state: AgentState) -> AgentState:
    agent_type = _keyword_route(state["question"])
    return {**state, "agent_type": agent_type}


# ── Specialist node (shared logic) ────────────────────────────────────────────

def _run_specialist(state: AgentState, tool_names: list[str], role: str) -> AgentState:
    all_tools = build_tools(state["session_id"])
    tools = [t for t in all_tools if t.name in tool_names]

    # Inject relevant memories from previous sessions
    memory_context = ""
    try:
        from agents.rag.memory import retrieve_memories
        memories = retrieve_memories(state["session_id"], state["question"])
        if memories:
            memory_context = "\n\nRelevant context from previous conversations:\n" + \
                             "\n".join(f"- {m}" for m in memories)
    except Exception:
        pass

    system_prompt = (
        f"You are PRISM, an expert AI assistant for construction and property management. "
        f"You are a {role} specialist. "
        "Always use the available tools to fetch real project data before answering. "
        "If the question refers to document content (contracts, specs, leases), use search_documents. "
        "Never make up numbers or facts — only state what the tools return. "
        f"Give a clear, specific answer once you have gathered enough information.{memory_context}"
    )

    steps: list = []
    tools_called: list = []
    answer = "I could not generate an answer from the available data."

    # Smart routing: pick best model tier for this question + agent type
    primary_model = select_model(state["question"], state["agent_type"])
    models_to_try = fallback_models(primary_model)

    t0 = time.time()

    # Try each model in order; skip to next on rate limit
    for model in models_to_try:
        agent = create_react_agent(
            model=_llm(model),
            tools=tools,
            prompt=SystemMessage(content=system_prompt),
        )
        try:
            result = agent.invoke({"messages": [HumanMessage(content=state["question"])]})
            messages = result.get("messages", [])

            for msg in reversed(messages):
                if isinstance(msg, AIMessage) and msg.content:
                    answer = msg.content
                    break

            for msg in messages:
                if isinstance(msg, AIMessage):
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            tools_called.append(tc.get("name", "unknown_tool"))
                            steps.append({
                                "thought": msg.content or "",
                                "action": tc.get("name", "unknown_tool"),
                                "observation": "",
                            })
                elif isinstance(msg, ToolMessage):
                    for step in reversed(steps):
                        if not step["observation"]:
                            step["observation"] = str(msg.content)[:400]
                            break
            # Extract and persist key facts as memories (best-effort)
            try:
                from agents.rag.memory import extract_and_store
                extract_and_store(state["session_id"], state["question"], answer, _llm(model))
            except Exception:
                pass

            # Log trace
            try:
                from agents.tracer import log_trace
                log_trace(
                    session_id   = state["session_id"],
                    question     = state["question"],
                    answer       = answer,
                    agent_type   = state["agent_type"],
                    model        = model,
                    tools_called = tools_called,
                    latency_ms   = int((time.time() - t0) * 1000),
                )
            except Exception:
                pass

            break  # success — stop trying models

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "rate_limit" in err_str.lower():
                print(f"[agent rate limit] model={model} — trying next model")
                continue  # try next model
            answer = f"I encountered an error: {e}"
            break
    else:
        answer = "All models are currently rate-limited. Please try again in a few minutes."

    return {**state, "answer": answer, "steps": steps, "tools_called": tools_called}


def site_ops_node(state: AgentState) -> AgentState:
    return _run_specialist(state, SPECIALIST_TOOLS["site_ops"], "Site Operations")

def rfi_node(state: AgentState) -> AgentState:
    return _run_specialist(state, SPECIALIST_TOOLS["rfi"], "RFI & Contracts")

def schedule_node(state: AgentState) -> AgentState:
    return _run_specialist(state, SPECIALIST_TOOLS["schedule"], "Schedule & Punch List")

def risk_node(state: AgentState) -> AgentState:
    return _run_specialist(state, SPECIALIST_TOOLS["risk"], "Risk & Analysis")

def property_node(state: AgentState) -> AgentState:
    return _run_specialist(state, SPECIALIST_TOOLS["property"], "Property Management")


# ── Route function ────────────────────────────────────────────────────────────

def route_to_specialist(state: AgentState) -> str:
    return state["agent_type"]


# ── Build the graph ───────────────────────────────────────────────────────────

def _build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("supervisor", supervisor_node)
    graph.add_node("site_ops",   site_ops_node)
    graph.add_node("rfi",        rfi_node)
    graph.add_node("schedule",   schedule_node)
    graph.add_node("risk",       risk_node)
    graph.add_node("property",   property_node)

    graph.set_entry_point("supervisor")

    graph.add_conditional_edges("supervisor", route_to_specialist, {
        "site_ops": "site_ops",
        "rfi":      "rfi",
        "schedule": "schedule",
        "risk":     "risk",
        "property": "property",
    })

    for node in ("site_ops", "rfi", "schedule", "risk", "property"):
        graph.add_edge(node, END)

    return graph.compile()


_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = _build_graph()
    return _graph


# ── Public entry point ────────────────────────────────────────────────────────

def run_agent(session_id: str, question: str) -> dict:
    """
    Returns:
      {answer: str, steps: [{thought, action, observation}], agent_used: str, tools_called: [str]}
    """
    graph = get_graph()
    initial: AgentState = {
        "question": question,
        "session_id": session_id,
        "agent_type": "",
        "answer": "",
        "steps": [],
        "tools_called": [],
        "error": "",
    }
    final = graph.invoke(initial)
    return {
        "answer":       final.get("answer", "No answer generated."),
        "steps":        final.get("steps", []),
        "agent_used":   SPECIALIST_MAP.get(final.get("agent_type", ""), "General"),
        "tools_called": final.get("tools_called", []),
        "agent_type":   final.get("agent_type", ""),
    }


# ── Async streaming entry point ───────────────────────────────────────────────

async def stream_agent(session_id: str, question: str) -> AsyncGenerator[dict, None]:
    """
    Async generator that yields SSE event dicts for the /agent/stream endpoint.
    Events: meta | token | tool_start | tool_end | done | error
    """
    agent_type  = _keyword_route(question)
    tool_names  = SPECIALIST_TOOLS[agent_type]
    role        = SPECIALIST_MAP[agent_type]
    model       = select_model(question, agent_type)

    # Memory injection
    memory_context = ""
    try:
        from agents.rag.memory import retrieve_memories
        memories = retrieve_memories(session_id, question)
        if memories:
            memory_context = "\n\nContext from previous conversations:\n" + \
                             "\n".join(f"- {m}" for m in memories)
    except Exception:
        pass

    system_prompt = (
        f"You are PRISM, an expert AI assistant for construction and property management. "
        f"You are a {role} specialist. "
        "Always use the available tools to fetch real project data before answering. "
        "If the question refers to document content, use search_documents. "
        f"Never make up numbers or facts — only state what the tools return.{memory_context}"
    )

    all_tools = build_tools(session_id)
    tools     = [t for t in all_tools if t.name in tool_names]

    yield {"type": "meta", "agent_type": agent_type, "agent_used": role, "model": model}

    tools_called:  list[str] = []
    answer_parts:  list[str] = []
    t0 = time.time()

    models_to_try = fallback_models(model)
    last_error    = None

    for current_model in models_to_try:
        agent = create_react_agent(
            model  = _llm(current_model),
            tools  = tools,
            prompt = SystemMessage(content=system_prompt),
        )
        try:
            async for event in agent.astream_events(
                {"messages": [HumanMessage(content=question)]},
                version="v2",
            ):
                kind = event["event"]

                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if chunk and chunk.content:
                        answer_parts.append(chunk.content)
                        yield {"type": "token", "content": chunk.content}

                elif kind == "on_tool_start":
                    name = event.get("name", "unknown_tool")
                    if name not in tools_called:
                        tools_called.append(name)
                    yield {"type": "tool_start", "tool": name}

                elif kind == "on_tool_end":
                    output  = event["data"].get("output", "")
                    preview = str(output)[:150] if output else ""
                    yield {"type": "tool_end", "tool": event.get("name", ""), "preview": preview}

            # Success
            final_answer = "".join(answer_parts)

            # Log trace
            try:
                from agents.tracer import log_trace
                log_trace(session_id, question, final_answer, agent_type,
                          current_model, tools_called, int((time.time() - t0) * 1000))
            except Exception:
                pass

            yield {
                "type":        "done",
                "answer":      final_answer,
                "agent_used":  role,
                "tools_called": tools_called,
            }
            return

        except Exception as e:
            last_error = str(e)
            if "429" in last_error or "rate_limit" in last_error.lower():
                yield {"type": "info", "content": f"Switching model…"}
                continue
            yield {"type": "error", "message": f"Agent error: {last_error[:200]}"}
            return

    yield {"type": "error", "message": "All models are currently rate-limited. Please try again in a few minutes."}
