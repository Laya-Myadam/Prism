"""
Singleton embedding model via fastembed (ONNX, CPU-only).
Model: BAAI/bge-small-en-v1.5 — 384 dims, ~25 MB download on first use.
"""
EMBED_DIM   = 384
EMBED_MODEL = "BAAI/bge-small-en-v1.5"

_model = None


def _get_model():
    global _model
    if _model is None:
        from fastembed import TextEmbedding
        _model = TextEmbedding(EMBED_MODEL)
    return _model


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings. Returns list of 384-dim float vectors."""
    if not texts:
        return []
    model = _get_model()
    return [v.tolist() for v in model.embed(texts)]


def embed_one(text: str) -> list[float]:
    return embed_batch([text])[0]
