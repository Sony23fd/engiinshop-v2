"use client"

import { useState } from "react"
import { RefreshCcw, Loader2 } from "lucide-react"
import { restoreGroupOrder } from "@/app/actions/order-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function GroupRejectedActions({ orderIds }: { orderIds: string[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [restoring, setRestoring] = useState(false)

  async function handleRestore() {
    if (!confirm(`Энэ хэрэглэгчийн бүх ${orderIds.length} захиалгыг буцааж сэргээх үү?`)) return
    setRestoring(true)
    const res = await restoreGroupOrder(orderIds)
    setRestoring(false)
    if (res.success) {
      toast({ title: "Сэргээгдлээ", description: "Захиалгууд хүлээгдэж буй дараалал руу орлоо." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  return (
    <button
      onClick={handleRestore}
      disabled={restoring}
      className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
      {orderIds.length > 1 ? `${orderIds.length} захиалга сэргээх` : "Сэргээх"}
    </button>
  )
}
