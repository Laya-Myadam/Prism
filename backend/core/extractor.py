import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

# ── Fallback fixed sections per domain ────────────────────────────────────────
FALLBACK_PROMPTS = {
    "Financial": {
        "Payment & Fee Terms": "What are the payment amounts, schedules, fees, or interest rates mentioned?",
        "Default & Penalties": "What happens if someone fails to pay or breaches the agreement?",
        "Key Covenants": "What are the main rules or obligations both parties must follow?",
        "Termination Conditions": "Under what conditions can this agreement be ended?",
    },
    "Construction": {
        "Scope of Work": "What work or tasks are described in this document?",
        "Project Timeline & Milestones": "What are the deadlines, milestones, or completion dates?",
        "Penalty & Delay Clauses": "What happens if work is delayed or not done properly?",
        "Materials & Specifications": "What materials, standards, or technical specs are mentioned?",
    },
    "Real Estate": {
        "Property Details": "What property is described — address, size, type?",
        "Price & Payment Terms": "What is the price, deposit, and how payments are structured?",
        "Lease / Tenancy Terms": "What are the rental period, rent amount, and renewal conditions?",
        "Restrictions & Obligations": "What are the buyer/seller/tenant obligations or property restrictions?",
    },
    "Investment": {
        "Investment Terms": "What are the investment amount, equity stake, or fund terms?",
        "Returns & Projections": "What financial returns, IRR, or profit projections are mentioned?",
        "Risk Factors": "What risks are mentioned in this document?",
        "Exit Strategy": "What are the exit options or conditions for investors?",
    },
    "Legal": {
        "Parties Involved": "Who are the parties to this agreement and what are their roles?",
        "Key Obligations": "What must each party do under this agreement?",
        "Indemnification": "Who is responsible if something goes wrong or causes loss?",
        "Governing Law & Disputes": "Which laws govern this document and how are disputes resolved?",
    },
    "General": {
        "Main Purpose": "What is the main purpose of this document?",
        "Key Parties": "Who is involved in this document and what are their roles?",
        "Important Terms": "What are the most important terms or conditions?",
        "Dates & Deadlines": "What important dates or deadlines are mentioned?",
    },
}

# ── Few-shot examples ─────────────────────────────────────────────────────────
FEW_SHOT_EXAMPLES = {
    "Financial": [
        {
            "question": "What are the payment amounts, schedules, fees, or interest rates mentioned?",
            "answer": "The borrower must pay back $200,000 over 5 years. Payments are due on the 1st of every month, starting January 2025. The annual interest rate is 6.5%. There is also a $500 processing fee charged upfront."
        },
        {
            "question": "What happens if someone fails to pay or breaches the agreement?",
            "answer": "If a payment is missed, the lender can charge a 2% late fee on the amount owed. If payments are missed for 3 months in a row, the lender has the right to demand the full remaining balance immediately."
        },
    ],
    "Construction": [
        {
            "question": "What work or tasks are described in this document?",
            "answer": "The contractor is responsible for building a 3-story residential building at 45 Oak Street. This includes foundation work, framing, electrical wiring, plumbing, and interior finishing."
        },
        {
            "question": "What happens if work is delayed or not done properly?",
            "answer": "If the project is not completed by the agreed date, the contractor must pay $1,000 for every day they go over the deadline. If the work quality does not meet the specified standards, the client can hire another contractor to fix it and send the bill to the original contractor."
        },
    ],
    "Real Estate": [
        {
            "question": "What property is described — address, size, type?",
            "answer": "The property is a 3-bedroom apartment located at 12 Maple Avenue, Austin, Texas. It covers 1,450 square feet and is on the 4th floor of a residential building."
        },
        {
            "question": "What are the rental period, rent amount, and renewal conditions?",
            "answer": "The lease runs for 12 months starting March 1, 2025. Monthly rent is $2,200, due on the 1st of each month. If the tenant wants to renew, they must give 60 days notice before the lease ends."
        },
    ],
    "Investment": [
        {
            "question": "What are the investment amount, equity stake, or fund terms?",
            "answer": "The investor is putting in $500,000 in exchange for a 15% equity stake in the company. The investment is structured as a convertible note with a 2-year maturity date."
        },
        {
            "question": "What risks are mentioned in this document?",
            "answer": "The document lists three main risks. First, the market may not grow as expected. Second, the company is early-stage and may run out of cash. Third, regulatory changes could affect the business model."
        },
    ],
    "Legal": [
        {
            "question": "Who are the parties to this agreement and what are their roles?",
            "answer": "There are two parties. ABC Corp provides the software service. XYZ Ltd is the client paying to use the service. ABC Corp keeps the software running, while XYZ Ltd pays on time and uses it properly."
        },
        {
            "question": "Who is responsible if something goes wrong or causes loss?",
            "answer": "If ABC Corp's software causes data loss or financial damage, ABC Corp is responsible but only up to the total amount the client paid in the last 12 months."
        },
    ],
    "General": [
        {
            "question": "What is the main purpose of this document?",
            "answer": "This document is a research paper analyzing how governments should decide between spending money on prisons versus hiring more police officers. It uses economic tools like marginal cost and benefit analysis to compare the two options."
        },
        {
            "question": "What important dates or deadlines are mentioned?",
            "answer": "The paper was submitted on March 21, 2026 for the BUS720 course at Belhaven University. No other specific deadlines or dates are mentioned in the document."
        },
    ],
}


