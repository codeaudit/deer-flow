// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Settings, RotateCcw, Sliders } from "lucide-react";
import { useState, useCallback } from "react";

import { Tooltip } from "~/components/deer-flow/tooltip";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { useConfig } from "~/core/api/hooks";
import type { ModelInfo } from "~/core/config/types";
import { 
  getModelParameters, 
  setModelParameters, 
  resetModelParameters,
  getDefaultParameters,
  type LLMParameters 
} from "~/core/store/settings-store";

import type { Tab } from "./types";

interface ModelConfigCardProps {
  model: ModelInfo;
}

function ModelConfigCard({ model }: ModelConfigCardProps) {
  const [parameters, setParameters] = useState<LLMParameters>(() => 
    getModelParameters(model.id)
  );

  const handleParameterChange = useCallback((key: keyof LLMParameters, value: number) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    setModelParameters(model.id, { [key]: value });
  }, [parameters, model.id]);

  const handleReset = useCallback(() => {
    const defaultParams = getDefaultParameters();
    setParameters(defaultParams);
    resetModelParameters(model.id);
  }, [model.id]);

  const maxTokensLimit = Math.min(model.context_window, 32768); // Cap at 32k for UI practicality

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {model.name}
              <Badge variant="outline" className="text-xs">
                {model.provider}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {model.model} • Context: {model.context_window.toLocaleString()} tokens
            </CardDescription>
          </div>
          <Tooltip title="Reset to defaults">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`temperature-${model.id}`} className="text-sm font-medium">
              Temperature
            </Label>
            <span className="text-xs text-muted-foreground">
              {parameters.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            id={`temperature-${model.id}`}
            min={0}
            max={2}
            step={0.01}
            value={[parameters.temperature]}
            onValueChange={(value) => handleParameterChange("temperature", value[0]!)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower values = more focused, higher values = more creative
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`max-tokens-${model.id}`} className="text-sm font-medium">
              Max Tokens
            </Label>
            <Input
              type="number"
              min={1}
              max={maxTokensLimit}
              value={parameters.max_tokens}
              onChange={(e) => {
                const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), maxTokensLimit);
                handleParameterChange("max_tokens", value);
              }}
              className="w-20 h-8 text-xs"
            />
          </div>
          <Slider
            id={`max-tokens-${model.id}`}
            min={1}
            max={maxTokensLimit}
            step={1}
            value={[parameters.max_tokens]}
            onValueChange={(value) => handleParameterChange("max_tokens", value[0]!)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of the response (1 - {maxTokensLimit.toLocaleString()})
          </p>
        </div>

        {/* Top-p */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`top-p-${model.id}`} className="text-sm font-medium">
              Top-p (Nucleus Sampling)
            </Label>
            <span className="text-xs text-muted-foreground">
              {parameters.top_p.toFixed(2)}
            </span>
          </div>
          <Slider
            id={`top-p-${model.id}`}
            min={0}
            max={1}
            step={0.01}
            value={[parameters.top_p]}
            onValueChange={(value) => handleParameterChange("top_p", value[0]!)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower values = more deterministic, higher values = more diverse
          </p>
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`frequency-penalty-${model.id}`} className="text-sm font-medium">
              Frequency Penalty
            </Label>
            <span className="text-xs text-muted-foreground">
              {parameters.frequency_penalty.toFixed(2)}
            </span>
          </div>
          <Slider
            id={`frequency-penalty-${model.id}`}
            min={-2}
            max={2}
            step={0.01}
            value={[parameters.frequency_penalty]}
            onValueChange={(value) => handleParameterChange("frequency_penalty", value[0]!)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Negative values encourage repetition, positive values discourage it
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const ModelsTab: Tab = () => {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-lg font-medium">Model Configuration</h1>
          <p className="text-muted-foreground text-sm">Loading models...</p>
        </header>
      </div>
    );
  }

  if (!config?.models) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-lg font-medium">Model Configuration</h1>
          <p className="text-muted-foreground text-sm">
            No models are configured. Please add models to your configuration file first.
          </p>
        </header>
      </div>
    );
  }

  const allModels: Array<{ model: ModelInfo; type: string }> = [];
  
  // Collect all configured models
  if (config.models.basic) {
    allModels.push(...config.models.basic.map(model => ({ model, type: "basic" })));
  }
  if (config.models.reasoning) {
    allModels.push(...config.models.reasoning.map(model => ({ model, type: "reasoning" })));
  }
  if (config.models.vision) {
    allModels.push(...config.models.vision.map(model => ({ model, type: "vision" })));
  }

  if (allModels.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-lg font-medium">Model Configuration</h1>
          <p className="text-muted-foreground text-sm">
            No models found in your configuration.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-medium flex items-center gap-2">
          <Sliders className="h-5 w-5" />
          Model Configuration
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure generation parameters for each of your models. Changes are saved automatically.
        </p>
      </header>

      <main className="space-y-6">
        {/* Basic Models */}
        {config.models.basic && config.models.basic.length > 0 && (
          <section>
            <h2 className="text-md font-medium mb-3 flex items-center gap-2">
              Chat Models
              <Badge variant="secondary" className="text-xs">
                {config.models.basic.length}
              </Badge>
            </h2>
            <div className="grid gap-4">
              {config.models.basic.map((model) => (
                <ModelConfigCard
                  key={model.id}
                  model={model}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reasoning Models */}
        {config.models.reasoning && config.models.reasoning.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-md font-medium mb-3 flex items-center gap-2">
                Reasoning Models
                <Badge variant="secondary" className="text-xs">
                  {config.models.reasoning.length}
                </Badge>
              </h2>
              <div className="grid gap-4">
                {config.models.reasoning.map((model) => (
                  <ModelConfigCard
                    key={model.id}
                    model={model}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Vision Models */}
        {config.models.vision && config.models.vision.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="text-md font-medium mb-3 flex items-center gap-2">
                Vision Models
                <Badge variant="secondary" className="text-xs">
                  {config.models.vision.length}
                </Badge>
              </h2>
              <div className="grid gap-4">
                {config.models.vision.map((model) => (
                  <ModelConfigCard
                    key={model.id}
                    model={model}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

ModelsTab.icon = Settings;
ModelsTab.displayName = "Models"; 