import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch user jobs joining the Job table
    const userJobs = await db.userJob.findMany({
      where: { userId },
      include: {
        job: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(userJobs);
  } catch (err: any) {
    console.error("GET /api/jobs error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