def _discover_sections(vectorstore, domain: str) -> dict:
    """
    Step 1 — Ask LLaMA to read the document and discover what topics
    actually exist in it. Returns a dict of {section_title: question}.
    Falls back to fixed sections if document is too short or vague.
    """
    # Pull a broad sample from the document
    docs = vectorstore.similarity_search("main topics key information summary", k=6)
    sample_text = "\n\n".join([d.page_content for d in docs])[:3000]

    if len(sample_text.strip()) < 200:
        # Document too short — use fallback
        return FALLBACK_PROMPTS.get(domain, FALLBACK_PROMPTS["General"])

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """You are a document analyst. Your job is to identify what topics and sections actually exist in a document.
Return ONLY a JSON object where:
- Keys are short section titles (3-6 words max)
- Values are specific questions to extract that information

Rules:
- Only include sections that actually have content in the document
- Maximum 6 sections
- Be specific to what's actually in this document, not generic
- No markdown, no explanation, just the JSON object"""
            },
            {
                "role": "user",
                "content": f"""This is a {domain} document. Read this sample and identify what sections/topics actually exist in it.

Document sample:
{sample_text}

Return a JSON object like this example:
{{
  "Scope of Work": "What specific work tasks and responsibilities are described?",
  "Site Inspection Issues": "What inspection problems or deficiencies were identified?",
  "Safety Requirements": "What safety rules or requirements are mentioned?"
}}

Only include sections that actually have content. JSON only:"""
            }
        ],
        max_tokens=400,
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    # Parse the JSON response
    import json
    import re
    try:
        # Extract JSON if wrapped in markdown
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            sections = json.loads(json_match.group())
            if isinstance(sections, dict) and len(sections) >= 2:
                return sections
    except Exception:
        pass

    # Fallback if JSON parsing fails
    return FALLBACK_PROMPTS.get(domain, FALLBACK_PROMPTS["General"])


def _build_few_shot_prompt(domain: str, question: str, context: str) -> str:
    """Builds a few-shot prompt using domain examples."""
    examples = FEW_SHOT_EXAMPLES.get(domain, FEW_SHOT_EXAMPLES["General"])
    examples_text = ""
    for i, ex in enumerate(examples, 1):
        examples_text += f"""Example {i}:
Question: {ex['question']}
Answer: {ex['answer']}

"""
    return f"""Here are examples of the exact style and length of answer I want:

{examples_text}Now answer this question using ONLY the document context below.
Same style — plain English, 2-4 sentences, specific facts only.
If the information is not in the context, say: "Not mentioned in this document."

Document context:
{context}

Question: {question}
Answer:"""


def extract_key_info(vectorstore, domain: str) -> dict:
    """
    Main extraction function.
    Step 1: Dynamically discover what sections actually exist in the document.
    Step 2: Extract each section using few-shot prompting.
    Falls back to fixed sections if document is too short.
    """
    # Step 1 — Discover real sections from the document
    sections = _discover_sections(vectorstore, domain)

    system = """You are a helpful document analyst.
- Answer ONLY from the document context provided.
- Match the style and length of the examples exactly.
- Never make up or assume information not in the context."""

    results = {}

    # Step 2 — Extract each discovered section
    for section_title, question in sections.items():
        docs = vectorstore.similarity_search(question, k=4)
        context = "\n\n".join([d.page_content for d in docs])
        user = _build_few_shot_prompt(domain, question, context)

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=300,
            temperature=0.1,
        )
        answer = response.choices[0].message.content.strip()

        # Only include sections that have real content
        if answer and "not mentioned" not in answer.lower():
            results[section_title] = answer
        elif answer:
            results[section_title] = answer

    return results