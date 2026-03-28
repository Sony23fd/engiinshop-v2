"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar } from "lucide-react"

export function DeliveryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDate = searchParams.get("date") || ""

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (newDate) {
      params.set("date", newDate)
    } else {
      params.delete("date")
    }
    
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex-wrap">
      <Calendar className="w-4 h-4 text-slate-400" />
      <input
        type="date"
        value={currentDate}
        onChange={handleDateChange}
        className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
        style={{ colorScheme: "normal" }}
      />
      <div className="flex items-center gap-1 border-l pl-2 ml-1">
        <button
          onClick={() => {
            const today = new Date();
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            const dateStr = today.toISOString().split("T")[0];
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", dateStr);
            router.push(`?${params.toString()}`);
          }}
          className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition-colors"
        >
          Өнөөдөр
        </button>
        <button
          onClick={() => {
            const yest = new Date(Date.now() - 86400000);
            yest.setMinutes(yest.getMinutes() - yest.getTimezoneOffset());
            const dateStr = yest.toISOString().split("T")[0];
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", dateStr);
            router.push(`?${params.toString()}`);
          }}
          className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium transition-colors"
        >
          Өчигдөр
        </button>
      </div>
      {currentDate && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete("date")
            router.push(`?${params.toString()}`)
          }}
          className="text-xs text-red-500 hover:text-red-700 font-medium ml-2"
        >
          × Цэвэрлэх
        </button>
      )}
    </div>
  )
}
