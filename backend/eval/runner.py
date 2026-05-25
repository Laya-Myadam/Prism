"""
PRISM Benchmark Runner
Runs all 20 benchmark questions against the live agent and scores:
  - Routing accuracy   (did it pick the right agent?)
  - Tool accuracy      (did it call at least one expected tool?)
  - Answer relevance   (do expected keywords appear in the answer?)
  - Latency            (ms per question)

Usage:
  cd backend
  python -m eval.runner --session_id demo
  python -m eval.runner --session_id demo --question_id B018
"""
import json
import time
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()


def run_benchmark(session_id: str, question_id: str | None = None) -> dict:
    from agents.orchestrator import run_agent

    with open(os.path.join(os.path.dirname(__file__), "benchmark.json")) as f:
        cases = json.load(f)

    if question_id:
        cases = [c for c in cases if c["id"] == question_id]

    results = []
    for case in cases:
        qid      = case["id"]
        question = case["question"]
        print(f"  [{qid}] {question}")

        t0 = time.time()
        try:
            response = run_agent(session_id, question)
            latency  = int((time.time() - t0) * 1000)

            answer       = response.get("answer", "")
            agent_used   = response.get("agent_used", "")
            tools_called = response.get("tools_called", [])

            # Score 1: routing (agent name contains expected agent key)
            expected_agent  = case["expected_agent"]
            routing_ok      = expected_agent.replace("_", " ") in agent_used.lower() \
                              or expected_agent in agent_used.lower()

            # Score 2: tool coverage (at least 1 expected tool was called)
            expected_tools  = case["expected_tools"]
            tool_ok         = any(et in tools_called for et in expected_tools)

            # Score 3: keyword presence in answer
            expected_kws    = case["expected_keywords"]
            answer_lower    = answer.lower()
            kw_hits         = [kw for kw in expected_kws if kw in answer_lower]
            keyword_score   = len(kw_hits) / len(expected_kws) if expected_kws else 1.0

            result = {
                "id":             qid,
                "question":       question,
                "routing_ok":     routing_ok,
                "tool_ok":        tool_ok,
                "keyword_score":  round(keyword_score, 2),
                "latency_ms":     latency,
                "agent_used":     agent_used,
                "tools_called":   tools_called,
                "answer_snippet": answer[:120],
            }

        except Exception as e:
            result = {
                "id": qid, "question": question,
                "routing_ok": False, "tool_ok": False,
                "keyword_score": 0, "latency_ms": 0,
                "error": str(e)[:200],
            }

        results.append(result)
        status = "PASS" if result.get("routing_ok") and result.get("tool_ok") else "FAIL"
        print(f"         → {status} | kw={result['keyword_score']} | {result.get('latency_ms')}ms")

    # Summary
    n             = len(results)
    routing_acc   = sum(1 for r in results if r.get("routing_ok")) / n
    tool_acc      = sum(1 for r in results if r.get("tool_ok")) / n
    avg_kw        = sum(r.get("keyword_score", 0) for r in results) / n
    avg_latency   = sum(r.get("latency_ms", 0) for r in results) / n

    summary = {
        "total":           n,
        "routing_accuracy": round(routing_acc, 3),
        "tool_accuracy":    round(tool_acc, 3),
        "avg_keyword_score": round(avg_kw, 3),
        "avg_latency_ms":  round(avg_latency),
        "results":         results,
    }

    print("\n── Summary ────────────────────────────────")
    print(f"  Questions:        {n}")
    print(f"  Routing accuracy: {routing_acc:.0%}")
    print(f"  Tool accuracy:    {tool_acc:.0%}")
    print(f"  Avg keyword score:{avg_kw:.0%}")
    print(f"  Avg latency:      {avg_latency:.0f}ms")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRISM benchmark runner")
    parser.add_argument("--session_id",  default="demo")
    parser.add_argument("--question_id", default=None)
    parser.add_argument("--output",      default=None, help="Save JSON results to file")
    args = parser.parse_args()

    print(f"\nPRISM Benchmark — session={args.session_id}\n")
    summary = run_benchmark(args.session_id, args.question_id)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"\nSaved to {args.output}")
