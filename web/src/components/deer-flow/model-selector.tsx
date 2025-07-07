// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@/core/api/hooks";
import type { ModelInfo } from "@/core/config/types";
import { 
  getSelectedModel, 
  setSelectedModel, 
  clearSelectedModel,
  getActiveFlow,
  useSettingsStore
} from "@/core/store/settings-store";

interface ModelSelectorProps {
  llmType: "basic" | "reasoning" | "vision";
  label: string;
  className?: string;
  compact?: boolean;
  flowId?: string; // Optional flow ID - if not provided, uses active flow
  onChange?: () => void; // Optional callback when selection changes
}

export function ModelSelector({ llmType, label, className, compact, flowId, onChange }: ModelSelectorProps) {
  const { config, loading } = useConfig();
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  
  // Subscribe to active flow changes to update model selection (only if no specific flowId provided)
  const activeFlowId = useSettingsStore((state) => state.activeFlowId);
  const flows = useSettingsStore((state) => state.flows);

  // Update local state when llmType, flow, or flow data changes
  useEffect(() => {
    setSelectedModelId(getSelectedModel(llmType, flowId));
  }, [llmType, activeFlowId, flowId, flows]);

  if (loading || !config?.models) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{label}:</span>
          <Badge variant="outline">Loading...</Badge>
        </div>
      </div>
    );
  }

  const availableModels = config.models[llmType] || [];
  const selectedModel = availableModels.find(model => model.id === selectedModelId);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(llmType, modelId, flowId);
    setSelectedModelId(modelId);
    setIsOpen(false);
    onChange?.();
  };

  const handleClearSelection = () => {
    clearSelectedModel(llmType, flowId);
    setSelectedModelId(undefined);
    setIsOpen(false);
    onChange?.();
  };

  if (availableModels.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{label}:</span>
          <Badge variant="outline">No models configured</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {!compact && (
          <span className="text-sm text-muted-foreground">{label}:</span>
        )}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                {selectedModel ? (
                  <>
                    <span className="truncate max-w-[150px]">
                      {selectedModel.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedModel.provider}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {compact ? `Select ${llmType}` : "Select model"}
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4">
              <h4 className="font-medium mb-3">Select {label} Model</h4>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedModelId === model.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => handleModelSelect(model.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{model.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {model.provider}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {model.model}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Context: {model.context_window.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedModelId && (
                <>
                  <Separator className="my-3" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="w-full"
                  >
                    Use Default Model
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Convenient component for multiple model types
export function ModelSelectorGroup({ className, flowId, onChange }: { className?: string; flowId?: string; onChange?: () => void }) {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground mb-2">Model Selection</div>
        <div className="text-xs text-muted-foreground">Loading available models...</div>
      </div>
    );
  }

  const hasBasicModels = config?.models?.basic && config.models.basic.length > 0;
  const hasReasoningModels = config?.models?.reasoning && config.models.reasoning.length > 0;
  const hasVisionModels = config?.models?.vision && config.models.vision.length > 0;

  if (!hasBasicModels && !hasReasoningModels && !hasVisionModels) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground mb-2">Model Selection</div>
        <div className="text-xs text-muted-foreground">No models configured</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm text-muted-foreground mb-3">Model Selection</div>
      <div className="space-y-3">
        {hasBasicModels && (
          <ModelSelector 
            llmType="basic" 
            label="Chat Model" 
            compact
            flowId={flowId}
            onChange={onChange}
          />
        )}
        {hasReasoningModels && (
          <ModelSelector 
            llmType="reasoning" 
            label="Reasoning Model" 
            compact
            flowId={flowId}
            onChange={onChange}
          />
        )}
        {hasVisionModels && (
          <ModelSelector 
            llmType="vision" 
            label="Vision Model" 
            compact
            flowId={flowId}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
} 