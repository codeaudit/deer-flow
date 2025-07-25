// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from "react";

import { env } from "@/env";

import type { DeerFlowConfig } from "../config";
import { useReplay } from "../replay";
import { useAuth } from "@/components/auth/AuthProvider";

import { fetchReplayTitle } from "./chat";
import { resolveServiceURL } from "./resolve-service-url";

export function useReplayMetadata() {
  const { isReplay } = useReplay();
  const [title, setTitle] = useState<string | null>(null);
  const isLoading = useRef(false);
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {
    if (!isReplay) {
      return;
    }
    if (title || isLoading.current) {
      return;
    }
    isLoading.current = true;
    fetchReplayTitle()
      .then((title) => {
        setError(false);
        setTitle(title ?? null);
        if (title) {
          document.title = `${title} - DeerFlow`;
        }
      })
      .catch(() => {
        setError(true);
        setTitle("Error: the replay is not available.");
        document.title = "DeerFlow";
      })
      .finally(() => {
        isLoading.current = false;
      });
  }, [isLoading, isReplay, title]);
  return { title, isLoading, hasError: error };
}

export function useConfig(): {
  config: DeerFlowConfig | null;
  loading: boolean;
} {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<DeerFlowConfig | null>(null);

  useEffect(() => {
    if (env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY) {
      setLoading(false);
      return;
    }
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    fetch(resolveServiceURL("config"), { headers })
      .then((res) => res.json())
      .then((config) => {
        setConfig(config);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch config", err);
        console.warn("Using fallback configuration. Please ensure the backend API is running at:", resolveServiceURL("config"));
        // Provide fallback configuration to prevent crashes
        const fallbackConfig: DeerFlowConfig = {
          rag: {
            provider: ""
          },
          models: {
            basic: [],
            reasoning: [],
            vision: []
          }
        };
        setConfig(fallbackConfig);
        setLoading(false);
      });
  }, [session?.access_token]);

  return { config, loading };
}
