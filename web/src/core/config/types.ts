export interface ModelInfo {
  id: string;
  name: string;
  model: string;
  provider: string;
  context_window: number;
}

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
