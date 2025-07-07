"use client";

// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useMemo } from "react";

import { Jumbotron } from "./landing/components/jumbotron";
import { CoreFeatureSection } from "./landing/sections/core-features-section";
import { JoinCommunitySection } from "./landing/sections/join-community-section";
import { LandingHeader } from "./landing/components/landing-header";
import { Ray } from "./landing/components/ray";
import { CaseStudySection } from "./landing/sections/case-study-section";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <LandingHeader />
      <main className="container flex flex-col items-center justify-center gap-56">
        <Jumbotron />
        <CaseStudySection />
        <CoreFeatureSection />
        <JoinCommunitySection />
      </main>
      <Ray />
    </div>
  );
}
