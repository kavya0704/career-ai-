"use client";

import React, { useEffect, useState } from "react";
import { MatchScore } from "@/lib/schemas";

interface ScoreCardProps {
  score: MatchScore | null;
  title?: string;
  animate?: boolean;
}

export default function ScoreCard({ score, title = "Match Score", animate = true }: ScoreCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (!score) return;
    if (!animate) {
      const id = setTimeout(() => {
        setAnimatedValue(score.overallScore);
      }, 0);
      return () => clearTimeout(id);
    }

    const duration = 1200; // ms
    const frameRate = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeProgress * score.overallScore);

      if (frame >= totalFrames) {
        setAnimatedValue(score.overallScore);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [score, animate]);

  if (!score) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground text-sm">No score details available.</p>
      </div>
    );
  }

  // Determine colors based on score value
  const getScoreColor = (val: number) => {
    if (val >= 70) return "text-success border-success/20 bg-success/5 stroke-success";
    if (val >= 40) return "text-warning border-warning/20 bg-warning/5 stroke-warning";
    return "text-destructive border-destructive/20 bg-destructive/5 stroke-destructive";
  };

  const getSubscoreBarColor = (val: number) => {
    if (val >= 70) return "bg-success";
    if (val >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const colorClasses = getScoreColor(score.overallScore);
  const strokeColor = score.overallScore >= 70 ? "hsl(var(--success))" : score.overallScore >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  // SVG parameters
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="glass-card p-6 flex flex-col h-full shadow-lg">
      <h3 className="text-lg font-bold font-display text-foreground mb-4">
        {title}
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
        {/* SVG Circular Progress */}
        <div className="relative flex items-center justify-center h-36 w-36">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-border/40"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold font-display leading-none text-foreground">
              {animatedValue}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
              Match
            </span>
          </div>
        </div>

        {/* Textual Feedback */}
        <div className="flex-1 text-center sm:text-left">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-2 border ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]} ${colorClasses.split(" ")[2]}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${score.overallScore >= 70 ? "bg-success" : score.overallScore >= 40 ? "bg-warning" : "bg-destructive"}`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${score.overallScore >= 70 ? "bg-success" : score.overallScore >= 40 ? "bg-warning" : "bg-destructive"}`} />
            </span>
            {score.overallScore >= 70 ? "Strong Match" : score.overallScore >= 40 ? "Partial Match" : "Poor Match"}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {score.explanation}
          </p>
        </div>
      </div>

      {/* Subscore Breakdowns */}
      <div className="space-y-4 pt-4 border-t border-border/40 flex-1">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Sub-score Breakdown
        </h4>

        {/* Skill Coverage */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-foreground">Required Skills Match</span>
            <span>{score.skillCoverageScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getSubscoreBarColor(score.skillCoverageScore)}`}
              style={{ width: `${score.skillCoverageScore}%` }}
            />
          </div>
        </div>

        {/* Responsibility Alignment */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-foreground">Responsibility Alignment</span>
            <span>{score.responsibilityAlignmentScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getSubscoreBarColor(score.responsibilityAlignmentScore)}`}
              style={{ width: `${score.responsibilityAlignmentScore}%` }}
            />
          </div>
        </div>

        {/* Keyword Match */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-foreground">Keyword Presence</span>
            <span>{score.keywordScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getSubscoreBarColor(score.keywordScore)}`}
              style={{ width: `${score.keywordScore}%` }}
            />
          </div>
        </div>

        {/* Seniority Alignment */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-foreground">Seniority & Domain Match</span>
            <span>{score.seniorityScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getSubscoreBarColor(score.seniorityScore)}`}
              style={{ width: `${score.seniorityScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
