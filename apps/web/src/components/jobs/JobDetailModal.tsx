'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  ExternalLink,
  ArrowRight,
  Save,
  MessageSquare,
  Sparkles,
  Award,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore, type Job } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface JobDetailModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export default function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  const router = useRouter()
  const { updateJobStatus, toggleJobSaved, setSelectedJobForResume } = useAppStore()

  // Local state for status and notes editing
  const [status, setStatus] = useState('saved')
  const [notes, setNotes] = useState('')
  const [isSavedStatus, setIsSavedStatus] = useState(false)

  // Populate local states when job changes
  useEffect(() => {
    if (job) {
      setStatus(job.status || 'saved')
      setNotes(job.notes || '')
      setIsSavedStatus(!!job.isSaved)
    }
  }, [job])

  if (!job) return null

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value
    setStatus(nextStatus)
    updateJobStatus(job.id, nextStatus, notes)
  }

  const handleSaveNotes = () => {
    updateJobStatus(job.id, status, notes)
  }

  const handleTailorResume = () => {
    setSelectedJobForResume({
      id: job.id,
      title: job.jobTitle,
      company: job.company,
      description: job.fullDescription || '',
    })
    onClose()
    router.push('/resumes')
  }

  const handleToggleSave = () => {
    toggleJobSaved(job.id)
    setIsSavedStatus(!isSavedStatus)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col justify-between overflow-hidden glass-card bg-zinc-950/95 border border-zinc-800/80 rounded-2xl shadow-2xl p-6">
        
        {/* Scrollable Main Section */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
          
          {/* Header section */}
          <DialogHeader className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                {job.company}
                <Badge variant="outline" className="px-2 py-0.5 rounded text-[9px] capitalize border-zinc-800 bg-zinc-900 text-zinc-300">
                  {job.source}
                </Badge>
              </span>
              <DialogTitle className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {job.jobTitle}
              </DialogTitle>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-zinc-900">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                  <MapPin className="size-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Location</p>
                  <p className="font-medium text-white truncate max-w-[120px]">{job.location || 'Remote/Global'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                  <DollarSign className="size-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Compensation</p>
                  <p className="font-medium text-white">{job.salary || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                  <Briefcase className="size-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Experience</p>
                  <p className="font-medium text-white">{job.experience || 'Flexible'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850">
                  <Award className="size-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">AI Score</p>
                  <p className="font-bold text-white">{job.relevanceScore}% Match</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Job description section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Job Description</h4>
            <div className="text-sm text-zinc-450 leading-relaxed bg-zinc-900/10 rounded-xl p-4 border border-zinc-900 max-h-[260px] overflow-y-auto text-zinc-300">
              {job.fullDescription ? (
                <div className="whitespace-pre-line">{job.fullDescription}</div>
              ) : (
                <span className="text-zinc-500 italic">No description provided. Click below to view the original listing.</span>
              )}
            </div>
          </div>

          {/* Skills Required */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Matching Skillsets</h4>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge
                  key={skill}
                  className="text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Application Tracking Sidepanel */}
          {isSavedStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-850">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Application Status</label>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 text-white rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="saved">Saved / Bookmarked</option>
                  <option value="resume_tailored">Resume Tailored</option>
                  <option value="applied">Applied</option>
                  <option value="email_sent">Outreach Sent</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <MessageSquare className="size-3.5" /> Notes & Follow-ups
                  </label>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleSaveNotes}
                    className="text-[10px] text-indigo-400 hover:bg-zinc-800 h-6 px-2"
                  >
                    <Save className="size-3 mr-1" /> Save Notes
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record application details, interviewer names, or reminders..."
                  className="h-14 min-h-14 max-h-14 bg-zinc-950 border-zinc-850 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer CTAs */}
        <DialogFooter className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-4 shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggleSave}
              className={cn(
                "h-10 px-4 rounded-lg text-xs font-medium border-zinc-800 bg-transparent transition-all",
                isSavedStatus ? "text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border-red-500/20" : "text-zinc-400 hover:bg-zinc-900"
              )}
            >
              {isSavedStatus ? 'Unsave Job' : 'Save/Bookmark'}
            </Button>

            <a
              href={job.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 px-4 items-center justify-center rounded-lg text-xs font-medium border border-zinc-800 text-zinc-300 hover:bg-zinc-900 transition-all gap-1.5"
            >
              <span>View Posting</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <Button
            onClick={handleTailorResume}
            className="h-10 px-4 rounded-lg text-xs font-semibold bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
          >
            <span>Tailor Resume for Job</span>
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
