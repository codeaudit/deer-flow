# SQLAlchemy Integration Plan

## Overview
This document outlines the plan for integrating SQLAlchemy with our existing Supabase setup by extending existing classes for MCP connections and LLM models only.

## Constraints
1. Keep existing account management untouched:
   - Preserve all `basejump` schema tables and functions
   - Continue using Supabase's built-in auth and RLS
   - Maintain current `DBConnection` class for account operations

2. Apply SQLAlchemy selectively:
   - Only for tables in the `public` schema
   - Only for tables without complex RLS policies
   - Focus on MCP connections and LLM models only

## Implementation Steps

### 1. Setup SQLAlchemy Infrastructure (Week 1) ✅

#### 1.1 Create Database Module ✅
```
suna/backend/database/
├── __init__.py
├── base.py          # SQLAlchemy declarative base
├── session.py       # Session management
└── connection.py    # Database connection (existing)
```

#### 1.2 Add Dependencies ✅
- Add to requirements.txt:
  ```
  sqlalchemy>=2.0.0
  sqlalchemy-utils>=0.40.0
  asyncpg>=0.27.0    # For async support
  alembic>=1.12.0    # For migrations
  ```

### 2. Extend Existing Classes (Week 1-2) ✅

#### 2.1 MCP Connection Class ✅
```python
# src/mcp_local/client.py
class MCPConnection(Base):
    """Extends existing MCPConnection with SQLAlchemy persistence"""
    __tablename__ = 'mcp_connections'
    
    id = Column(UUID, primary_key=True)
    qualified_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    config = Column(JSON)  # Store non-sensitive config
    enabled_tools = Column(JSON)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
```

#### 2.2 LLM Model Info Class ✅
```python
# src/llms/llm.py
class ModelInfo(Base):
    """Extends existing ModelInfo with SQLAlchemy persistence"""
    __tablename__ = 'llm_models'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    provider = Column(String)
    context_window = Column(Integer)
    base_url = Column(String)
    verify_ssl = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
```

### 3. Integration Points (Week 2) ✅

#### 3.1 Database Session Management ✅
```python
# database/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

async def get_session() -> AsyncSession:
    """Get SQLAlchemy session for database operations"""
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession)
    return async_session()
```

#### 3.2 Integration Examples ✅
```python
# Example of MCP connection persistence
async def save_mcp_connection(connection: MCPConnection, session: AsyncSession):
    session.add(connection)
    await session.commit()

# Example of LLM model persistence
async def get_or_create_model_info(data: Dict[str, Any], session: AsyncSession) -> ModelInfo:
    model_info = await session.query(ModelInfo).filter_by(id=data["id"]).first()
    if not model_info:
        model_info = ModelInfo(data)
        session.add(model_info)
        await session.commit()
    return model_info
```

### 4. Migration Scripts (Week 2) ✅

#### 4.1 Create Alembic Migration ✅
```sql
-- migrations/XXXXXX_add_sqlalchemy_tables.sql
-- Create mcp_connections table
CREATE TABLE mcp_connections (
    id UUID PRIMARY KEY,
    qualified_name VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    config JSONB,
    enabled_tools JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create llm_models table
CREATE TABLE llm_models (
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
```

### 5. Testing Infrastructure (Week 3) ✅

#### 5.1 Test Utilities ✅
```python
# tests/utils/db_test_utils.py
async def create_test_session():
    """Create test database session"""
    engine = create_async_engine(TEST_DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession)
    return async_session()
```

#### 5.2 Model Tests ✅
```
tests/unit/models/
├── test_mcp_connection.py
└── test_model_info.py
```

#### 5.3 Integration Tests ✅
```
tests/integration/
└── test_persistence.py
```

### 6. Multi-Account Support (Week 4) ✅

#### 6.1 Update Models with Account Association ✅
```python
# Update both model classes to include account_id
class MCPConnection(Base):
    # Existing columns...
    account_id = Column(String, ForeignKey("auth.users.id"), nullable=False, index=True)
    
class ModelInfo(Base):
    # Existing columns...
    account_id = Column(String, ForeignKey("auth.users.id"), nullable=False, index=True)
```

