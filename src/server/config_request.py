# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import List, Dict, Any
from pydantic import BaseModel, Field

from src.server.rag_request import RAGConfigResponse


class ModelInfo(BaseModel):
    """Model information structure."""

    id: str = Field(..., description="Unique model identifier")
    name: str = Field(..., description="Human-readable model name")
    model: str = Field(..., description="Model name for API calls")
    provider: str = Field(..., description="Model provider (e.g., OpenAI, Google)")
    context_window: int = Field(default=4096, description="Maximum context window size")


class ConfigResponse(BaseModel):
    """Response model for server config."""

    rag: RAGConfigResponse = Field(..., description="The config of the RAG")
    models: Dict[str, List[ModelInfo]] = Field(
        ..., description="The configured models with metadata"
    )
