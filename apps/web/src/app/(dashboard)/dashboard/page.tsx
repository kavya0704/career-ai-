'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Sparkles, Search, FileText, Mail, BarChart3, TrendingUp, 
  Layers, ArrowUpRight, Plus, Loader2, ArrowRight, Bell, AlertCircle,
  Briefcase, CheckCircle2, Award, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  pipeline: {
    saved: number
    resume_tailored: number
    applied: number
    email_sent: number
    replied: number
    interviewing: number
    offer: number
    rejected: number
  }
  totalJobs: number
  emails: {
    drafted: number
    sent: number
    replied: number
    replyRate: number
  }
  atsMetrics: {
    totalAnalyses: number
    avgOriginalScore: number
    avgOptimizedScore: number
    averageImprovement: number
  }
}

export default function DashboardOverviewPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch overview analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics/overview')
        if (res.ok) {
          const overview = await res.json()
          setData(overview)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const candidateName = session?.user?.name || 'Copilot User'

  // Pre-calculate funnel weights
  const funnelSteps = [
    { label: 'Saved', count: data?.pipeline.saved || 0, color: 'bg-zinc-650' },
    { label: 'Tailored', count: data?.pipeline.resume_tailored || 0, color: 'bg-indigo-500' },
    { label: 'Applied', count: data?.pipeline.applied || 0, color: 'bg-blue-500' },
    { label: 'Emailed', count: data?.pipeline.email_sent || 0, color: 'bg-purple-500' },
    { label: 'Interviewing', count: data?.pipeline.interviewing || 0, color: 'bg-amber-500 animate-pulse' },
    { label: 'Offers', count: data?.pipeline.offer || 0, color: 'bg-emerald-500' }
  ]

  const maxFunnelCount = Math.max(...funnelSteps.map(s => s.count), 1)

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 font-display">
              Welcome back, {candidateName}! <Sparkles className="size-5 text-indigo-400 animate-float" />
            </h2>
            <p className="text-xs text-zinc-400 leading-normal max-w-xl">
              Your AI agents are monitoring job opportunities. Take a look at your application funnel state and trigger follow-up outreach campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/jobs')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
              id="dashboard-job-discover-btn"
            >
              <Search className="size-3.5" />
              <span>Discover Jobs</span>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-full bg-indigo-500/5 blur-3xl rounded-full" />
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading overview analytics...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Avg ATS Score */}
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Average ATS Score</p>
                  <p className="text-3xl font-extrabold text-white mt-1.5">
                    {data?.atsMetrics.avgOptimizedScore || 0}%
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="size-3" />
                    +{data?.atsMetrics.averageImprovement || 0}% AI Improvement
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Award className="size-5" />
                </div>
              </CardContent>
            </Card>

            {/* Total Jobs */}
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Jobs Tracked</p>
                  <p className="text-3xl font-extrabold text-white mt-1.5">
                    {data?.totalJobs || 0}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Across 3 scraping channels
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Briefcase className="size-5" />
                </div>
              </CardContent>
            </Card>

            {/* Outreach Sent */}
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Outreach Sent</p>
                  <p className="text-3xl font-extrabold text-white mt-1.5">
                    {data?.emails.sent || 0}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {data?.emails.drafted || 0} total drafts compiled
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Mail className="size-5" />
                </div>
              </CardContent>
            </Card>

            {/* Reply Rate */}
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Recruiter Replies</p>
                  <p className="text-3xl font-extrabold text-white mt-1.5">
                    {data?.emails.replied || 0}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <CheckCircle2 className="size-3" />
                    {data?.emails.replyRate || 0}% Response Rate
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Funnel pipeline visualization (Left col) */}
            <Card className="glass-card lg:col-span-8 border border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="size-4 text-indigo-400" /> Application Funnel Pipeline
                </CardTitle>
                <CardDescription className="text-[11px] text-zinc-400">
                  Active distribution tracking your job applications stages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4">
                  {funnelSteps.map((step, idx) => {
                    const pct = Math.round((step.count / maxFunnelCount) * 100)
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-zinc-300">{step.label}</span>
                          <span className="text-white bg-zinc-900 border border-border/20 px-2 py-0.5 rounded text-[10px]">
                            {step.count} {step.count === 1 ? 'position' : 'positions'}
                          </span>
                        </div>
                        <div className="h-3 w-full bg-zinc-900/50 rounded-lg overflow-hidden border border-border/15">
                          <div 
                            className={cn("h-full rounded-lg transition-all duration-500", step.color)}
                            style={{ width: `${step.count > 0 ? Math.max(pct, 5) : 0}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Feed (Right col) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Quick Actions Card */}
              <Card className="glass-card border border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white">Quick Tasks</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-400">
                    Jump straight to core features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <Button
                    onClick={() => router.push('/jobs')}
                    variant="outline"
                    className="w-full text-xs h-9 justify-between border-border/50 text-zinc-300 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="size-3.5 text-indigo-400" /> Scan Scraper Feeds
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </Button>

                  <Button
                    onClick={() => router.push('/resumes')}
                    variant="outline"
                    className="w-full text-xs h-9 justify-between border-border/50 text-zinc-300 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="size-3.5 text-violet-400" /> Tailor Resume to JD
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </Button>

                  <Button
                    onClick={() => router.push('/emails/compose')}
                    variant="outline"
                    className="w-full text-xs h-9 justify-between border-border/50 text-zinc-300 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="size-3.5 text-cyan-400" /> Compose Cold Outreach
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>

              {/* Follow-up Alerts Widget */}
              <Card className="glass-card border border-border/40 bg-zinc-950/20">
                <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="size-4 text-indigo-400" /> Reminders
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 bg-indigo-500/5 text-indigo-400">
                    System Feed
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2.5 p-2.5 rounded-lg border border-border/20 bg-background/25">
                    <Clock className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h5 className="text-[11px] font-bold text-white">Outreach Follow-ups</h5>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        Check draft status and follow up on sent applications after 3 business days.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-2.5 rounded-lg border border-border/20 bg-background/25">
                    <Award className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h5 className="text-[11px] font-bold text-white font-display">Target Score Goal</h5>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        Keep ATS scores above 80% to maximize recruiter interview response rates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}
