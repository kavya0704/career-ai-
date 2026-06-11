"use client";

import React, { useState } from "react";
import { TailoredResume } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";

interface SideBySideDiffProps {
  tailoredResume: TailoredResume | null;
}

export default function SideBySideDiff({ tailoredResume }: SideBySideDiffProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  if (!tailoredResume || !tailoredResume.tailoredExperience) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground text-sm">No tailored experience details available.</p>
      </div>
    );
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Basic word-level diff highlighting
  const renderTailoredBullet = (original: string, tailored: string) => {
    if (original === tailored) return <span>{tailored}</span>;

    const originalWords = new Set(
      original
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
    );

    const tailoredWords = tailored.split(/\s+/);

    return (
      <span>
        {tailoredWords.map((word, idx) => {
          const cleanWord = word
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

          const isNew = cleanWord && !originalWords.has(cleanWord);

          if (isNew) {
            return (
              <span
                key={idx}
                className="bg-success/20 text-success-foreground border border-success/30 px-1 py-0.5 rounded font-medium inline-block mx-0.5 text-xs animate-scale-in"
              >
                {word}
              </span>
            );
          }
          return <span key={idx}> {word} </span>;
        })}
      </span>
    );
  };

  const getConfidenceBadge = (conf: "high" | "medium" | "low") => {
    switch (conf) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/5 border border-success/20 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            High Confidence
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/5 border border-warning/20 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Medium Confidence
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/5 border border-destructive/20 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
            Low Confidence
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {tailoredResume.tailoredExperience.map((exp, expIdx) => (
        <div key={exp.company + expIdx} className="glass-card overflow-hidden shadow-md">
          {/* Header Banner */}
          <div className="bg-muted/40 border-b border-border/40 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h4 className="text-base font-bold text-foreground">{exp.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{exp.company}</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 w-fit">
              Experience Section
            </Badge>
          </div>

          {/* Grid Layout (Original vs Tailored) */}
          <div className="divide-y divide-border/30">
            {exp.bullets.map((bullet, bulletIdx) => {
              const rowId = `${expIdx}-${bulletIdx}`;
              const isExpanded = !!expandedRows[rowId];
              const hasChanges = bullet.original !== bullet.tailored;

              return (
                <div key={bulletIdx} className={`transition-colors ${isExpanded ? "bg-muted/10" : "hover:bg-muted/5"}`}>
                  <div
                    onClick={() => toggleRow(rowId)}
                    className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30 cursor-pointer p-5 items-start gap-4 text-xs"
                  >
                    {/* Left Column: Original */}
                    <div className="pr-2 leading-relaxed text-muted-foreground/80">
                      <div className="md:hidden text-[9px] uppercase font-bold text-muted-foreground mb-1">Original:</div>
                      {bullet.original}
                    </div>

                    {/* Right Column: Tailored */}
                    <div className="pl-0 md:pl-4 leading-relaxed text-foreground">
                      <div className="md:hidden text-[9px] uppercase font-bold text-primary mb-1">Tailored:</div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1">
                            {renderTailoredBullet(bullet.original, bullet.tailored)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            {hasChanges && (
                              <span className="bg-primary/5 text-primary border border-primary/20 text-[9px] px-1 py-0.5 rounded font-medium shrink-0">
                                Modified
                              </span>
                            )}
                            <span className="text-muted-foreground text-[8px] hover:text-foreground">
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </span>
                          </div>
                        </div>
                        
                        {bullet.riskFlag && (
                          <div className="bg-warning/10 border border-warning/30 text-warning-foreground rounded-lg p-2.5 flex gap-2.5 items-start mt-1 text-[10px] leading-normal animate-fade-in">
                            <svg className="text-warning shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <div>
                              <span className="font-bold block mb-0.5">Verification Warning (Potential Fabrication):</span>
                              {bullet.riskFlag}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Metadata Pane */}
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-border/20 px-6 py-4 text-xs text-muted-foreground space-y-4">
                      {/* Flex panel */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">Confidence:</span>
                          {getConfidenceBadge(bullet.confidence)}
                        </div>
                        {bullet.keywordsAddressed.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground shrink-0">Keywords Addressed:</span>
                            {bullet.keywordsAddressed.map((kw) => (
                              <Badge key={kw} variant="outline" className="text-[10px] bg-background/50 border-border text-foreground px-2 py-0">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Change reasoning */}
                      <div>
                        <span className="font-bold text-foreground block mb-1">Change Reason:</span>
                        <p>{bullet.changeReason}</p>
                      </div>

                      {/* Risk warning */}
                      {bullet.riskFlag && (
                        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex gap-2.5 items-start">
                          <svg className="text-destructive shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div>
                            <span className="font-bold text-destructive block mb-0.5">Verification Warning (Potential Fabrication Risk):</span>
                            <p className="text-destructive/80 text-[11px]">{bullet.riskFlag}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
