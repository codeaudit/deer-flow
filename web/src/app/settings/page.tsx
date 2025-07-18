// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { ArrowLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useReplay } from "@/core/replay";
import { useSettingsStore } from "@/core/store/settings-store";
import { cn } from "@/lib/utils";

import { SETTINGS_TABS } from "./tabs";

function SettingsPageContent() {
  const { isReplay } = useReplay();
  const [activeTabId, setActiveTabId] = useState(SETTINGS_TABS[0]!.id);
  const [settings, setSettings] = useState(useSettingsStore.getState() || {});
  const [changes, setChanges] = useState<Partial<any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleTabChange = useCallback(
    (newChanges: Partial<any>) => {
      setTimeout(() => {
        setChanges((prev) => {
          // Deep merge for mcp
          if (newChanges.mcp && prev.mcp) {
            return {
              ...prev,
              ...newChanges,
              mcp: {
                ...prev.mcp,
                ...newChanges.mcp,
              },
            };
          }
          return {
            ...prev,
            ...newChanges,
          };
        });
      }, 0);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (Object.keys(changes).length > 0) {
      setIsSaving(true);
      const newSettings: any = {
        ...(settings || {}),
        ...(changes || {}),
      };
      setSettings(newSettings as any);
      setChanges({});
      
      // Get the current account ID
      const accountId = useSettingsStore.getState().accountId || 'default';
      
      // Check if the changes contain accountSettings structure
      if (newSettings.accountSettings && newSettings.accountSettings[accountId]) {
        // Extract the settings for the current account from accountSettings
        const accountSettings = newSettings.accountSettings[accountId];
        // Save only the account-specific settings to the backend
        useSettingsStore.getState().save(accountSettings);
      } else if (newSettings.accountSettings && newSettings.accountSettings.default) {
        // If accountSettings exists but not for this account, save default settings
        const defaultSettings = newSettings.accountSettings.default;
        useSettingsStore.getState().save(defaultSettings);
      } else {
        // If no accountSettings structure, save the changes directly
        useSettingsStore.getState().save(changes);
      }
      
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  }, [settings, changes]);

  useEffect(() => {
    setSettings((useSettingsStore.getState() || {}) as Record<string, any>);
  }, []);

  useEffect(() => {
    if (Object.keys(changes).length > 0) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [changes, handleSave]);

  const mergedSettings = useMemo<any>(() => {
    return {
      ...(settings || {}),
      ...(changes || {}),
    };
  }, [settings, changes]);

  if (isReplay) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Settings not available in replay mode</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/chat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="transition-colors hover:bg-accent"
          >
            {isSidebarCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">DeerFlow Settings</h1>
            <p className="text-muted-foreground">
              Configure your DeerFlow research workflows and preferences
            </p>
          </div>
          <div className="ml-auto">
            {isSaving && (
              <Badge variant="default" className="animate-pulse">
                Saving...
              </Badge>
            )}
            {!isSaving && Object.keys(changes).length > 0 && (
              <Badge variant="secondary">Unsaved changes</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "border-r bg-muted/20 transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
          isSidebarCollapsed ? "w-0" : "w-64"
        )}>
          <div className={cn(
            "w-64 p-4 transition-opacity duration-300",
            isSidebarCollapsed ? "opacity-0" : "opacity-100"
          )}>
            <ul className="space-y-1">
              {SETTINGS_TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                      activeTabId === tab.id &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <tab.icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                    {tab.badge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-auto text-xs",
                          activeTabId === tab.id &&
                            "border-primary-foreground text-primary-foreground",
                        )}
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTabId} className="h-full">
            <div className="h-full p-6">
              {SETTINGS_TABS.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 h-full focus-visible:outline-none"
                >
                  <tab.component
                    settings={mergedSettings}
                    onChange={handleTabChange}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const settings = useSettingsStore((s: any) => s.settings);
  const loading = useSettingsStore((s: any) => s.loading);
  const error = useSettingsStore((s: any) => s.error);
  const hydrate = useSettingsStore((s: any) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading settings: {String(error)}</p>
          <button
            onClick={() => hydrate()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No settings found.</p>
          <button
            onClick={() => hydrate()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Load Settings
          </button>
        </div>
      </div>
    );
  }

  // Render the actual settings content
  return <SettingsPageContent />;
} 