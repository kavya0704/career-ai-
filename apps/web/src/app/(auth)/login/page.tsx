'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = zod.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const result = await signIn('credentials', {
        email: values.email,
        name: values.email.split('@')[0], // Use email prefix as temporary name
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setErrorMsg('Invalid email or password.')
      } else {
        router.refresh()
        router.push(callbackUrl)
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
          Welcome back <Sparkles className="size-5 text-indigo-400" />
        </CardTitle>
        <CardDescription className="text-zinc-400 text-sm">
          Access your AI job-hunting dashboard
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <Link
                href="/login"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock className="size-4" />
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-9 pr-10 h-10 bg-zinc-900/50 border-zinc-850 focus:border-indigo-500/60 focus:ring-indigo-500/10 text-white rounded-lg placeholder-zinc-500"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-destructive font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/15"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-[#0d0d15] px-3 text-[10px] text-zinc-500 uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            setErrorMsg(null)
            try {
              const result = await signIn('credentials', {
                email: 'google-demo-user@gmail.com',
                name: 'Google Demo User',
                redirect: false,
                callbackUrl,
              })

              if (result?.error) {
                setErrorMsg('Google login simulation failed.')
              } else {
                router.refresh()
                router.push(callbackUrl)
              }
            } catch (err) {
              setErrorMsg('An error occurred during Google login simulation.')
            } finally {
              setLoading(false)
            }
          }}
          className="w-full h-10 border-zinc-800 bg-transparent text-white hover:bg-zinc-800/40 rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google
        </Button>
      </CardContent>

      <CardFooter className="flex justify-center pb-8 pt-4 border-t border-zinc-800/40 bg-zinc-950/20">
        <p className="text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Create account
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
