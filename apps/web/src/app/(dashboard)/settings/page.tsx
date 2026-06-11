'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Settings, User, Mail, Shield, AlertCircle, Save, Loader2,
  CheckCircle2, Globe, Link2, Briefcase, KeyRound, Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SMTP_STORAGE_KEY = 'careerai-smtp-config'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  
  // Profile loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // DB User Profile States
  const [name, setName] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [targetRoles, setTargetRoles] = useState('')
  const [preferredLocs, setPreferredLocs] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [skills, setSkills] = useState('')
  const [experienceLvl, setExperienceLvl] = useState('intermediate')

  // SMTP Settings States (saved locally in browser client for security)
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('465')
  const [smtpSecure, setSmtpSecure] = useState(true)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')

  // Load profile and SMTP settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        // 1. Fetch DB profile
        const res = await fetch('/api/profile')
        if (res.ok) {
          const user = await res.json()
          setName(user.name || '')
          setLinkedinUrl(user.linkedinUrl || '')
          setPortfolioUrl(user.portfolioUrl || '')
          setTargetRoles(user.targetRoles?.join(', ') || '')
          setPreferredLocs(user.preferredLocs?.join(', ') || '')
          setSalaryMin(user.salaryMin ? String(user.salaryMin) : '')
          setSalaryMax(user.salaryMax ? String(user.salaryMax) : '')
          setSkills(user.skills?.join(', ') || '')
          setExperienceLvl(user.experienceLvl || 'intermediate')
        }

        // 2. Fetch local SMTP
        const localSmtp = localStorage.getItem(SMTP_STORAGE_KEY)
        if (localSmtp) {
          const config = JSON.parse(localSmtp)
          setSmtpHost(config.host || '')
          setSmtpPort(config.port ? String(config.port) : '465')
          setSmtpSecure(config.secure !== undefined ? config.secure : true)
          setSmtpUser(config.auth?.user || '')
          setSmtpPass(config.auth?.pass || '')
          setSmtpFromName(config.fromName || '')
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      // 1. Save profile to DB
      const rolesArray = targetRoles.split(',').map(r => r.trim()).filter(Boolean)
      const locsArray = preferredLocs.split(',').map(l => l.trim()).filter(Boolean)
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean)

      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          linkedinUrl,
          portfolioUrl,
          targetRoles: rolesArray,
          preferredLocs: locsArray,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
          salaryMax: salaryMax ? parseInt(salaryMax) : null,
          skills: skillsArray,
          experienceLvl
        })
      })

      if (!profileRes.ok) {
        const err = await profileRes.json()
        throw new Error(err.error || 'Failed to update database profile.')
      }

      // 2. Save SMTP locally in browser
      if (smtpHost && smtpUser && smtpPass) {
        const smtpConfig = {
          host: smtpHost,
          port: Number(smtpPort),
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          },
          fromName: smtpFromName || undefined
        }
        localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(smtpConfig))
      } else {
        localStorage.removeItem(SMTP_STORAGE_KEY)
      }

      // Update session client cache if needed
      await updateSession()

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error saving settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 font-display">
          Profile Settings <Settings className="size-5 text-indigo-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your career preference profile, social handles, and SMTP configurations.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 animate-fade-in-up">
          
          {/* Status alerts */}
          {success && (
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Personal Handle and Career Preferences */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Account profile */}
              <Card className="glass-card border border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="size-4 text-indigo-400" /> Personal Account Profile
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-400">
                    Basic identification details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</span>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Kavya Shaw"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        required
                        id="settings-name-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Login Email (Read-Only)</span>
                      <Input
                        value={session?.user?.email || 'user@example.com'}
                        className="h-9 text-xs bg-zinc-900/50 text-zinc-550 border-zinc-850 cursor-not-allowed select-none"
                        disabled
                        id="settings-email-readonly"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">LinkedIn Profile URL</span>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                          <Link2 className="size-3.5" />
                        </span>
                        <Input
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/kavyashaw"
                          className="pl-9 h-9 text-xs focus-visible:ring-indigo-500"
                          id="settings-linkedin-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Portfolio Website URL</span>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                          <Globe className="size-3.5" />
                        </span>
                        <Input
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://kavyashaw.dev"
                          className="pl-9 h-9 text-xs focus-visible:ring-indigo-500"
                          id="settings-portfolio-input"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Career Preferences */}
              <Card className="glass-card border border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="size-4 text-indigo-400" /> Job Search Preferences
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-400">
                    Preferences used to filter scraped jobs and context pitches.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Target Roles (Comma Separated)</span>
                      <Input
                        value={targetRoles}
                        onChange={(e) => setTargetRoles(e.target.value)}
                        placeholder="Software Engineer, Fullstack Developer, Frontend Lead"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        id="settings-roles-input"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Preferred Locations (Comma Separated)</span>
                      <Input
                        value={preferredLocs}
                        onChange={(e) => setPreferredLocs(e.target.value)}
                        placeholder="Remote, San Francisco, Bangalore"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        id="settings-locations-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Minimum Target Salary ($ / Yr)</span>
                      <Input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder="80000"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        id="settings-salmin-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Maximum Target Salary ($ / Yr)</span>
                      <Input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="150000"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        id="settings-salmax-input"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Focus Core Skills (Comma Separated)</span>
                      <Input
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="React, TypeScript, Node.js, Next.js, Prisma, PostgreSQL"
                        className="h-9 text-xs focus-visible:ring-indigo-500"
                        id="settings-skills-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Experience Seniority Level</span>
                      <select
                        value={experienceLvl}
                        onChange={(e) => setExperienceLvl(e.target.value)}
                        className="w-full h-9 px-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/60 text-white rounded-lg text-xs outline-none cursor-pointer"
                        id="settings-exp-select"
                      >
                        <option value="entry" className="bg-zinc-950">Entry Level (&lt; 2 Yrs)</option>
                        <option value="intermediate" className="bg-zinc-950">Intermediate (2-5 Yrs)</option>
                        <option value="senior" className="bg-zinc-950">Senior (5+ Yrs)</option>
                        <option value="lead" className="bg-zinc-950">Lead / Director</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Col: SMTP Mail Server override configs */}
            <div className="lg:col-span-5 space-y-6">
              
              <Card className="glass-card border border-border/40 bg-zinc-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <KeyRound className="size-4 text-indigo-400" /> Default SMTP Server Config
                  </CardTitle>
                  <CardDescription className="text-[11px] text-zinc-400">
                    Mail server credentials used to send cold outreach emails directly from the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Host</span>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="h-8.5 text-xs focus-visible:ring-indigo-500"
                        id="settings-smtp-host"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Port</span>
                      <Input
                        type="number"
                        placeholder="465"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="h-8.5 text-xs focus-visible:ring-indigo-500"
                        id="settings-smtp-port"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP Username (Email)</span>
                      <Input
                        placeholder="youraddress@gmail.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="h-8.5 text-xs focus-visible:ring-indigo-500"
                        id="settings-smtp-user"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">SMTP App Password</span>
                      <Input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="h-8.5 text-xs focus-visible:ring-indigo-500"
                        id="settings-smtp-pass"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">From Name (Sender)</span>
                      <Input
                        placeholder="Kavya"
                        value={smtpFromName}
                        onChange={(e) => setSmtpFromName(e.target.value)}
                        className="h-8.5 text-xs focus-visible:ring-indigo-500"
                        id="settings-smtp-fromname"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSmtpSecure(!smtpSecure)}
                      className={cn(
                        "w-full flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded border transition-colors mt-2 justify-center",
                        smtpSecure ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      )}
                      id="settings-smtp-secure"
                    >
                      SSL/TLS Connection Encryption
                    </button>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

          {/* Sticky footer actions */}
          <div className="flex justify-end pt-4 border-t border-border/20">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 px-6 rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
              id="settings-save-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Dashboard Settings
                </>
              )}
            </Button>
          </div>

        </form>
      )}

    </div>
  )
}
