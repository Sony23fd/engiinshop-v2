"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"

export function ListSearchFilter({ placeholder = "Данс, утас, нэр, хаяг..." }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  useEffect(() => {
    // Only trigger if query actually changed from what is in the URL
    const currentQ = searchParams.get("q") || ""
    if (query === currentQ) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query) {
        params.set("q", query)
      } else {
        params.delete("q")
      }
      params.delete("page") // Reset page only when search query changes
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 400)

    return () => clearTimeout(timer)
  }, [query, router, searchParams])

  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-9 h-9 bg-white border-slate-200"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  )
}
