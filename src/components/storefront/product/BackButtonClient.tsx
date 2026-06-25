"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButtonClient() {
  const router = useRouter()

  return (
    <button 
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium bg-white px-4 py-2 rounded-xl border shadow-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      Буцах
    </button>
  )
}
