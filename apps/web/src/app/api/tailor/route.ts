import { NextResponse } from "next/server";
import { callLLM } from "@/lib/groq";
import { getBulletRewriterPrompt, getMatchScoringPrompt } from "@/lib/prompts";
import {
  ResumeProfileSchema,
  JobDescriptionProfileSchema,
  TailoredResumeSchema,
  MatchScoreSchema,
} from "@/lib/schemas";
import { validateTruthfulness } from "@/lib/validators";
import { ZodError } from "zod";

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

    const { resumeProfile, jobDescriptionProfile } = payload;

    if (!resumeProfile || !jobDescriptionProfile) {
      return NextResponse.json(
        { error: "Both resumeProfile and jobDescriptionProfile are required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    // Validate inputs
    try {
      ResumeProfileSchema.parse(resumeProfile);
      JobDescriptionProfileSchema.parse(jobDescriptionProfile);
    } catch (valErr: any) {
      return NextResponse.json(
        {
          error: "Input validation failed.",
          code: "VALIDATION_ERROR",
          details: valErr.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || valErr.message,
        },
        { status: 400 }
      );
    }

    // Step 1: Generate Tailored Resume
    const tailorInput = `Original Resume Profile:\n${JSON.stringify(resumeProfile)}\n\nJob Description Profile:\n${JSON.stringify(jobDescriptionProfile)}`;

    const rawTailoredResume = await callLLM(
      getBulletRewriterPrompt(),
      tailorInput,
      TailoredResumeSchema
    );

    // Step 2: Post-process for truthfulness validation
    const tailoredResume = validateTruthfulness(resumeProfile, rawTailoredResume);

    // Step 3: Map tailored resume back to a virtual ResumeProfile shape for scoring
    const virtualResumeProfile = {
      ...resumeProfile,
      summary: tailoredResume.tailoredSummary,
      skills: tailoredResume.tailoredSkills,
      experience: resumeProfile.experience.map((exp: any) => {
        const tailoredExp = tailoredResume.tailoredExperience.find(
          (e: any) => e.company.toLowerCase() === exp.company.toLowerCase()
        );
        return {
          ...exp,
          bullets: tailoredExp
            ? tailoredExp.bullets.map((b: any) => b.tailored)
            : exp.bullets,
        };
      }),
    };

    // Step 4: Calculate the score of the tailored resume
    const scoringInput = `Structured Resume:\n${JSON.stringify(virtualResumeProfile)}\n\nStructured Job Description:\n${JSON.stringify(jobDescriptionProfile)}`;

    const tailoredScore = await callLLM(
      getMatchScoringPrompt(),
      scoringInput,
      MatchScoreSchema
    );

    return NextResponse.json({
      tailoredResume,
      tailoredScore,
    });
  } catch (err: any) {
    console.error("Tailoring pipeline error:", err.message);

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
          details: err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 422 }
      );
    }

    const isSchemaMismatch = err.message?.includes("schema structure") || err.message?.includes("JSON");
    return NextResponse.json(
      {
        error: isSchemaMismatch ? "AI model output did not match the expected schema." : "Failed to tailor resume.",
        code: isSchemaMismatch ? "LLM_SCHEMA_MISMATCH" : "LLM_ERROR",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
