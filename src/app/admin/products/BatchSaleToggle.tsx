"use client"

import { useState } from "react"
import { toggleBatchForSale, updateBatchDeliveryFee, toggleBatchPreOrder } from "@/app/actions/product-actions"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Pencil, Package, Calendar } from "lucide-react"
import { updateBatchClosingDate } from "@/app/actions/product-actions"

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

function InlineEditDate({ label, value, onSave }: {
  label: string
  value: Date | null
  onSave: (val: Date | null) => Promise<any>
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ? value.toISOString().split("T")[0] : "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const newDate = val ? new Date(val) : null;
    await onSave(newDate)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <Calendar className="w-3 h-3 text-slate-300" />
      <span className="text-[11px] text-slate-400">{label}:</span>
      {editing ? (
        <>
          <Input value={val} onChange={e => setVal(e.target.value)}
            className="h-6 w-28 text-xs px-1.5" type="date" />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-green-600" />}
          </Button>
        </>
      ) : (
        <button onClick={() => setEditing(true)}
          className="text-[11px] font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-0.5 group">
          {value ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` : "Тохируулах"}
          <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
        </button>
      )}
    </div>
  )
}

export function BatchSaleToggle({ batch }: { batch: any }) {
  const batchId = batch.id
  const initialEnabled = batch.isAvailableForSale ?? false
  const initialPreOrder = batch.isPreOrder ?? false
  const initialFee = Number(batch.deliveryFee || 0)
  const dynamicRemainingQty = batch.targetQuantity - (batch._calculatedOrderedSum || 0)
  const targetQty = batch.targetQuantity
  const initialClosingDate = batch.closingDate ? new Date(batch.closingDate) : null

  const [enabled, setEnabled] = useState(initialEnabled)
  const [preOrder, setPreOrder] = useState(initialPreOrder)
  const [loading, setLoading] = useState(false)
  const [preOrderLoading, setPreOrderLoading] = useState(false)

  async function handleToggle(val: boolean) {
    setLoading(true)
    setEnabled(val)
    await toggleBatchForSale(batchId, val)
    setLoading(false)
  }

  async function handlePreOrderToggle(val: boolean) {
    setPreOrderLoading(true)
    setPreOrder(val)
    await toggleBatchPreOrder(batchId, val)
    setPreOrderLoading(false)
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {/* Toggle with Visual Indicator */}
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        <div className={`w-2 h-2 rounded-full ${
          enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
        }`} />
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading}
          className="data-[state=checked]:bg-green-500" />
        <span className={`text-xs font-medium ${enabled ? "text-green-600" : "text-slate-400"}`}>
          {enabled ? "Зарна" : "Хаалттай"}
        </span>
      </div>

      {/* Pre-order Toggle */}
      {enabled && (
        <div className="flex flex-col items-end gap-1 mt-1 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
          <div className="flex items-center gap-2">
            {preOrderLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            <Switch checked={preOrder} onCheckedChange={handlePreOrderToggle} disabled={preOrderLoading}
              className="data-[state=checked]:bg-indigo-500 scale-[0.8]" />
            <span className={`text-[11px] font-semibold ${preOrder ? "text-indigo-600" : "text-slate-400"}`}>
              Урьдчилсан захиалга
            </span>
          </div>
          {preOrder && (
            <div className="mt-1">
              <InlineEditDate
                label="Дуусах хугацаа"
                value={initialClosingDate || null}
                onSave={(val) => updateBatchClosingDate(batchId, val)}
              />
            </div>
          )}
        </div>
      )}

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
