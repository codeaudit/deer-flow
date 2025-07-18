-- Add account_id to existing tables
ALTER TABLE mcp_connections ADD COLUMN account_id UUID NOT NULL REFERENCES auth.users(id);
ALTER TABLE llm_models ADD COLUMN account_id UUID NOT NULL REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_connections_account_id ON mcp_connections(account_id);
CREATE INDEX IF NOT EXISTS idx_llm_models_account_id ON llm_models(account_id);

-- Add Row-Level Security policies
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

-- Create policies that restrict access to the account owner
CREATE POLICY mcp_connections_account_isolation ON mcp_connections
    USING (account_id = auth.uid());
    
CREATE POLICY llm_models_account_isolation ON llm_models
    USING (account_id = auth.uid()); 