'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Check, Edit2, Save, X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EmailPreviewProps {
  subject: string
  body: string
  toName?: string
  toEmail?: string
  tone?: string
  warnings?: string[]
  onUpdate?: (updatedSubject: string, updatedBody: string) => void
}

export function EmailPreview({
  subject: initialSubject,
  body: initialBody,
  toName = 'Hiring Manager',
  toEmail,
  tone = 'professional',
  warnings = [],
  onUpdate,
}: EmailPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [copied, setCopied] = useState(false)

  // Sync state when props change
  useEffect(() => {
    setSubject(initialSubject)
    setBody(initialBody)
  }, [initialSubject, initialBody])

  const handleCopy = async () => {
    try {
      const fullText = `Subject: ${subject}\n\n${body}`
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleSave = () => {
    setIsEditing(false)
    if (onUpdate) {
      onUpdate(subject, body)
    }
  }

  const handleCancel = () => {
    setSubject(initialSubject)
    setBody(initialBody)
    setIsEditing(false)
  }

  // Live analysis of body
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const hasPlaceholders = /\[.*?\]|\{.*?\}|<.*?>/g.test(body) || /placeholder/i.test(body)

  const activeWarnings = [...warnings]
  if (hasPlaceholders && !activeWarnings.some(w => w.includes('placeholder'))) {
    activeWarnings.push('Email body contains bracketed text or potential placeholders (e.g. [Name]).')
  }
  if (wordCount > 180 && !activeWarnings.some(w => w.includes('long'))) {
    activeWarnings.push(`Email is quite long (${wordCount} words). Recommended length is under 150 words.`)
  }

  return (
    <div className="glass-card overflow-hidden transition-all duration-300">
      
      {/* Header bar */}
      <div className="bg-muted/30 px-5 py-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <FileText className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Generated Email Draft</h3>
            <p className="text-[11px] text-muted-foreground">Tailored for outreach</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tone Badge */}
          <Badge variant="secondary" className="capitalize text-[11px] px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20">
            {tone}
          </Badge>
          {/* Word Count Badge */}
          <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5", wordCount > 180 ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "text-muted-foreground")}>
            {wordCount} words
          </Badge>
        </div>
      </div>

      {/* Warnings panel */}
      {activeWarnings.length > 0 && (
        <div className="bg-amber-500/5 border-b border-amber-500/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Outreach Safety Warnings:</span>
          </div>
          <ul className="list-disc pl-5 text-[11px] text-amber-400/90 space-y-1">
            {activeWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Email Body Card Form */}
      <div className="p-5 space-y-4">
        
        {/* Envelope Metadata */}
        <div className="space-y-2.5 text-xs bg-black/10 dark:bg-black/20 p-3.5 rounded-lg border border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-12 font-medium">To:</span>
            <span className="text-foreground font-semibold">
              {toName} {toEmail ? `<${toEmail}>` : ''}
            </span>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-border/20">
            <span className="text-muted-foreground w-12 pt-1 font-medium">Subject:</span>
            {isEditing ? (
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
                className="flex-1 text-xs h-7 px-2 border-indigo-500/30 focus-visible:ring-indigo-500"
                id="email-subject-input"
              />
            ) : (
              <span className="text-foreground font-semibold flex-1 pt-0.5 leading-normal">{subject}</span>
            )}
          </div>
        </div>

        {/* Email Content Box */}
        <div className="relative">
          {isEditing ? (
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write email contents..."
              className="min-h-[220px] text-sm leading-relaxed font-sans border-indigo-500/30 focus-visible:ring-indigo-500 bg-background/50 resize-y"
              id="email-body-input"
            />
          ) : (
            <div className="min-h-[220px] rounded-lg border border-border/30 bg-background/20 p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap select-text selection:bg-indigo-500/30 font-sans">
              {body}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 h-8 text-xs"
                id="email-preview-save-btn"
              >
                <Save className="size-3.5" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 text-xs text-muted-foreground"
                id="email-preview-cancel-btn"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-border/60 text-muted-foreground hover:text-foreground h-8 text-xs flex items-center gap-1.5"
              id="email-preview-edit-btn"
            >
              <Edit2 className="size-3.5" />
              Edit Draft
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isEditing}
            className={cn(
              "h-8 text-xs flex items-center gap-1.5 transition-all duration-300",
              copied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
            id="email-preview-copy-btn"
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                Copied Subject & Body!
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
