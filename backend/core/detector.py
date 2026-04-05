import os
import pdfplumber
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

def detect_domain(pdf_path: str) -> str:
    """
    Uses LLaMA3 via Groq to classify the document domain.
    Sends first 1000 chars to the LLM — no hardcoded keywords.
    """
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[:3]:
            t = page.extract_text()
            if t:
                text += t
            if len(text) >= 1000:
                break

    sample = text[:1000].strip()
    if not sample:
        return "General"

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a document classifier. Reply with exactly ONE word from the list provided. No explanation, no punctuation, just the word."
            },
            {
                "role": "user",
                "content": f"""What domain is this document from?
Choose exactly one: Financial, Construction, Real Estate, Investment, Legal, General

Document sample:
{sample}

Reply with one word only:"""
            }
        ],
        max_tokens=5,
        temperature=0,
    )

    result = response.choices[0].message.content.strip()
    valid = ["Financial", "Construction", "Real Estate", "Investment", "Legal", "General"]
    for v in valid:
        if v.lower() in result.lower():
            return v
    return "General"