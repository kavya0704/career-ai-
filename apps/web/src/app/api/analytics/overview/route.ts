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

    // 1. Fetch total counts from UserJob
    const userJobs = await db.userJob.findMany({
      where: { userId },
      include: {
        job: true
      }
    });

    const pipelineCounts = {
      saved: 0,
      resume_tailored: 0,
      applied: 0,
      email_sent: 0,
      replied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0
    };

    userJobs.forEach(uj => {
      const status = uj.status as keyof typeof pipelineCounts;
      if (status in pipelineCounts) {
        pipelineCounts[status]++;
      }
    });

    // 2. Fetch email metrics
    const emails = await db.email.findMany({
      where: { userId }
    });

    const totalEmailsDrafted = emails.length;
    const totalEmailsSent = emails.filter(e => e.status === "sent").length;
    const totalReplies = emails.filter(e => e.replyReceived).length;

    // 3. Average ATS score (based on optimized scores)
    const analyses = await db.resumeAnalysis.findMany({
      where: { userId, optimizedScore: { not: null } },
      select: { optimizedScore: true, originalScore: true }
    });

    let avgOriginalScore = 0;
    let avgOptimizedScore = 0;
    
    if (analyses.length > 0) {
      const totalOrig = analyses.reduce((sum, a) => sum + (a.originalScore || 0), 0);
      const totalOpt = analyses.reduce((sum, a) => sum + (a.optimizedScore || 0), 0);
      avgOriginalScore = Math.round(totalOrig / analyses.length);
      avgOptimizedScore = Math.round(totalOpt / analyses.length);
    }

    // 4. Time-series chart helper (group last 7 days of activity)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const activityTimeline = last7Days.map(date => {
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const jobsAdded = userJobs.filter(uj => 
        uj.createdAt.toISOString().split("T")[0] === date
      ).length;

      const emailsSent = emails.filter(e => 
        e.status === "sent" && 
        e.sentAt && 
        e.sentAt.toISOString().split("T")[0] === date
      ).length;

      return {
        date: formattedDate,
        jobsAdded,
        emailsSent
      };
    });

    return NextResponse.json({
      pipeline: pipelineCounts,
      totalJobs: userJobs.length,
      emails: {
        drafted: totalEmailsDrafted,
        sent: totalEmailsSent,
        replied: totalReplies,
        replyRate: totalEmailsSent > 0 ? Math.round((totalReplies / totalEmailsSent) * 100) : 0
      },
      atsMetrics: {
        totalAnalyses: analyses.length,
        avgOriginalScore,
        avgOptimizedScore,
        averageImprovement: Math.max(0, avgOptimizedScore - avgOriginalScore)
      },
      timeline: activityTimeline
    });

  } catch (err: any) {
    console.error("GET /api/analytics/overview error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 550 });
  }
}
