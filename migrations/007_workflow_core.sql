BEGIN;

-- =====================================================
-- Core Workflow Schema for deer-flow
-- Modified from Suna's agentpress_schema.sql
-- =====================================================

-- Create projects table (simplified for deer-flow)
CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create threads table (modified for deer-flow workflow system)
CREATE TABLE IF NOT EXISTS threads (
    thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(project_id) ON DELETE SET NULL,
    title VARCHAR(255),
    workflow_type TEXT NOT NULL DEFAULT 'research', -- 'research', 'coding', 'analysis', 'prose', 'podcast', 'ppt'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (compatible with deer-flow)
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflow_executions table (replaces Suna's agent_runs)
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL, -- 'research', 'coding', 'analysis', 'prose', 'podcast', 'ppt'
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'stopped'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_tokens INTEGER DEFAULT 0,
    total_duration_seconds NUMERIC DEFAULT 0,
    agent_responses JSONB DEFAULT '[]'::jsonb, -- Store responses from each agent in workflow
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

CREATE INDEX IF NOT EXISTS idx_threads_account_id ON threads(account_id);
CREATE INDEX IF NOT EXISTS idx_threads_project_id ON threads(project_id);
CREATE INDEX IF NOT EXISTS idx_threads_workflow_type ON threads(workflow_type);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_account_id ON workflow_executions(account_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_thread_id ON workflow_executions(thread_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_type ON workflow_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

-- =====================================================
-- Updated_at Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
    BEFORE UPDATE ON workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY projects_account_access ON projects
    FOR ALL USING (basejump.has_role_on_account(account_id));

-- Threads Policies
CREATE POLICY threads_account_access ON threads
    FOR ALL USING (basejump.has_role_on_account(account_id));

-- Messages Policies - access through thread ownership
CREATE POLICY messages_thread_access ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.thread_id = messages.thread_id 
            AND basejump.has_role_on_account(threads.account_id)
        )
    );

-- Workflow Executions Policies
CREATE POLICY workflow_executions_account_access ON workflow_executions
    FOR ALL USING (basejump.has_role_on_account(account_id));

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT ALL PRIVILEGES ON TABLE projects TO authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE threads TO authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE messages TO authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE workflow_executions TO authenticated, service_role;

COMMIT; 