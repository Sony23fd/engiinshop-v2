"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, PackageCheck } from "lucide-react"
import { confirmDeliveryGroup } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function GroupDeliveryActions({ orderIds }: { orderIds: string[] }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleConfirm() {
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг ачааг хүргэгдсэн гэж хүлээн зөвшөөрөх үү? Ингэснээр Хүргэгдсэн захиалга руу шилжих болно.`)) return
    
    setLoading(true)
    const res = await confirmDeliveryGroup(orderIds)
    setLoading(false)

    if (res.success) {
      setDone(true)
      toast({ title: "Амжилттай", description: "Хүргэлт баталгаажлаа." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  if (done) {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600 border-green-200 bg-green-50 w-full sm:w-auto h-8 text-xs font-semibold px-4">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleConfirm} 
      disabled={loading}
      size="sm" 
      className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm w-full sm:w-auto h-8 text-xs font-semibold px-4 transition-colors"
    >
      {loading ? (
        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Уншиж байна...</>
      ) : (
        <><PackageCheck className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн гэж батлах</>
      )}
    </Button>
  )
}
