-- ============================================================
-- PRISM RAG Schema — run this once in Supabase SQL Editor
-- ============================================================

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Document chunks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  TEXT        NOT NULL,
    doc_name    TEXT        NOT NULL,
    doc_type    TEXT        NOT NULL DEFAULT 'general',
    chunk_index INTEGER     NOT NULL DEFAULT 0,
    content     TEXT        NOT NULL,
    embedding   vector(384),
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_session_idx
    ON document_chunks (session_id);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── Semantic cache ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semantic_cache (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id         TEXT        NOT NULL,
    question           TEXT        NOT NULL,
    question_embedding vector(384),
    answer             TEXT        NOT NULL,
    agent_used         TEXT        NOT NULL DEFAULT '',
    tools_called       JSONB       NOT NULL DEFAULT '[]',
    hit_count          INTEGER     NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_hit_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS semantic_cache_session_idx
    ON semantic_cache (session_id);

CREATE INDEX IF NOT EXISTS semantic_cache_embedding_idx
    ON semantic_cache USING ivfflat (question_embedding vector_cosine_ops)
    WITH (lists = 50);

-- ── Agent memory ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_memory (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       TEXT        NOT NULL,
    memory_type      TEXT        NOT NULL DEFAULT 'fact',
    content          TEXT        NOT NULL,
    embedding        vector(384),
    importance       FLOAT       NOT NULL DEFAULT 0.5,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_memory_session_idx
    ON agent_memory (session_id);

CREATE INDEX IF NOT EXISTS agent_memory_embedding_idx
    ON agent_memory USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- ── RPC: vector search over document chunks ───────────────────────────────────
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding   vector(384),
    match_count       INT  DEFAULT 20,
    filter_session_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id          UUID,
    session_id  TEXT,
    doc_name    TEXT,
    doc_type    TEXT,
    chunk_index INT,
    content     TEXT,
    metadata    JSONB,
    similarity  FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id, dc.session_id, dc.doc_name, dc.doc_type,
        dc.chunk_index, dc.content, dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE (
        filter_session_id IS NULL
        OR dc.session_id = filter_session_id
        OR dc.session_id = 'demo'
    )
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── RPC: semantic cache lookup ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_semantic_cache(
    query_embedding      vector(384),
    similarity_threshold FLOAT DEFAULT 0.92,
    filter_session_id    TEXT  DEFAULT NULL,
    match_count          INT   DEFAULT 1
)
RETURNS TABLE (
    id           UUID,
    session_id   TEXT,
    question     TEXT,
    answer       TEXT,
    agent_used   TEXT,
    tools_called JSONB,
    similarity   FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id, sc.session_id, sc.question, sc.answer,
        sc.agent_used, sc.tools_called,
        1 - (sc.question_embedding <=> query_embedding) AS similarity
    FROM semantic_cache sc
    WHERE (
        filter_session_id IS NULL
        OR sc.session_id = filter_session_id
    )
    AND 1 - (sc.question_embedding <=> query_embedding) >= similarity_threshold
    ORDER BY sc.question_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── RPC: agent memory retrieval ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_agent_memory(
    query_embedding   vector(384),
    filter_session_id TEXT,
    match_count       INT DEFAULT 5
)
RETURNS TABLE (
    id           UUID,
    session_id   TEXT,
    memory_type  TEXT,
    content      TEXT,
    importance   FLOAT,
    similarity   FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id, am.session_id, am.memory_type, am.content, am.importance,
        1 - (am.embedding <=> query_embedding) AS similarity
    FROM agent_memory am
    WHERE am.session_id = filter_session_id
    ORDER BY am.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
