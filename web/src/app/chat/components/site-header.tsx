"use client";

// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import UserAccountDisplay from "@/components/auth/UserAccountDisplay";
import { ThemeToggle } from "@/components/deer-flow/theme-toggle";

export function SiteHeader() {
  return (
    <header className="supports-backdrop-blur:bg-background/80 bg-background/40 sticky top-0 left-0 z-40 flex h-15 w-full flex-col items-center backdrop-blur-lg">
      <div className="container flex h-15 items-center justify-between px-3">
        <Link href="/" className="text-xl font-medium hover:opacity-80 transition-opacity">
          <span className="mr-1 text-2xl">🦌</span>
          DeerFlow
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeToggle />
          <UserAccountDisplay />
        </div>
      </div>
    </header>
  );
}
