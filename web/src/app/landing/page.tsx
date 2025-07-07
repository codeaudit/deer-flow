"use client";

import { LandingHeader } from "./components/landing-header";
import { Jumbotron } from "./components/jumbotron";
import { CoreFeatureSection } from "./sections/core-features-section";
import { CaseStudySection } from "./sections/case-study-section";
import { JoinCommunitySection } from "./sections/join-community-section";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-screen flex-col">
      <LandingHeader />
      <main className="flex flex-1 flex-col items-center justify-center">
        <Jumbotron />
        <CoreFeatureSection />
        <CaseStudySection />
        <JoinCommunitySection />
      </main>
    </div>
  );
} 