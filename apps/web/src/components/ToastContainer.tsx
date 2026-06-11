"use client";

import React from "react";
import { useTailoring, Toast } from "@/lib/context";

export default function ToastContainer() {
  const { toasts, dismissToast } = useTailoring();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, message, type } = toast;

  // Icon and style selectors based on toast type
  const typeStyles = {
    success: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/30 dark:border-emerald-500/20",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: (
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      border: "border-rose-500/30 dark:border-rose-500/20",
      text: "text-rose-800 dark:text-rose-200",
      icon: (
        <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/30 dark:border-amber-500/20",
      text: "text-amber-800 dark:text-amber-200",
      icon: (
        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/30 dark:border-blue-500/20",
      text: "text-blue-800 dark:text-blue-200",
      icon: (
        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const currentStyles = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md animate-slide-in-right ${currentStyles.bg} ${currentStyles.border} ${currentStyles.text}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{currentStyles.icon}</div>
      <div className="flex-1 text-xs font-medium leading-relaxed">{message}</div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 ml-2 rounded-lg p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss toast"
      >
        <svg className="h-4 w-4 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
