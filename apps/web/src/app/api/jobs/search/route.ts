import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  role: z.string().min(2),
  location: z.string().optional().default(""),
  skills: z.array(z.string()).optional().default([])
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { role, location, skills } = parsed.data;
    const userId = (session.user as any).id;

    // 1. Create search session in DB
    const searchSession = await db.searchSession.create({
      data: {
        userId,
        role,
        location,
        status: "queued"
      }
    });

    // 2. Call Python FastAPI scraper service
    const scraperUrl = "http://127.0.0.1:8000/scrape";
    try {
      const scraperRes = await fetch(scraperUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.SCRAPER_SERVICE_API_KEY || "careerai_internal_secret_key_987"
        },
        body: JSON.stringify({
          role,
          location,
          session_id: searchSession.id,
          user_id: userId,
          skills
        })
      });

      if (!scraperRes.ok) {
        const errText = await scraperRes.text();
        console.error(`Scraper service returned error status ${scraperRes.status}: ${errText}`);
        
        // Update session status to failed
        await db.searchSession.update({
          where: { id: searchSession.id },
          data: { status: "failed" }
        });

        return NextResponse.json({ error: "Scraper service trigger failed" }, { status: 502 });
      }
    } catch (fetchErr: any) {
      console.error("Failed to connect to scraper service:", fetchErr);
      
      // Update session status to failed
      await db.searchSession.update({
        where: { id: searchSession.id },
        data: { status: "failed" }
      });

      return NextResponse.json({ error: "Scraper backend service unreachable" }, { status: 503 });
    }

    return NextResponse.json({
      sessionId: searchSession.id,
      status: "queued"
    });
  } catch (err: any) {
    console.error("Jobs search API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
