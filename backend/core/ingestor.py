import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from core.image_extractor import extract_images_from_pdf

def ingest_pdf(pdf_path: str):
    all_documents = []

    # 1. Extract text page by page
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                all_documents.append(Document(
                    page_content=page_text,
                    metadata={"source": "text", "page": page_num}
                ))

    # 2. Extract and describe embedded images
    print("Scanning for images in your document...")
    image_data = extract_images_from_pdf(pdf_path)

    if image_data:
        print(f"Found {len(image_data)} image(s) — describing them with AI vision...")
        for img in image_data:
            all_documents.append(Document(
                page_content=img["text"],
                metadata={"source": "image", "page": img["page_num"], "image_index": img["image_index"]}
            ))
    else:
        print("No embedded images found — processing text only.")

    if not all_documents:
        raise ValueError("Could not extract any content from this PDF.")

    # Fix 2: Larger chunks (1500 chars, 200 overlap) for better large doc handling
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " "]
    )
    text_docs = [d for d in all_documents if d.metadata["source"] == "text"]
    image_docs = [d for d in all_documents if d.metadata["source"] == "image"]
    chunked_text = splitter.split_documents(text_docs)
    final_docs = chunked_text + image_docs

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )

    vectorstore = FAISS.from_documents(final_docs, embeddings)
    return vectorstore, len(image_docs), len(chunked_text)