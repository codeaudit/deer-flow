// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Check, ChevronDown, FileText, Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/deer-flow/tooltip";
import { 
  getActiveFlow, 
  getAllFlows, 
  setActiveFlow,
  type Flow
} from "@/core/store";
import { cn } from "@/lib/utils";

interface FlowSelectorProps {
  className?: string;
  onOpenSettings?: () => void;
}

export function FlowSelector({ className, onOpenSettings }: FlowSelectorProps) {
  const [open, setOpen] = useState(false);
  const activeFlow = getActiveFlow();
  const allFlows = getAllFlows();

  const handleSelectFlow = (flowId: string) => {
    setActiveFlow(flowId);
    setOpen(false);
  };

  const formatFlowName = (flow: Flow) => {
    if (flow.name.length > 22) {
      return flow.name.substring(0, 22) + "...";
    }
    return flow.name;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[160px] sm:w-[180px] md:w-[200px] justify-between rounded-2xl text-xs px-3 h-8"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatFlowName(activeFlow)}</span>
            {activeFlow.isDefault && (
              <Badge variant="secondary" className="text-xs px-1 shrink-0">Default</Badge>
            )}
          </div>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search flows..." />
          <CommandEmpty>No flows found.</CommandEmpty>
          <CommandGroup>
            {allFlows && allFlows.map((flow) => (
              <CommandItem
                key={flow.id}
                value={flow.name}
                onSelect={() => handleSelectFlow(flow.id)}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{flow.name}</span>
                  {flow.isDefault && (
                    <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
                  )}
                </div>
                <Check
                  className={cn(
                    "ml-2 h-4 w-4 shrink-0",
                    activeFlow.id === flow.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          {onOpenSettings && (
            <>
              <div className="border-t">
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onOpenSettings();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage Flows</span>
                  </CommandItem>
                </CommandGroup>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
} 