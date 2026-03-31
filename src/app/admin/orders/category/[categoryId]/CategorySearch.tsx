"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function CategorySearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set("q", e.target.value)
    } else {
      params.delete("q")
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input 
        key={searchParams.get("q") ?? ""}
        placeholder="Багцын нэр, дугаар, тайлбараар хайх..." 
        className="pl-10 bg-slate-50 border-slate-200"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleSearch}
      />
    </div>
  )
}
