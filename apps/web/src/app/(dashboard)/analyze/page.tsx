'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Mail,
  ChevronRight,
  RefreshCw,
  FileText,
  FileEdit,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import ScoreCard from '@/components/ScoreCard'
import GapAnalysis from '@/components/GapAnalysis'
import SideBySideDiff from '@/components/SideBySideDiff'
import { cn } from '@/lib/utils'


interface DBResume {
  id: string
  name: string
  rawText: string
  isBase: boolean
}

export default function AnalyzePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryResumeId = searchParams.get('resumeId')
  const queryJobId = searchParams.get('jobId')

  const { selectedJobForResume, setAnalysisForEmail } = useAppStore()

  // App States
  const [resumes, setResumes] = useState<DBResume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [jdText, setJdText] = useState('')
  const [loadingResumes, setLoadingResumes] = useState(true)

  // Pipeline States
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0) // 0: input, 1: parse, 2: score/gaps, 3: bullet tailor, 4: complete, 5: error
  const [progressMsg, setProgressMsg] = useState('')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  // Analysis Results
  const [resumeProfile, setResumeProfile] = useState<any>(null)
  const [jobDescriptionProfile, setJobDescriptionProfile] = useState<any>(null)
  const [initialScore, setInitialScore] = useState<any>(null)
  const [gaps, setGaps] = useState<any[]>([])
  const [tailoredResume, setTailoredResume] = useState<any>(null)
  const [tailoredScore, setTailoredScore] = useState<any>(null)

  // Active Tab View in Results
  const [activeTab, setActiveTab] = useState<'score' | 'gaps' | 'diff'>('score')

  // Load user resumes and pre-fill JD if active context exists
  useEffect(() => {
    const init = async () => {
      setLoadingResumes(true)
      try {
        const res = await fetch('/api/resumes')
        if (res.ok) {
          const data = await res.json()
          setResumes(data)

          // Preselect resume
          if (queryResumeId) {
            setSelectedResumeId(queryResumeId)
          } else {
            const base = data.find((r: any) => r.isBase)
            if (base) setSelectedResumeId(base.id)
            else if (data.length > 0) setSelectedResumeId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Error loading resumes:', err)
      } finally {
        setLoadingResumes(false)
      }
    }

    init()

    // Pre-fill Job Description from active context
    if (selectedJobForResume) {
      setJdText(selectedJobForResume.description)
    }
  }, [queryResumeId, selectedJobForResume])

  // Run the end-to-end tailoring pipeline
  const runPipeline = async () => {
    if (!selectedResumeId || !jdText.trim()) return

    const selectedResume = resumes.find((r) => r.id === selectedResumeId)
    if (!selectedResume) return

    setStage(1)
    setProgressMsg('Initializing Pipeline: Structuring resume profile & job description...')
    setErrorDetails(null)

    try {
      // ─── STAGE 1 & 2: EVALUATE INITIAL MATCH & GAPS ───
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: selectedResume.rawText,
          jdText: jdText.trim(),
        }),
      })

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json()
        throw new Error(err.error || 'Failed to complete resume analysis.')
      }

      const analyzeData = await analyzeRes.json()
      setResumeProfile(analyzeData.resumeProfile)
      setJobDescriptionProfile(analyzeData.jobDescriptionProfile)
      setInitialScore(analyzeData.initialScore)
      setGaps(analyzeData.gaps)

      // ─── STAGE 3: RUN RESUME TAILORING ───
      setStage(3)
      setProgressMsg('Optimizing work experience bullets & adjusting skills density...')

      const tailorRes = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeProfile: analyzeData.resumeProfile,
          jobDescriptionProfile: analyzeData.jobDescriptionProfile,
        }),
      })

      if (!tailorRes.ok) {
        const err = await tailorRes.json()
        throw new Error(err.error || 'Failed to complete resume tailoring.')
      }

      const tailorData = await tailorRes.json()
      setTailoredResume(tailorData.tailoredResume)
      setTailoredScore(tailorData.tailoredScore)

      setStage(4)
      setProgressMsg('Complete!')

    } catch (err: any) {
      setStage(5)
      setErrorDetails(err.message || 'Error occurred during resume tailoring pipeline.')
    }
  }

  // Handover context chain to Outreach Email module
  const handleProceedToEmail = () => {
    if (!tailoredResume || !tailoredScore) return

    // Extract top achievements to pre-fill email achievements
    const achievements = tailoredResume.tailoredExperience?.[0]?.bullets?.slice(0, 2).map((b: any) => b.tailored) || []

    setAnalysisForEmail({
      id: `analysis-${Date.now()}`,
      topAchievements: achievements,
      atsScore: tailoredScore.overallScore,
      company: selectedJobForResume?.company || jobDescriptionProfile?.company || 'Target Company',
      role: selectedJobForResume?.title || jobDescriptionProfile?.jobTitle || 'Target Role',
    })

    router.push('/emails/compose')
  }

  return (
    <div className="space-y-6">
      
      {/* ─── PAGE TITLE ─── */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 font-display">
          Resume Tailoring Engine <FileEdit className="size-5 text-indigo-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Scrutinize job description compatibility, target ATS keywords, and rewrite bullets truth-validated.
        </p>
      </div>

      {/* ─── INPUT PANEL (Stage 0) ─── */}
      {stage === 0 && (
        <Card className="glass-card border border-border/40 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Resume Selector */}
            <div className="lg:col-span-1 space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Select Resume from Library</label>
              {loadingResumes ? (
                <div className="h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3 gap-2 text-xs text-zinc-500">
                  <Loader2 className="size-4 animate-spin" /> Loading library...
                </div>
              ) : resumes.length === 0 ? (
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-850 text-xs text-zinc-500 text-center">
                  No resumes found. Go to <span className="text-indigo-400 underline cursor-pointer" onClick={() => router.push('/resumes')}>Resumes</span> to upload.
                </div>
              ) : (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/60 text-white rounded-lg text-sm outline-none cursor-pointer"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-950">
                      {r.name} {r.isBase ? '(Master)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Job Description Text */}
            <div className="lg:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Target Job Description (JD)</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description details here..."
                className="w-full h-44 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/60 text-white rounded-xl outline-none p-4 text-sm resize-none"
              />
            </div>

          </div>

          <CardFooter className="flex justify-end pt-4 border-t border-zinc-900 px-0">
            <Button
              onClick={runPipeline}
              disabled={!selectedResumeId || !jdText.trim()}
              className="bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/10 flex items-center gap-2 h-10 px-6"
            >
              <span>Initiate LLM Tailoring</span>
              <Sparkles className="size-4 animate-pulse" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── LOADING STAGES PANEL (Stage 1-3) ─── */}
      {(stage === 1 || stage === 3) && (
        <Card className="glass-card border border-border/40 p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="size-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="size-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-base font-bold text-white">AI Engine Processing</h4>
            <p className="text-xs text-indigo-400 font-semibold animate-pulse">{progressMsg}</p>
            <p className="text-[10px] text-zinc-550 pt-2">Please do not refresh. Groq LLM pipelines structure and truth-validate bullets against your master resume experience profiles.</p>
          </div>
        </Card>
      )}

      {/* ─── ERROR STAGE (Stage 5) ─── */}
      {stage === 5 && (
        <Card className="glass-card border border-border/40 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-base font-bold text-white">Pipeline Execution Error</h4>
            <p className="text-xs text-red-400">{errorDetails || 'An error occurred during LLM API callbacks.'}</p>
          </div>
          <Button
            onClick={() => setStage(0)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-9 rounded-lg"
          >
            Reset Form
          </Button>
        </Card>
      )}

      {/* ─── RESULTS PANEL (Stage 4) ─── */}
      {stage === 4 && (
        <div className="space-y-6">
          {/* Handover Outreach Banner */}
          <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Resume Tailoring Completed Successfully!</h4>
                <p className="text-xs text-zinc-400">
                  Target Score optimized from <span className="text-red-400 font-bold">{initialScore?.overallScore}%</span> to <span className="text-emerald-400 font-bold">{tailoredScore?.overallScore}%</span>. Ready to generate outreach emails.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setStage(0)}
                className="border-zinc-800 bg-transparent text-zinc-400 text-xs h-9 rounded-lg hover:bg-zinc-900"
              >
                <RefreshCw className="size-3.5 mr-1" /> Re-Tailor
              </Button>
              
              <Button
                onClick={handleProceedToEmail}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
              >
                <span>Generate Outreach Email</span>
                <Mail className="size-4" />
              </Button>
            </div>
          </Card>

          {/* Results Tab Selector */}
          <div className="flex border-b border-zinc-900 gap-6">
            {[
              { id: 'score', label: 'Match Scores' },
              { id: 'gaps', label: 'Gaps Analysis' },
              { id: 'diff', label: 'Bullet Diff rewrites' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "pb-3 text-sm font-semibold transition-all relative",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'score' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScoreCard score={initialScore} title="Original Match Profile" animate={false} />
                <ScoreCard score={tailoredScore} title="Tailored Match Profile (After AI edits)" />
              </div>
            )}
            
            {activeTab === 'gaps' && (
              <div className="h-[520px]">
                <GapAnalysis gaps={gaps} />
              </div>
            )}

            {activeTab === 'diff' && (
              <SideBySideDiff tailoredResume={tailoredResume} />
            )}
          </div>
        </div>
      )}

    </div>
  )
}
