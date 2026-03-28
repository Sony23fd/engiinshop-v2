"use client"

import { useState } from "react"
import { toggleBatchForSale, updateBatchDeliveryFee } from "@/app/actions/product-actions"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Pencil, Package } from "lucide-react"

function InlineEdit({ label, value, onSave, prefix = "" }: {
  label: string
  value: string
  onSave: (val: number) => Promise<any>
  prefix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(Number(val) || 0)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <span className="text-[11px] text-slate-400">{label}:</span>
      {editing ? (
        <>
          <Input value={val} onChange={e => setVal(e.target.value)}
            className="h-6 w-20 text-xs text-right px-1.5" type="number" min="0" />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-green-600" />}
          </Button>
        </>
      ) : (
        <button onClick={() => setEditing(true)}
          className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-0.5 group">
          {prefix}{Number(val).toLocaleString()}
          <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
        </button>
      )}
    </div>
  )
}

export function BatchSaleToggle({ batchId, initialEnabled, initialFee, dynamicRemainingQty, targetQty }: {
  batchId: string
  initialEnabled: boolean
  initialFee: number
  dynamicRemainingQty: number  // computed: targetQty - total ordered
  targetQty: number
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function handleToggle(val: boolean) {
    setLoading(true)
    setEnabled(val)
    await toggleBatchForSale(batchId, val)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading}
          className="data-[state=checked]:bg-green-500" />
        <span className={`text-xs font-medium ${enabled ? "text-green-600" : "text-slate-400"}`}>
          {enabled ? "Зарна" : "Хаалттай"}
        </span>
      </div>

      {/* Dynamic remaining qty (read-only, computed from orders) */}
      <div className="flex items-center gap-1">
        <Package className="w-3 h-3 text-slate-300" />
        <span className="text-[11px] text-slate-400">Үлдэгдэл:</span>
        <span className={`text-xs font-semibold ${dynamicRemainingQty <= 0 ? "text-red-500" : "text-slate-700"}`}>
          {dynamicRemainingQty} / {targetQty}
        </span>
      </div>

      {/* Delivery fee — still editable per-batch */}
      <InlineEdit
        label="Хүргэлт"
        value={String(initialFee)}
        onSave={fee => updateBatchDeliveryFee(batchId, fee)}
        prefix="₮"
      />
    </div>
  )
}
