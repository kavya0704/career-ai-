'use client'

import React, { useState } from 'react'
import { ShieldAlert, Send, Settings2, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SmtpCredentials {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromName?: string
}

interface EmailConfirmGateProps {
  emailId: string
  toEmail: string
  toName?: string
  subject: string
  onSend: (smtpConfig?: SmtpCredentials) => Promise<void>
  onSaveDraft?: () => void
  isSending?: boolean
}

export function EmailConfirmGate({
  emailId,
  toEmail,
  toName = 'Hiring Manager',
  subject,
  onSend,
  onSaveDraft,
  isSending = false,
}: EmailConfirmGateProps) {
  const [confirmRecipient, setConfirmRecipient] = useState(false)
  const [confirmPlaceholders, setConfirmPlaceholders] = useState(false)
  const [showSmtpSettings, setShowSmtpSettings] = useState(false)
  
  // Custom SMTP state
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(465)
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')

  const canSend = confirmRecipient && confirmPlaceholders && !isSending

  const handleSendClick = async () => {
    if (!canSend) return

    let smtpConfig: SmtpCredentials | undefined = undefined

    if (smtpHost && smtpUser && smtpPass) {
      smtpConfig = {
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        fromName: smtpFromName || undefined
      }
    }

    await onSend(smtpConfig)
  }

  return (
    <div className="glass-card border-red-500/20 bg-card/40 overflow-hidden transition-all duration-300 relative">
      
      {/* Red/Orange Warning Banner at top */}
      <div className="bg-gradient-to-r from-red-500/15 via-amber-500/10 to-transparent p-4 border-b border-red-500/20 flex items-start gap-3">
        <ShieldAlert className="size-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 font-display">
            Cold Outreach Safety Verification Gate
          </h4>
          <p className="text-[11px] text-zinc-400 leading-normal max-w-xl">
            This module connects directly to your mail server to dispatch cold pitches. Automated email sends can damage sender domain reputation if they contain placeholders or inaccurate details. Review and authorize this send below.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Verification Checkboxes */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-foreground">Double-Confirmation Checklist:</h5>
          
          <label 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-200",
              confirmRecipient 
                ? "bg-indigo-500/5 border-indigo-500/30 text-foreground" 
                : "border-border/30 hover:bg-accent/40 text-muted-foreground"
            )}
            onClick={() => setConfirmRecipient(!confirmRecipient)}
          >
            <div className={cn(
              "size-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors",
              confirmRecipient ? "bg-indigo-500 border-indigo-500 text-white" : "border-muted-foreground/50 bg-background"
            )}>
              {confirmRecipient && <Check className="size-3 stroke-[3]" />}
            </div>
            <div className="text-xs leading-normal">
              <span className="font-semibold text-zinc-300">Verify Recipient:</span> I confirm that the recipient's name <span className="text-indigo-400 font-medium">"{toName}"</span> and target address <span className="text-indigo-400 font-medium">"{toEmail}"</span> are correct for this job application.
            </div>
          </label>

          <label 
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all duration-200",
              confirmPlaceholders 
                ? "bg-indigo-500/5 border-indigo-500/30 text-foreground" 
                : "border-border/30 hover:bg-accent/40 text-muted-foreground"
            )}
            onClick={() => setConfirmPlaceholders(!confirmPlaceholders)}
          >
            <div className={cn(
              "size-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors",
              confirmPlaceholders ? "bg-indigo-500 border-indigo-500 text-white" : "border-muted-foreground/50 bg-background"
            )}>
              {confirmPlaceholders && <Check className="size-3 stroke-[3]" />}
            </div>
            <div className="text-xs leading-normal">
              <span className="font-semibold text-zinc-300">Clean Pitch Check:</span> I have read the email content and verify that all brackets, curly braces, and template placeholder tokens (like [Company] or [Your Name]) have been completely removed or replaced with real details.
            </div>
          </label>
        </div>

        {/* Custom SMTP accordion */}
        <div className="border border-border/30 rounded-lg overflow-hidden bg-black/10">
          <button
            type="button"
            onClick={() => setShowSmtpSettings(!showSmtpSettings)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all"
            id="smtp-config-toggle"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="size-4 text-indigo-400" />
              Configure Custom SMTP Credentials for this Send
            </span>
            <span className="text-[10px] text-indigo-400 underline">
              {showSmtpSettings ? 'Collapse' : 'Expand Settings'}
            </span>
          </button>

          {showSmtpSettings && (
            <div className="p-4 border-t border-border/20 space-y-4 animate-scale-in">
              <div className="flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-lg text-[11px] text-indigo-300 leading-normal">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  Leave these inputs blank to default to the system SMTP server credentials (configured in your global profile settings or system `.env`). Enter custom credentials below to override just for this send.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Host</span>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="h-8 text-xs focus-visible:ring-indigo-500"
                    id="smtp-host-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Port</span>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="h-8 text-xs focus-visible:ring-indigo-500"
                    id="smtp-port-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Username (Email)</span>
                  <Input
                    placeholder="yourname@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="h-8 text-xs focus-visible:ring-indigo-500"
                    id="smtp-user-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP App Password</span>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="h-8 text-xs focus-visible:ring-indigo-500"
                    id="smtp-pass-input"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Display Name (Sender)</span>
                  <Input
                    placeholder="Kavya"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    className="h-8 text-xs focus-visible:ring-indigo-500"
                    id="smtp-from-name-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSmtpSecure(!smtpSecure)}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-bold px-2.5 py-1 rounded border transition-colors",
                    smtpSecure ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  )}
                  id="smtp-secure-toggle"
                >
                  <Check className={cn("size-3", smtpSecure ? "opacity-100" : "opacity-0")} />
                  SSL/TLS Encryption
                </button>
              </div>
            </div>
          )}
        </div>

        <Separator className="opacity-20" />

        {/* Send and Save Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          {onSaveDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSending}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
              id="email-save-draft-btn"
            >
              Save as Draft
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleSendClick}
            disabled={!canSend}
            className={cn(
              "text-xs font-semibold h-9 px-5 flex items-center gap-2 shadow-lg transition-all duration-300",
              canSend 
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white hover:scale-[1.02] shadow-emerald-500/10" 
                : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
            )}
            id="email-send-now-btn"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                Dispatching outreach...
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                YES — Send This Email Now
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
