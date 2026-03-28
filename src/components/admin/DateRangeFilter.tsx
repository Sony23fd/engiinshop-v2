"use client"
import { useRouter, useSearchParams } from "next/navigation"

export function DateRangeFilter({ days, basePath }: { days: number, basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <select 
      value={days}
      onChange={(e) => {
        const newParams = new URLSearchParams(searchParams.toString())
        newParams.set('days', e.target.value)
        const path = basePath || window.location.pathname
        router.push(`${path}?${newParams.toString()}`)
      }}
      className="bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-500 hover:border-slate-300 transition-colors"
    >
      <option value="1">Өнөөдөр</option>
      <option value="2">Сүүлийн 2 хоног</option>
      <option value="7">Сүүлийн 7 хоног</option>
      <option value="30">Сүүлийн 1 сар</option>
      <option value="90">Сүүлийн 3 сар</option>
      <option value="180">Сүүлийн хагас жил</option>
      <option value="365">Сүүлийн 1 жил</option>
      <option value="0">Бүх хугацаа</option>
    </select>
  )
}
