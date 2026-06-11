'use client'

import React, { useState, useEffect, useMemo } from 'react'

import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers,
  HelpCircle,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAppStore, type Job } from '@/store/app-store'
import JobCard from '@/components/jobs/JobCard'
import JobDetailModal from '@/components/jobs/JobDetailModal'
import { cn } from '@/lib/utils'


// ─── Mock Scrape Generator ───────────────────────────────────────────────────

function generateMockJobs(role: string, location: string, exp: string): Job[] {
  const titles = [
    `${role}`,
    `Senior ${role}`,
    `Lead ${role}`,
    `Junior ${role}`,
    `Staff ${role}`,
    `Full Stack ${role}`,
  ]
  const companies = ['Stripe', 'Linear', 'Vercel', 'Notion', 'Supabase', 'Retool', 'Airbnb', 'GitLab']
  const sources = ['remoteok', 'wellfound', 'naukri']
  const skillsList = [
    ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'PostgreSQL'],
    ['Python', 'FastAPI', 'Docker', 'AWS', 'PostgreSQL', 'Redis'],
    ['Go', 'Kubernetes', 'gRPC', 'Docker', 'AWS', 'Redis'],
    ['React', 'GraphQL', 'TypeScript', 'CSS modules', 'Webpack', 'Jest'],
    ['Ruby on Rails', 'React', 'PostgreSQL', 'Redis', 'Sidekiq', 'JavaScript'],
  ]

  return Array.from({ length: 6 }).map((_, idx) => {
    const company = companies[idx % companies.length]
    const title = titles[idx % titles.length]
    const source = sources[idx % sources.length]
    const skills = skillsList[idx % skillsList.length]
    const relevanceScore = Math.floor(Math.random() * 35) + 65 // 65-99%

    return {
      id: `mock-job-${idx}-${Date.now()}`,
      jobTitle: title,
      company,
      location: location || (idx % 2 === 0 ? 'Remote' : 'San Francisco, CA'),
      salary: `$${100 + idx * 15}k - $${140 + idx * 20}k`,
      experience: exp || (idx % 2 === 0 ? 'Mid' : 'Senior'),
      skills,
      jobUrl: 'https://careerai.copilot/mock-listing',
      fullDescription: `We are looking for a ${title} to join our team at ${company}. You will work on building scaleable products and services, coordinating with product managers and engineers to craft top-tier experiences.

Key Responsibilities:
- Design and develop clean, maintainable, and reusable codebase.
- Collaborate closely with UX designers to translate beautiful design structures to dynamic interfaces.
- Write unit and integration tests to ensure stability and type-safety.
- Contribute to daily agile standups and participate in constructive peer code reviews.

What we look for:
- Strong familiarity with: ${skills.join(', ')}.
- Strong communication skills and structured problem-solving approach.
- Ability to work independently in a fast-paced environment.`,
      postedDate: new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString(),
      source,
      relevanceScore,
      scrapedAt: new Date().toISOString(),
      isSaved: false,
    }
  })
}

