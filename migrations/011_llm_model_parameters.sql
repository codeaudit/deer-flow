-- Migration: Create llm_model_parameters table for per-user, per-model LLM parameters

CREATE TABLE IF NOT EXISTS llm_model_parameters (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR NOT NULL REFERENCES "auth.users"(id) ON DELETE CASCADE,
    model_id VARCHAR NOT NULL,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2048,
    top_p FLOAT DEFAULT 0.9,
    frequency_penalty FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_account_model UNIQUE (account_id, model_id)
); 