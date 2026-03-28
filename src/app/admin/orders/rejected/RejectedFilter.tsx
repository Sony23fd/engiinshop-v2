"use client"
import { useRouter } from "next/navigation"

export function RejectedFilter({ days }: { days: number }) {
  const router = useRouter()
  return (
    <select 
      value={days}
      onChange={(e) => router.push(`/admin/orders/rejected?days=${e.target.value}`)}
      className="bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-red-500"
    >
      <option value="7">Сүүлийн 7 хоног</option>
      <option value="30">Сүүлийн 1 сар</option>
      <option value="90">Сүүлийн 3 сар</option>
      <option value="0">Бүх хугацаа</option>
    </select>
  )
}
