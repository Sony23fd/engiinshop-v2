"use client"

import { useState } from "react"
import { User, Truck, Box, Tag, CheckCircle2, AlertCircle, Edit2 } from "lucide-react"
import { GroupDeliveryActions } from "./GroupDeliveryActions"
import { formatSelectedOptions } from "@/lib/variant-utils"
import { updateDeliveryAddressForOrders } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function DeliveryGroupCard({ 
  groupOrders,
  deliveryFee = 8000
}: { 
  groupOrders: any[];
  deliveryFee?: number;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(groupOrders.map(o => o.id))
  const { toast } = useToast()
  const router = useRouter()

  const first = groupOrders[0]
  const deliveryAddress = groupOrders.find((o: any) => o.deliveryAddress)?.deliveryAddress
  const isMissingAddr = !deliveryAddress || 
    deliveryAddress.trim() === "" || 
    deliveryAddress === "Хаяг тодруулах шаардлагатай" || 
    deliveryAddress === "Өөрөө ирж авна" || 
    deliveryAddress === "Өөрөө авна"

  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [inputAddress, setInputAddress] = useState(isMissingAddr ? "" : (deliveryAddress || ""))
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputAddress.trim()) {
      toast({ variant: "destructive", title: "Алдаа", description: "Хүргэлтийн хаяг хоосон байж болохгүй" })
      return
    }
    setIsSavingAddress(true)
    const allGroupOrderIds = groupOrders.map(o => o.id)
    const res = await updateDeliveryAddressForOrders(allGroupOrderIds, inputAddress.trim())
    setIsSavingAddress(false)
    if (res.success) {
      toast({ title: "Амжилттай", description: "Хүргэлтийн хаяг шинэчлэгдлээ." })
      setIsEditingAddress(false)
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Хаяг шинэчлэхэд алдаа гарлаа" })
    }
  }

  const isOutForDelivery = groupOrders.some((o: any) => 
    o.status?.name?.toLowerCase().includes("ажилтанд өгсөн") || 
    o.status?.name?.toLowerCase().includes("хүргэлтэд гарсан")
  )

  const isFeePaid = groupOrders.every((o: any) => o.deliveryFeePaid === true)

  let totalCargoFee = 0
  for (const o of groupOrders) {
    if (o.batch?.product?.isFreeCargo || o.batch?.isFreeCargo) continue
    const unitCargo = Number(o.batch?.cargoFeeStatus || 0) * Number(o.batch?.product?.weight || 0)
    const customCargo = Number(o.cargoFee || 0)
    const orderFee = customCargo > 0 ? customCargo * Number(o.quantity || 1) : unitCargo * Number(o.quantity || 1)
    totalCargoFee += orderFee
  }

  const allSelected = selectedIds.length === groupOrders.length
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleAll() {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(groupOrders.map(o => o.id))
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 ${isMissingAddr ? "border-l-red-500" : (isOutForDelivery ? "border-l-indigo-500" : "border-l-amber-400")}`}>
      {/* Customer Header */}
      <div className="bg-slate-50 border-b px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMissingAddr ? "bg-red-100 text-red-600" : (isOutForDelivery ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600")}`}>
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-900">{first.customerName}</span>
               <span className="text-slate-400">·</span>
               <span className="text-slate-500 text-sm font-semibold">{first.customerPhone}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
              <p>⏱️ Хүсэлт өгсөн: <span className="font-medium text-slate-500" suppressHydrationWarning>{new Date(first.deliveryRequestedAt || first.updatedAt).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}</span></p>
              {first.deliveryDate && (
                <p>📅 Хүргүүлэх өдөр: <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded" suppressHydrationWarning>{new Date(first.deliveryDate).toLocaleDateString("mn-MN")}</span></p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isMissingAddr && (
            <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-xs border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Хаяг дутуу!
            </span>
          )}
          {isOutForDelivery ? (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
              <Truck className="w-3.5 h-3.5" /> Жолоочтой яваа (Хүргэлтэд гарсан)
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
              <Box className="w-3.5 h-3.5" /> Хүргэлтэд бэлтгэх (Хүлээгдэж буй)
            </span>
          )}
        </div>
      </div>

      {/* Payment & Cargo Fee Status Banner */}
      <div className={`px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b ${
        isFeePaid ? "bg-emerald-50/70 border-emerald-100 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {isFeePaid ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Төлбөр урьдчилан төлөгдсөн (Жолооч мөнгө авахгүй)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-200/70 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Хүргэлт / Карго төлбөр шалгагдаж буй
            </span>
          )}
        </div>
        <div className="text-slate-500 text-xs flex items-center gap-3">
          <span>📦 Карго: <strong className="text-slate-800 font-semibold">{totalCargoFee > 0 ? `${totalCargoFee.toLocaleString()} ₮` : "Үнэгүй"}</strong></span>
          <span>·</span>
          <span>🚚 Хүргэлт: <strong className="text-slate-800 font-semibold">{deliveryFee.toLocaleString()} ₮</strong></span>
          <span>·</span>
          <span>Нийт: <strong className="text-slate-900 font-bold">{(totalCargoFee + deliveryFee).toLocaleString()} ₮</strong></span>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y">
        <div className="px-5 py-2 bg-slate-50/50 flex items-center gap-3 border-b">
           <input 
              type="checkbox" 
              className={`w-4 h-4 rounded border-slate-300 ${isOutForDelivery ? "text-indigo-600 focus:ring-indigo-500" : "text-amber-600 focus:ring-amber-500"} cursor-pointer`}
              checked={allSelected}
              ref={input => { if (input) input.indeterminate = someSelected }}
              onChange={toggleAll}
            />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Бүгдийг сонгох</span>
        </div>
        {groupOrders.map((order: any) => {
          const isChecked = selectedIds.includes(order.id)
          return (
          <div key={order.id} className={`px-5 py-4 transition-colors ${isChecked ? (isOutForDelivery ? 'bg-indigo-50/20' : 'bg-amber-50/20') : 'hover:bg-slate-50/50'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="mt-1">
                <input 
                  type="checkbox" 
                  className={`w-4 h-4 rounded border-slate-300 ${isOutForDelivery ? "text-indigo-600 focus:ring-indigo-500" : "text-amber-600 focus:ring-amber-500"} cursor-pointer`}
                  checked={isChecked}
                  onChange={() => toggleOne(order.id)}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 cursor-pointer" onClick={() => toggleOne(order.id)}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-800">{order.batch?.product?.name}</span>
                  <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                  {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      {formatSelectedOptions(order.selectedOptions)}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isOutForDelivery ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {order.status?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Тоо</span>
                    <span className="font-medium text-slate-800">{order.quantity} ш</span>
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <span className="text-slate-400 text-xs block">Хүргүүлэх хаяг</span>
                    {isEditingAddress ? (
                      <form onSubmit={handleSaveAddress} className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={inputAddress}
                          onChange={e => setInputAddress(e.target.value)}
                          placeholder="Дүүрэг, хороо, байр, орц, тоот..."
                          className="text-xs px-2.5 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 bg-white text-slate-800 shadow-xs"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-50 shrink-0 shadow-xs"
                        >
                          {isSavingAddress ? "Хадгалж байна..." : "Хадгалах"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsEditingAddress(false); setInputAddress(isMissingAddr ? "" : (deliveryAddress || "")); }}
                          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg shrink-0"
                        >
                          Болих
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {isMissingAddr ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            ⚠️ Хаяг тодруулах шаардлагатай!
                          </span>
                        ) : (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-xs border border-indigo-100">
                            {deliveryAddress}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setIsEditingAddress(true); }}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 underline ml-1 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3" /> {isMissingAddr ? "Хаяг оруулах" : "Засах"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Delivery actions */}
      <div className="border-t px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <p className="text-xs text-slate-500">
          {isOutForDelivery ? (
            <>Сонгосон <strong className="text-indigo-700 font-bold">{selectedIds.length}</strong> захиалга жолоочтой замдаа яваа. Хэрэглэгчийн гар дээр очсон бол батална уу.</>
          ) : (
            <>Сонгосон <strong className="text-amber-700 font-bold">{selectedIds.length}</strong> захиалгыг жолоочид баглаж өгсөн бол хүргэлтэд гаргана уу.</>
          )}
        </p>
        <GroupDeliveryActions orderIds={selectedIds} isOutForDelivery={isOutForDelivery} isFeePaid={isFeePaid} isMissingAddress={isMissingAddr} />
      </div>
    </div>
  )
}
