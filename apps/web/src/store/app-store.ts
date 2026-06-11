import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Job {
  id: string
  jobTitle: string
  company: string
  location: string | null
  salary: string | null
  experience: string | null
  skills: string[]
  jobUrl: string
  fullDescription: string | null
  postedDate: string | null
  source: string
  relevanceScore: number
  scrapedAt: string
  // User-specific
  status?: string
  notes?: string
  isSaved?: boolean
}

export interface JobFilters {
  source: string[]
  minSalary: number
  workType: string
  sortBy: string
}

export interface SelectedJobForResume {
  id: string
  title: string
  company: string
  description: string
}

export interface AnalysisForEmail {
  id: string
  topAchievements: string[]
  atsScore: number
  company: string
  role: string
}

// ─── State Interface ─────────────────────────────────────────────────────────

export interface AppState {
  // Jobs
  searchResults: Job[]
  savedJobs: Job[]
  selectedJob: Job | null
  jobSearchLoading: boolean
  jobFilters: JobFilters
  setSearchResults: (jobs: Job[]) => void
  setSavedJobs: (jobs: Job[]) => void
  setSelectedJob: (job: Job | null) => void
  setJobSearchLoading: (loading: boolean) => void
  setJobFilters: (filters: Partial<JobFilters>) => void
  toggleJobSaved: (jobId: string) => void
  updateJobStatus: (jobId: string, status: string, notes?: string) => void

  // Resume context chain
  selectedJobForResume: SelectedJobForResume | null
  setSelectedJobForResume: (job: SelectedJobForResume | null) => void

  // Email context chain
  analysisForEmail: AnalysisForEmail | null
  setAnalysisForEmail: (analysis: AnalysisForEmail | null) => void

  // UI preferences
  theme: 'dark' | 'light'
  toggleTheme: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

// ─── Store Instance ──────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Jobs
      searchResults: [],
      savedJobs: [],
      selectedJob: null,
      jobSearchLoading: false,
      jobFilters: {
        source: [],
        minSalary: 0,
        workType: 'any',
        sortBy: 'relevance',
      },
      setSearchResults: (jobs) => set({ searchResults: jobs }),
      setSavedJobs: (jobs) => set({ savedJobs: jobs }),
      setSelectedJob: (job) => set({ selectedJob: job }),
      setJobSearchLoading: (loading) => set({ jobSearchLoading: loading }),
      setJobFilters: (filters) =>
        set((state) => ({ jobFilters: { ...state.jobFilters, ...filters } })),

      toggleJobSaved: (jobId) =>
        set((state) => {
          // Toggle in searchResults
          const updatedSearch = state.searchResults.map((job) =>
            job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
          )
          
          // Toggle in savedJobs
          const alreadySaved = state.savedJobs.some((job) => job.id === jobId)
          let updatedSaved = [...state.savedJobs]
          
          if (alreadySaved) {
            updatedSaved = updatedSaved.filter((job) => job.id !== jobId)
          } else {
            const jobToSave = state.searchResults.find((job) => job.id === jobId)
            if (jobToSave) {
              updatedSaved.push({ ...jobToSave, isSaved: true, status: 'saved' })
            }
          }

          return {
            searchResults: updatedSearch,
            savedJobs: updatedSaved,
          }
        }),

      updateJobStatus: (jobId, status, notes) =>
        set((state) => {
          const updatedSaved = state.savedJobs.map((job) =>
            job.id === jobId
              ? { ...job, status, ...(notes !== undefined && { notes }) }
              : job
          )
          return { savedJobs: updatedSaved }
        }),

      // Resume Context Chain
      selectedJobForResume: null,
      setSelectedJobForResume: (job) => set({ selectedJobForResume: job }),

      // Email Context Chain
      analysisForEmail: null,
      setAnalysisForEmail: (analysis) => set({ analysisForEmail: analysis }),

      // UI Preferences
      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
          if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', nextTheme === 'dark')
          }
          return { theme: nextTheme }
        }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'careerai-app-state',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        savedJobs: state.savedJobs,
        selectedJobForResume: state.selectedJobForResume,
        analysisForEmail: state.analysisForEmail,
      }),
    }
  )
)
