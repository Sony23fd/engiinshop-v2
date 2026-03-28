"use client"
import { useState } from "react"
import { RefreshCcw, Loader2 } from "lucide-react"
import { restoreGroupOrder } from "@/app/actions/order-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function GroupDeliveredActions({ orderIds }: { orderIds: string[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [restoring, setRestoring] = useState(false)

  async function handleRestore() {
    if (!confirm(`Энэ хэрэглэгчийн ${orderIds.length} захиалгыг буцааж сэргээх үү (Алдаатай дарсан бол)?`)) return
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
      className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
      {orderIds.length > 1 ? `${orderIds.length} ширхэгийг буцаах` : "Буцаах (Алдаатай бол)"}
    </button>
  )
}
