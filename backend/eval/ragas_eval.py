"""
RAGAS evaluation for the PRISM RAG pipeline.

Metrics:
  - faithfulness:      Is the answer faithful to the retrieved context?
  - answer_relevancy:  Is the answer relevant to the question?
  - context_precision: Are retrieved chunks actually relevant to the question?
  - context_recall:    Did we retrieve all information needed to answer?

Requirements:
  pip install ragas datasets
  GROQ_API_KEY must be set (used as the judge LLM via LangChain)

Usage:
  cd backend
  python -m eval.ragas_eval --session_id demo --doc_name contract.pdf
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

RAG_TEST_QUESTIONS = [
    "What are the liquidated damages per day?",
    "How long does the contractor have to submit a weather delay notice?",
    "What form must be used for change orders?",
    "What is the approval timeline for change orders?",
    "What constitutes a compensable delay event?",
]


def build_eval_dataset(session_id: str, questions: list[str]) -> list[dict]:
    """Run each question through the RAG retriever and collect inputs for RAGAS."""
    from agents.rag.retriever import retrieve, format_context
    from agents.orchestrator import run_agent

    samples = []
    for q in questions:
        print(f"  Retrieving: {q[:60]}...")
        chunks   = retrieve(session_id, q, top_k=5)
        contexts = [c["content"] for c in chunks]
        response = run_agent(session_id, q)
        answer   = response.get("answer", "")
        samples.append({
            "question":  q,
            "answer":    answer,
            "contexts":  contexts,
            # ground_truth is optional — add manually for higher-quality eval
        })
    return samples


def run_ragas(session_id: str, questions: list[str] | None = None) -> dict:
    """Run RAGAS evaluation and return metric scores."""
    try:
        from ragas import evaluate
        from ragas.metrics import (
            faithfulness,
            answer_relevancy,
            context_precision,
        )
        from datasets import Dataset
    except ImportError:
        print("ERROR: Install ragas and datasets: pip install ragas datasets")
        return {}

    # Use LangChain Groq as the judge LLM
    try:
        from langchain_groq import ChatGroq
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.0,
        )
    except Exception as e:
        print(f"ERROR: Could not init judge LLM: {e}")
        return {}

    qs = questions or RAG_TEST_QUESTIONS
    print(f"\nBuilding eval dataset ({len(qs)} questions)...")
    samples = build_eval_dataset(session_id, qs)

    if not any(s["contexts"] for s in samples):
        print("WARNING: No document chunks found. Run /rag/ingest first to populate the vector store.")
        return {}

    dataset = Dataset.from_list(samples)

    print("\nRunning RAGAS evaluation...")
    try:
        result = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision],
            llm=llm,
        )
        scores = {
            "faithfulness":       round(float(result["faithfulness"]), 3),
            "answer_relevancy":   round(float(result["answer_relevancy"]), 3),
            "context_precision":  round(float(result["context_precision"]), 3),
        }
        print("\n── RAGAS Scores ──────────────────────────")
        for k, v in scores.items():
            bar = "█" * int(v * 20)
            print(f"  {k:<22} {v:.3f}  {bar}")
        return scores

    except Exception as e:
        print(f"ERROR during RAGAS evaluation: {e}")
        return {}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PRISM RAGAS evaluation")
    parser.add_argument("--session_id", default="demo")
    args = parser.parse_args()

    print(f"\nPRISM RAGAS Eval — session={args.session_id}")
    run_ragas(args.session_id)
