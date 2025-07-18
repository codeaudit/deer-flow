// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { FileText, Plus, Settings, Trash2, Copy, RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";

import { ModelSelectorGroup } from "@/components/deer-flow/model-selector";
import { Tooltip } from "@/components/deer-flow/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsState, Flow } from "@/core/store";
import { 
  createFlow, 
  updateFlow, 
  deleteFlow, 
  setActiveFlow, 
  getAllFlows,
  setPrompt,
  resetPrompt,
  resetAllPrompts,
  fixBrokenTemplates,
  fixPlannerJsonFormat,
  useSettingsStore,
  getPreRegisteredMCPs,
  toggleFlowMCP,
  isFlowMCPEnabled,
} from "@/core/store";

import type { Tab } from "./types";

const AGENT_DESCRIPTIONS = {
  coordinator: "Entry point agent that handles greetings and routes research requests",
  planner: "Creates comprehensive research plans by breaking down complex questions",
  researcher: "Conducts thorough investigations using search tools and external APIs",
  coder: "Handles data processing, calculations, and Python scripting tasks",
  reporter: "Synthesizes research findings into well-structured reports",
};

export const FlowLibraryTab: Tab = ({
  settings,
  onChange,
}: {
  settings: SettingsState;
  onChange: (changes: Partial<SettingsState>) => void;
}) => {
  const [selectedFlowId, setSelectedFlowId] = useState<string>(settings.activeFlowId);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [newFlowName, setNewFlowName] = useState<string>("");
  const [isCreatingFlow, setIsCreatingFlow] = useState<boolean>(false);

  const selectedFlow = settings.flows?.find(flow => flow.id === selectedFlowId) ?? settings.flows?.[0];

  const handleCreateFlow = useCallback(() => {
    if (newFlowName.trim()) {
      const newFlow = createFlow(newFlowName.trim());
      setSelectedFlowId(newFlow.id);
      setNewFlowName("");
      setIsCreatingFlow(false);
      // Get fresh settings from store after creating the flow
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [newFlowName, onChange]);

  const handleDeleteFlow = useCallback((flowId: string) => {
    if (window.confirm("Are you sure you want to delete this flow? This action cannot be undone.")) {
      deleteFlow(flowId);
      // If deleting selected flow, select first available
      if (selectedFlowId === flowId) {
        const remainingFlows = getAllFlows().filter(f => f.id !== flowId);
        setSelectedFlowId(remainingFlows[0]?.id ?? "default");
      }
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlowId, onChange]);

  const handleDuplicateFlow = useCallback((flow: Flow) => {
    const duplicatedFlow = createFlow(`${flow.name} (Copy)`, flow);
    setSelectedFlowId(duplicatedFlow.id);
    const updatedSettings = useSettingsStore.getState();
    onChange(updatedSettings);
  }, [onChange]);

  const handleSetActiveFlow = useCallback((flowId: string) => {
    setActiveFlow(flowId);
    const updatedSettings = useSettingsStore.getState();
    onChange(updatedSettings);
  }, [onChange]);

  const handleFlowInfoUpdate = useCallback((updates: Partial<Flow>) => {
    if (selectedFlow) {
      updateFlow(selectedFlow.id, updates);
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlow, onChange]);

  const handleGeneralSettingUpdate = useCallback((key: keyof Flow["generalSettings"], value: unknown) => {
    if (selectedFlow) {
      updateFlow(selectedFlow.id, {
        generalSettings: { ...selectedFlow.generalSettings, [key]: value }
      });
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlow, onChange]);

  const handlePromptChange = useCallback((agentName: keyof Flow["prompts"], content: string) => {
    if (selectedFlow) {
      setPrompt(agentName, content, selectedFlow.id);
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlow, onChange]);

  const handleResetPrompt = useCallback((agentName: keyof Flow["prompts"]) => {
    if (selectedFlow) {
      resetPrompt(agentName, selectedFlow.id);
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlow, onChange]);

  const handleResetAllPrompts = useCallback(() => {
    if (selectedFlow && window.confirm("Are you sure you want to reset all prompts to default? This action cannot be undone.")) {
      resetAllPrompts(selectedFlow.id);
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    }
  }, [selectedFlow, onChange]);

  const toggleAgent = useCallback((agentName: string) => {
    setExpandedAgent(prev => prev === agentName ? null : agentName);
  }, []);

  if (!selectedFlow) {
    return <div>No flows available</div>;
  }

  return (
    <div className="flex h-full gap-8">
      {/* Left Sidebar - Flow List */}
      <div className="w-96 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Flow Library</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingFlow(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Flow
          </Button>
        </div>

        {isCreatingFlow && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <Label htmlFor="new-flow-name">Flow Name</Label>
            <Input
              id="new-flow-name"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              placeholder="Enter flow name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFlow();
                if (e.key === "Escape") setIsCreatingFlow(false);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateFlow} disabled={!newFlowName.trim()}>
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreatingFlow(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 flex-1 overflow-auto">
          {settings.flows.map((flow) => (
            <div
              key={flow.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedFlowId === flow.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={() => setSelectedFlowId(flow.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{flow.name}</h3>
                    {flow.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    {settings.activeFlowId === flow.id && <Badge variant="default" className="text-xs">Active</Badge>}
                  </div>
                  {flow.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {flow.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated {new Date(flow.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  {settings.activeFlowId !== flow.id && (
                    <Tooltip title="Set as active flow">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActiveFlow(flow.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="Duplicate flow">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateFlow(flow);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </Tooltip>
                  {!flow.isDefault && (
                    <Tooltip title="Delete flow">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow.id);
                        }}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Flow Editor */}
      <div className="flex-1 space-y-8 overflow-auto">
        {/* Flow Info Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Flow Configuration</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input
                id="flow-name"
                value={selectedFlow.name}
                onChange={(e) => handleFlowInfoUpdate({ name: e.target.value })}
                placeholder="Enter flow name..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flow-description">Description</Label>
              <Textarea
                id="flow-description"
                value={selectedFlow.description ?? ""}
                onChange={(e) => handleFlowInfoUpdate({ description: e.target.value })}
                placeholder="Describe what this flow is used for..."
                className="min-h-20"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* General Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">General Settings</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max-plan-iterations">Max Plan Iterations</Label>
              <Slider
                id="max-plan-iterations"
                min={1}
                max={5}
                step={1}
                value={[selectedFlow.generalSettings.maxPlanIterations]}
                onValueChange={(value) => handleGeneralSettingUpdate("maxPlanIterations", value[0])}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Current: {selectedFlow.generalSettings.maxPlanIterations}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-step-num">Max Research Steps</Label>
              <Slider
                id="max-step-num"
                min={1}
                max={10}
                step={1}
                value={[selectedFlow.generalSettings.maxStepNum]}
                onValueChange={(value) => handleGeneralSettingUpdate("maxStepNum", value[0])}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Current: {selectedFlow.generalSettings.maxStepNum}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-search-results">Max Search Results</Label>
              <Slider
                id="max-search-results"
                min={1}
                max={10}
                step={1}
                value={[selectedFlow.generalSettings.maxSearchResults]}
                onValueChange={(value) => handleGeneralSettingUpdate("maxSearchResults", value[0])}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                Current: {selectedFlow.generalSettings.maxSearchResults}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-style">Report Style</Label>
              <Select
                value={selectedFlow.generalSettings.reportStyle}
                onValueChange={(value) => handleGeneralSettingUpdate("reportStyle", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="popular_science">Popular Science</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-accepted-plan"
                checked={selectedFlow.generalSettings.autoAcceptedPlan}
                onCheckedChange={(checked) => handleGeneralSettingUpdate("autoAcceptedPlan", checked)}
              />
              <Label htmlFor="auto-accepted-plan">Auto Accept Plan</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-deep-thinking"
                checked={selectedFlow.generalSettings.enableDeepThinking}
                onCheckedChange={(checked) => handleGeneralSettingUpdate("enableDeepThinking", checked)}
              />
              <Label htmlFor="enable-deep-thinking">Enable Deep Thinking</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-background-investigation"
                checked={selectedFlow.generalSettings.enableBackgroundInvestigation}
                onCheckedChange={(checked) => handleGeneralSettingUpdate("enableBackgroundInvestigation", checked)}
              />
              <Label htmlFor="enable-background-investigation">Enable Background Investigation</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Model Selection Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Model Selection</h3>
          <p className="text-sm text-muted-foreground">
            Choose specific models for different types of tasks. Leave unselected to use the first configured model.
          </p>
          <ModelSelectorGroup 
            flowId={selectedFlow.id} 
            onChange={() => {
              const updatedSettings = useSettingsStore.getState();
              onChange(updatedSettings);
            }}
          />
        </div>

        <Separator />

        {/* MCP Selection Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">MCP Servers</h3>
          <p className="text-sm text-muted-foreground">
            Enable specific MCP tools for this flow. Only globally enabled MCPs can be selected.
          </p>
          <FlowMCPSelector 
            flowId={selectedFlow.id} 
            onChange={() => {
              const updatedSettings = useSettingsStore.getState();
              onChange(updatedSettings);
            }}
          />
        </div>

        <Separator />

        {/* Prompts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Agent Prompts</h3>
            <div className="flex gap-2">
              <Tooltip title="Fix broken Jinja2 templates causing network errors">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedFlow && window.confirm("This will reset all prompts to fix template syntax errors. Continue?")) {
                      fixBrokenTemplates(selectedFlow.id);
                      const updatedSettings = useSettingsStore.getState();
                      onChange(updatedSettings);
                    }
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Fix Templates
                </Button>
              </Tooltip>
              <Tooltip title="Fix planner JSON format issue (most common fix)">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedFlow && window.confirm("This will update your planner prompt to fix JSON format errors. Continue?")) {
                      fixPlannerJsonFormat(selectedFlow.id);
                      const updatedSettings = useSettingsStore.getState();
                      onChange(updatedSettings);
                    }
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Fix JSON
                </Button>
              </Tooltip>
              <Tooltip title="Reset all prompts to default">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAllPrompts}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(selectedFlow.prompts).map(([agentName, prompt]) => (
              <div
                key={agentName}
                className="border rounded-lg p-6 bg-card shadow-sm"
              >
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleAgent(agentName)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium capitalize">
                        {agentName} Agent
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {AGENT_DESCRIPTIONS[agentName as keyof typeof AGENT_DESCRIPTIONS]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip title={`Reset ${agentName} prompt to default`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetPrompt(agentName as keyof Flow["prompts"]);
                        }}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                    >
                      {expandedAgent === agentName ? "Collapse" : "Edit"}
                    </Button>
                  </div>
                </div>

                {expandedAgent === agentName && (
                  <div className="mt-6 space-y-4">
                    <Label htmlFor={`prompt-${agentName}`}>
                      Prompt Content
                    </Label>
                    <Textarea
                      id={`prompt-${agentName}`}
                      value={prompt}
                      onChange={(e) =>
                        handlePromptChange(
                          agentName as keyof Flow["prompts"],
                          e.target.value
                        )
                      }
                      placeholder={`Enter the system prompt for the ${agentName} agent...`}
                      className="min-h-[600px] font-mono text-sm leading-relaxed"
                      style={{
                        resize: "vertical",
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {prompt.length} characters | {prompt.split('\n').length} lines
                      </span>
                      <span>
                        Supports Jinja2 template variables like {`{{ CURRENT_TIME }}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mt-6">
          <p>
            <strong>Template Variables:</strong> Use Jinja2 syntax for dynamic content
          </p>
          <p>
            <strong>Available Variables:</strong> CURRENT_TIME, locale, report_style, max_step_num, resources
          </p>
          <p>
            <strong>Note:</strong> Changes are saved automatically and take effect on the next conversation
          </p>
        </div>
      </div>
    </div>
  );
};

// Flow MCP Selector Component
function FlowMCPSelector({ flowId, onChange }: { flowId: string; onChange?: () => void }) {
  const preRegisteredMCPs = getPreRegisteredMCPs();
  
  const handleToggleMCP = useCallback((mcpName: string, enabled: boolean) => {
    toggleFlowMCP(mcpName, enabled, flowId);
    onChange?.();
  }, [flowId, onChange]);

  const enabledMCPs = preRegisteredMCPs.filter(mcp => mcp.enabled);
  
  if (enabledMCPs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Settings className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No globally enabled MCPs available</p>
        <p className="text-xs">Enable MCPs in the MCP settings tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enabledMCPs.map((mcp) => {
        const isFlowEnabled = isFlowMCPEnabled(mcp.name, flowId);
        
        return (
          <div
            key={mcp.name}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{mcp.displayName}</h4>
                <Badge variant="outline" className="text-xs">Built-in</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {mcp.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {mcp.tools.map((tool) => (
                  <Tooltip key={tool.name} title={tool.description}>
                    <Badge variant="secondary" className="text-xs">
                      {tool.name}
                    </Badge>
                  </Tooltip>
                ))}
              </div>
            </div>
            <div className="ml-4">
              <Switch
                checked={isFlowEnabled}
                onCheckedChange={(enabled) => handleToggleMCP(mcp.name, enabled)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

FlowLibraryTab.displayName = "Flow Library";
FlowLibraryTab.icon = FileText; 