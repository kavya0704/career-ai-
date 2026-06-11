import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function GET(
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

    const userJob = await db.userJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      },
      include: {
        job: true
      }
    });

    if (!userJob) {
      return NextResponse.json({ error: "Job not found in your saved list" }, { status: 404 });
    }

    return NextResponse.json(userJob);
  } catch (err: any) {
    console.error("GET /api/jobs/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.userJob.delete({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/jobs/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
