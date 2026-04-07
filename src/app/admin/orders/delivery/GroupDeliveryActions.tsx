"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, PackageCheck, Handshake } from "lucide-react"
import { confirmDeliveryGroup, markDeliveryAsPickedUp } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function GroupDeliveryActions({ orderIds }: { orderIds: string[] }) {
  const [loading, setLoading] = useState<"deliver" | "pickup" | null>(null)
  const [done, setDone] = useState<"delivered" | "pickedup" | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  async function handleConfirmDelivery() {
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг ачааг хүргэгдсэн гэж хүлээн зөвшөөрөх үү?`)) return
    
    setLoading("deliver")
    const res = await confirmDeliveryGroup(orderIds)
    setLoading(null)

    if (res.success) {
      setDone("delivered")
      toast({ title: "Амжилттай", description: "Хүргэлт баталгаажлаа." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  async function handlePickedUp() {
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг бараа захиалагч өөрөө ирж авсан уу? Ингэснээр хүргэлтийн жагсаалтаас хасагдана.`)) return
    
    setLoading("pickup")
    const res = await markDeliveryAsPickedUp(orderIds)
    setLoading(null)

    if (res.success) {
      setDone("pickedup")
      toast({ title: "Амжилттай", description: "Захиалагч өөрөө авсан гэж бүртгэгдлээ." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  if (done === "delivered") {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600 border-green-200 bg-green-50 h-8 text-xs font-semibold px-4">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн
      </Button>
    )
  }

  if (done === "pickedup") {
    return (
      <Button variant="outline" size="sm" disabled className="text-emerald-600 border-emerald-200 bg-emerald-50 h-8 text-xs font-semibold px-4">
        <Handshake className="w-3.5 h-3.5 mr-1.5" /> Өөрөө авсан
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button 
        onClick={handlePickedUp} 
        disabled={!!loading}
        variant="outline"
        size="sm" 
        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 text-xs font-semibold px-3 transition-colors"
      >
        {loading === "pickup" ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Уншиж байна...</>
        ) : (
          <><Handshake className="w-3.5 h-3.5 mr-1.5" /> Өөрөө авсан</>
        )}
      </Button>
      <Button 
        onClick={handleConfirmDelivery} 
        disabled={!!loading}
        size="sm" 
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm h-8 text-xs font-semibold px-4 transition-colors"
      >
        {loading === "deliver" ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Уншиж байна...</>
        ) : (
          <><PackageCheck className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн гэж батлах</>
        )}
      </Button>
    </div>
  )
}
