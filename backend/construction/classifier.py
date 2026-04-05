import os
import pdfplumber
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

# ── Document types ConstructIQ understands ────────────────────────────────────
DOCUMENT_TYPES = [
    "Contract",
    "Drawings",
    "Specifications",
    "Daily Reports",
    "RFIs",
    "Change Orders",
    "Submittals",
    "Inspection Reports",
    "Meeting Minutes",
    "Schedule",
    "General",
]

# ── Icons for UI display ──────────────────────────────────────────────────────
DOC_TYPE_ICONS = {
    "Contract":           "📜",
    "Drawings":           "📐",
    "Specifications":     "📋",
    "Daily Reports":      "📅",
    "RFIs":               "❓",
    "Change Orders":      "🔄",
    "Submittals":         "📦",
    "Inspection Reports": "🔍",
    "Meeting Minutes":    "🗒️",
    "Schedule":           "🗓️",
    "General":            "📄",
}

# ── Few-shot examples — teaches model exact classification behavior ─────────────
FEW_SHOT_CLASSIFY = [
    {
        "sample": "This Agreement is entered into between Owner ABC Corp and General Contractor XYZ Builders. Contract Sum: $4,500,000. Substantial Completion Date: December 31, 2025. Liquidated damages shall apply at $2,000 per day.",
        "classification": "Contract"
    },
    {
        "sample": "SHEET S-101 FOUNDATION PLAN. Scale 1:50. All footings to be 24 inches wide. See structural notes. Rebar schedule per S-201. Refer to spec section 03 30 00 for concrete requirements.",
        "classification": "Drawings"
    },
    {
        "sample": "SECTION 03 30 00 — CAST-IN-PLACE CONCRETE. 1.1 SUMMARY: This section includes concrete for foundations, slabs, and walls. 1.2 REFERENCES: ACI 301, ACI 318. 2.1 MATERIALS: Cement shall conform to ASTM C150.",
        "classification": "Specifications"
    },
    {
        "sample": "Daily Construction Report — Date: March 15 2025. Weather: Partly cloudy 68F. Crew on site: 24 workers. Work completed today: Formed and poured column footings at grid lines A1 through A4. Delays: None.",
        "classification": "Daily Reports"
    },
    {
        "sample": "REQUEST FOR INFORMATION. RFI No: 047. Subject: Waterproofing membrane thickness. Question: The specification section 07 13 00 does not specify membrane thickness. Please clarify required thickness at below-grade walls.",
        "classification": "RFIs"
    },
    {
        "sample": "CHANGE ORDER NO. 12. Project: Riverside Office Building. Description: Add emergency generator pad and conduit as directed by Owner. Additional Cost: $34,500. Additional Time: 5 days.",
        "classification": "Change Orders"
    },
    {
        "sample": "SUBMITTAL TRANSMITTAL. Spec Section: 03 30 00. Item: Concrete Mix Design. Submitted by: ABC Contractors. Status: Submitted for Approval. Attached: Ready-mix supplier mix design report #2024-441.",
        "classification": "Submittals"
    },
    {
        "sample": "SITE INSPECTION REPORT. Inspector: John Davis, PE. Date: April 2 2025. Items observed: Rebar placement at grade beam does not match drawing S-102. Cover insufficient at north wall. Corrective action required before pour.",
        "classification": "Inspection Reports"
    },
    {
        "sample": "OAC MEETING MINUTES. Project: Harbor View Condominiums. Date: February 10 2025. Attendees: Owner rep, Architect, GC superintendent. Items discussed: Schedule recovery plan, RFI backlog, upcoming inspections.",
        "classification": "Meeting Minutes"
    },
    {
        "sample": "PROJECT SCHEDULE — Baseline. Activity: Foundation Work. Start: Jan 15 2025. Finish: Feb 28 2025. Duration: 44 days. Critical Path: Yes. Predecessor: Site Mobilization. Resource: Structural crew.",
        "classification": "Schedule"
    },
]


