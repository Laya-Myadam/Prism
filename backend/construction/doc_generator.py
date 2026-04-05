import os
from datetime import date
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

TODAY = date.today().strftime("%B %d, %Y")

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT TYPE 1 — RFI RESPONSE
# ─────────────────────────────────────────────────────────────────────────────

RFI_RESPONSE_PROMPT = """You are a senior construction document specialist writing an official RFI response.

Project context:
{project_context}

RFI Details:
- RFI Number: {rfi_number}
- Subject: {subject}
- Question: {question}
- Drawing Reference: {drawing_ref}
- Spec Section: {spec_ref}
- Submitted By: {submitted_by}
- Date: {date}

Retrieved document context:
{doc_context}

Write a complete, professional RFI response in this exact format:

================================================================
RFI RESPONSE
================================================================
Project:        {project_name}
RFI Number:     {rfi_number}
Subject:        {subject}
Date:           {date}
Submitted By:   {submitted_by}
Responded By:   [Architect/Engineer of Record]
================================================================

RESPONSE:
[2-4 sentences. Direct, factual answer. Reference specific drawing numbers,
spec sections, or page numbers where applicable. If conflicting requirements
exist, state which governs and why. If the answer is not found in documents,
say so clearly and recommend a course of action.]

DOCUMENT REFERENCES:
[List each document and specific location that supports this response]

ATTACHMENTS: None / [List if any]

================================================================
Signature: _______________________     Date: {date}
================================================================

Use ONLY information from the retrieved document context above.
Never fabricate. If not found, say: "This information is not addressed in the
current contract documents. Contractor should seek written clarification."
"""


