"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { confirmGroupPayment, rejectGroupPayment } from "@/app/actions/settings-actions"

export function GroupPendingActions({ orderIds }: { orderIds: string[] }) {
  const [status, setStatus] = useState<"idle" | "confirming" | "rejecting" | "confirmed" | "rejected">("idle")

  async function handleConfirm() {
    setStatus("confirming")
    const res = await confirmGroupPayment(orderIds)
    if (res.success) setStatus("confirmed")
    else setStatus("idle")
  }

  async function handleReject() {
    if (!confirm(`Энэ хэрэглэгчийн ${orderIds.length} захиалгыг бүгдийг нь цуцлах уу?`)) return
    setStatus("rejecting")
    const res = await rejectGroupPayment(orderIds)
    if (res.success) setStatus("rejected")
    else setStatus("idle")
  }

  if (status === "confirmed") {
    return (
      <div className="flex items-center gap-1.5 text-green-600 font-semibold text-sm">
        <CheckCircle2 className="w-4 h-4" /> Баталгаажлаа
      </div>
    )
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
        <XCircle className="w-4 h-4" /> Цуцлагдлаа
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleConfirm}
        disabled={status === "confirming" || status === "rejecting"}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {status === "confirming"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle2 className="w-4 h-4" />
        }
        {orderIds.length > 1 ? `${orderIds.length} захиалга баталгаажуулах` : "Баталгаажуулах"}
      </button>
      <button
        onClick={handleReject}
        disabled={status === "confirming" || status === "rejecting"}
        className="flex items-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {status === "rejecting"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <XCircle className="w-4 h-4" />
        }
        Цуцлах
      </button>
    </div>
  )
}
