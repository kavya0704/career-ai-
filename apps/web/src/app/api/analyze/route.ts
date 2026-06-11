import { NextResponse } from "next/server";
import { callLLM } from "@/lib/groq";
import { getJDExtractionPrompt, getResumeParserPrompt, getMatchScoringPrompt, getGapAnalysisPrompt } from "@/lib/prompts";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  ResumeGapSchema,
} from "@/lib/schemas";
import { z, ZodError } from "zod";

const GapAnalysisResponseSchema = z.object({
  gaps: z.array(ResumeGapSchema),
});

export async function POST(request: Request) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { resumeText, jdText } = payload;

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { error: "Both resumeText and jdText are required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Step 1: Run JD Extraction and Resume Parsing in parallel
    const [jobDescriptionProfile, resumeProfile] = await Promise.all([
      callLLM(
        getJDExtractionPrompt(),
        `Job Description Text:\n${jdText}`,
        JobDescriptionProfileSchema
      ),
      callLLM(
        getResumeParserPrompt(),
        `Resume Text:\n${resumeText}`,
        ResumeProfileSchema
      ),
    ]);

    // Step 2: Run scoring and gap analysis on the structured profiles in parallel
    const scoreAndGapsPromptInput = `Structured Resume:\n${JSON.stringify(resumeProfile)}\n\nStructured Job Description:\n${JSON.stringify(jobDescriptionProfile)}`;

    const [initialScore, gapResponse] = await Promise.all([
      callLLM(
        getMatchScoringPrompt(),
        scoreAndGapsPromptInput,
        MatchScoreSchema
      ),
      callLLM(
        getGapAnalysisPrompt(),
        scoreAndGapsPromptInput,
        GapAnalysisResponseSchema
      ),
    ]);

    return NextResponse.json({
      resumeProfile,
      jobDescriptionProfile,
      initialScore,
      gaps: gapResponse.gaps,
    });
  } catch (err: any) {
    console.error("Analysis pipeline error:", err.message);

    // Check if it's a rate limit or API key error or structure error
    const isRateLimit = err.status === 429 || err.message?.toLowerCase().includes("rate limit") || err.message?.toLowerCase().includes("too many requests");
    const isServiceUnavailable = err.status === 503 || err.message?.toLowerCase().includes("unavailable");
    const isApiKeyError = err.message?.includes("GROQ_API_KEY is missing") || err.status === 401;

    if (isRateLimit || isServiceUnavailable) {
      return NextResponse.json(
        {
          error: "LLM service is currently unavailable or rate limited.",
          code: "SERVICE_UNAVAILABLE",
          details: err.message,
        },
        { status: 503 }
      );
    }

    if (isApiKeyError) {
      return NextResponse.json(
        {
          error: "API key error. Please check your AI API key configuration.",
          code: "API_KEY_ERROR",
          details: err.message,
        },
        { status: 500 }
      );
    }

    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Schema validation failed on structured data.",
          code: "VALIDATION_ERROR",
          details: err.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", "),
        },
        { status: 422 }
      );
    }

    // Default LLM error or schema mismatch during callLLM
    const isSchemaMismatch = err.message?.includes("schema structure") || err.message?.includes("JSON");
    return NextResponse.json(
      {
        error: isSchemaMismatch ? "AI model output did not match the expected schema." : "Failed to analyze profiles.",
        code: isSchemaMismatch ? "LLM_SCHEMA_MISMATCH" : "LLM_ERROR",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
