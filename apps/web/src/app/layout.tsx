import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TailoringProvider } from "@/lib/context";
import { TooltipProvider } from "@/components/ui/tooltip";
import ToastContainer from "@/components/ToastContainer";
import SessionProvider from "@/components/SessionProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerAI Copilot — Unified Job Hunting Suite",
  description:
    "AI-powered job discovery, resume matching/tailoring, and cold email outreach automation. The ultimate tool to land your next opportunity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", inter.variable, outfit.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <SessionProvider>
          <TailoringProvider>
            <TooltipProvider>
              {/* ─── Navigation ─── */}
              <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 group"
                    id="nav-logo"
                  >
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-110">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-lg font-bold font-display tracking-tight text-foreground">
                      CareerAI <span className="gradient-text">Copilot</span>
                    </span>
                  </Link>

                  <div className="hidden md:flex items-center gap-1">
                    <Link
                      href="/dashboard"
                      className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                      id="nav-dashboard"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                      id="nav-jobs"
                    >
                      Job Board
                    </Link>
                    <Link
                      href="/resumes"
                      className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                      id="nav-resumes"
                    >
                      Resumes
                    </Link>
                    <Link
                      href="/emails"
                      className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                      id="nav-emails"
                    >
                      Outreach
                    </Link>
                  </div>

                  <div className="md:hidden flex items-center">
                    {/* Simple mobile menu indicator */}
                    <span className="text-xs text-muted-foreground bg-muted py-1 px-2.5 rounded-full">Menu</span>
                  </div>
                </nav>
              </header>

              {/* ─── Main Content ─── */}
              <main className="flex-1">{children}</main>

              {/* ─── Global Toasts ─── */}
              <ToastContainer />

              {/* ─── Footer ─── */}
              <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} CareerAI Copilot. The Unified Career Hub.
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Review AI suggestions for accuracy. Do not submit unverified statements to employers.
                    </p>
                  </div>
                </div>
              </footer>
            </TooltipProvider>
          </TailoringProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
