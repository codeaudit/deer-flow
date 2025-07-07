// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { motion } from "framer-motion";
import { Blocks, PencilRuler, Trash, Globe } from "lucide-react";
import { useCallback, useState } from "react";

import { Tooltip } from "@/components/deer-flow/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { MCPServerMetadata } from "@/core/mcp";
import { 
  getPreRegisteredMCPs, 
  togglePreRegisteredMCP, 
  useSettingsStore,
} from "@/core/store/settings-store";
import { cn } from "@/lib/utils";

import { AddMCPServerDialog } from "../dialogs/add-mcp-server-dialog";

import type { Tab } from "./types";

export const MCPTab: Tab = ({ settings, onChange }) => {
  const [servers, setServers] = useState<MCPServerMetadata[]>(
    settings.mcp.servers,
  );
  const [newlyAdded, setNewlyAdded] = useState(false);
  
  // Always get fresh data from the store to avoid stale state
  const preRegistered = getPreRegisteredMCPs();

  const handleAddServers = useCallback(
    (servers: MCPServerMetadata[]) => {
      const merged = mergeServers(settings.mcp.servers, servers);
      setServers(merged);
      onChange({ 
        ...settings, 
        mcp: { 
          ...settings.mcp, 
          servers: merged 
        } 
      });
      setNewlyAdded(true);
      setTimeout(() => {
        setNewlyAdded(false);
      }, 1000);
      setTimeout(() => {
        document.getElementById("settings-content-scrollable")?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
    },
    [onChange, settings],
  );

  const handleDeleteServer = useCallback(
    (name: string) => {
      const merged = settings.mcp.servers.filter(
        (server) => server.name !== name,
      );
      setServers(merged);
      onChange({ 
        ...settings, 
        mcp: { 
          ...settings.mcp, 
          servers: merged 
        } 
      });
    },
    [onChange, settings],
  );

  const handleToggleCustomServer = useCallback(
    (name: string, enabled: boolean) => {
      const merged = settings.mcp.servers.map((server) =>
        server.name === name ? { ...server, enabled } : server,
      );
      setServers(merged);
      onChange({ 
        ...settings, 
        mcp: { 
          ...settings.mcp, 
          servers: merged 
        } 
      });
    },
    [onChange, settings],
  );

  const handleTogglePreRegistered = useCallback(
    (mcpName: string, enabled: boolean) => {
      togglePreRegisteredMCP(mcpName, enabled);
      // Update settings to trigger re-render
      const updatedSettings = useSettingsStore.getState();
      onChange(updatedSettings);
    },
    [onChange],
  );



  const animationProps = {
    initial: { backgroundColor: "gray" },
    animate: { backgroundColor: "transparent" },
    transition: { duration: 1 },
    style: {
      transition: "background-color 1s ease-out",
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-medium">MCP Servers</h1>
          <AddMCPServerDialog onAdd={handleAddServers} />
        </div>
        <div className="text-muted-foreground markdown text-sm">
          The Model Context Protocol boosts DeerFlow by integrating external
          tools for tasks like private domain searches, web browsing, food
          ordering, and more. Click here to
          <a
            className="ml-1"
            target="_blank"
            href="https://modelcontextprotocol.io/"
          >
            learn more about MCP.
          </a>
        </div>
      </header>

      {/* Pre-registered MCPs Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-medium mb-2">Built-in MCPs</h2>
          <p className="text-sm text-muted-foreground">
            Control global availability of pre-configured MCP servers. 
            When enabled, these MCPs become available for all flows to use.
          </p>
        </div>
        
        <ul className="flex flex-col gap-3">
          {preRegistered.map((preServer) => {
            const isGloballyEnabled = preServer.enabled;
            
            return (
              <li
                key={preServer.name}
                className={cn(
                  "!bg-card group relative overflow-hidden rounded-lg border pb-2 shadow duration-300",
                  !isGloballyEnabled && "opacity-60"
                )}
              >
                <div className="flex flex-col items-start px-4 py-3">
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-base font-medium">{preServer.displayName}</div>
                      <div className="bg-blue-500 text-white h-fit rounded px-1.5 py-0.5 text-xs">
                        Built-in
                      </div>
                      {!isGloballyEnabled && (
                        <div className="bg-muted text-muted-foreground h-fit rounded px-1.5 py-0.5 text-xs">
                          Disabled
                        </div>
                      )}
                    </div>
                    
                    {/* Global toggle only */}
                    <div className="flex items-center gap-2">
                      <Globe size={14} />
                      <Tooltip title={`${isGloballyEnabled ? 'Disable globally' : 'Enable globally'} - controls availability for all flows`}>
                        <Switch
                          checked={isGloballyEnabled}
                          onCheckedChange={(enabled) => handleTogglePreRegistered(preServer.name, enabled)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {preServer.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <PencilRuler size={16} />
                    {preServer.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="text-muted-foreground border-muted-foreground w-fit rounded-md border px-2 py-1"
                      >
                        <Tooltip title={tool.description}>
                          <div className="text-sm">{tool.name}</div>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Separator />

      {/* Custom MCPs Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-medium mb-2">Custom MCPs</h2>
          <p className="text-sm text-muted-foreground">
            User-added MCP servers that you&apos;ve configured manually. 
            When enabled, these become available for all flows to use.
          </p>
        </div>
        
        <ul id="mcp-servers-list" className="flex flex-col gap-4">
          {servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Blocks size={48} className="mx-auto mb-4 opacity-50" />
              <p>No custom MCP servers configured yet.</p>
              <p className="text-sm">Add your first MCP server using the button above.</p>
            </div>
          ) : (
            servers.map((server) => {
              const isNew =
                server.createdAt &&
                server.createdAt > Date.now() - 1000 * 60 * 60 * 1;
              return (
                <motion.li
                  className={
                    "!bg-card group relative overflow-hidden rounded-lg border pb-2 shadow duration-300"
                  }
                  key={server.name}
                  {...(isNew && newlyAdded && animationProps)}
                >
                  <div className="absolute top-3 right-2">
                    <Tooltip title="Enable/disable server">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="airplane-mode"
                          checked={server.enabled}
                          onCheckedChange={(checked) => {
                            handleToggleCustomServer(server.name, checked);
                          }}
                        />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="absolute top-1 right-12 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Tooltip title="Delete server">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteServer(server.name)}
                      >
                        <Trash />
                      </Button>
                    </Tooltip>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col items-start px-4 py-2",
                      !server.enabled && "text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2 flex items-center gap-2",
                        !server.enabled && "opacity-70",
                      )}
                    >
                      <div className="text-lg font-medium">{server.name}</div>
                      {!server.enabled && (
                        <div className="bg-primary text-primary-foreground h-fit rounded px-1.5 py-0.5 text-xs">
                          Disabled
                        </div>
                      )}
                      <div className="bg-primary text-primary-foreground h-fit rounded px-1.5 py-0.5 text-xs">
                        {server.transport}
                      </div>
                      {isNew && (
                        <div className="bg-primary text-primary-foreground h-fit rounded px-1.5 py-0.5 text-xs">
                          New
                        </div>
                      )}
                    </div>
                    <ul
                      className={cn(
                        "flex flex-wrap items-center gap-2",
                        !server.enabled && "opacity-70",
                      )}
                    >
                      <PencilRuler size={16} />
                      {server.tools.map((tool) => (
                        <li
                          key={tool.name}
                          className="text-muted-foreground border-muted-foreground w-fit rounded-md border px-2"
                        >
                          <Tooltip key={tool.name} title={tool.description}>
                            <div className="w-fit text-sm">{tool.name}</div>
                          </Tooltip>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
};
MCPTab.icon = Blocks;
MCPTab.displayName = "MCP";
MCPTab.badge = "Beta";

function mergeServers(
  existing: MCPServerMetadata[],
  added: MCPServerMetadata[],
): MCPServerMetadata[] {
  const serverMap = new Map(existing.map((server) => [server.name, server]));

  for (const addedServer of added) {
    addedServer.createdAt = Date.now();
    addedServer.updatedAt = Date.now();
    serverMap.set(addedServer.name, addedServer);
  }

  const result = Array.from(serverMap.values());
  result.sort((a, b) => b.createdAt - a.createdAt);
  return result;
}
