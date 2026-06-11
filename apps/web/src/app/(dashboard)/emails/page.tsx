'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mail, Send, AlertCircle, FileText, CheckCircle2, Search, Filter, 
  Trash2, ExternalLink, Calendar, Copy, Check, MessageSquare, Plus, ArrowRight, Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DBEmail {
  id: string
  toEmail: string | null
  toName: string | null
  subject: string
  body: string
  tone: string | null
  wordCount: number | null
  status: 'draft' | 'sent' | 'failed'
  sentAt: string | null
  createdAt: string
  job?: {
    company: string
    jobTitle: string
  } | null
}

export default function EmailsHistoryPage() {
  const router = useRouter()
  
  // List States
  const [emails, setEmails] = useState<DBEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'failed'>('all')
  
  // Modal State
  const [selectedEmail, setSelectedEmail] = useState<DBEmail | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch Emails
  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/emails')
      if (res.ok) {
        const data = await res.json()
        setEmails(data)
      }
    } catch (err) {
      console.error('Error fetching emails:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const handleCopy = async (email: DBEmail) => {
    try {
      const fullText = `Subject: ${email.subject}\n\n${email.body}`
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Aggregate Metrics
  const totalEmails = emails.length
  const totalSent = emails.filter(e => e.status === 'sent').length
  const totalDrafts = emails.filter(e => e.status === 'draft').length
  const totalFailed = emails.filter(e => e.status === 'failed').length

  // Filter & Search Emails
  const filteredEmails = emails.filter(email => {
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter
    
    const company = email.job?.company || ''
    const role = email.job?.jobTitle || ''
    const recipientName = email.toName || ''
    const recipientEmail = email.toEmail || ''
    const subjectLine = email.subject || ''
    
    const matchStr = `${company} ${role} ${recipientName} ${recipientEmail} ${subjectLine}`.toLowerCase()
    const matchesSearch = matchStr.includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 font-display">
            Outreach Outbox <Mail className="size-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review and check delivery status for your cold job application pitches.
          </p>
        </div>

        <Button
          onClick={() => router.push('/emails/compose')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
          id="compose-outreach-btn"
        >
          <Plus className="size-4" />
          <span>New Outreach Pitch</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Drafted', count: totalEmails, icon: FileText, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
          { label: 'Sent Outreach', count: totalSent, icon: Send, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Active Drafts', count: totalDrafts, icon: FileText, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
          { label: 'Delivery Failures', count: totalFailed, icon: AlertCircle, color: 'text-red-400 border-red-500/20 bg-red-500/5' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card key={idx} className={cn("glass-card border", kpi.color)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{kpi.count}</p>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter and search actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, role, recipient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs focus-visible:ring-indigo-500 bg-zinc-900/40 border-border/40"
            id="email-search-input"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'sent', label: 'Sent' },
            { id: 'draft', label: 'Drafts' },
            { id: 'failed', label: 'Failed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all select-none whitespace-nowrap",
                statusFilter === tab.id 
                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" 
                  : "border-border/30 text-muted-foreground hover:bg-accent/40"
              )}
              id={`filter-btn-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Box */}
      {loading ? (
        <Card className="glass-card border border-border/40 p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="size-8 animate-spin text-indigo-500 mb-2" />
          <span className="text-xs text-zinc-400">Loading outreach logs...</span>
        </Card>
      ) : filteredEmails.length === 0 ? (
        <Card className="border border-dashed border-border/40 bg-zinc-950/20 p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
          <Mail className="size-10 text-muted-foreground/30 mb-3" />
          <h4 className="text-xs font-semibold text-zinc-400 mb-1">No outreach records found</h4>
          <p className="text-[11px] max-w-xs text-zinc-550">
            {searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your search terms or status filters." 
              : "Generate and send your first cold job pitch to display it here."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmails.map((email) => (
            <Card 
              key={email.id} 
              onClick={() => setSelectedEmail(email)}
              className="glass-card border border-border/40 hover:border-indigo-500/30 hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge 
                    className={cn(
                      "text-[9px] uppercase font-bold px-2 py-0.5 border",
                      email.status === 'sent' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                      email.status === 'draft' && "bg-amber-500/10 text-amber-400 border-amber-500/25",
                      email.status === 'failed' && "bg-red-500/10 text-red-400 border-red-500/25"
                    )}
                  >
                    {email.status}
                  </Badge>
                  
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(email.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <CardTitle className="text-sm font-bold text-white truncate">
                  {email.job?.company || 'Direct Outreach'}
                </CardTitle>
                <CardDescription className="text-xs text-indigo-400 truncate">
                  {email.job?.jobTitle || 'Custom Pitch'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                  {email.body}
                </p>
                
                <div className="border-t border-border/20 pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate max-w-[170px]">
                    To: <span className="font-semibold text-zinc-300">{email.toName || email.toEmail || 'Manager'}</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] capitalize px-1.5 bg-black/10">
                    {email.tone || 'Professional'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        {selectedEmail && (
          <DialogContent className="glass-card border border-border/40 max-w-2xl bg-zinc-950/95 text-foreground">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge 
                  className={cn(
                    "text-[10px] uppercase font-bold border",
                    selectedEmail.status === 'sent' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                    selectedEmail.status === 'draft' && "bg-amber-500/10 text-amber-400 border-amber-500/25",
                    selectedEmail.status === 'failed' && "bg-red-500/10 text-red-400 border-red-500/25"
                  )}
                >
                  {selectedEmail.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Drafted on {new Date(selectedEmail.createdAt).toLocaleDateString()}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2 pt-1 font-display">
                {selectedEmail.job?.company || 'Direct'} — {selectedEmail.job?.jobTitle || 'Outreach'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              
              {/* Envelope details */}
              <div className="bg-black/20 p-3 rounded-lg border border-border/20 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-12 font-medium">To:</span>
                  <span className="text-foreground font-semibold">
                    {selectedEmail.toName} {selectedEmail.toEmail ? `<${selectedEmail.toEmail}>` : ''}
                  </span>
                </div>
                {selectedEmail.sentAt && (
                  <div className="flex items-center gap-2 border-t border-border/10 pt-1.5">
                    <span className="text-muted-foreground w-12 font-medium">Sent At:</span>
                    <span className="text-foreground font-semibold">
                      {new Date(selectedEmail.sentAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2 border-t border-border/10 pt-1.5">
                  <span className="text-muted-foreground w-12 pt-0.5 font-medium">Subject:</span>
                  <span className="text-foreground font-semibold flex-1 leading-normal">
                    {selectedEmail.subject}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="rounded-lg border border-border/30 bg-background/20 p-4 text-xs leading-relaxed text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans">
                {selectedEmail.body}
              </div>

            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border/20 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(selectedEmail)}
                className={cn(
                  "text-xs flex items-center gap-1.5 transition-all duration-300",
                  copied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "border-border/60 text-muted-foreground"
                )}
                id="dialog-copy-btn"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Copied Outreach!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy Pitch
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                  className="text-xs h-8 text-muted-foreground"
                  id="dialog-close-btn"
                >
                  Close
                </Button>
                
                {selectedEmail.status !== 'sent' && (
                  <Button
                    onClick={() => {
                      setSelectedEmail(null)
                      router.push(`/emails/compose?emailId=${selectedEmail.id}`)
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 flex items-center gap-1.5"
                    id="dialog-action-btn"
                  >
                    <span>Edit / Send Outreach</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

    </div>
  )
}
