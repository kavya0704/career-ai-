'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore, type Job } from '@/store/app-store'
import { cn } from '@/lib/utils'

// ─── Source Colors ───────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  remoteok: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  naukri: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  wellfound: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  linkedin: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  indeed: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  default: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' },
}

function getSourceColors(source: string) {
  const key = source.toLowerCase().replace(/[^a-z]/g, '')
  return SOURCE_COLORS[key] || SOURCE_COLORS.default
}

// ─── Relative Time Heuristic ──────────────────────────────────────────────────

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`
    return `${diffDays}d ago`
  } catch {
    return dateStr
  }
}

interface JobCardProps {
  job: Job
  onOpenDetails: (job: Job) => void
}

export default function JobCard({ job, onOpenDetails }: JobCardProps) {
  const router = useRouter()
  const { toggleJobSaved, setSelectedJobForResume } = useAppStore()

  const srcColors = useMemo(() => getSourceColors(job.source), [job.source])
  const relativeTime = useMemo(() => getRelativeTime(job.postedDate), [job.postedDate])

  // Relevance Circle Color
  const scoreColors = useMemo(() => {
    const score = job.relevanceScore
    if (score >= 80) return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' }
    if (score >= 60) return { stroke: 'stroke-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' }
    return { stroke: 'stroke-red-500', text: 'text-red-400', bg: 'bg-red-500/10' }
  }, [job.relevanceScore])

  // Context chain trigger: updates Zustand store context and routes to Analyze
  const handleTailorResume = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedJobForResume({
      id: job.id,
      title: job.jobTitle,
      company: job.company,
      description: job.fullDescription || '',
    })
    router.push('/resumes') // Go to Resumes page to let user pick resume or click straight through to Analyze page
  }

  return (
    <div
      onClick={() => onOpenDetails(job)}
      className="glass-card hover-lift p-5 flex flex-col justify-between h-[280px] cursor-pointer group relative overflow-hidden"
    >
      {/* Glow highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header Info */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1.5 max-w-[80%]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              {job.company}
              <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border capitalize", srcColors.bg, srcColors.text, srcColors.border)}>
                {job.source}
              </span>
            </span>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight line-clamp-2">
              {job.jobTitle}
            </h3>
          </div>

          {/* Circular relevance percentage */}
          <div className="relative flex items-center justify-center size-12 shrink-0">
            <svg className="size-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-zinc-800"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className={scoreColors.stroke}
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * job.relevanceScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className={cn("absolute text-[10px] font-bold font-display", scoreColors.text)}>
              {job.relevanceScore}%
            </span>
          </div>
        </div>

        {/* Job metadata rows */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-zinc-500" />
              <span className="truncate max-w-[120px]">{job.location}</span>
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="size-3.5 text-zinc-500" />
              <span>{job.salary}</span>
            </span>
          )}
          {job.experience && (
            <span className="flex items-center gap-1">
              <Briefcase className="size-3.5 text-zinc-500" />
              <span>{job.experience}</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle Skills tags */}
      <div className="flex flex-wrap gap-1 py-3 my-1">
        {job.skills.slice(0, 4).map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className="text-[9px] px-2 py-0.5 rounded-full border-zinc-800 bg-zinc-900/40 text-zinc-300 font-medium"
          >
            {skill}
          </Badge>
        ))}
        {job.skills.length > 4 && (
          <Badge
            variant="outline"
            className="text-[9px] px-2 py-0.5 rounded-full border-zinc-850 bg-zinc-950 text-indigo-400 font-bold"
          >
            +{job.skills.length - 4}
          </Badge>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-zinc-850/40 pt-3.5 mt-auto">
        <span className="flex items-center gap-1 text-[10px] text-zinc-500">
          <Clock className="size-3" />
          {relativeTime}
        </span>

        <div className="flex items-center gap-2">
          {/* Heart Bookmark trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              toggleJobSaved(job.id)
            }}
            className={cn(
              "size-8 rounded-lg hover:bg-zinc-800/60 border border-zinc-850 transition-colors",
              job.isSaved ? "text-red-500 bg-red-500/5 hover:bg-red-500/10 border-red-500/20" : "text-zinc-400"
            )}
          >
            <Heart className={cn("size-4", job.isSaved && "fill-current")} />
          </Button>

          {/* Primary CTA: Tailor Resume */}
          <Button
            onClick={handleTailorResume}
            className="h-8 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500 hover:text-white text-indigo-400 transition-all flex items-center gap-1 group/btn"
          >
            <span>Tailor Resume</span>
            <ArrowRight className="size-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}
