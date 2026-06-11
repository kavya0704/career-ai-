'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import {
  User,
  Link as LinkIcon,
  Briefcase,
  MapPin,
  DollarSign,
  Upload,
  FileText,
  Tag,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// ─── Step Schemas ────────────────────────────────────────────────────────────

const step1Schema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  linkedinUrl: zod.string().url('Please enter a valid URL').or(zod.literal('')),
  portfolioUrl: zod.string().url('Please enter a valid URL').or(zod.literal('')),
})

const step2Schema = zod.object({
  targetRole: zod.string().min(2, 'Please enter at least one target role'),
  location: zod.string().min(2, 'Please enter a target location'),
  salaryMin: zod.string().regex(/^\d*$/, 'Must be a number').or(zod.literal('')),
  salaryMax: zod.string().regex(/^\d*$/, 'Must be a number').or(zod.literal('')),
  experienceLvl: zod.string().min(1, 'Please select your experience level'),
  workType: zod.enum(['remote', 'hybrid', 'onsite', 'any']),
})

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Resume state
  const [file, setFile] = useState<File | null>(null)
  const [parsedText, setParsedText] = useState('')
  const [resumeId, setResumeId] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Skills state
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  // ─── Form Handlers ─────────────────────────────────────────────────────────

  const form1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: '', linkedinUrl: '', portfolioUrl: '' },
  })

  const form2 = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      targetRole: '',
      location: '',
      salaryMin: '',
      salaryMax: '',
      experienceLvl: 'Mid',
      workType: 'any' as const,
    },
  })

  // Autofill name from session when loaded
  useEffect(() => {
    if (session?.user?.name) {
      form1.setValue('name', session.user.name)
    }
  }, [session, form1])

  // ─── Steps Navigation ──────────────────────────────────────────────────────

  const nextStep = async () => {
    setErrorMsg(null)
    if (step === 1) {
      const isValid = await form1.trigger()
      if (isValid) setStep(2)
    } else if (step === 2) {
      const isValid = await form2.trigger()
      if (isValid) setStep(3)
    } else if (step === 3) {
      if (!parsedText || !resumeId) {
        setErrorMsg('Please upload and parse your resume before proceeding.')
        return
      }
      setStep(4)
    }
  }

  const prevStep = () => {
    setErrorMsg(null)
    setStep((prev) => Math.max(prev - 1, 1))
  }

  // ─── Step 3: File Upload & Parse ──────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) processFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) processFile(selectedFile)
  }

  const processFile = async (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (extension !== 'pdf' && extension !== 'docx') {
      setErrorMsg('Unsupported format. Only PDF and DOCX files are allowed.')
      return
    }

    setFile(selectedFile)
    setLoading(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // 1. Call file parser
      const parseRes = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      })

      if (!parseRes.ok) {
        const err = await parseRes.json()
        throw new Error(err.error || 'Failed to parse file.')
      }

      const { rawText } = await parseRes.json()
      setParsedText(rawText)

      // 2. Save resume to db as Base
      const saveRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedFile.name,
          rawText,
          isBase: true,
        }),
      })

      if (!saveRes.ok) {
        const err = await saveRes.json()
        throw new Error(err.error || 'Failed to save resume.')
      }

      const resumeData = await saveRes.json()
      setResumeId(resumeData.id)

      // 3. Simple heuristic to extract skills from text
      const commonSkills = [
        'javascript', 'typescript', 'react', 'node', 'next.js', 'vue', 'angular',
        'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'go', 'golang',
        'rust', 'c++', 'c#', 'ruby', 'rails', 'php', 'laravel', 'sql', 'postgres',
        'mysql', 'mongodb', 'redis', 'aws', 'gcp', 'azure', 'docker', 'kubernetes',
        'cicd', 'git', 'graphql', 'rest', 'html', 'css', 'tailwind', 'sass',
        'machine learning', 'deep learning', 'nlp', 'data science', 'analytics'
      ]
      
      const foundSkills = commonSkills.filter(skill => 
        rawText.toLowerCase().includes(skill)
      ).map(skill => skill.charAt(0).toUpperCase() + skill.slice(1))

      setSkills(foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js'])

    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing resume upload.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 4: Skills Logic ──────────────────────────────────────────────────

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (!skills.includes(skillInput.trim())) {
        setSkills((prev) => [...prev, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove))
  }

  // ─── Onboarding Complete Submit ────────────────────────────────────────────

  const completeSetup = async () => {
    setSubmitLoading(true)
    setErrorMsg(null)

    const step1Data = form1.getValues()
    const step2Data = form2.getValues()

    const payload = {
      name: step1Data.name,
      linkedinUrl: step1Data.linkedinUrl || null,
      portfolioUrl: step1Data.portfolioUrl || null,
      targetRoles: [step2Data.targetRole],
      preferredLocs: [step2Data.location],
      salaryMin: step2Data.salaryMin || null,
      salaryMax: step2Data.salaryMax || null,
      experienceLvl: step2Data.experienceLvl,
      workTypes: [step2Data.workType],
      skills,
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile.')
      }

      await updateSession()
      router.push('/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing onboarding setup.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Card className="glass-card border border-border/40 overflow-hidden shadow-2xl relative w-full">
      <CardHeader className="pt-8 pb-4">
        {/* Stepper Header */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  s === step
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : s < step
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}
              >
                {s < step ? <CheckCircle className="size-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    s < step ? 'bg-emerald-500/40' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <CardTitle className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
          {step === 1 && 'Step 1: Personal Info'}
          {step === 2 && 'Step 2: Career Preferences'}
          {step === 3 && 'Step 3: Base Resume'}
          {step === 4 && 'Step 4: Tech Skills'}
          <Sparkles className="size-4 text-indigo-400" />
        </CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          {step === 1 && 'Tell us who you are and where recruiters can find you.'}
          {step === 2 && 'What type of jobs, location, and salary are you hunting?'}
          {step === 3 && 'Upload your core resume. We will extract skills and experience.'}
          {step === 4 && 'Adjust your parsed skills list so we target your best competencies.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="min-h-[260px] flex flex-col justify-between">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* ─── STEP 1: PERSONAL INFO ─── */}
        {step === 1 && (
          <form className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Display Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <User className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Kavya Shaw"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                  {...form1.register('name')}
                />
              </div>
              {form1.formState.errors.name && (
                <p className="text-[10px] text-destructive font-medium mt-1">{form1.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">LinkedIn URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <LinkIcon className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                  {...form1.register('linkedinUrl')}
                />
              </div>
              {form1.formState.errors.linkedinUrl && (
                <p className="text-[10px] text-destructive font-medium mt-1">{form1.formState.errors.linkedinUrl.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Portfolio or Website URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <LinkIcon className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="https://myportfolio.com"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                  {...form1.register('portfolioUrl')}
                />
              </div>
              {form1.formState.errors.portfolioUrl && (
                <p className="text-[10px] text-destructive font-medium mt-1">{form1.formState.errors.portfolioUrl.message}</p>
              )}
            </div>
          </form>
        )}

        {/* ─── STEP 2: CAREER PREFERENCES ─── */}
        {step === 2 && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-zinc-300">Target Role / Title</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Briefcase className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Software Engineer"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                  {...form2.register('targetRole')}
                />
              </div>
              {form2.formState.errors.targetRole && (
                <p className="text-[10px] text-destructive font-medium mt-1">{form2.formState.errors.targetRole.message}</p>
              )}
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-zinc-300">Preferred Location</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <MapPin className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="San Francisco, CA or Remote"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                  {...form2.register('location')}
                />
              </div>
              {form2.formState.errors.location && (
                <p className="text-[10px] text-destructive font-medium mt-1">{form2.formState.errors.location.message}</p>
              )}
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-zinc-300">Salary Range (Min/Max)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                    <DollarSign className="size-3.5" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Min"
                    className="pl-8 h-10 bg-zinc-900/50 border-zinc-850 text-white rounded-lg"
                    {...form2.register('salaryMin')}
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                    <DollarSign className="size-3.5" />
                  </span>
                  <Input
                    type="text"
                    placeholder="Max"
                    className="pl-8 h-10 bg-zinc-900/50 border-zinc-850 text-white rounded-lg"
                    {...form2.register('salaryMax')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-zinc-300">Experience Level</label>
              <select
                className="w-full h-10 px-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/60 text-white rounded-lg outline-none text-sm cursor-pointer"
                {...form2.register('experienceLvl')}
              >
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
                <option value="Lead">Lead / Staff / Director</option>
              </select>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-xs font-semibold text-zinc-300">Work Setup preference</label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {['remote', 'hybrid', 'onsite', 'any'].map((type) => (
                  <label
                    key={type}
                    className={`h-10 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer border select-none transition-all capitalize ${
                      form2.watch('workType') === type
                        ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/5'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      className="sr-only"
                      {...form2.register('workType')}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* ─── STEP 3: BASE RESUME UPLOAD ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all min-h-[180px] cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : file
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/10'
              }`}
            >
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.docx"
                className="sr-only"
                onChange={handleFileChange}
              />
              <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center gap-3 w-full h-full">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-sm text-zinc-300 font-semibold">Parsing document...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <FileText className="size-6" />
                    </div>
                    <p className="text-sm text-white font-semibold">{file.name}</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Successfully parsed & saved as base</p>
                  </div>
                ) : (
                  <>
                    <div className="size-12 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
                      <Upload className="size-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Drag & drop your resume, or browse</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Supports PDF and DOCX formats up to 5MB</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* ─── STEP 4: SKILLS TAGGING ─── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Add Skills</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Tag className="size-4" />
                </span>
                <Input
                  type="text"
                  placeholder="Type a skill (e.g. Docker) and press Enter"
                  className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 text-white rounded-lg"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Your Skills Stack</label>
              <div className="flex flex-wrap gap-2 p-3 min-h-[100px] rounded-lg bg-zinc-900/40 border border-zinc-800/60 max-h-[160px] overflow-y-auto">
                {skills.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic m-auto">No skills added yet.</p>
                ) : (
                  skills.map((skill) => (
                    <div
                      key={skill}
                      className="h-6 px-2.5 rounded-full flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-indigo-400 hover:text-indigo-200 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pb-8 pt-6 border-t border-zinc-850/40 bg-zinc-950/20">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1 || submitLoading}
          className="border-zinc-850 bg-transparent text-zinc-400 hover:bg-zinc-800/40 rounded-lg flex items-center gap-1.5 h-10"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button
            onClick={nextStep}
            className="bg-zinc-850 hover:bg-zinc-800 text-white rounded-lg flex items-center gap-1.5 h-10 font-medium"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={completeSetup}
            disabled={submitLoading}
            className="bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-lg transition-all h-10 shadow-lg shadow-indigo-500/15 flex items-center gap-2"
          >
            {submitLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Setup</span>
                <CheckCircle className="size-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
