import os
from groq import Groq
from core.project_store import get_source_citations

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"  # same model as qa_engine.py


# ── Few-shot examples — teaches the model exact RFI response format ───────────
FEW_SHOT_RFI = [
    {
        "rfi_number": "RFI-001",
        "subject": "Concrete compressive strength at foundation",
        "question": "The drawings show f'c = 4000 psi but the spec section 03 30 00 says f'c = 3000 psi. Which governs?",
        "drawing_ref": "S-101",
        "spec_ref": "03 30 00",
        "context": "Section 03 30 00 states: Concrete for all foundation elements shall achieve minimum compressive strength of 3000 psi at 28 days. Drawing S-101 note 3 states: All footing concrete f'c = 4000 psi.",
        "response": """RFI RESPONSE — RFI-001
Subject: Concrete compressive strength at foundation

Answer:
The drawing requirement governs. Drawing S-101 note 3 specifies f'c = 4000 psi for all footing concrete, which is more stringent than the 3000 psi stated in Spec Section 03 30 00. Per standard construction contract hierarchy, the more stringent requirement applies. Contractor shall use 4000 psi concrete for all foundation elements.

Document References:
- Drawing S-101, Note 3 — specifies f'c = 4000 psi for footings
- Spec Section 03 30 00 — specifies f'c = 3000 psi (less stringent, does not govern)

Confidence: High"""
    },
    {
        "rfi_number": "RFI-002",
        "subject": "Waterproofing membrane at below-grade walls",
        "question": "Spec calls for waterproofing but does not specify the membrane thickness. What thickness is required?",
        "drawing_ref": "A-201",
        "spec_ref": "07 13 00",
        "context": "Spec Section 07 13 00: Apply waterproofing membrane to all below-grade exterior walls. Product shall be cold-applied, self-adhering rubberized asphalt. Drawing A-201 shows waterproofing symbol at all basement walls. No thickness noted on drawings.",
        "response": """RFI RESPONSE — RFI-002
Subject: Waterproofing membrane at below-grade walls

Answer:
The specification and drawings do not explicitly state a membrane thickness. Based on the specified product type — cold-applied self-adhering rubberized asphalt per Spec Section 07 13 00 — industry standard is 40 mil minimum dry film thickness. Contractor should request written confirmation from the architect before proceeding to avoid a potential change order.

Document References:
- Spec Section 07 13 00 — defines membrane type, silent on thickness
- Drawing A-201 — confirms waterproofing location, no thickness noted

Confidence: Medium"""
    },
]


# ── Build the RFI prompt ───────────────────────────────────────────────────────
def _build_rfi_prompt(rfi: dict, context: str, citations: list[str]) -> str:
    """
    Builds a few-shot prompt that forces the LLM to respond
    in official RFI response format with document citations.
    """
    examples_text = ""
    for ex in FEW_SHOT_RFI:
        examples_text += f"""--- EXAMPLE ---
RFI Number: {ex['rfi_number']}
Subject: {ex['subject']}
Question: {ex['question']}
Drawing Reference: {ex['drawing_ref']}
Spec Section: {ex['spec_ref']}
Document Context: {ex['context']}

Response:
{ex['response']}

"""

    citations_text = "\n".join(f"- {c}" for c in citations) if citations else "- Source document (page unknown)"

    return f"""You are a senior construction document specialist writing official RFI responses.
Here are two examples of the exact format and tone required:

{examples_text}--- NOW RESPOND TO THIS RFI ---
RFI Number: {rfi['rfi_number']}
Subject: {rfi['subject']}
Question: {rfi['question']}
Drawing Reference: {rfi.get('drawing_ref', 'Not specified')}
Spec Section: {rfi.get('spec_ref', 'Not specified')}

Document Context (retrieved from project documents):
{context}

Source documents where this context was found:
{citations_text}

Write the official RFI response in the exact same format as the examples above.
- Answer ONLY from the document context provided
- Always list the exact source documents under "Document References"
- End with Confidence: High, Medium, or Low
- If the answer is not found, say so clearly and recommend the contractor seek written clarification"""


# ── Main function called from app.py ─────────────────────────────────────────
def answer_rfi(project_vectorstore, rfi: dict) -> dict:
    """
    Takes the combined project FAISS vectorstore and a structured RFI dict.
    Returns a dict with the formatted response and metadata.

    RFI dict format:
    {
        "rfi_number": "RFI-003",
        "subject": "Rebar spacing at shear walls",
        "question": "Drawing shows #5 @ 12\" but spec says #4 @ 6\". Which governs?",
        "drawing_ref": "S-201",       # optional
        "spec_ref": "03 20 00",       # optional
    }

    Returns:
    {
        "rfi_number": "RFI-003",
        "subject": "...",
        "response": "RFI RESPONSE — ...",    # full formatted response
        "citations": ["specs.pdf — page 4", "drawings.pdf — page 12"],
        "confidence": "High" / "Medium" / "Low"
    }
    """

    # Build a rich search query combining subject + question + refs
    search_query = f"{rfi['subject']} {rfi['question']}"
    if rfi.get('drawing_ref'):
        search_query += f" drawing {rfi['drawing_ref']}"
    if rfi.get('spec_ref'):
        search_query += f" specification section {rfi['spec_ref']}"

    # MMR retrieval — same settings as qa_engine.py
    retriever = project_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20}
    )
    docs = retriever.invoke(search_query)
    context = "\n\n".join([d.page_content for d in docs])

    # Get source citations from chunk metadata
    citations = get_source_citations(docs)

    # Confidence score
    similarity_docs = project_vectorstore.similarity_search_with_score(search_query, k=1)
    if similarity_docs:
        score = similarity_docs[0][1]
        confidence = "High" if score < 0.5 else "Medium" if score < 1.0 else "Low"
    else:
        confidence = "Low"

    # Build prompt and call LLM
    prompt = _build_rfi_prompt(rfi, context, citations)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior construction document specialist. "
                    "Write official RFI responses that are clear, precise, and always cite source documents. "
                    "Never fabricate information. If the answer is not in the documents, say so directly."
                )
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=600,
        temperature=0.1,   # very low — RFI responses need consistency, not creativity
    )

    formatted_response = response.choices[0].message.content.strip()

    return {
        "rfi_number": rfi["rfi_number"],
        "subject": rfi["subject"],
        "response": formatted_response,
        "citations": citations,
        "confidence": confidence,
    }