"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { confirmOrderPayment, rejectOrderPayment } from "@/app/actions/settings-actions"
import { RejectionDialog } from "@/components/admin/RejectionDialog"

export function PendingOrderActions({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<"idle" | "confirming" | "rejecting" | "confirmed" | "rejected">("idle")
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)

  async function handleConfirm() {
    setStatus("confirming")
    const res = await confirmOrderPayment(orderId)
    if (res.success) setStatus("confirmed")
    else setStatus("idle")
  }

  async function handleReject(reason: string) {
    setStatus("rejecting")
    const res = await rejectOrderPayment(orderId, reason)
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
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button
        onClick={handleConfirm}
        disabled={status === "confirming" || status === "rejecting"}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
      >
        {status === "confirming"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle2 className="w-4 h-4" />
        }
        Баталгаажуулах
      </button>
      <button
        onClick={() => setIsRejectModalOpen(true)}
        disabled={status === "confirming" || status === "rejecting"}
        className="flex items-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
      >
        {status === "rejecting"
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <XCircle className="w-4 h-4" />
        }
        Цуцлах
      </button>

      <RejectionDialog 
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        isLoading={status === "rejecting"}
      />
    </div>
  )
}
