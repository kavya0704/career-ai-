"use client";

import React from "react";
import { useTailoring } from "@/lib/context";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SAMPLE_JD = `Senior React Developer (Frontend) - TechCorp

We are looking for a Senior React Developer to join our team. You will be responsible for leading frontend initiatives, designing type-safe UI components, and optimizing our overall web application performance.

Key Responsibilities:
- Lead the transition of existing web pages to a modern Next.js framework.
- Architect reusable component design systems and enforce type safety using TypeScript.
- Optimize page loading times, rendering performance, and Core Web Vitals.
- Write comprehensive unit tests and integration tests for frontend features.
- Provide technical guidance to junior developers through code reviews.

Requirements:
- 5+ years of experience in modern frontend development.
- Strong proficiency in React, TypeScript, and state management libraries (Redux/Zustand).
- Experience with server-side rendering (SSR) and static site generation (SSG).
- Solid understanding of Webpack, Tailwind CSS, Jest, and Cypress.
`;

export default function JDInput() {
  const { jdText, setJdText } = useTailoring();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJdText(e.target.value);
  };

  const loadSample = () => {
    setJdText(SAMPLE_JD);
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold font-display text-foreground">
          2. Target Job Description
        </h3>
        <Button
          onClick={loadSample}
          variant="outline"
          size="sm"
          className="text-xs font-semibold px-3 py-1 bg-background hover:bg-muted"
        >
          Load Sample JD
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <Textarea
          value={jdText}
          onChange={handleTextChange}
          placeholder="Paste the full text of the job description or role requirements here..."
          className="flex-1 min-h-[350px] font-mono text-xs leading-relaxed bg-background/50 border-border/60 focus-ring resize-none p-4"
        />
        <div className="mt-2 flex justify-between items-center text-xs">
          <div>
            {jdText.length > 0 && jdText.length < 50 && (
              <span className="text-destructive font-medium">Job Description must be at least 50 characters (min. 50)</span>
            )}
            {jdText.length > 10000 && (
              <span className="text-destructive font-medium">Job Description must not exceed 10,000 characters (max. 10,000)</span>
            )}
          </div>
          <div className="text-muted-foreground ml-auto">
            {jdText.length} / 10,000 characters
          </div>
        </div>
      </div>
    </div>
  );
}
