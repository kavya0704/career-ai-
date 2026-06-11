import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  status: z.string(),
  notes: z.string().optional()
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

    const { id: jobId } = await params;
    const userId = (session.user as any).id;

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    const updatedUserJob = await db.userJob.update({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      },
      data: {
        status,
        notes,
        appliedAt: status === "applied" ? new Date() : undefined
      }
    });

    return NextResponse.json(updatedUserJob);
  } catch (err: any) {
    console.error("POST /api/jobs/[id]/status error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
