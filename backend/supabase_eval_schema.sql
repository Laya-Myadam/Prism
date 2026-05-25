-- ============================================================
-- PRISM Eval Schema — run this once in Supabase SQL Editor
-- (after supabase_rag_schema.sql)
-- ============================================================

-- ── Agent traces (observability) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_traces (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   TEXT        NOT NULL,
    question     TEXT        NOT NULL,
    answer       TEXT        NOT NULL,
    agent_type   TEXT        NOT NULL DEFAULT '',
    model        TEXT        NOT NULL DEFAULT '',
    tools_called JSONB       NOT NULL DEFAULT '[]',
    latency_ms   INTEGER     NOT NULL DEFAULT 0,
    cost_usd     FLOAT       NOT NULL DEFAULT 0,
    cached       BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_traces_session_idx    ON agent_traces (session_id);
CREATE INDEX IF NOT EXISTS agent_traces_created_at_idx ON agent_traces (created_at DESC);

-- ── Human feedback (eval loop) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eval_feedback (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   TEXT        NOT NULL,
    question     TEXT        NOT NULL,
    answer       TEXT        NOT NULL,
    agent_used   TEXT        NOT NULL DEFAULT '',
    tools_called JSONB       NOT NULL DEFAULT '[]',
    rating       INTEGER     NOT NULL,   -- 1 = thumbs up, -1 = thumbs down
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT rating_check CHECK (rating IN (-1, 1))
);

CREATE INDEX IF NOT EXISTS eval_feedback_session_idx ON eval_feedback (session_id);
CREATE INDEX IF NOT EXISTS eval_feedback_rating_idx  ON eval_feedback (rating);
CREATE INDEX IF NOT EXISTS eval_feedback_created_idx ON eval_feedback (created_at DESC);
