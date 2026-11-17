"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, PackageCheck, Handshake, Truck, RotateCcw } from "lucide-react"
import { 
  confirmDeliveryGroup, 
  markDeliveryAsPickedUp, 
  handoverOrdersToCourier, 
  revertCourierHandover,
  markDeliveryFeePaid
} from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function GroupDeliveryActions({ 
  orderIds,
  isOutForDelivery = false,
  isFeePaid = false
}: { 
  orderIds: string[];
  isOutForDelivery?: boolean;
  isFeePaid?: boolean;
}) {
  const [loading, setLoading] = useState<"handover" | "deliver" | "pickup" | "revert" | "fee" | null>(null)
  const [done, setDone] = useState<"handover" | "delivered" | "pickedup" | "reverted" | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // 1. Hand over to courier (Step 1)
  async function handleHandoverToCourier() {
    if (orderIds.length === 0) return

    let autoConfirmFee = false
    if (!isFeePaid) {
      const ok = confirm(
        `⚠️ АНХААРУУЛГА:\nЭнэ захиалгын карго/хүргэлтийн төлбөр систем дээр БАТЛАГДААГҮЙ байна.\n\nЖолооч хэрэглэгчээс төлбөр авах ёсгүй тул төлбөр урьдчилан бүрэн төлөгдсөн эсэхийг шалгана уу.\n\nТөлбөрийг ТӨЛӨГДСӨН гэж батлаад хүргэлтэд гаргах уу?`
      )
      if (!ok) return
      autoConfirmFee = true
    } else {
      if (!confirm(`Эдгээр ${orderIds.length} ширхэг ачааг хүргэлтийн ажилтанд хүлээлгэн өгч хүргэлтэд гаргах уу?`)) return
    }
    
    setLoading("handover")
    const res = await handoverOrdersToCourier(orderIds, autoConfirmFee)
    setLoading(null)

    if (res.success) {
      setDone("handover")
      toast({ title: "Амжилттай", description: "Хүргэлтийн ажилтанд хүлээлгэн өглөө." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  // Toggle Fee Paid
  async function handleToggleFee(paid: boolean) {
    if (orderIds.length === 0) return
    setLoading("fee")
    const res = await markDeliveryFeePaid(orderIds, paid)
    setLoading(null)
    if (res.success) {
      toast({ title: "Амжилттай", description: paid ? "Төлбөр төлөгдсөнөөр тэмдэглэгдлээ." : "Төлбөрийн төлөвийг буцаалаа." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  // 2. Confirm delivered to customer (Step 2)
  async function handleConfirmDelivery() {
    if (orderIds.length === 0) return
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг ачаа хэрэглэгчийн гар дээр очсон гэж батлах уу?`)) return
    
    setLoading("deliver")
    const res = await confirmDeliveryGroup(orderIds)
    setLoading(null)

    if (res.success) {
      setDone("delivered")
      toast({ title: "Амжилттай", description: "Хүргэлт амжилттай баталгаажлаа." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  // 3. Mark picked up by customer themselves
  async function handlePickedUp() {
    if (orderIds.length === 0) return
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг барааг захиалагч өөрөө ирж авсан уу? Ингэснээр хүргэлтийн жагсаалтаас хасагдана.`)) return
    
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

  // 4. Revert courier handover back to ready
  async function handleRevert() {
    if (orderIds.length === 0) return
    if (!confirm(`Эдгээр ${orderIds.length} ширхэг ачааг хүргэлтээс буцааж агуулахын бэлтгэх жагсаалт руу шилжүүлэх үү?`)) return

    setLoading("revert")
    const res = await revertCourierHandover(orderIds)
    setLoading(null)

    if (res.success) {
      setDone("reverted")
      toast({ title: "Амжилттай", description: "Хүргэлтээс буцааж агуулахын жагсаалт руу шилжүүллээ." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  if (done === "delivered") {
    return (
      <Button variant="outline" size="sm" disabled className="text-emerald-600 border-emerald-200 bg-emerald-50 h-8 text-xs font-semibold px-4">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн
      </Button>
    )
  }

  if (done === "handover") {
    return (
      <Button variant="outline" size="sm" disabled className="text-indigo-600 border-indigo-200 bg-indigo-50 h-8 text-xs font-semibold px-4">
        <Truck className="w-3.5 h-3.5 mr-1.5" /> Жолоочид өгсөн
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

  if (done === "reverted") {
    return (
      <Button variant="outline" size="sm" disabled className="text-slate-500 border-slate-200 bg-slate-50 h-8 text-xs font-semibold px-4">
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Буцаагдсан
      </Button>
    )
  }

  // If order is currently out for delivery (with courier)
  if (isOutForDelivery) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Button 
          onClick={handleRevert} 
          disabled={!!loading || orderIds.length === 0}
          variant="outline"
          size="sm" 
          className="border-slate-200 text-slate-600 hover:bg-slate-100 h-8 text-xs font-semibold px-3 transition-colors"
        >
          {loading === "revert" ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Буцааж байна...</>
          ) : (
            <><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Буцаах</>
          )}
        </Button>
        <Button 
          onClick={handleConfirmDelivery} 
          disabled={!!loading || orderIds.length === 0}
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 text-xs font-semibold px-4 transition-colors"
        >
          {loading === "deliver" ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Баталж байна...</>
          ) : (
            <><PackageCheck className="w-3.5 h-3.5 mr-1.5" /> Хүргэгдсэн гэж батлах</>
          )}
        </Button>
      </div>
    )
  }

  // If order is currently waiting in warehouse (ready for courier)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isFeePaid ? (
        <Button 
          onClick={() => handleToggleFee(true)} 
          disabled={!!loading || orderIds.length === 0}
          variant="outline"
          size="sm" 
          className="border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 h-8 text-xs font-semibold px-3 transition-colors shadow-xs"
        >
          {loading === "fee" ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Баталж байна...</>
          ) : (
            <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Төлбөр батлах</>
          )}
        </Button>
      ) : (
        <Button 
          onClick={() => handleToggleFee(false)} 
          disabled={!!loading || orderIds.length === 0}
          variant="ghost"
          size="sm" 
          className="text-slate-400 hover:text-red-600 h-8 text-[11px] px-2"
          title="Төлбөрийн баталгаажуулалтыг цуцлах"
        >
          Төлбөр цуцлах
        </Button>
      )}

      <Button 
        onClick={handlePickedUp} 
        disabled={!!loading || orderIds.length === 0}
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
        onClick={handleHandoverToCourier} 
        disabled={!!loading || orderIds.length === 0}
        size="sm" 
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm h-8 text-xs font-semibold px-4 transition-colors"
      >
        {loading === "handover" ? (
          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Шилжүүлж байна...</>
        ) : (
          <><Truck className="w-3.5 h-3.5 mr-1.5" /> Жолоочид хүлээлгэн өгөх</>
        )}
      </Button>
    </div>
  )
}
