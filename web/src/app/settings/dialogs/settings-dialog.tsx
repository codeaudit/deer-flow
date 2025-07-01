// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Settings } from "lucide-react";
import Link from "next/link";

import { Tooltip } from "~/components/deer-flow/tooltip";
import { Button } from "~/components/ui/button";
import { useReplay } from "~/core/replay";

export function SettingsDialog() {
  const { isReplay } = useReplay();

  if (isReplay) {
    return null;
  }

  return (
    <Tooltip title="Settings">
      <Link href="/settings">
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </Link>
    </Tooltip>
  );
}
