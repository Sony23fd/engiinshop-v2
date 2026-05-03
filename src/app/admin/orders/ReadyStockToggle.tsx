"use client"

import { useState } from "react"
import { PackageCheck } from "lucide-react"
import { toggleCategoryReadyStock } from "@/app/actions/category-actions"

interface Props {
  categoryId: string
  initialReadyStock: boolean
  initialStatusId: string | null
  statuses: { id: string; name: string; color?: string }[]
}

export function ReadyStockToggle({ categoryId, initialReadyStock, initialStatusId, statuses }: Props) {
  const [isReady, setIsReady] = useState(initialReadyStock)
  const [statusId, setStatusId] = useState<string | null>(initialStatusId)
  const [saving, setSaving] = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (isReady) {
      // Turning off
      setSaving(true)
      await toggleCategoryReadyStock(categoryId, false, null)
      setIsReady(false)
      setStatusId(null)
      setSaving(false)
    } else {
      // Turning on — need to pick a status
      setIsReady(true)
    }
  }

  async function handleStatusSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault()
    e.stopPropagation()
    const selectedId = e.target.value
    if (!selectedId) return
    setSaving(true)
    setStatusId(selectedId)
    await toggleCategoryReadyStock(categoryId, true, selectedId)
    setSaving(false)
  }

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsReady(false)
    setStatusId(null)
  }

  const selectedStatus = statuses.find(s => s.id === statusId)

  return (
    <div onClick={e => { e.preventDefault(); e.stopPropagation() }} className="mt-2">
      {isReady && statusId ? (
        // Active state — show badge
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <PackageCheck className="w-3 h-3" />
            Бэлэн бараа
          </span>
          {selectedStatus && (
            <span className="text-[10px] text-slate-400">
              → {selectedStatus.name}
            </span>
          )}
          <button
            onClick={handleToggle}
            disabled={saving}
            className="text-[10px] text-red-400 hover:text-red-600 underline underline-offset-2 ml-auto"
          >
            Болих
          </button>
        </div>
      ) : isReady && !statusId ? (
        // Selecting status
        <div className="flex items-center gap-2">
          <select
            onClick={e => e.stopPropagation()}
            onChange={handleStatusSelect}
            disabled={saving}
            defaultValue=""
            className="text-xs border border-emerald-300 rounded-lg px-2 py-1.5 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 flex-1 min-w-0"
          >
            <option value="" disabled>Статус сонгох...</option>
            {statuses.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={handleCancel}
            className="text-xs text-slate-400 hover:text-slate-600 px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        // Inactive state — show toggle button
        <button
          onClick={handleToggle}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 transition-colors border border-slate-200 hover:border-emerald-200"
        >
          <PackageCheck className="w-3 h-3" />
          Бэлэн бараа
        </button>
      )}
    </div>
  )
}
