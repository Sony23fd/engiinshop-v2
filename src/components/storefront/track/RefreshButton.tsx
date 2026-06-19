"use client"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function RefreshButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  return (
    <button 
      onClick={handleRefresh} 
      disabled={isRefreshing}
      className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 shrink-0"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Шинэчлэж байна..." : "Дахин шалгах"}
    </button>
  )
}
