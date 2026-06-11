'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { EmailPreview } from '@/components/email/EmailPreview'
import { EmailConfirmGate } from '@/components/email/EmailConfirmGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, Sparkles, Loader2, AlertCircle, ArrowLeft, Send, CheckCircle2,
  Briefcase, Building2, User, HelpCircle, RefreshCw, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PastAnalysis {
  id: string
  createdAt: string
  job?: {
    company: string
    jobTitle: string
  }
  resume?: {
    name: string
  }
}

export default function ComposePage() {
  const router = useRouter()
  const { analysisForEmail } = useAppStore()
  
  // Input Form States
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('')
  const [toName, setToName] = useState('Hiring Manager')
  const [toEmail, setToEmail] = useState('')
  const [tone, setTone] = useState('professional')
  const [customInstruction, setCustomInstruction] = useState('')
  
  // Past Analyses for Fallback
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  
  // Pipeline States
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  // Generated Email Draft State
  const [generatedEmail, setGeneratedEmail] = useState<any>(null)

  // Load Past Analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoadingAnalyses(true)
      try {
        const res = await fetch('/api/analyses')
        if (res.ok) {
          const data = await res.json()
          setPastAnalyses(data)
          
          // Pre-select from active store context first, otherwise fallback to most recent analysis
          if (analysisForEmail?.id) {
            setSelectedAnalysisId(analysisForEmail.id)
          } else if (data.length > 0) {
            setSelectedAnalysisId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load analyses:', err)
      } finally {
        setLoadingAnalyses(false)
      }
    }
    fetchAnalyses()
  }, [analysisForEmail])

  // Synchronize custom instructions if store changes
  useEffect(() => {
    if (analysisForEmail?.topAchievements && analysisForEmail.topAchievements.length > 0) {
      const achievementContext = `Focus on my key achievements: \n- ${analysisForEmail.topAchievements.join('\n- ')}`
      setCustomInstruction(achievementContext)
    }
  }, [analysisForEmail])

  const handleGenerate = async () => {
    if (!selectedAnalysisId) {
      setError('Please select a tailored resume analysis context.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedEmail(null)
    setSendSuccess(false)

    try {
      const res = await fetch('/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: selectedAnalysisId,
          tone,
          toEmail: toEmail.trim() || undefined,
          toName: toName.trim() || undefined,
          customInstruction: customInstruction.trim() || undefined
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate outreach email.')
      }

      const emailData = await res.json()
      setGeneratedEmail(emailData)
    } catch (err: any) {
      setError(err.message || 'Error occurred during generation.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = async (smtpConfig?: any) => {
    if (!generatedEmail?.id) return
    
    setIsSending(true)
    setSendError(null)

    try {
      const res = await fetch(`/api/emails/${generatedEmail.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: toEmail.trim() || undefined,
          toName: toName.trim() || undefined,
          smtpConfig
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send the email.')
      }

      setSendSuccess(true)
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/emails')
      }, 2000)
    } catch (err: any) {
      setSendError(err.message || 'SMTP delivery failed. Check your credentials and server details.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveDraft = () => {
    // Already saved to database when generated
    router.push('/emails')
  }

  // Find selected context metadata for display
  const activeContext = pastAnalyses.find(a => a.id === selectedAnalysisId)

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-accent border border-border/25 size-9 rounded-lg"
          id="email-compose-back-btn"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 font-display">
            Cold Outreach Generator <Mail className="size-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Compose high-conversion outreach emails personalized using your tailored resume achievements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Composer Options */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass-card border border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="size-4 text-indigo-400" /> Context & Personalization
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-400">
                Link this email to an existing tailoring analysis context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Context Picker */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Select Job Context</span>
                {loadingAnalyses ? (
                  <div className="h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3 gap-2 text-xs text-zinc-500">
                    <Loader2 className="size-3.5 animate-spin" /> Loading analyses...
                  </div>
                ) : pastAnalyses.length === 0 ? (
                  <div className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400 text-center">
                    No tailored resumes found. Please build a tailored resume first to generate outreach pitches.
                  </div>
                ) : (
                  <select
                    value={selectedAnalysisId}
                    onChange={(e) => setSelectedAnalysisId(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/60 text-white rounded-lg text-xs outline-none cursor-pointer"
                    id="analysis-context-select"
                  >
                    {pastAnalyses.map((analysis) => (
                      <option key={analysis.id} value={analysis.id} className="bg-zinc-950">
                        {analysis.job?.company || 'Unknown'} — {analysis.job?.jobTitle || 'Role'} ({new Date(analysis.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Contact Name</span>
                  <Input
                    placeholder="e.g. Recruiting Manager"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    className="h-9 text-xs focus-visible:ring-indigo-500"
                    id="recipient-name-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Contact Email</span>
                  <Input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="h-9 text-xs focus-visible:ring-indigo-500"
                    id="recipient-email-input"
                  />
                </div>
              </div>

              {/* Tone Selection Cards */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Select Tone</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'professional', label: 'Professional', desc: 'Formal, polite' },
                    { id: 'friendly', label: 'Friendly', desc: 'Warm, inviting' },
                    { id: 'bold', label: 'Bold', desc: 'Direct, punchy' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left flex flex-col justify-between h-20 transition-all select-none",
                        tone === t.id 
                          ? "bg-indigo-500/10 border-indigo-500/40 text-foreground ring-1 ring-indigo-500/20" 
                          : "border-border/30 hover:bg-accent/40 text-muted-foreground"
                      )}
                      id={`tone-btn-${t.id}`}
                    >
                      <span className={cn("text-xs font-semibold", tone === t.id ? "text-indigo-400" : "text-zinc-300")}>
                        {t.label}
                      </span>
                      <span className="text-[9px] leading-tight text-zinc-500">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements & Instructions Text Area */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Additional Context / Instructions</span>
                <Textarea
                  placeholder="Specify key details to mention, call-to-actions, or paste achievements..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="min-h-[110px] text-xs resize-none focus-visible:ring-indigo-500"
                  id="custom-instructions-input"
                />
              </div>

            </CardContent>
            <CardFooter className="flex justify-end pt-2 border-t border-border/20">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedAnalysisId}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium h-9 px-5 flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
                id="generate-email-btn"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Drafting Email...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Generate Outreach Pitch
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error display */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Preview & Dispatch Gate */}
        <div className="lg:col-span-7 space-y-6">
          
          {isGenerating && (
            <Card className="glass-card border border-border/40 p-16 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative">
                <div className="size-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <Mail className="size-4 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-white">Drafting Cold Pitch...</h4>
                <p className="text-zinc-550 leading-normal max-w-xs pt-1">
                  Our LLM is personalizing the outreach context, matching key bullets to the target JD, and crafting conversational copy.
                </p>
              </div>
            </Card>
          )}

          {sendSuccess && (
            <Card className="border border-emerald-500/30 bg-emerald-500/5 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Email Sent Successfully!</h4>
                <p className="text-xs text-zinc-400 leading-normal">
                  Outreach email dispatched. Redirecting to draft history logs...
                </p>
              </div>
            </Card>
          )}

          {generatedEmail && !sendSuccess && (
            <div className="space-y-6 animate-fade-in-up">
              
              {/* Preview Form */}
              <EmailPreview
                subject={generatedEmail.subject}
                body={generatedEmail.body}
                toName={toName}
                toEmail={toEmail}
                tone={tone}
                warnings={generatedEmail.warnings}
                onUpdate={(newSub: string, newBody: string) => {
                  setGeneratedEmail((prev: any) => prev ? { ...prev, subject: newSub, body: newBody } : null)
                }}
              />

              {/* Confirm send error */}
              {sendError && (
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Dispatch Error:</span> {sendError}
                  </div>
                </div>
              )}

              {/* Double Confirm Send Check */}
              <EmailConfirmGate
                emailId={generatedEmail.id}
                toEmail={toEmail}
                toName={toName}
                subject={generatedEmail.subject}
                onSend={handleSend}
                onSaveDraft={handleSaveDraft}
                isSending={isSending}
              />
            </div>
          )}

          {!generatedEmail && !isGenerating && !sendSuccess && (
            <Card className="border border-dashed border-border/40 bg-zinc-950/20 p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Mail className="size-10 text-muted-foreground/30 mb-3" />
              <h4 className="text-xs font-semibold text-zinc-400 mb-1">Preview Outreach Email</h4>
              <p className="text-[11px] max-w-xs text-zinc-550">
                Setup your context and click the "Generate" button on the left to draft your customized email pitch.
              </p>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}