def generate_rfi_response(project_vectorstore, project_facts: dict, rfi_data: dict) -> str:
    """
    Generates a complete formatted RFI response document.

    rfi_data keys: rfi_number, subject, question, drawing_ref, spec_ref, submitted_by
    """
    from core.project_store import get_source_citations

    search_query = f"{rfi_data['subject']} {rfi_data['question']} {rfi_data.get('drawing_ref','')} {rfi_data.get('spec_ref','')}"
    retriever = project_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20}
    )
    docs = retriever.invoke(search_query)
    doc_context = "\n\n".join([d.page_content for d in docs])
    citations = get_source_citations(docs)
    citations_text = "\n".join(f"- {c}" for c in citations)

    project_context = f"""
Project Name: {project_facts.get('project_name') or 'Not specified'}
Owner: {project_facts.get('owner') or 'Not specified'}
General Contractor: {project_facts.get('general_contractor') or 'Not specified'}
Architect: {project_facts.get('architect') or 'Not specified'}
"""

    prompt = RFI_RESPONSE_PROMPT.format(
        project_context=project_context,
        rfi_number=rfi_data.get("rfi_number", "RFI-001"),
        subject=rfi_data.get("subject", ""),
        question=rfi_data.get("question", ""),
        drawing_ref=rfi_data.get("drawing_ref", "Not specified"),
        spec_ref=rfi_data.get("spec_ref", "Not specified"),
        submitted_by=rfi_data.get("submitted_by", "Not specified"),
        date=TODAY,
        doc_context=doc_context + "\n\nSource citations:\n" + citations_text,
        project_name=project_facts.get("project_name") or "Project",
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a construction document specialist. Write formal, precise construction documents. Never fabricate information."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=700,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT TYPE 2 — DELAY NOTICE LETTER
# ─────────────────────────────────────────────────────────────────────────────

DELAY_NOTICE_PROMPT = """You are a construction contracts specialist drafting a formal delay notice letter.

Project context:
{project_context}

Delay details provided:
- Delay Event: {delay_event}
- Date Delay Began: {delay_date}
- Cause of Delay: {delay_cause}
- Impact Description: {delay_impact}
- Days Claimed: {days_claimed}

Retrieved contract/document context:
{doc_context}

Write a complete formal delay notice letter in this exact format:

================================================================
FORMAL NOTICE OF DELAY
================================================================
Date:           {today}
Project:        {project_name}
To:             {owner}
From:           {gc}
Re:             Notice of Delay — {delay_event}
Contract Date:  {contract_date}
================================================================

Dear [Owner Representative],

Pursuant to [reference the relevant contract notice clause if found in documents,
otherwise write "the notice provisions of the Contract"], [GC Name] hereby
provides formal written notice of a delay event affecting the above-referenced project.

DELAY EVENT:
[Describe the delay event clearly and factually in 2-3 sentences]

CAUSE OF DELAY:
[State the cause. Classify as: Owner-caused / Force Majeure / Differing Site Condition
/ Weather / Other. Reference contract documents where applicable.]

IMPACT TO PROJECT SCHEDULE:
[Describe the schedule impact. State number of days claimed.
Reference critical path activities affected.]

CONTRACT ENTITLEMENT:
[Reference the specific contract clause that entitles the contractor to a time
extension and/or additional compensation. If not found in documents, write the
standard industry language.]

RESERVATION OF RIGHTS:
[GC Name] reserves all rights to claim additional time and compensation as
the full impact of this delay becomes known.

Please confirm receipt of this notice and provide written direction within
[number] days per contract requirements.

Respectfully submitted,

_______________________
[General Contractor Representative]
{gc}
Date: {today}

================================================================
cc: Project File, [Architect Name]
================================================================
"""


def generate_delay_notice(project_vectorstore, project_facts: dict, delay_data: dict) -> str:
    """
    Generates a formal delay notice letter.

    delay_data keys: delay_event, delay_date, delay_cause, delay_impact, days_claimed
    """
    search_query = f"delay notice time extension contract clause {delay_data.get('delay_cause', '')}"
    retriever = project_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 15}
    )
    docs = retriever.invoke(search_query)
    doc_context = "\n\n".join([d.page_content for d in docs])

    project_name = project_facts.get("project_name") or "Project"
    owner = project_facts.get("owner") or "[Owner Name]"
    gc = project_facts.get("general_contractor") or "[General Contractor]"
    contract_date = project_facts.get("start_date") or "[Contract Date]"

    prompt = DELAY_NOTICE_PROMPT.format(
        project_context=f"Project: {project_name}, Owner: {owner}, GC: {gc}",
        delay_event=delay_data.get("delay_event", ""),
        delay_date=delay_data.get("delay_date", ""),
        delay_cause=delay_data.get("delay_cause", ""),
        delay_impact=delay_data.get("delay_impact", ""),
        days_claimed=delay_data.get("days_claimed", "TBD"),
        doc_context=doc_context,
        today=TODAY,
        project_name=project_name,
        owner=owner,
        gc=gc,
        contract_date=contract_date,
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a construction contracts specialist. Write formal, legally precise delay notice letters. Reference contract clauses when found."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=800,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT TYPE 3 — CHANGE ORDER ASSESSMENT
# ─────────────────────────────────────────────────────────────────────────────

CHANGE_ORDER_PROMPT = """You are a senior construction cost consultant reviewing a change order request.

Project context:
{project_context}

Change Order Details:
- CO Number: {co_number}
- Description of Work: {co_description}
- Contractor Claimed Cost: {claimed_cost}
- Contractor Claimed Days: {claimed_days}
- Reason Given: {co_reason}

Retrieved contract/document context:
{doc_context}

Write a complete change order assessment in this exact format:

================================================================
CHANGE ORDER ASSESSMENT
================================================================
Project:        {project_name}
CO Number:      {co_number}
Date:           {today}
Description:    {co_description}
Claimed Cost:   {claimed_cost}
Claimed Days:   {claimed_days}
================================================================

1. SCOPE ANALYSIS
[Is this work in scope or out of scope? Reference specific drawing numbers,
spec sections, or contract clauses that support your determination.
State clearly: IN SCOPE / OUT OF SCOPE / PARTIALLY OUT OF SCOPE]

2. COST ASSESSMENT
[Is the claimed cost reasonable? Identify any line items that appear inflated,
missing, or unsupported. State: REASONABLE / QUESTIONABLE / UNSUPPORTED]

3. TIME ASSESSMENT
[Are the claimed days reasonable and supported? Does this work fall on the
critical path? State: REASONABLE / QUESTIONABLE / NOT SUPPORTED]

4. RECOMMENDATION
[APPROVE / APPROVE WITH MODIFICATIONS / REJECT / REQUEST MORE INFORMATION]
[2-3 sentences explaining the recommendation with specific reasons]

5. SUGGESTED RESPONSE
[Draft a 2-sentence response to the contractor]

================================================================
Assessed By: _______________________ Date: {today}
================================================================
"""


def generate_change_order_assessment(project_vectorstore, project_facts: dict, co_data: dict) -> str:
    """
    Generates a change order assessment.

    co_data keys: co_number, co_description, claimed_cost, claimed_days, co_reason
    """
    search_query = f"scope of work {co_data.get('co_description', '')} change order contract"
    retriever = project_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20}
    )
    docs = retriever.invoke(search_query)
    doc_context = "\n\n".join([d.page_content for d in docs])

    project_name = project_facts.get("project_name") or "Project"

    prompt = CHANGE_ORDER_PROMPT.format(
        project_context=f"Project: {project_name}, Contract Value: {project_facts.get('project_value') or 'Not specified'}",
        co_number=co_data.get("co_number", "CO-001"),
        co_description=co_data.get("co_description", ""),
        claimed_cost=co_data.get("claimed_cost", "Not specified"),
        claimed_days=co_data.get("claimed_days", "Not specified"),
        co_reason=co_data.get("co_reason", "Not specified"),
        doc_context=doc_context,
        project_name=project_name,
        today=TODAY,
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a construction cost consultant. Write objective, factual change order assessments. Always reference source documents."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=700,
        temperature=0.1,
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT TYPE 4 — WEEKLY PROGRESS SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

WEEKLY_SUMMARY_PROMPT = """You are a construction project manager writing a weekly progress report.

Project context:
{project_context}

Week ending: {week_ending}

Retrieved daily reports and project documents:
{doc_context}

Write a complete weekly progress summary in this exact format:

================================================================
WEEKLY PROGRESS REPORT
================================================================
Project:        {project_name}
Week Ending:    {week_ending}
Prepared By:    Project Manager
================================================================

WORK COMPLETED THIS WEEK:
[Bullet list of major work activities completed. Be specific — reference
locations, quantities, and trade performing the work where mentioned in docs.]

WORK IN PROGRESS:
[Bullet list of activities currently underway]

SCHEDULED NEXT WEEK:
[Bullet list of planned activities for next week if mentioned]

SCHEDULE STATUS:
[On Track / At Risk / Behind — with brief explanation]

OPEN ITEMS / ISSUES:
[List any open RFIs, unresolved issues, or items requiring attention]

SAFETY:
[Any incidents reported this week. If none mentioned, state: No incidents reported.]

WEATHER IMPACTS:
[Any weather delays reported. If none, state: No weather impacts reported.]

PHOTOS / ATTACHMENTS: See project file

================================================================
Submitted: _______________________ Date: {week_ending}
================================================================
"""


def generate_weekly_summary(project_vectorstore, project_facts: dict, week_data: dict) -> str:
    """
    Generates a weekly progress summary from daily reports.

    week_data keys: week_ending (date string)
    """
    search_query = "work completed this week daily report progress activities schedule"
    retriever = project_vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 8, "fetch_k": 25}
    )
    docs = retriever.invoke(search_query)
    doc_context = "\n\n".join([d.page_content for d in docs])

    project_name = project_facts.get("project_name") or "Project"
    gc = project_facts.get("general_contractor") or ""

    prompt = WEEKLY_SUMMARY_PROMPT.format(
        project_context=f"Project: {project_name}, GC: {gc}",
        week_ending=week_data.get("week_ending", TODAY),
        doc_context=doc_context,
        project_name=project_name,
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a construction project manager. Write clear, factual weekly progress reports based only on the documents provided."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=800,
        temperature=0.15,
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────────────────────
# MASTER ROUTER — called from app.py
# ─────────────────────────────────────────────────────────────────────────────

DOCUMENT_TYPES = {
    "RFI Response":              generate_rfi_response,
    "Delay Notice Letter":       generate_delay_notice,
    "Change Order Assessment":   generate_change_order_assessment,
    "Weekly Progress Summary":   generate_weekly_summary,
}


def generate_document(
    doc_type: str,
    project_vectorstore,
    project_facts: dict,
    form_data: dict
) -> str:
    """
    Master router. Called from app.py with the selected doc type and form data.

    Usage:
        result = generate_document(
            doc_type="Delay Notice Letter",
            project_vectorstore=st.session_state.project_vectorstore,
            project_facts=st.session_state.dashboard["facts"],
            form_data={"delay_event": "...", "delay_cause": "...", ...}
        )
    """
    generator_fn = DOCUMENT_TYPES.get(doc_type)
    if not generator_fn:
        return f"Error: Unknown document type '{doc_type}'"

    return generator_fn(project_vectorstore, project_facts, form_data)