# ── Extract first ~1500 chars from PDF for classification ─────────────────────
def _extract_sample(pdf_path: str, max_chars: int = 1500) -> str:
    """Reads first few pages and returns a text sample for classification."""
    sample = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages[:3]:  # first 3 pages is enough to classify
                text = page.extract_text()
                if text:
                    sample += text + "\n"
                if len(sample) >= max_chars:
                    break
    except Exception:
        return ""
    return sample[:max_chars]


# ── Build classification prompt ───────────────────────────────────────────────
def _build_classify_prompt(sample: str) -> str:
    examples_text = ""
    for ex in FEW_SHOT_CLASSIFY:
        examples_text += f"""Document sample: "{ex['sample']}"
Classification: {ex['classification']}

"""

    types_list = ", ".join(DOCUMENT_TYPES)

    return f"""You are a construction document specialist. Classify documents into exactly one of these types:
{types_list}

Here are examples of correct classifications:

{examples_text}Now classify this document. Reply with ONE word only — the exact type name from the list above.

Document sample:
\"\"\"{sample}\"\"\"

Classification:"""


# ── Main classification function ──────────────────────────────────────────────
def classify_document(pdf_path: str, filename: str) -> dict:
    """
    Classifies a single PDF into one of the DOCUMENT_TYPES.

    Returns:
    {
        "filename": "structural_specs.pdf",
        "path": "/data/uploads/structural_specs.pdf",
        "doc_type": "Specifications",
        "icon": "📋",
        "confidence": "high" / "low"   ← low if sample was too short
    }
    """
    sample = _extract_sample(pdf_path)

    # If we couldn't extract text (scanned PDF etc), default to General
    if not sample.strip():
        return {
            "filename": filename,
            "path": pdf_path,
            "doc_type": "General",
            "icon": DOC_TYPE_ICONS["General"],
            "confidence": "low"
        }

    prompt = _build_classify_prompt(sample)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a construction document classifier. "
                        "Reply with ONE word only — the document type. "
                        "Never explain. Never add punctuation. Just the type name."
                    )
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=10,       # one word only
            temperature=0.0,     # zero creativity — pure classification
        )

        raw = response.choices[0].message.content.strip()

        # Clean up — match to known types
        doc_type = "General"
        for known_type in DOCUMENT_TYPES:
            if known_type.lower() in raw.lower():
                doc_type = known_type
                break

        return {
            "filename": filename,
            "path": pdf_path,
            "doc_type": doc_type,
            "icon": DOC_TYPE_ICONS.get(doc_type, "📄"),
            "confidence": "high"
        }

    except Exception:
        return {
            "filename": filename,
            "path": pdf_path,
            "doc_type": "General",
            "icon": DOC_TYPE_ICONS["General"],
            "confidence": "low"
        }


# ── Classify multiple documents at once ──────────────────────────────────────
def classify_all_documents(path_dicts: list[dict]) -> list[dict]:
    """
    Takes a list of {"path": ..., "filename": ...} dicts
    and returns a list of classification results.

    Usage in app.py:
        path_dicts = save_project_files(uploaded_files)
        classified = classify_all_documents(path_dicts)
    """
    results = []
    for doc in path_dicts:
        result = classify_document(doc["path"], doc["filename"])
        results.append(result)
    return results


# ── Group classified docs by type ────────────────────────────────────────────
def group_by_type(classified_docs: list[dict]) -> dict:
    """
    Groups classified documents by their doc_type.
    Useful for dashboard_engine to know which docs are contracts, which are drawings etc.

    Returns:
    {
        "Contract": [{"filename": "contract.pdf", "path": ..., ...}],
        "Specifications": [{"filename": "specs.pdf", ...}],
        ...
    }
    """
    groups = {doc_type: [] for doc_type in DOCUMENT_TYPES}
    for doc in classified_docs:
        doc_type = doc.get("doc_type", "General")
        groups[doc_type].append(doc)
    # Remove empty groups
    return {k: v for k, v in groups.items() if v}