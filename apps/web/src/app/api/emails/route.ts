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

    const emails = await db.email.findMany({
      where: { userId },
      include: {
        job: true,
        analysis: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(emails);
  } catch (err: any) {
    console.error("GET /api/emails error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
