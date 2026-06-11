'use client'

import React, { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, Award, Mail, Calendar, ChevronRight,
  TrendingDown, CheckCircle2, RefreshCw, AlertCircle, Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  timeline: Array<{
    date: string
    jobsAdded: number
    emailsSent: number
  }>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/overview')
      if (res.ok) {
        const overview = await res.json()
        setData(overview)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Calculate chart max heights
  const timelineMax = data?.timeline 
    ? Math.max(...data.timeline.map(t => Math.max(t.jobsAdded, t.emailsSent)), 1)
    : 1

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            Performance Analytics <BarChart3 className="size-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Track your ATS optimization score improvement and cold outreach response conversions.
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="border-border/60 hover:text-foreground h-8 text-xs flex items-center gap-1.5"
          id="analytics-refresh-btn"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh Stats
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading charts and reports...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Top Row: General stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ATS Score Improvement */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">ATS Score Improvement</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    +{data?.atsMetrics.averageImprovement || 0}%
                  </span>
                  <span className="text-xs text-zinc-400">average lift</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/25">
                  <span className="text-muted-foreground">Original Average:</span>
                  <span className="font-semibold text-red-400">{data?.atsMetrics.avgOriginalScore || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Optimized Average:</span>
                  <span className="font-semibold text-emerald-400">{data?.atsMetrics.avgOptimizedScore || 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Email Conversion Rates */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Outreach Funnel</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {data?.emails.replyRate || 0}%
                  </span>
                  <span className="text-xs text-zinc-400">reply conversion</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/25">
                  <span className="text-muted-foreground">Total Dispatched:</span>
                  <span className="font-semibold text-white">{data?.emails.sent || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Responses Logged:</span>
                  <span className="font-semibold text-emerald-400">{data?.emails.replied || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Database Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {data?.totalJobs || 0}
                  </span>
                  <span className="text-xs text-zinc-400">positions tracked</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/25">
                  <span className="text-muted-foreground">Resume Analyses:</span>
                  <span className="font-semibold text-white">{data?.atsMetrics.totalAnalyses || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Drafts:</span>
                  <span className="font-semibold text-white">{data?.emails.drafted || 0}</span>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SVG Timeline Chart */}
            <Card className="glass-card border border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white">Weekly Activity Timeline</CardTitle>
                <CardDescription className="text-[11px] text-zinc-400">
                  Scraped jobs vs. outreach emails sent over the last 7 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {data?.timeline && data.timeline.length > 0 ? (
                  <div className="space-y-6">
                    {/* Visual Chart Bars */}
                    <div className="h-44 flex items-end justify-between gap-4 px-2 pt-4 border-b border-border/20">
                      {data.timeline.map((day, idx) => {
                        const jobHeight = Math.round((day.jobsAdded / timelineMax) * 100)
                        const emailHeight = Math.round((day.emailsSent / timelineMax) * 100)
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Hover info tooltip */}
                            <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-transform bg-zinc-950 border border-border/30 px-2.5 py-1.5 rounded text-[9px] text-zinc-300 pointer-events-none z-10 space-y-0.5">
                              <p className="font-bold text-white">{day.date}</p>
                              <p>Jobs Added: {day.jobsAdded}</p>
                              <p>Emails Sent: {day.emailsSent}</p>
                            </div>
                            
                            {/* Side-by-side bars */}
                            <div className="flex items-end gap-1 w-full justify-center">
                              {/* Jobs Added Bar */}
                              <div 
                                className="w-2 md:w-3 bg-indigo-500 rounded-t-sm transition-all duration-500"
                                style={{ height: `${day.jobsAdded > 0 ? Math.max(jobHeight, 4) : 0}%` }}
                              />
                              {/* Emails Sent Bar */}
                              <div 
                                className="w-2 md:w-3 bg-cyan-400 rounded-t-sm transition-all duration-500"
                                style={{ height: `${day.emailsSent > 0 ? Math.max(emailHeight, 4) : 0}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Timeline labels */}
                    <div className="flex justify-between px-2 text-[10px] text-muted-foreground font-semibold">
                      {data.timeline.map((day, idx) => (
                        <span key={idx} className="flex-1 text-center truncate">{day.date}</span>
                      ))}
                    </div>

                    {/* Legend keys */}
                    <div className="flex items-center gap-4 justify-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <span className="size-2 bg-indigo-500 rounded-full" /> Jobs Added
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <span className="size-2 bg-cyan-400 rounded-full" /> Emails Sent
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">No timeline activity logged.</div>
                )}
              </CardContent>
            </Card>

            {/* Funnel chart (SVG/CSS) */}
            <Card className="glass-card border border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white">Outreach Conversion Funnel</CardTitle>
                <CardDescription className="text-[11px] text-zinc-400">
                  Step-by-step conversion from generating drafts to receiving manager responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                {[
                  { label: 'Drafted Pitches', count: data?.emails.drafted || 0, pct: 100, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' },
                  { label: 'Sent Outreach', count: data?.emails.sent || 0, pct: data?.emails.drafted ? Math.round((data.emails.sent / data.emails.drafted) * 100) : 0, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' },
                  { label: 'Replies Logged', count: data?.emails.replied || 0, pct: data?.emails.sent ? Math.round((data.emails.replied / data.emails.sent) * 100) : 0, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' }
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">{step.label}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {step.count} ({step.pct}% rate)
                      </span>
                    </div>
                    <div className="h-6 w-full rounded-lg border border-border/20 bg-zinc-900/50 overflow-hidden flex items-center px-3 justify-between relative">
                      <div 
                        className={cn("absolute left-0 top-0 h-full opacity-15", step.color.split(" ")[0])}
                        style={{ width: `${step.pct}%` }}
                      />
                      <span className="text-[10px] font-bold text-white z-10">{step.count} records</span>
                      <span className="text-[10px] font-bold text-muted-foreground z-10">Step {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

        </div>
      )}

    </div>
  )
}
