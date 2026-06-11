"use client";

import React from "react";
import { ResumeGap } from "@/lib/schemas";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface GapAnalysisProps {
  gaps: ResumeGap[];
}

export default function GapAnalysis({ gaps }: GapAnalysisProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground text-sm">No gap details available.</p>
      </div>
    );
  }

  // Sort gaps: High first, then Medium, then Low
  const sortedGaps = [...gaps].sort((a, b) => {
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  const getImportanceBadge = (importance: "high" | "medium" | "low") => {
    switch (importance) {
      case "high":
        return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-warning hover:bg-warning/90 text-warning-foreground">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-muted hover:bg-muted/95 text-muted-foreground border">Low Priority</Badge>;
    }
  };

  return (
    <div className="glass-card p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold font-display text-foreground">
          Identified Gaps ({gaps.length})
        </h3>
        <p className="text-xs text-muted-foreground">Expand items to see suggested actions</p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px] pr-2">
        <Accordion className="space-y-3">
          {sortedGaps.map((gap, index) => (
            <AccordionItem
              key={gap.name + index}
              value={`item-${index}`}
              className="border border-border/50 rounded-xl px-4 py-1 bg-background/30 hover:bg-background/50 transition-colors"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex flex-col sm:flex-row sm:items-center text-left gap-2 w-full pr-4">
                  <span className="font-semibold text-sm text-foreground flex-1">
                    {gap.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {gap.canSafelyAdd && (
                      <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5 font-semibold">
                        Quick Add
                      </Badge>
                    )}
                    {getImportanceBadge(gap.importance)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-xs leading-relaxed space-y-3 text-muted-foreground border-t border-border/20 mt-1">
                {/* Evidence quotes */}
                <div>
                  <div className="font-bold text-foreground mb-1 uppercase tracking-wider text-[9px]">
                    Required by Job Description:
                  </div>
                  <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground bg-muted/20 p-2 rounded-r-md">
                    &ldquo;{gap.jdEvidence}&rdquo;
                  </blockquote>
                </div>

                <div>
                  <div className="font-bold text-foreground mb-1 uppercase tracking-wider text-[9px]">
                    Current Resume Coverage:
                  </div>
                  <p className="pl-1">{gap.resumeEvidence}</p>
                </div>

                {/* Recommendation */}
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <div className="font-bold text-primary mb-1 uppercase tracking-wider text-[9px]">
                    Suggested Action:
                  </div>
                  <p className="text-foreground pl-0.5">{gap.suggestedAction}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
