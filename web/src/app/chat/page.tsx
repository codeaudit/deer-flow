// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { SiteHeader } from "./components/site-header";

const Main = dynamic(() => import("./main"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      Loading DeerFlow...
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 justify-center overscroll-none">
        <Main />
      </div>
    </div>
  );
}
