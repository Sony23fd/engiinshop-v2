"use client"

import { useState } from "react"
import { updateCategoryDeliveryFee } from "@/app/actions/category-actions"
import { Check, Loader2, Pencil, Truck } from "lucide-react"

export function CategoryDeliveryFeeEditor({ categoryId, initialFee }: {
  categoryId: string
  initialFee: number
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(initialFee))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateCategoryDeliveryFee(categoryId, Number(val) || 0)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
      <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
      <span className="text-sm text-indigo-700 font-medium">Хүргэлтийн үнэ:</span>
      {editing ? (
        <>
          <div className="flex items-center gap-1">
            <span className="text-sm text-indigo-600">₮</span>
            <input
              value={val}
              onChange={e => setVal(e.target.value)}
              type="number"
              min="0"
              className="border rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false) }}
            />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Хадгалах
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">
            Болих
          </button>
        </>
      ) : (
        <>
          <span className="font-bold text-indigo-800">₮{Number(val).toLocaleString()}</span>
          {saved && <Check className="w-3.5 h-3.5 text-green-500" />}
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-600 ml-1">
            <Pencil className="w-3 h-3" /> Засах
          </button>
          <span className="text-xs text-indigo-400 ml-1">← энэ ангиллын бүх барааны хүргэлтийн үнэ болно</span>
        </>
      )}
    </div>
  )
}
