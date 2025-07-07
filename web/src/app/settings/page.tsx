// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { ArrowLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useReplay } from "@/core/replay";
import {
  type SettingsState,
  changeSettings,
  saveSettings,
  useSettingsStore,
} from "@/core/store";
import { cn } from "@/lib/utils";

import { SETTINGS_TABS } from "./tabs";

function SettingsPageContent() {
  const { isReplay } = useReplay();
  const [activeTabId, setActiveTabId] = useState(SETTINGS_TABS[0]!.id);
  const [settings, setSettings] = useState(useSettingsStore.getState());
  const [changes, setChanges] = useState<Partial<SettingsState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleTabChange = useCallback(
    (newChanges: Partial<SettingsState>) => {
      setTimeout(() => {
        setChanges((prev) => ({
          ...prev,
          ...newChanges,
        }));
      }, 0);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (Object.keys(changes).length > 0) {
      setIsSaving(true);
      const newSettings: SettingsState = {
        ...settings,
        ...changes,
      };
      setSettings(newSettings);
      setChanges({});
      changeSettings(newSettings);
      saveSettings();
      
      // Show saving state briefly
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  }, [settings, changes]);

  useEffect(() => {
    setSettings(useSettingsStore.getState());
  }, []);

  // Auto-save changes as they occur
  useEffect(() => {
    if (Object.keys(changes).length > 0) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [changes, handleSave]);

  const mergedSettings = useMemo<SettingsState>(() => {
    return {
      ...settings,
      ...changes,
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
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading Settings...</h1>
          <p className="text-muted-foreground">Please wait while we prepare your settings page</p>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
} 