#### 6.2 Add Account-Specific Query Methods ✅
```python
# Add to both model classes
@classmethod
async def get_for_account(cls, session: AsyncSession, account_id: str) -> List["ModelClass"]:
    """Get all instances for a specific account"""
    result = await session.execute(select(cls).where(cls.account_id == account_id))
    return list(result.scalars().all())
```

#### 6.3 Create User Session Context ✅
```python
class UserSessionContext:
    """Context manager that attaches user context to database sessions"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        
    async def get_session(self) -> AsyncSession:
        """Get a session with user context"""
        session = await get_session()
        # Set session info that can be used by query filters
        session.info["user_id"] = self.user_id
        return session
```

#### 6.4 Add Row-Level Security Policies ✅
```sql
-- Add RLS policies to the tables
ALTER TABLE mcp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

-- Create policies that restrict access to the account owner
CREATE POLICY mcp_connections_account_isolation ON mcp_connections
    USING (account_id = auth.uid());
    
CREATE POLICY llm_models_account_isolation ON llm_models
    USING (account_id = auth.uid());
```

#### 6.5 Update Migration Script ✅
```sql
-- Add account_id to existing tables
ALTER TABLE mcp_connections ADD COLUMN account_id UUID NOT NULL REFERENCES auth.users(id);
ALTER TABLE llm_models ADD COLUMN account_id UUID NOT NULL REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX idx_mcp_connections_account_id ON mcp_connections(account_id);
CREATE INDEX idx_llm_models_account_id ON llm_models(account_id);
```

#### 6.6 Auth Middleware Integration ✅
```python
# Middleware to extract user ID from authentication token
async def auth_middleware(request, call_next):
    # Extract token from request
    token = extract_token(request)
    if token:
        # Verify token and get user ID
        user_id = await verify_token(token)
        if user_id:
            # Attach user ID to request state
            request.state.user_id = user_id
    
    return await call_next(request)
```

### 7. Frontend Changes for Multi-Account Support (Week 5)

#### 7.1 Update API Endpoints ✅
```typescript
// Update API endpoints to include account context
// web/src/core/api/chat.ts, web/src/core/api/hooks.ts
function fetchConfig() {
  // Add authentication token to request
  return fetch(resolveServiceURL("config"), {
    headers: {
      "Authorization": `Bearer ${getAuthToken()}`
    }
  });
}
```

#### 7.2 Update Config Hook ✅
```typescript
// web/src/core/api/hooks.ts
export function useConfig() {
  const { session } = useAuth(); // Get current auth session
  const [config, setConfig] = useState<DeerFlowConfig | null>(null);
  
  useEffect(() => {
    // Re-fetch config when auth session changes
    if (session?.access_token) {
      fetchConfig()
        .then(res => res.json())
        .then(data => setConfig(data));
    }
  }, [session?.access_token]); // Depend on auth token
  
  // ...
}
```

#### 7.3 Update Model Types ✅
```typescript
// web/src/core/config/types.ts
export interface ModelInfo {
  id: string;
  name: string;
  model: string;
  provider: string;
  context_window: number;
  account_id: string; // Add account_id field
}

export interface MCPServerMetadata {
  // Existing fields...
  account_id: string; // Add account_id field
}
```

#### 7.4 Update Settings Store ✅
```typescript
// web/src/core/store/settings-store.ts
// Update to store settings per account
export type SettingsState = {
  accountId: string | null; // Track current account ID
  accountSettings: Record<string, {
    flows: Flow[];
    activeFlowId: string;
    modelParameters: ModelParameters;
    mcp: {
      servers: MCPServerMetadata[];
      preRegistered: PreRegisteredMCPServer[];
    };
  }>;
};

// Add account-aware getters and setters
export function getSettingsForCurrentAccount() {
  const state = useSettingsStore.getState();
  return state.accountSettings[state.accountId || 'default'] || DEFAULT_SETTINGS;
}

export function updateSettingsForCurrentAccount(settings: Partial<AccountSettings>) {
  const state = useSettingsStore.getState();
  const accountId = state.accountId || 'default';
  
  useSettingsStore.setState({
    accountSettings: {
      ...state.accountSettings,
      [accountId]: {
        ...state.accountSettings[accountId],
        ...settings
      }
    }
  });
}
```

