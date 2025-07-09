BEGIN;

-- =====================================================
-- Knowledge Base System for deer-flow
-- Modified from Suna's knowledge_base.sql
-- =====================================================

-- Knowledge base entries (modified for workflow context)
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    usage_context VARCHAR(100) DEFAULT 'workflow', -- 'workflow', 'research', 'coding', 'analysis'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking (modified for workflow tracking)
CREATE TABLE IF NOT EXISTS knowledge_base_usage_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES knowledge_base_entries(entry_id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_kb_entries_account_id ON knowledge_base_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_thread_id ON knowledge_base_entries(thread_id);
CREATE INDEX IF NOT EXISTS idx_kb_entries_usage_context ON knowledge_base_entries(usage_context);
CREATE INDEX IF NOT EXISTS idx_kb_entries_is_active ON knowledge_base_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_kb_entries_created_at ON knowledge_base_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_kb_usage_entry_id ON knowledge_base_usage_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_kb_usage_thread_id ON knowledge_base_usage_log(thread_id);
CREATE INDEX IF NOT EXISTS idx_kb_usage_workflow_execution_id ON knowledge_base_usage_log(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_kb_usage_used_at ON knowledge_base_usage_log(used_at);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_usage_log ENABLE ROW LEVEL SECURITY;

-- Knowledge Base Entries Policies
CREATE POLICY kb_entries_account_access ON knowledge_base_entries
    FOR ALL USING (basejump.has_role_on_account(account_id));

-- Knowledge Base Usage Log Policies - access through thread ownership
CREATE POLICY kb_usage_log_account_access ON knowledge_base_usage_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM threads t
            WHERE t.thread_id = knowledge_base_usage_log.thread_id
            AND basejump.has_role_on_account(t.account_id)
        )
    );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get thread knowledge base
CREATE OR REPLACE FUNCTION get_thread_knowledge_base(
    p_thread_id UUID,
    p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    entry_id UUID,
    name VARCHAR(255),
    description TEXT,
    content TEXT,
    usage_context VARCHAR(100),
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.entry_id,
        kb.name,
        kb.description,
        kb.content,
        kb.usage_context,
        kb.is_active,
        kb.created_at
    FROM knowledge_base_entries kb
    WHERE kb.thread_id = p_thread_id
    AND (kb.is_active = TRUE OR p_include_inactive = TRUE)
    ORDER BY kb.created_at DESC;
END;
$$;

-- Function to log knowledge base usage
CREATE OR REPLACE FUNCTION log_knowledge_base_usage(
    p_entry_id UUID,
    p_thread_id UUID,
    p_workflow_execution_id UUID DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO knowledge_base_usage_log (
        entry_id,
        thread_id,
        workflow_execution_id
    ) VALUES (
        p_entry_id,
        p_thread_id,
        p_workflow_execution_id
    );
END;
$$;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT ALL PRIVILEGES ON TABLE knowledge_base_entries TO authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE knowledge_base_usage_log TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION get_thread_knowledge_base(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION log_knowledge_base_usage(UUID, UUID, UUID) TO authenticated;

COMMIT; 