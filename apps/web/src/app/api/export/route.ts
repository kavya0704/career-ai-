import { NextResponse } from "next/server";
import { generateComparisonPDFHTML, generateCleanResumePDFHTML } from "@/lib/pdf-template";
import { renderPDF } from "@/lib/pdf";
import {
  ResumeProfileSchema,
  TailoredResumeSchema,
  JobDescriptionProfileSchema,
  MatchScoreSchema,
  ResumeGapSchema,
} from "@/lib/schemas";
import { z } from "zod";

const ComparisonExportSchema = z.object({
  type: z.literal("comparison"),
  resumeProfile: ResumeProfileSchema,
  tailoredResume: TailoredResumeSchema,
  jobDescriptionProfile: JobDescriptionProfileSchema,
  initialScore: MatchScoreSchema,
  tailoredScore: MatchScoreSchema,
  gaps: z.array(ResumeGapSchema),
});

const CleanExportSchema = z.object({
  type: z.literal("clean"),
  resumeProfile: ResumeProfileSchema,
  tailoredResume: TailoredResumeSchema,
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

    const { type } = payload;

    if (!type || (type !== "comparison" && type !== "clean")) {
      return NextResponse.json(
        { error: "Invalid or missing export type (must be 'comparison' or 'clean').", code: "INVALID_EXPORT_TYPE" },
        { status: 400 }
      );
    }

    // Validate payload against schema
    try {
      if (type === "comparison") {
        ComparisonExportSchema.parse(payload);
      } else {
        CleanExportSchema.parse(payload);
      }
    } catch (valErr: any) {
      return NextResponse.json(
        {
          error: "Payload validation failed.",
          code: "VALIDATION_ERROR",
          details: valErr.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') || valErr.message,
        },
        { status: 400 }
      );
    }

    let htmlContent = "";

    if (type === "comparison") {
      htmlContent = generateComparisonPDFHTML(payload);
    } else {
      htmlContent = generateCleanResumePDFHTML(payload);
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderPDF(htmlContent);
    } catch (pdfErr: any) {
      return NextResponse.json(
        {
          error: "Failed to generate export PDF.",
          code: "PDF_GENERATION_FAILED",
          details: pdfErr.message,
        },
        { status: 500 }
      );
    }

    // Stream binary PDF
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${
          type === "comparison" ? "resume-comparison-proof.pdf" : "tailored-resume.pdf"
        }"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("PDF Export error:", err.message);
    return NextResponse.json(
      { error: "Internal server error during PDF generation.", code: "INTERNAL_SERVER_ERROR", details: err.message },
      { status: 500 }
    );
  }
}