#### 7.5 Update Auth Provider ✅
```typescript
// web/src/components/auth/AuthProvider.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ...
  const handleAccountChange = React.useCallback((newAccount: Account | null) => {
    setAccount(newAccount);
    useSettingsStore.setState({ accountId: newAccount?.account_id || null });
    if (newAccount?.account_id) {
      // Optionally, implement loadSettingsForAccount(account_id) if needed
      // loadSettingsForAccount(newAccount.account_id);
    }
  }, []);
  // ...
};
```

#### 7.6 Update Settings Components ✅
```typescript
// Update MCP tab, Models tab, etc. to use account-aware settings
// web/src/app/settings/tabs/models-tab.tsx, mcp-tab.tsx
export const ModelsTab: Tab = () => {
  const { config, loading } = useConfig();
  const { account } = useAuth(); // Get current account
  // Show account-specific UI elements
  return (
    <div>
      {account && (
        <div className="text-sm text-muted-foreground mb-4">
          Managing models for account: {account.name}
        </div>
      )}
      {/* Existing component code */}
    </div>
  );
};
```

#### 7.7 Update Chat API ✅
```typescript
// web/src/core/api/chat.ts
export async function* chatStream(
  userMessage: string,
  params: {
    // Existing params...
  },
  options: { abortSignal?: AbortSignal } = {},
) {
  // Add auth token to request
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getAuthToken()}`
  };
  
  const stream = fetchStream(resolveServiceURL("chat/stream"), {
    body: JSON.stringify({
      messages: [{ role: "user", content: userMessage }],
      ...params,
    }),
    headers,
    signal: options.abortSignal,
  });
  
  // ...
}
```

## Implementation Guidelines

### Class Extension Rules
1. All extended classes must:
   - Inherit from both the original class and SQLAlchemy Base ✅
   - Maintain all existing functionality ✅
   - Add persistence capabilities without breaking existing code ✅
   - Include proper type hints ✅
   - Support async operations ✅

### Integration Guidelines
1. Services should:
   - Support both SQLAlchemy and direct database access ✅
   - Handle transactions appropriately ✅
   - Include proper error handling ✅
   - Support RLS policies when using SQLAlchemy ✅

### Multi-Account Guidelines
1. All data access must:
   - Be scoped to the current user's account ✅
   - Apply account filtering at the database level ✅
   - Handle authentication failures gracefully ✅
   - Support switching between accounts without data leakage ✅

### Frontend Guidelines
1. All frontend components must:
   - Be account-aware and display account-specific data
   - Re-fetch data when account context changes
   - Include proper error handling for authentication issues
   - Provide clear visual indication of current account context

## Migration Path

### Phase 1: Infrastructure Setup ✅
- Set up SQLAlchemy base configuration ✅
- Add database session management ✅
- Create test infrastructure ✅

### Phase 2: Class Extensions ✅
- Extend MCPConnection class ✅
- Extend ModelInfo class ✅
- Add persistence methods ✅

### Phase 3: Integration ✅
- Update services to use SQLAlchemy ✅
- Add database migrations ✅
- Implement test coverage ✅

### Phase 4: Multi-Account Support ✅
- Update models with account association ✅
- Add account-specific query methods ✅
- Create user session context ✅
- Add RLS policies ✅
- Update migration scripts ✅
- Integrate with auth middleware ✅

### Phase 5: Frontend Updates
- Update API endpoints with authentication
- Modify settings store to be account-aware
- Update UI components to display account context
- Add account switching support
- Implement proper error handling for auth issues
- Add account-specific settings persistence

#### Additional Robustness Steps
- Handle token expiry/invalid tokens on the frontend (auto sign-out, prompt re-login)
- If users can belong to multiple accounts/teams, add UI for account switching and ensure all state/settings reload accordingly
- Add backend logging/auditing for account access and failed authentication attempts
- Add frontend integration tests for:
  - Account switching
  - Account isolation (no data leakage between accounts)
  - Error handling for expired/invalid tokens

## Success Criteria
1. No disruption to existing functionality ✅
2. Improved query performance for complex operations ✅
3. Better type safety and IDE support ✅
4. Maintained security through RLS ✅
5. Comprehensive test coverage ✅
6. Complete isolation between different user accounts ✅
7. Seamless account switching with correct configuration loading ✅
8. Clear UI indication of current account context
9. Proper error handling for authentication issues

## Rollback Plan
Each change should be isolated enough to allow for easy rollback by:
1. Maintaining old code paths ✅
2. Using feature flags for new SQLAlchemy implementations ✅
3. Keeping detailed migration logs ✅ 

## Phase 6: Account Default Initialization and Safe State Handling

### 1. Define Default Settings Structure

- [x] In the frontend, define a `DEFAULT_SETTINGS` object that includes:
  - Empty arrays for user-specific models and MCPs.
  - System-wide defaults (if any) for MCPs and models, but do not duplicate per account.
  - Example:
    ```ts
    const DEFAULT_SETTINGS = {
      flows: [],
      activeFlowId: null,
      modelParameters: {},
      mcp: {
        servers: [], // Only system-wide defaults, if any
        preRegistered: [], // Only system-wide defaults, if any
      },
    };
    ```

### 2. Update State Accessors to Use Defaults

- [x] Refactor all state accessors (e.g., `getSettingsForCurrentAccount()`) in the frontend to:
  - Return the settings for the current account if they exist.
  - If not, return a deep copy of `DEFAULT_SETTINGS`.
  - Ensure all UI components (Model tab, MCP tab, etc.) use these accessors.

### 3. Initialize Settings on Account Change

- [x] In the account change handler (e.g., in `AuthProvider.tsx` or equivalent):
  - On account switch, check if settings for the new account exist in the store.
  - If not, initialize them to a deep copy of `DEFAULT_SETTINGS`.
  - Ensure the UI re-renders with the correct, account-specific settings.

### 4. Backend: Return Defaults for New Accounts

- [x] Update backend API endpoints for models and MCPs to:
  - Filter results by the authenticated account ID.
  - If no user-specific models/MCPs exist, return empty arrays (not undefined or null).
  - Optionally, include system-wide defaults if required by product design.

### 5. UI: Safe Access and Empty State Handling

- [ ] Refactor UI components to:
  - Always use safe accessors for models/MCPs (e.g., `settings?.mcp?.servers || []`).
  - Treat empty arrays as a valid state and display a message like “No models configured for this account” or “No MCPs found. Add one to get started.”
  - Never assume the presence of user-specific models/MCPs.

### 6. Data Fetching and Re-fetch on Account Change

- [x] Ensure that all data fetching hooks (e.g., `useConfig`, `useModels`, `useMCPs`) re-fetch data when the account or auth token changes.
- [x] Show a loading spinner or skeleton UI while account settings are being initialized or fetched.

### 7. Testing

- [x] Add/Update tests to verify:
  - Switching to a new account always shows the default state (no user models/MCPs).
  - Adding a model/MCP to one account does not affect others.
  - System-wide defaults (if any) are visible to all accounts but not duplicated.
  - UI handles empty state gracefully (no errors).

---

**Success Criteria for This Phase**
- No errors when switching to a new or empty account.
- Each account starts with only system-wide defaults (if any), and no user-specific models/MCPs.
- UI always displays correct, account-specific data.
- No data leakage between accounts.
- Graceful handling of empty state in all relevant UI components. 

### 8. Remove Global localStorage Settings and Make Settings Account-Specific

- [x] Refactor settings loading and saving logic (e.g., in `web/src/core/store/settings-store.ts`) so that settings are not loaded from or saved to localStorage globally.
- [x] Ensure that all settings persistence and retrieval is namespaced by account ID, both in memory and in any storage (localStorage, cookies, etc.).
- [x] Remove or refactor any code that loads settings from a global key in localStorage (e.g., `SETTINGS_KEY`).
- [x] On account switch or sign-in, only load settings for the current account, and never leak settings between accounts.
- [x] Follow the frontend/backend flow described above: settings should be initialized to defaults for new accounts, and all state should be isolated per account.
- [x] Ensure that authentication/session persistence is also account-specific and does not auto-sign in users based on stale localStorage/cookie state. 