import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/groq";

const RequestSchema = z.object({
  analysisId: z.string().min(1),
  tone: z.string().optional().default("professional"),
  toEmail: z.string().email().optional(),
  toName: z.string().optional(),
  customInstruction: z.string().optional()
});

const EmailResponseSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { analysisId, tone, toEmail, toName, customInstruction } = parsed.data;

    // Fetch analysis with related job, resume, and user details
    const analysis = await db.resumeAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        job: true,
        resume: true,
        user: true
      }
    });

    if (!analysis || analysis.userId !== userId) {
      return NextResponse.json({ error: "Resume analysis not found" }, { status: 404 });
    }

    if (!analysis.job) {
      return NextResponse.json({ error: "The resume analysis does not have an associated job" }, { status: 400 });
    }

    const candidateName = analysis.user.name || "Kavya";
    const companyName = analysis.job.company;
    const jobTitle = analysis.job.jobTitle;

    const systemPrompt = `You are an expert career coach and cold outreach copywriter. Your goal is to write a highly personalized, high-converting cold email to a hiring manager or recruiter.
The email should feel organic, conversational, and direct. Do NOT use generic robotic phrases (like "I hope this email finds you well" or "I am writing to express my interest").
Make sure to clearly link the candidate's achievements and skills to the specific job duties.

Strict Constraints:
1. The body MUST be concise, under 150 words.
2. Absolutely NO placeholders or bracketed terms like [Company], [Your Name], [Link]. Replace all placeholders with actual candidate details.
3. Tone: ${tone}.
4. Output MUST be a valid JSON object matching this schema:
{
  "subject": "Punchy subject line under 50 characters",
  "body": "Personalized email body"
}`;

    const userPrompt = `Candidate Profile:
- Name: ${candidateName}
- Contact Email: ${analysis.user.email}
- Linkedin: ${analysis.user.linkedinUrl || "None"}
- Portfolio: ${analysis.user.portfolioUrl || "None"}

Job Description:
- Title: ${jobTitle}
- Company: ${companyName}
- Location: ${analysis.job.location || "Remote"}
- Description Summary: ${analysis.job.fullDescription?.substring(0, 1500) || ""}

Resume Context (Tailored Resume/Skills):
${analysis.tailoredResumeText?.substring(0, 1500) || analysis.resume.rawText.substring(0, 1500)}

Bullet Rewrites for Inspiration:
${JSON.stringify(analysis.bulletRewrites || {})}

Recipient Information:
- Recipient Name: ${toName || "Hiring Manager"}
- Custom Context/Instructions: ${customInstruction || "None"}

Write the email now. Remember, only respond with JSON.`;

    const generated = await callLLM(systemPrompt, userPrompt, EmailResponseSchema);

    // Calculate word count
    const wordCount = generated.body.split(/\s+/).filter(Boolean).length;

    // Check for any warnings (e.g. if placeholder is still present)
    const warnings: string[] = [];
    if (/\[.*?\]|\{.*?\}|<.*?>/.test(generated.body) || /placeholder/i.test(generated.body)) {
      warnings.push("Email draft contains potential placeholder characters or text.");
    }
    if (wordCount > 180) {
      warnings.push(`Email is quite long (${wordCount} words). Try to edit it down.`);
    }

    // Save drafted email in database
    const emailDraft = await db.email.create({
      data: {
        userId,
        jobId: analysis.jobId,
        analysisId: analysis.id,
        toEmail,
        toName,
        subject: generated.subject,
        body: generated.body,
        tone,
        wordCount,
        warnings,
        status: "draft"
      }
    });

    return NextResponse.json(emailDraft, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/emails/generate error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
