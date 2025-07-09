// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Settings as SettingsIcon, type LucideIcon } from "lucide-react";

import { AboutTab } from "./about-tab";
import { AccountTab } from "./account-tab";
import { FlowLibraryTab } from "./flow-library-tab";
import { MCPTab } from "./mcp-tab";
import { ModelsTab } from "./models-tab";

export const SETTINGS_TABS = [FlowLibraryTab, ModelsTab, MCPTab, AccountTab, AboutTab].map((tab) => {
  const name = tab.displayName ?? tab.name;
  return {
    ...tab,
    id: name.replace(/Tab$/, "").toLocaleLowerCase(),
    label: name.replace(/Tab$/, ""),
    icon: (tab.icon ?? SettingsIcon) as LucideIcon,
    component: tab,
  };
});
