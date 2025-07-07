"use client";

import { memo } from "react";

export const Ray = memo(() => {
  return (
    <svg
      className="pointer-events-none fixed -top-80 left-0 z-[99] h-[169%] w-[138%] opacity-0 md:-top-20 md:left-60 lg:w-[84%] will-change-transform"
      viewBox="0 0 3787 2842"
      fill="none"
      width="3787"
      height="2842"
      aria-hidden="true"
    >
      <g>
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill="white"
          fillOpacity="0.21"
          style={{
            filter: "blur(151px)",
          }}
        />
      </g>
    </svg>
  );
});

Ray.displayName = "Ray";
