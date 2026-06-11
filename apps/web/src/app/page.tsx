import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Sub-component for Landing Page when unauthenticated
function LandingPageView() {
  const features = [
    {
      title: "Job Discovery Board",
      description: "Trigger scraper microservices to find jobs matching your role and location, with instant Jaccard matching scores.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      title: "Resume Tailoring Engine",
      description: "AI-powered bullet point rewrites and gap analysis that align your experience with JD keywords.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      title: "Cold Email Outreach",
      description: "Generate highly personalized, professional cold emails based on your tailored bullets and dispatch them instantly using SMTP.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    }
  ];

  return (
    <div className="relative">
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            CareerAI Copilot — All-in-One Job Suite
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-display">
            Discover Jobs, Tailor Resumes, & <span className="gradient-text">Automate Outreach</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Consolidate your entire job hunt. Search live listings with intelligent compatibility indexing, tailor resume experience bullets truthfully, and instantly draft and send high-converting outreach emails.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/api/auth/signin"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
            >
              Sign In to Copilot
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/20 border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-8 hover-lift">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-display mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <LandingPageView />;
  }

  const userId = (session.user as any).id || "";

  // Query stats inside Server Component
  let scrapedJobs = 0;
  let savedJobs = 0;
  let totalResumes = 0;
  let emailsSent = 0;
  let recentJobsList: any[] = [];
  let recentEmailsList: any[] = [];

  try {
    scrapedJobs = await db.job.count();
    savedJobs = await db.userJob.count({
      where: { userId }
    });
    totalResumes = await db.resume.count({
      where: { userId }
    });
    emailsSent = await db.email.count({
      where: { userId, status: "sent" }
    });

    recentJobsList = await db.job.findMany({
      take: 4,
      orderBy: { scrapedAt: "desc" }
    });

    recentEmailsList = await db.email.findMany({
      where: { userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { job: true }
    });
  } catch (err) {
    console.error("Dashboard stats query error:", err);
  }

  return (
    <main className="min-h-screen py-10 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display text-foreground">
              Welcome to <span className="gradient-text">CareerAI Copilot</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as <span className="font-semibold text-foreground">{session.user.name || session.user.email}</span>. Let's land your next role.
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/95 transition-all self-start"
          >
            Find New Jobs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Scraped Jobs</span>
            <div className="text-3xl font-extrabold font-display text-foreground mt-1">{scrapedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Available in database</p>
          </div>
          <div className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saved Jobs</span>
            <div className="text-3xl font-extrabold font-display text-foreground mt-1">{savedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently tracked roles</p>
          </div>
          <div className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resumes</span>
            <div className="text-3xl font-extrabold font-display text-foreground mt-1">{totalResumes}</div>
            <p className="text-xs text-muted-foreground mt-1">Uploaded base files</p>
          </div>
          <div className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outreach Sent</span>
            <div className="text-3xl font-extrabold font-display text-foreground mt-1">{emailsSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Emails sent via SMTP</p>
          </div>
        </div>

        {/* Main Dashboard Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Jobs */}
          <div className="lg:col-span-2 glass-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <h3 className="text-base font-bold font-display text-foreground">Recent Jobs In Platform</h3>
              <Link href="/jobs" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            {recentJobsList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No jobs scraped yet. Go to the Job Board to search listings.
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobsList.map((job) => (
                  <div key={job.id} className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/10 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">{job.jobTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.company} • {job.location || "Remote"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-bold text-primary bg-primary/5 border-primary/20">
                          {job.relevanceScore}% match
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Scraped {new Date(job.scrapedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link
                      href="/input"
                      className="text-xs bg-muted hover:bg-accent text-foreground py-1 px-3 rounded font-semibold transition-colors"
                    >
                      Tailor
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Email Outreach Log */}
          <div className="lg:col-span-1 glass-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
              <h3 className="text-base font-bold font-display text-foreground">Outreach History</h3>
              <Link href="/emails" className="text-xs text-primary hover:underline">Outreach Tab</Link>
            </div>
            {recentEmailsList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No outreach emails generated yet. Tailor a resume to write drafts.
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmailsList.map((email) => (
                  <div key={email.id} className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge className={
                        email.status === "sent" ? "bg-emerald-500/10 text-emerald-500 border-0" : 
                        email.status === "failed" ? "bg-rose-500/10 text-rose-500 border-0" : 
                        "bg-amber-500/10 text-amber-500 border-0"
                      }>
                        {email.status}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">{new Date(email.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground truncate">{email.subject}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">To: {email.toEmail || "None"}</p>
                    {email.job && (
                      <p className="text-[9px] text-primary/80 mt-1 truncate">For: {email.job.jobTitle} at {email.job.company}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
