'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  FileText,
  Mail,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  Bell,
  Sparkles,
  User,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { signOut, useSession } from 'next-auth/react'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Job Search',
    href: '/jobs',
    icon: Search,
  },
  {
    label: 'Resumes',
    href: '/resumes',
    icon: FileText,
  },
  {
    label: 'Emails',
    href: '/emails',
    icon: Mail,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
] as const

const BOTTOM_NAV = [
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const

const SIDEBAR_KEY = 'careerai-sidebar-collapsed'
const THEME_KEY = 'careerai-theme'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize state from localStorage on client mount
  useEffect(() => {
    setMounted(true)
    const storedCollapsed = localStorage.getItem(SIDEBAR_KEY)
    if (storedCollapsed) {
      setCollapsed(storedCollapsed === 'true')
    }

    const storedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null
    const initialTheme = storedTheme || 'dark'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleSidebar = () => {
    const nextState = !collapsed
    setCollapsed(nextState)
    localStorage.setItem(SIDEBAR_KEY, String(nextState))
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem(THEME_KEY, nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  // Pre-render loading state/skeleton to avoid hydration flicker
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen bg-[#0a0a0f] text-white items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-zinc-400 font-medium">Bootstrapping Workspace...</span>
        </div>
      </div>
    )
  }

  // Extract breadcrumbs from route path
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))

  return (
    <TooltipProvider delay={300}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300 relative">
        
        {/* Futuristic Ambient Orbs & Grids */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50 dark:opacity-100">
          <div className="cyber-grid absolute inset-0" />
          <div className="mesh-orb-1" />
          <div className="mesh-orb-2" />
        </div>
        
        {/* ─── Sidebar Navigation ─── */}
        <aside
          className={cn(
            "glass-sidebar z-30 flex flex-col justify-between transition-all duration-300 relative border-r border-border/40",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {/* Top Logo / Brand Section */}
          <div className="flex h-16 items-center px-4 justify-between">
            <Link
              href="/dashboard"
              className={cn("flex items-center gap-3 group", collapsed && "mx-auto")}
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                <Sparkles className="size-5" />
              </div>
              {!collapsed && (
                <span className="text-base font-bold font-display tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent dark:from-white dark:via-zinc-200 dark:to-zinc-400 light:from-zinc-950 light:to-zinc-800">
                  CareerAI <span className="text-indigo-400 font-medium">Copilot</span>
                </span>
              )}
            </Link>
          </div>

          <Separator className="opacity-20" />

          {/* Navigation Links */}
          <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-all relative group",
                          isActive
                            ? "bg-primary/15 text-primary border-l-2 border-primary pl-2.5"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {!collapsed && <span className="ml-3 transition-opacity duration-300">{item.label}</span>}
                        {collapsed && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    }
                  />
                  {collapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>

          <Separator className="opacity-20" />

          {/* Bottom Settings & User Actions */}
          <div className="p-3 space-y-2">
            {BOTTOM_NAV.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center h-10 px-3 rounded-lg text-sm font-medium transition-all group",
                          isActive
                            ? "bg-primary/15 text-primary border-l-2 border-primary pl-2.5"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        {!collapsed && <span className="ml-3">{item.label}</span>}
                      </Link>
                    }
                  />
                  {collapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}

            {/* Theme Toggle & Collapse Buttons */}
            <div className={cn("flex items-center justify-between", collapsed ? "flex-col gap-2" : "flex-row")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-accent text-muted-foreground hover:text-foreground size-9 rounded-lg"
              >
                {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hover:bg-accent text-muted-foreground hover:text-foreground size-9 rounded-lg hidden md:inline-flex"
              >
                {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
              </Button>
            </div>

            <Separator className="opacity-20" />

            {/* User Mini Profile */}
            <div className={cn("flex items-center gap-3", collapsed ? "justify-center py-1" : "p-1.5")}>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-bold text-indigo-400 shrink-0">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate leading-none mb-1">
                    {session?.user?.name || 'Copilot User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-none">
                    {session?.user?.email || 'user@careerai.copilot'}
                  </p>
                </div>
              )}
              {!collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-7"
                >
                  <LogOut className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* ─── Main Content Shell ─── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          
          {/* Top Bar Header */}
          <header className="h-16 border-b border-border/40 bg-card/45 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
            {/* Breadcrumb section */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer font-medium">Home</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb}>
                  <span>/</span>
                  <span className={cn("font-medium", idx === breadcrumbs.length - 1 && "text-foreground")}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Top Bar Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Notification icon */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground size-9 rounded-lg"
              >
                <Bell className="size-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-background" />
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Profile display */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary/20">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
            <div className="max-w-7xl mx-auto page-enter h-full">
              {children}
            </div>
          </main>
        </div>

      </div>
    </TooltipProvider>
  )
}
