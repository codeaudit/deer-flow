-- Create mcp_connections table
CREATE TABLE IF NOT EXISTS mcp_connections (
    id UUID PRIMARY KEY,
    qualified_name VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    config JSONB,
    enabled_tools JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    provider VARCHAR,
    context_window INTEGER,
    base_url VARCHAR,
    verify_ssl BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mcp_connections_name ON mcp_connections (name);
CREATE INDEX IF NOT EXISTS idx_llm_models_name ON llm_models (name);
CREATE INDEX IF NOT EXISTS idx_llm_models_provider ON llm_models (provider); 