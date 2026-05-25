"""Text chunking with word-level sliding window and overlap."""


def chunk_text(
    text: str,
    chunk_size: int = 400,
    overlap: int = 40,
    min_words: int = 20,
) -> list[str]:
    """Split text into overlapping word-count chunks."""
    words = text.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        piece = words[i : i + chunk_size]
        if len(piece) >= min_words:
            chunks.append(" ".join(piece))
        i += chunk_size - overlap
    return chunks


def chunk_by_section(
    text: str,
    section_sep: str = "\n\n",
    max_words: int = 450,
) -> list[str]:
    """Split by double-newline sections; rechunk any section that's too large."""
    sections = [s.strip() for s in text.split(section_sep) if s.strip()]
    result = []
    for section in sections:
        if len(section.split()) <= max_words:
            result.append(section)
        else:
            result.extend(chunk_text(section))
    return result


def smart_chunk(text: str) -> list[str]:
    """Choose section or word-window chunking based on document structure."""
    return chunk_by_section(text) if "\n\n" in text else chunk_text(text)
