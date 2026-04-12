"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import clsx from "clsx"

export function ShopFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentType = searchParams.get("type") || "all"
  const initialQuery = searchParams.get("q") || ""
  
  const [query, setQuery] = useState(initialQuery)

  // Sync state if URL changes directly
  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  // Debounced search
  useEffect(() => {
    // Only trigger if query actually changed from what is in the URL
    const currentQ = searchParams.get("q") || ""
    if (query === currentQ) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set("q", query.trim())
      } else {
        params.delete("q")
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 400)

    return () => clearTimeout(timer)
  }, [query, router, searchParams])

  const setType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type === "all") {
      params.delete("type")
    } else {
      params.set("type", type)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 w-full mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-2 sm:p-3 rounded-2xl border border-slate-100">
        
        {/* Pill Tabs for Type */}
        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto hide-scrollbar sm:w-auto w-full">
          <button 
            onClick={() => setType("all")}
            className={clsx(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap",
              currentType === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Бүх бараа
          </button>
          <button 
            onClick={() => setType("ready")}
            className={clsx(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap",
              currentType === "ready" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Бэлэн бараа
          </button>
          <button 
            onClick={() => setType("preorder")}
            className={clsx(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap",
              currentType === "preorder" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Урьдчилсан захиалга
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            placeholder="Барааны нэрээр хайх..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
