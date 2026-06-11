import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";

const SmtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  secure: z.boolean().optional().default(false),
  auth: z.object({
    user: z.string().min(1),
    pass: z.string().min(1)
  }),
  fromName: z.string().optional()
});

const RequestSchema = z.object({
  toEmail: z.string().email().optional(),
  toName: z.string().optional(),
  smtpConfig: SmtpConfigSchema.optional()
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: emailId } = await params;
    const userId = (session.user as any).id;

    // Load email draft
    const email = await db.email.findUnique({
      where: { id: emailId }
    });

    if (!email || email.userId !== userId) {
      return NextResponse.json({ error: "Email draft not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { toEmail: overrideEmail, toName: overrideName, smtpConfig: bodySmtp } = parsed.data;

    // Resolve recipient details (prefer body override, then email DB, then error)
    const finalToEmail = overrideEmail || email.toEmail;
    const finalToName = overrideName || email.toName;

    if (!finalToEmail) {
      return NextResponse.json({ error: "Recipient email address is missing" }, { status: 400 });
    }

    // Resolve SMTP configurations
    let smtpHost = bodySmtp?.host || process.env.SMTP_HOST;
    let smtpPort = bodySmtp?.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined);
    let smtpSecure = bodySmtp?.secure !== undefined ? bodySmtp.secure : (process.env.SMTP_SECURE === "true");
    let smtpUser = bodySmtp?.auth?.user || process.env.SMTP_USER;
    let smtpPass = bodySmtp?.auth?.pass || process.env.SMTP_PASS;
    let fromName = bodySmtp?.fromName || process.env.SMTP_FROM_NAME || session.user.name || "CareerAI User";

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({
        error: "SMTP configurations are incomplete. Please provide smtpConfig in the request or set environment variables."
      }, { status: 400 });
    }

    // Initialize transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const formattedTo = finalToName ? `${finalToName} <${finalToEmail}>` : finalToEmail;
    const formattedFrom = `${fromName} <${smtpUser}>`;

    try {
      // Send the email
      await transporter.sendMail({
        from: formattedFrom,
        to: formattedTo,
        subject: email.subject,
        text: email.body
      });
    } catch (sendErr: any) {
      console.error("Nodemailer sendMail failed:", sendErr);
      
      // Update email status in DB to failed
      await db.email.update({
        where: { id: emailId },
        data: {
          status: "failed",
          toEmail: finalToEmail,
          toName: finalToName
        }
      });

      return NextResponse.json({ error: "Email delivery failed", details: sendErr.message }, { status: 502 });
    }

    // Update email status to sent
    const updatedEmail = await db.email.update({
      where: { id: emailId },
      data: {
        status: "sent",
        sentAt: new Date(),
        toEmail: finalToEmail,
        toName: finalToName
      }
    });

    // Update associated UserJob tracker status to email_sent if jobId is present
    if (email.jobId) {
      try {
        await db.userJob.update({
          where: {
            userId_jobId: {
              userId,
              jobId: email.jobId
            }
          },
          data: {
            status: "email_sent"
          }
        });
      } catch (userJobErr) {
        console.warn("Failed to update UserJob status to email_sent:", userJobErr);
      }
    }

    return NextResponse.json(updatedEmail);
  } catch (err: any) {
    console.error("POST /api/emails/[id]/send error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
