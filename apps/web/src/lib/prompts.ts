// Prompt Loading Utilities
// Imports prompt strings from src/prompts/ and interpolates user data

import { jdExtractionSystemPrompt } from "@/prompts/jd-extraction";
import { resumeParserSystemPrompt } from "@/prompts/resume-parser";
import { matchScoringSystemPrompt } from "@/prompts/match-scoring";
import { bulletRewriterSystemPrompt } from "@/prompts/bullet-rewriter";
import { gapAnalysisSystemPrompt } from "@/prompts/gap-analysis";

/**
 * Get the system prompt for JD extraction.
 */
export function getJDExtractionPrompt(): string {
  return jdExtractionSystemPrompt;
}

/**
 * Get the system prompt for resume parsing.
 */
export function getResumeParserPrompt(): string {
  return resumeParserSystemPrompt;
}

/**
 * Get the system prompt for match scoring.
 */
export function getMatchScoringPrompt(): string {
  return matchScoringSystemPrompt;
}

/**
 * Get the system prompt for bullet rewriting.
 */
export function getBulletRewriterPrompt(): string {
  return bulletRewriterSystemPrompt;
}

/**
 * Get the system prompt for gap analysis.
 */
export function getGapAnalysisPrompt(): string {
  return gapAnalysisSystemPrompt;
}