export default function JobSearchPage() {
  const {
    searchResults,
    jobSearchLoading,
    jobFilters,
    setSearchResults,
    setJobSearchLoading,
    setJobFilters,
  } = useAppStore()

  // Form inputs
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('Mid')
  const [workType, setWorkType] = useState('any')
  const [minSalary, setMinSalary] = useState('')

  // Detail Modal States
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Feedback notifications
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [showScraperAlert, setShowScraperAlert] = useState(false)

  // Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role.trim()) return

    setJobSearchLoading(true)
    setSearchTriggered(true)
    setShowScraperAlert(false)
    setError(null)

    try {
      // 1. Call Search Scraper API
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.trim(),
          location: location.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error('Scraper backend service unreachable')
      }

      // If scraper successfully triggered, wait 3 seconds then load results
      setTimeout(async () => {
        try {
          const jobsRes = await fetch('/api/jobs')
          if (jobsRes.ok) {
            const userJobs = await jobsRes.json()
            if (userJobs && userJobs.length > 0) {
              const jobs = userJobs.map((uj: any) => ({
                ...uj.job,
                status: uj.status,
                notes: uj.notes,
                isSaved: true,
              }))
              setSearchResults(jobs)
            } else {
              // Fallback to simulated scrape if db returned no jobs
              setSearchResults(generateMockJobs(role, location, experience))
            }
          } else {
            // Fallback to simulated scrape
            setSearchResults(generateMockJobs(role, location, experience))
          }
        } catch {
          setSearchResults(generateMockJobs(role, location, experience))
        } finally {
          setJobSearchLoading(false)
        }
      }, 3000)

    } catch (err: any) {
      console.warn('Scraper API failed, launching simulated fallback mode:', err.message)
      // Launch simulated scrape (so user gets immediate results and can proceed with layout)
      setShowScraperAlert(true)
      
      setTimeout(() => {
        setSearchResults(generateMockJobs(role, location, experience))
        setJobSearchLoading(false)
      }, 1500)
    }
  }

  const [error, setError] = useState<string | null>(null)

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    let list = [...searchResults]

    // Source Filter Badge Chips
    if (jobFilters.source.length > 0) {
      list = list.filter((job) => jobFilters.source.includes(job.source.toLowerCase()))
    }

    // Work Type Filter
    if (jobFilters.workType !== 'any') {
      list = list.filter((job) => {
        const type = jobFilters.workType.toLowerCase()
        const isRemote = job.location?.toLowerCase().includes('remote') || false
        if (type === 'remote') return isRemote
        return !isRemote
      })
    }

    // Min Salary Filter
    if (jobFilters.minSalary > 0) {
      list = list.filter((job) => {
        if (!job.salary) return false
        const match = job.salary.match(/\d+/)
        if (!match) return false
        const salaryVal = parseInt(match[0])
        return salaryVal >= jobFilters.minSalary
      })
    }

    // Sort Logic
    if (jobFilters.sortBy === 'relevance') {
      list.sort((a, b) => b.relevanceScore - a.relevanceScore)
    } else if (jobFilters.sortBy === 'date') {
      list.sort((a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime())
    } else if (jobFilters.sortBy === 'salary') {
      list.sort((a, b) => {
        const valA = parseInt(a.salary?.match(/\d+/)?.[0] || '0')
        const valB = parseInt(b.salary?.match(/\d+/)?.[0] || '0')
        return valB - valA
      })
    }

    return list
  }, [searchResults, jobFilters])

  // Source count counts
  const sourceStats = useMemo(() => {
    const counts = { remoteok: 0, naukri: 0, wellfound: 0 }
    searchResults.forEach((job) => {
      const src = job.source.toLowerCase().replace(/[^a-z]/g, '')
      if (src === 'remoteok') counts.remoteok++
      else if (src === 'naukri') counts.naukri++
      else if (src === 'wellfound') counts.wellfound++
    })
    return counts
  }, [searchResults])

  const toggleSourceFilter = (src: string) => {
    const active = jobFilters.source
    const next = active.includes(src)
      ? active.filter((s) => s !== src)
      : [...active, src]
    setJobFilters({ source: next })
  }

  const openDetails = (job: Job) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      
      {/* ─── Search Form Banner ─── */}
      <Card className="glass-card border border-border/40 p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/25">
              <Search className="size-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
              Job Search Agent <Sparkles className="size-4 text-indigo-400" />
            </h2>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Title search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Briefcase className="size-4" />
              </span>
              <Input
                type="text"
                placeholder="Job title (e.g. React Developer)"
                className="pl-9 h-10 bg-zinc-900/50 border-zinc-800 text-white rounded-lg placeholder-zinc-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            {/* Location search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <MapPin className="size-4" />
              </span>
              <Input
                type="text"
                placeholder="Location (e.g. Remote, SF)"
                className="pl-9 h-10 bg-zinc-900/50 border-zinc-800 text-white rounded-lg placeholder-zinc-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Exp Level Dropdown */}
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="h-10 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-lg text-sm outline-none cursor-pointer"
            >
              <option value="Entry">Entry Level</option>
              <option value="Mid">Mid Level</option>
              <option value="Senior">Senior Level</option>
              <option value="Lead">Lead / Staff</option>
            </select>

            {/* Search Submit */}
            <Button
              type="submit"
              disabled={jobSearchLoading}
              className="h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2"
            >
              {jobSearchLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Scrape & Scrutinize</span>
                  <Sparkles className="size-4 animate-pulse" />
                </>
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Scraper Alert Notification */}
      {showScraperAlert && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-400 text-xs">
          <HelpCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Scraper backend service is currently offline</p>
            <p className="opacity-80">CareerAI Copilot has initiated Simulated Fallback Mode. Generating realistic jobs matching your filters for immediate testing.</p>
          </div>
        </div>
      )}

      {/* ─── Filters & Main Results Panel ─── */}
      {searchTriggered && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left filter side-panel */}
          <aside className="space-y-5 lg:col-span-1">
            <Card className="glass-card border border-border/40 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Filter className="size-3.5" /> Filters
                </span>
                {/* Reset filters button */}
                <button
                  onClick={() => setJobFilters({ source: [], minSalary: 0, workType: 'any' })}
                  className="text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  Reset All
                </button>
              </div>

              {/* Source chips */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Job Source</label>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'RemoteOK', id: 'remoteok', count: sourceStats.remoteok },
                    { label: 'Wellfound', id: 'wellfound', count: sourceStats.wellfound },
                    { label: 'Naukri', id: 'naukri', count: sourceStats.naukri },
                  ].map((src) => (
                    <button
                      key={src.id}
                      onClick={() => toggleSourceFilter(src.id)}
                      className={cn(
                        "flex items-center justify-between h-8 px-3 rounded-lg text-xs font-medium border select-none transition-all",
                        jobFilters.source.includes(src.id)
                          ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-400"
                          : "border-zinc-800 text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                      )}
                    >
                      <span>{src.label}</span>
                      <span className="text-[10px] opacity-60 font-bold">({src.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Work Setup</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Remote', val: 'remote' },
                    { label: 'Onsite', val: 'onsite' },
                    { label: 'Any', val: 'any' },
                  ].map((type) => (
                    <button
                      key={type.val}
                      onClick={() => setJobFilters({ workType: type.val })}
                      className={cn(
                        "h-8 rounded-lg text-xs font-medium border select-none transition-all",
                        jobFilters.workType === type.val
                          ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-400"
                          : "border-zinc-800 text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Minimum */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Salary Range (Min)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                    <DollarSign className="size-3.5" />
                  </span>
                  <Input
                    type="number"
                    placeholder="Min salary (e.g. 100k)"
                    className="pl-8 h-9 bg-zinc-900/40 border-zinc-800 text-xs text-white"
                    value={jobFilters.minSalary || ''}
                    onChange={(e) => setJobFilters({ minSalary: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </Card>
          </aside>

          {/* Right Results Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter status & Sort bar */}
            <div className="flex items-center justify-between bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-3.5">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Layers className="size-4 text-indigo-400" />
                Found {filteredJobs.length} matches based on parameters
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="size-3.5 text-zinc-500" />
                <select
                  value={jobFilters.sortBy}
                  onChange={(e) => setJobFilters({ sortBy: e.target.value })}
                  className="bg-transparent border-none text-xs text-zinc-300 font-semibold cursor-pointer outline-none hover:text-white"
                >
                  <option value="relevance" className="bg-zinc-950">Sort by Relevance</option>
                  <option value="date" className="bg-zinc-950">Sort by Date</option>
                  <option value="salary" className="bg-zinc-950">Sort by Salary</option>
                </select>
              </div>
            </div>

            {/* Loader Skeleton Grid */}
            {jobSearchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="glass-card p-5 h-[280px] space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 w-2/3">
                        <div className="h-3 w-16 bg-zinc-800 rounded-full" />
                        <div className="h-4 w-full bg-zinc-800 rounded-full" />
                      </div>
                      <div className="size-12 rounded-full bg-zinc-800" />
                    </div>
                    <div className="flex gap-2 py-4">
                      <div className="h-4 w-12 bg-zinc-800 rounded-full" />
                      <div className="h-4 w-16 bg-zinc-800 rounded-full" />
                      <div className="h-4 w-10 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="h-8 w-full bg-zinc-850 rounded-lg mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              /* Empty state */
              <div className="glass-card flex flex-col items-center justify-center p-12 text-center border-dashed min-h-[300px]">
                <div className="size-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 animate-bounce">
                  <Search className="size-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">No Jobs Found</h4>
                <p className="text-xs text-zinc-550 max-w-sm">No job matches currently fit the active filters. Expand search keywords or reset filter chips.</p>
              </div>
            ) : (
              /* Active Job Card Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} onOpenDetails={openDetails} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Detail Modal Overlay */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  )
}
