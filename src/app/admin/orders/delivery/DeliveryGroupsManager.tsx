"use client"

import { useState } from "react"
import { DeliveryGroupCard } from "./DeliveryGroupCard"
import { confirmDeliveryGroup, handoverOrdersToCourier } from "@/app/actions/order-actions"
import { 
  CheckCircle2, 
  Truck, 
  Copy, 
  ExternalLink, 
  Loader2, 
  CheckSquare, 
  Square, 
  Smartphone,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface DeliveryGroupsManagerProps {
  groups: any[][]
  currentTab: "ready" | "in_transit"
  courierPin: string
}

export function DeliveryGroupsManager({
  groups,
  currentTab,
  courierPin
}: DeliveryGroupsManagerProps) {
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([])
  const [loadingAction, setLoadingAction] = useState<"bulk_deliver" | "bulk_handover" | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const allKeys = groups.map(g => g[0].customerPhone || g[0].id)
  const allSelected = groups.length > 0 && selectedGroupKeys.length === groups.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedGroupKeys([])
    } else {
      setSelectedGroupKeys(allKeys)
    }
  }

  const toggleGroup = (key: string) => {
    setSelectedGroupKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Collect all order IDs for selected groups
  const getSelectedOrderIds = () => {
    const selectedGroups = groups.filter(g => selectedGroupKeys.includes(g[0].customerPhone || g[0].id))
    return selectedGroups.flatMap(g => g.map(o => o.id))
  }

  // 1. Bulk confirm delivered (for in_transit tab)
  const handleBulkConfirmDelivered = async () => {
    const orderIds = getSelectedOrderIds()
    if (orderIds.length === 0) return

    if (!confirm(`Сонгосон ${selectedGroupKeys.length} харилцагчийн нийт ${orderIds.length} ширхэг ачааг бүгдийг "Хүргэгдсэн" төлөвт шилжүүлж батлах уу?`)) return

    setLoadingAction("bulk_deliver")
    const res = await confirmDeliveryGroup(orderIds)
    setLoadingAction(null)

    if (res.success) {
      toast({ 
        title: "Амжилттай", 
        description: `${selectedGroupKeys.length} харилцагчийн ачаа хүргэгдсэнээр бүртгэгдлээ.` 
      })
      setSelectedGroupKeys([])
      router.refresh()
    } else {
      toast({ 
        variant: "destructive", 
        title: "Алдаа", 
        description: res.error || "Алдаа гарлаа" 
      })
    }
  }

  // 2. Bulk handover to courier (for ready tab)
  const handleBulkHandover = async () => {
    const orderIds = getSelectedOrderIds()
    if (orderIds.length === 0) return

    // Check if any order has unpaid delivery fee
    const selectedOrders = groups.filter(g => selectedGroupKeys.includes(g[0].customerPhone || g[0].id)).flatMap(g => g)
    const hasUnpaidFee = selectedOrders.some((o: any) => o.deliveryFeePaid === false)

    let autoConfirmFee = false
    if (hasUnpaidFee) {
      const ok = confirm(
        `⚠️ АНХААРУУЛГА:\nСонгосон захиалгуудын дунд карго/хүргэлтийн төлбөр нь систем дээр БАТЛАГДААГҮЙ захиалгууд байна.\n\nЖолооч хэрэглэгчээс төлбөр авах ёсгүй тул төлбөр урьдчилан орж ирсэн эсэхийг шалгана уу.\n\nТөлбөрийг ТӨЛӨГДСӨН гэж тооцоод бүгдийг хүргэлтэд гаргах уу?`
      )
      if (!ok) return
      autoConfirmFee = true
    } else {
      if (!confirm(`Сонгосон ${selectedGroupKeys.length} харилцагчийн нийт ${orderIds.length} ширхэг ачааг хүргэлтийн ажилтанд хүлээлгэн өгч хүргэлтэд гаргах уу?`)) return
    }

    setLoadingAction("bulk_handover")
    const res = await handoverOrdersToCourier(orderIds, autoConfirmFee)
    setLoadingAction(null)

    if (res.success) {
      toast({ 
        title: "Амжилттай", 
        description: `${selectedGroupKeys.length} харилцагчийн ачааг хүргэлтийн ажилтанд шилжүүллээ.` 
      })
      setSelectedGroupKeys([])
      router.refresh()
    } else {
      toast({ 
        variant: "destructive", 
        title: "Алдаа", 
        description: res.error || "Алдаа гарлаа" 
      })
    }
  }

  // Copy Courier Mobile Link
  const handleCopyCourierLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://anarkoreashop.mn"
    const link = `${origin}/courier?pin=${courierPin}`
    navigator.clipboard.writeText(link)
    toast({ 
      title: "Хуулагдлаа! 📱", 
      description: `Жолоочийн шууд нэвтрэх линк хуулагдлаа: ${link}` 
    })
  }

  return (
    <div className="space-y-4">
      {/* Top Global Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Selection toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer select-none"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {allSelected ? "Бүх сонголтыг цуцлах" : `Бүгдийг сонгох (${groups.length} харилцагч)`}
            </span>
          </button>

          {selectedGroupKeys.length > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 animate-in fade-in">
              Сонгосон: {selectedGroupKeys.length}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Courier Link Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCourierLink}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-8 text-xs font-semibold px-3 shadow-xs"
            title="Жолоочийн утсаараа харах шууд линкийг хуулах"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Жолоочийн линк хуулах
          </Button>

          <a
            href={`/courier?pin=${courierPin}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            title="Жолоочийн мобайл хуудсыг шинэ таб дээр нээх"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Bulk In-Transit Confirm (Tab: in_transit) */}
          {currentTab === "in_transit" && selectedGroupKeys.length > 0 && (
            <Button
              size="sm"
              onClick={handleBulkConfirmDelivered}
              disabled={loadingAction === "bulk_deliver"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs px-3.5 shadow-sm active:scale-95 transition-all animate-in fade-in"
            >
              {loadingAction === "bulk_deliver" ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Баталж байна...</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Сонгосон ({selectedGroupKeys.length}) бүгдийг хүргэгдсэнээр батлах</>
              )}
            </Button>
          )}

          {/* Bulk Handover to Courier (Tab: ready) */}
          {currentTab === "ready" && selectedGroupKeys.length > 0 && (
            <Button
              size="sm"
              onClick={handleBulkHandover}
              disabled={loadingAction === "bulk_handover"}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-8 text-xs px-3.5 shadow-sm active:scale-95 transition-all animate-in fade-in"
            >
              {loadingAction === "bulk_handover" ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Шилжүүлж байна...</>
              ) : (
                <><Truck className="w-3.5 h-3.5 mr-1.5" /> Сонгосон ({selectedGroupKeys.length}) бүгдийг жолоочид өгөх</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Render Delivery Groups with integrated selection checkbox */}
      <div className="space-y-4">
        {groups.map((groupOrders) => {
          const key = groupOrders[0].customerPhone || groupOrders[0].id
          const isSelected = selectedGroupKeys.includes(key)

          return (
            <div key={key} className="relative group/wrapper">
              {/* Group Checkbox Pin at top right */}
              <div className="absolute top-3.5 right-4 z-10 hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-lg border shadow-xs">
                <input
                  type="checkbox"
                  id={`select-group-${key}`}
                  checked={isSelected}
                  onChange={() => toggleGroup(key)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                />
                <label htmlFor={`select-group-${key}`} className="text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                  Сонгох
                </label>
              </div>

              <div className={`transition-all rounded-xl ${isSelected ? "ring-2 ring-indigo-500 shadow-md" : ""}`}>
                <DeliveryGroupCard groupOrders={groupOrders} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
