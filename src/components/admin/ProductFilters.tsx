"use client"
import { useRouter, useSearchParams } from "next/navigation"

export function ProductFilters({ currentStock, currentSort }: { currentStock: string, currentSort: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set(key, value)
    newParams.delete("page") // Reset to page 1 on filter/sort change
    router.push(`/admin/products?${newParams.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <select 
        value={currentStock}
        onChange={(e) => updateParam('stock', e.target.value)}
        className="bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-500 hover:border-slate-300 transition-colors"
      >
        <option value="all">Бүх бараа</option>
        <option value="in_stock">Үлдэгдэлтэй</option>
        <option value="out_of_stock">Үлдэгдэл дууссан</option>
      </select>

      <select 
        value={currentSort}
        onChange={(e) => updateParam('sort', e.target.value)}
        className="bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-500 hover:border-slate-300 transition-colors"
      >
        <option value="remaining_desc">Их үлдэгдэлтэйгээс нь</option>
        <option value="remaining_asc">Бага үлдэгдэлтэйгээс нь</option>
        <option value="newest">Шинэ нь эхэндээ</option>
        <option value="oldest">Хуучин нь эхэндээ</option>
      </select>
    </div>
  )
}
