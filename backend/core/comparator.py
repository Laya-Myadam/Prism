import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"


def compare_documents(vectorstore_a, vectorstore_b, topic: str) -> dict:
    """
    Compares two documents on a given topic.
    Retrieves relevant chunks from each vectorstore and asks
    LLaMA3 to compare them clearly and simply.
    Returns a dict with doc_a, doc_b, and comparison summary.
    """
    # Retrieve from both docs using MMR
    retriever_a = vectorstore_a.as_retriever(
        search_type="mmr", search_kwargs={"k": 5, "fetch_k": 15}
    )
    retriever_b = vectorstore_b.as_retriever(
        search_type="mmr", search_kwargs={"k": 5, "fetch_k": 15}
    )

    docs_a = retriever_a.invoke(topic)
    docs_b = retriever_b.invoke(topic)

    context_a = "\n\n".join([d.page_content for d in docs_a])
    context_b = "\n\n".join([d.page_content for d in docs_b])

    system = """You are a document comparison expert.
- Compare the two documents clearly and simply.
- Use plain English — no jargon.
- Be specific about differences and similarities.
- Structure your answer with: Document A says... Document B says... Key Difference...
- If info is missing from a document, say "Not mentioned in Document [A/B]."
- Never make up information."""

    user = f"""Compare these two documents on the topic: "{topic}"

Document A content:
{context_a}

Document B content:
{context_b}

Give a clear, simple comparison:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=600,
        temperature=0.2,
    )

    full_comparison = response.choices[0].message.content.strip()

    # Also get individual summaries
    def summarize(context, label):
        r = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "Summarize what this document says about the topic in 2-3 simple sentences. Only use info from the context."},
                {"role": "user", "content": f"Topic: {topic}\n\nContext:\n{context}"},
            ],
            max_tokens=150,
            temperature=0.1,
        )
        return r.choices[0].message.content.strip()

    return {
        "doc_a_summary": summarize(context_a, "A"),
        "doc_b_summary": summarize(context_b, "B"),
        "comparison": full_comparison,
    }