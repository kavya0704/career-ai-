'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Upload,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface DBResume {
  id: string
  name: string
  rawText: string
  isBase: boolean
  createdAt: string
}

export default function ResumesPage() {
  const router = useRouter()
  const { selectedJobForResume, setSelectedJobForResume } = useAppStore()
  
  const [resumes, setResumes] = useState<DBResume[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Selection state for tailoring
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  // Fetch all resumes on mount
  const fetchResumes = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/resumes')
      if (res.ok) {
        const data = await res.json()
        setResumes(data)
        // Auto-select base resume or first resume
        const base = data.find((r: any) => r.isBase)
        if (base) {
          setSelectedResumeId(base.id)
        } else if (data.length > 0) {
          setSelectedResumeId(data[0].id)
        }
      } else {
        throw new Error('Failed to fetch resumes')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading resumes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  // Handle setting a resume as Base
  const handleSetBase = async (id: string) => {
    setActionLoadingId(id)
    setErrorMsg(null)
    try {
      // Find the resume data
      const target = resumes.find((r) => r.id === id)
      if (!target) return

      // POST to resumes to update base status (the endpoint sets isBase and turns off others in transaction)
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: target.name,
          rawText: target.rawText,
          isBase: true,
        }),
      })

      if (res.ok) {
        await fetchResumes()
      } else {
        throw new Error('Failed to update base status')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating base resume.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle direct file upload in library
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension !== 'pdf' && extension !== 'docx') {
      setErrorMsg('Unsupported format. Only PDF and DOCX files are allowed.')
      return
    }

    setUploadLoading(true)
    setErrorMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // 1. Parse file content
      const parseRes = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      })

      if (!parseRes.ok) {
        const err = await parseRes.json()
        throw new Error(err.error || 'Failed to parse file.')
      }

      const { rawText } = await parseRes.json()

      // 2. Save parsed resume
      const saveRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          rawText,
          isBase: resumes.length === 0, // Make base if it's the first resume
        }),
      })

      if (saveRes.ok) {
        await fetchResumes()
      } else {
        throw new Error('Failed to save resume.')
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading resume.')
    } finally {
      setUploadLoading(false)
    }
  }

  // Route to Analyze page with context
  const handleProceedToTailor = () => {
    if (!selectedResumeId || !selectedJobForResume) return
    router.push(`/analyze?resumeId=${selectedResumeId}&jobId=${selectedJobForResume.id}`)
  }

  return (
    <div className="space-y-6">
      
      {/* ─── Context-Chain Banner ─── */}
      {selectedJobForResume && (
        <Card className="border border-indigo-500/30 bg-indigo-500/5 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Resume Tailoring Context Active</h4>
              <p className="text-xs text-zinc-400">
                You selected <span className="text-indigo-400 font-semibold">{selectedJobForResume.title}</span> at <span className="text-indigo-400 font-semibold">{selectedJobForResume.company}</span>. Choose a resume below to tailor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedJobForResume(null)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Clear Context
            </Button>
            
            <Button
              onClick={handleProceedToTailor}
              disabled={!selectedResumeId}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/15"
            >
              <span>Proceed to Tailoring</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Main Library Interface ─── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 font-display">
            Resume Library <FileCheck className="size-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Manage and set your master resumes for tailoring tasks.</p>
        </div>

        <div>
          <input
            type="file"
            id="lib-resume-upload"
            accept=".pdf,.docx"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={uploadLoading}
          />
          <label 
            htmlFor="lib-resume-upload"
            className={cn(
              "bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer border border-indigo-600 shadow-sm transition-colors shadow-indigo-500/10",
              uploadLoading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {uploadLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            <span>Upload Resume</span>
          </label>

        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="glass-card p-5 h-[180px] animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="size-10 rounded bg-zinc-850" />
                <div className="h-6 w-16 bg-zinc-850 rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-zinc-850 rounded-full" />
              <div className="h-8 w-24 bg-zinc-850 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[260px]">
          <div className="size-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 animate-pulse">
            <FileText className="size-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">No Resumes Found</h4>
          <p className="text-xs text-zinc-550 max-w-sm">Upload your first PDF or Word document resume using the button above to begin tailoring.</p>
        </div>
      ) : (
        /* Resume List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => {
            const isSelected = selectedResumeId === resume.id
            const isBase = resume.isBase
            
            return (
              <div
                key={resume.id}
                onClick={() => setSelectedResumeId(resume.id)}
                className={cn(
                  "glass-card p-5 h-[180px] flex flex-col justify-between hover-lift cursor-pointer transition-all relative",
                  isSelected
                    ? "border-primary/60 shadow-lg shadow-indigo-500/5 bg-zinc-900/10"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/5"
                )}
              >
                {/* Upper row: icon and base indicator */}
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "p-2.5 rounded-lg border text-indigo-400 bg-indigo-500/5 border-indigo-500/20"
                  )}>
                    <FileText className="size-5" />
                  </div>

                  <div className="flex gap-1.5">
                    {isBase && (
                      <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                        Master Base
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Resume Title */}
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight truncate">
                    {resume.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between border-t border-zinc-850/40 pt-3 mt-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={isBase || actionLoadingId === resume.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetBase(resume.id)
                    }}
                    className={cn(
                      "text-[10px] h-7 px-2 border rounded border-zinc-850 hover:bg-zinc-800",
                      isBase ? "text-emerald-400 border-emerald-500/20" : "text-zinc-400"
                    )}
                  >
                    {actionLoadingId === resume.id ? (
                      <Loader2 className="size-3 animate-spin mr-1" />
                    ) : isBase ? (
                      <Check className="size-3 mr-1" />
                    ) : null}
                    {isBase ? 'Master Set' : 'Set Master'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
