export interface ModelInfo {
  id: string;
  name: string;
  model: string;
  provider: string;
  context_window: number;
  account_id: string; // Add account_id field
}

// Note: MCPServerMetadata should also include account_id for account-specific data

export interface ModelConfig {
  basic: ModelInfo[];
  reasoning: ModelInfo[];
  vision: ModelInfo[];
}

export interface RagConfig {
  provider: string;
}

export interface DeerFlowConfig {
  rag: RagConfig;
  models: ModelConfig;
}
