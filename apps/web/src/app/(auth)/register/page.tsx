'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'


const registerSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: zod.string(),
  acceptTerms: zod.boolean().refine((val) => val === true, 'You must accept the terms & conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormValues = zod.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  // Dynamic Password Strength Meter
  const calculatePasswordStrength = (pass: string) => {
    let score = 0
    if (!pass) return { score, label: 'Empty', color: 'bg-zinc-800' }
    
    if (pass.length >= 8) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[a-z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    switch (score) {
      case 1:
      case 2:
        return { score, label: 'Weak', color: 'bg-red-500' }
      case 3:
        return { score, label: 'Fair', color: 'bg-amber-500' }
      case 4:
        return { score, label: 'Good', color: 'bg-indigo-500' }
      case 5:
        return { score, label: 'Strong', color: 'bg-emerald-500' }
      default:
        return { score, label: 'Weak', color: 'bg-red-500' }
    }
  }

  const strength = calculatePasswordStrength(passwordValue)

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // Direct call to NextAuth credentials since authOptions auto-creates users on credentials submission
      const result = await signIn('credentials', {
        email: values.email,
        name: values.name,
        redirect: false,
        callbackUrl: '/onboarding', // Route to onboarding wizard on registration
      })

      if (result?.error) {
        setErrorMsg('Could not register account. Please check details.')
      } else {
        router.refresh()
        router.push('/onboarding')
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card border border-border/40 overflow-hidden shadow-2xl relative w-full">
      <CardHeader className="text-center pt-8 pb-4">
        <CardTitle className="text-2xl font-bold font-display tracking-tight text-white flex items-center justify-center gap-2">
          Create Account <Sparkles className="size-5 text-indigo-400" />
        </CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Join CareerAI Copilot and start your automated search
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <User className="size-4" />
              </span>
              <Input
                type="text"
                placeholder="Kavya Shaw"
                className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-[10px] text-destructive font-medium mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail className="size-4" />
              </span>
              <Input
                type="email"
                placeholder="user@example.com"
                className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-destructive font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock className="size-4" />
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                className="pl-9 pr-10 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                {...register('password', {
                  onChange: (e) => setPasswordValue(e.target.value)
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
                  <span>Strength: {strength.label}</span>
                  <span>{strength.score} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-full flex-1 transition-colors duration-300",
                        idx <= strength.score ? strength.color : "bg-zinc-800"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            {errors.password && (
              <p className="text-[10px] text-destructive font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock className="size-4" />
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="pl-9 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-destructive font-medium mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="acceptTerms"
              className="mt-0.5 rounded border-zinc-800 bg-zinc-900/50 text-indigo-600 focus:ring-indigo-500/20 size-4 cursor-pointer"
              {...register('acceptTerms')}
            />
            <label htmlFor="acceptTerms" className="text-[11px] text-zinc-400 leading-tight select-none cursor-pointer">
              I accept the{' '}
              <Link href="/register" className="text-indigo-400 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/register" className="text-indigo-400 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-[10px] text-destructive font-medium">{errors.acceptTerms.message}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/15"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center pb-8 pt-4 border-t border-zinc-800/40 bg-zinc-950/20">
        <p className="text-xs text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
