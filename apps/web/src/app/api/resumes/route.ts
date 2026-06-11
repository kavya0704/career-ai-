import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateResumeSchema = z.object({
  name: z.string().min(1),
  rawText: z.string().min(1),
  isBase: z.boolean().optional().default(false)
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const resumes = await db.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(resumes);
  } catch (err: any) {
    console.error("GET /api/resumes error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const body = await req.json();
    const parsed = CreateResumeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, rawText, isBase } = parsed.data;

    // Use transaction to update existing isBase and create new resume
    const result = await db.$transaction(async (tx) => {
      if (isBase) {
        await tx.resume.updateMany({
          where: { userId, isBase: true },
          data: { isBase: false }
        });
      }

      const newResume = await tx.resume.create({
        data: {
          userId,
          name,
          rawText,
          isBase
        }
      });

      return newResume;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/resumes error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
