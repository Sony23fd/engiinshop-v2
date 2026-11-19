"use client"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ManualPaymentClientProps {
  label?: string
  value: string
  large?: boolean
  copyToastTitle?: string
  copyToastDescription?: string
}

export function ManualPaymentClient({ 
  label, 
  value, 
  large = false,
  copyToastTitle,
  copyToastDescription
}: ManualPaymentClientProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast({ 
      title: copyToastTitle || "Хуулагдлаа 📋", 
      description: copyToastDescription || value 
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      <div 
        className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 group cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs" 
        onClick={handleCopy}
      >
        <span className={`font-mono select-all ${large ? 'text-xl font-black tracking-wider text-slate-900' : 'font-semibold text-slate-800'}`}>
          {value}
        </span>
        <button 
          type="button"
          className={`p-2 rounded-md transition-colors flex items-center gap-1.5 text-xs font-bold ${
            copied 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span>Хуулагдлаа</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Хуулах</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
