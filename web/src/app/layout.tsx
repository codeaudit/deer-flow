// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";

import { env } from "@/env";
import { Providers } from "@/providers/providers";
import { debugEnv } from "@/lib/env-check";

export const metadata: Metadata = {
  title: "🦌 DeerFlow",
  description:
    "Deep Exploration and Efficient Research, an AI tool that combines language models with specialized tools for research tasks.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug environment variables in development
  if (process.env.NODE_ENV === 'development') {
    debugEnv();
  }
  
  const cookieStore = await cookies();
  const initialCookies = cookieStore.getAll();

  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Define isSpace function globally to fix markdown-it issues with Next.js + Turbopack
          https://github.com/markdown-it/markdown-it/issues/1082#issuecomment-2749656365 */}
        <Script id="markdown-it-fix" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && typeof window.isSpace === 'undefined') {
              window.isSpace = function(code) {
                return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0B || code === 0x0C || code === 0x0D;
              };
            }
          `}
        </Script>
        <Script id="hydration-fix" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined') {
              window.__INITIAL_COOKIES__ = ${JSON.stringify(initialCookies)};
            }
          `}
        </Script>
      </head>
      <body className="bg-app" suppressHydrationWarning>
        <Providers initialCookies={initialCookies}>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
        {
          // NO USER BEHAVIOR TRACKING OR PRIVATE DATA COLLECTION BY DEFAULT
          //
          // When `NEXT_PUBLIC_STATIC_WEBSITE_ONLY` is `true`, the script will be injected
          // into the page only when `AMPLITUDE_API_KEY` is provided in `.env`
        }
        {env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY && env.AMPLITUDE_API_KEY && (
          <>
            <Script src="https://cdn.amplitude.com/script/d2197dd1df3f2959f26295bb0e7e849f.js"></Script>
            <Script id="amplitude-init" strategy="lazyOnload">
              {`window.amplitude.init('${env.AMPLITUDE_API_KEY}', {"fetchRemoteConfig":true,"autocapture":true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
