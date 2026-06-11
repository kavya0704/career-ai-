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

    const analyses = await db.resumeAnalysis.findMany({
      where: { userId },
      include: {
        job: true,
        resume: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(analyses);
  } catch (err: any) {
    console.error("GET /api/analyses error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 550 });
  }
}
