import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

_conversation_memory = []
MAX_MEMORY = 5


def reset_memory():
    global _conversation_memory
    _conversation_memory = []


# ── Few-shot examples for Q&A ─────────────────────────────────────────────────
# These examples teach the model the exact conversational tone we want.
# Short, clear, friendly, specific — never vague, never too long.

FEW_SHOT_QA = [
    {
        "question": "What happens if the contractor misses the deadline?",
        "context": "The contractor shall pay liquidated damages of $1,000 per day for each day of delay beyond the completion date of December 31, 2024.",
        "answer": "If the contractor finishes late, they have to pay $1,000 for every day they go over the December 31, 2024 deadline. This money comes straight out of their final payment."
    },
    {
        "question": "Who is responsible for insurance?",
        "context": "The contractor shall maintain general liability insurance of not less than $2,000,000 per occurrence throughout the duration of the project.",
        "answer": "The contractor is responsible for getting insurance. They must have at least $2 million in general liability coverage and keep it active for the entire project."
    },
    {
        "question": "Can the client cancel the contract?",
        "context": "The owner may terminate this agreement for convenience upon 14 days written notice. In such event, the contractor shall be entitled to payment for all work completed to date.",
        "answer": "Yes, the client can cancel anytime by giving 14 days written notice. If they do, the contractor gets paid for all the work they've already done — they don't lose that money."
    },
]


def _build_few_shot_qa_prompt(question: str, context: str, memory_text: str) -> str:
    """
    Builds a few-shot prompt for Q&A with:
    - 3 examples of ideal question → answer style
    - Conversation memory for follow-up questions
    - The actual document context and question
    """
    examples_text = ""
    for i, ex in enumerate(FEW_SHOT_QA, 1):
        examples_text += f"""Example {i}:
Context: {ex['context']}
Question: {ex['question']}
Answer: {ex['answer']}

"""

    memory_section = ""
    if memory_text.strip():
        memory_section = f"""Previous conversation (for follow-up context):
{memory_text}
"""

    return f"""Here are examples of exactly how I want you to answer — plain, clear, friendly, 2-3 sentences:

{examples_text}Now answer the user's question using ONLY the document context below.
Same style as the examples. If not found, say: "I couldn't find that in the document."

{memory_section}Document context:
{context}

Question: {question}
Answer:"""


def ask_question(vectorstore, question: str, chat_history: list) -> str:
    global _conversation_memory

    # MMR retrieval — reduces redundant chunks
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20}
    )
    docs = retriever.invoke(question)
    context = "\n\n".join([d.page_content for d in docs])

    # Confidence score based on vector similarity
    similarity_docs = vectorstore.similarity_search_with_score(question, k=1)
    if similarity_docs:
        score = similarity_docs[0][1]
        confidence = "High" if score < 0.5 else "Medium" if score < 1.0 else "Low"
    else:
        confidence = "Low"

    system = """You are a friendly document assistant.
- Answer ONLY from the document context provided.
- Match the tone and length of the examples exactly — plain English, 2-3 sentences.
- Never make up information.
- At the very end, on a new line, write exactly: Confidence: High, Confidence: Medium, or Confidence: Low."""

    # Build memory context
    memory_text = ""
    for exchange in _conversation_memory[-MAX_MEMORY:]:
        memory_text += f"User: {exchange['question']}\nAssistant: {exchange['answer']}\n\n"

    user = _build_few_shot_qa_prompt(question, context, memory_text)
    user += f"\n\nConfidence: {confidence}"

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=400,
        temperature=0.15,
    )

    answer = response.choices[0].message.content.strip()

    # Store in memory
    _conversation_memory.append({"question": question, "answer": answer})
    if len(_conversation_memory) > MAX_MEMORY:
        _conversation_memory.pop(0)

    return answer