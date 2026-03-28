"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { X } from "lucide-react"

type ToastType = "default" | "destructive"

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastType
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-0 right-0 z-50 p-6 flex flex-col gap-2 pointer-events-none w-full sm:w-auto sm:min-w-[350px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full flex-col gap-1 overflow-hidden rounded-md border p-4 shadow-lg transition-all 
              ${t.variant === "destructive" ? "bg-red-50 text-red-900 border-red-200" : "bg-white text-slate-900 border-slate-200"}
              animate-in slide-in-from-bottom-5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{t.title}</h3>
                {t.description && <p className="text-sm opacity-90 mt-1">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className={`flex-shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 
                  ${t.variant === "destructive" ? "focus:ring-red-400" : "focus:ring-slate-400"}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // If used outside provider, just fallback to console to prevent crash
    return {
      toast: (options: any) => {
        if (options.variant === "destructive") console.error(options.title, options.description)
        else console.log(options.title, options.description)
        
        // Optional fallback: browser alert if desperately needed, but console is safer
        // alert(`${options.title}\n${options.description || ""}`)
      }
    }
  }
  return context
}
