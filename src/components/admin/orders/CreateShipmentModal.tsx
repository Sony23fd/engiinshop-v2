"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Plane,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  X,
  Calendar,
  Check,
  Truck,
  FileText,
  Camera,
  UploadCloud,
  Weight,
  Coins
} from "lucide-react"
import { createShipmentManifest, getEligibleOrdersForShipment } from "@/app/actions/shipment-actions"
import Link from "next/link"

export interface SelectedOrderItem {
  id: string
  orderNumber: number
  customerName: string
  customerPhone: string
  productName: string
  quantity: number
  variantDesc?: string
  displayDate?: string
}

interface CreateShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedOrders: SelectedOrderItem[]
  defaultDateStr?: string
  onSuccess?: (shipment: any) => void
}

const COMMON_CARRIERS = [
  "Ачтан Карго",
  "Бүргэд Карго",
  "МИАТ Агаарын тээвэр",
  "Монгол Шуудан",
  "Хаан Карго",
]

export function CreateShipmentModal({
  isOpen,
  onClose,
  selectedOrders,
  defaultDateStr,
  onSuccess,
}: CreateShipmentModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdShipment, setCreatedShipment] = useState<any | null>(null)

  // Modifiable list of orders in this shipment
  const [ordersList, setOrdersList] = useState<SelectedOrderItem[]>(selectedOrders)

  // Default values
  const today = new Date()
  const dateFormatted = defaultDateStr || `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`

  const [name, setName] = useState(`${dateFormatted} Сөүл Карго`)
  const [notes, setNotes] = useState("")

  // Carrier & Logistic details
  const [carrierName, setCarrierName] = useState("Ачтан Карго")
  const [waybillNumber, setWaybillNumber] = useState("")
  const [boxCount, setBoxCount] = useState<number>(1)
  const [totalWeight, setTotalWeight] = useState<string>("")
  const [shippingCost, setShippingCost] = useState<string>("")
  const [costCurrency, setCostCurrency] = useState<"KRW" | "MNT">("KRW")
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search orders from other days
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Sync ordersList with selectedOrders when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrdersList(selectedOrders)
      setError(null)
      setCreatedShipment(null)
      setShowSearch(false)
      setSearchQuery("")
      setSearchResults([])
      setReceiptImageUrl(null)
    }
  }, [isOpen, selectedOrders])

  // Upload receipt image
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        setReceiptImageUrl(data.imageUrl)
      } else {
        setError(data.error || "Зураг оруулахад алдаа гарлаа.")
      }
    } catch (err: any) {
      setError(err.message || "Зураг оруулахад алдаа гарлаа.")
    } finally {
      setUploadingReceipt(false)
    }
  }

  // Search orders from other days
  const handleSearchOtherOrders = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const res = await getEligibleOrdersForShipment({ search: searchQuery.trim() })
    setIsSearching(false)
    if (res.success) {
      const currentIds = new Set(ordersList.map((o) => o.id))
      setSearchResults(res.orders.filter((o) => !currentIds.has(o.id)))
    }
  }

  // Add order from search
  const handleAddOrder = (item: any) => {
    const newItem: SelectedOrderItem = {
      id: item.id,
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      productName: item.productName,
      quantity: item.quantity,
      variantDesc: item.variantDesc,
      displayDate: item.displayDate,
    }
    setOrdersList((prev) => [...prev, newItem])
    setSearchResults((prev) => prev.filter((o) => o.id !== item.id))
  }

  // Remove order from list
  const handleRemoveOrder = (id: string) => {
    setOrdersList((prev) => prev.filter((o) => o.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ordersList.length) {
      setError("Ачилтанд оруулах захиалга сонгогдоогүй байна.")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await createShipmentManifest({
        name,
        notes,
        carrierName,
        waybillNumber,
        boxCount: Math.max(1, Number(boxCount) || 1),
        totalWeight: totalWeight ? parseFloat(totalWeight) : undefined,
        shippingCost: shippingCost ? parseFloat(shippingCost) : undefined,
        costCurrency,
        receiptImageUrl: receiptImageUrl || undefined,
        orderIds: ordersList.map((o) => o.id),
      })

      if (res.success && res.shipment) {
        setCreatedShipment(res.shipment)
        if (onSuccess) onSuccess(res.shipment)
      } else {
        setError(res.error || "Ачилт үүсгэхэд алдаа гарлаа.")
      }
    })
  }

  const handleClose = () => {
    setError(null)
    setCreatedShipment(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Plane className="w-5 h-5" />
              </span>
              Карго Ачилт & Тээврийн Бүртгэл Үүсгэх
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Сонгосон {ordersList.length} барааг каргонд ачиж, карго компанийн дагалдах бичиг болон баримтын зургийг бүртгэнэ.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {createdShipment ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Ачилт & Каргоны Бүртгэл Амжилттай Хадгалагдлаа!
                </h3>
                <p className="text-sm text-slate-600">
                  Илгээмжийн код: <strong className="font-mono text-indigo-700">{createdShipment.code}</strong>
                </p>
                {carrierName && (
                  <p className="text-xs text-slate-500">
                    Тээвэрлэгч: <b>{carrierName}</b> {waybillNumber && `(Waybill: ${waybillNumber})`}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Нийт {ordersList.length} барааны төлөв &ldquo;Солонгосоос хөдөлсөн&rdquo; болж шинэчлэгдлээ.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/admin/orders/shipments/${createdShipment.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Package className="w-4 h-4" />
                  Ачилтын баримт харах / Хэвлэх
                </Link>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full sm:w-auto font-bold text-sm"
                >
                  Хаах
                </Button>
              </div>
            </div>
          ) : (
            <form id="create-shipment-form" onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                  <div>{error}</div>
                </div>
              )}

              {/* 1. Shipment Name & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="shipment-name" className="text-xs font-bold text-slate-700 block">
                    Илгээмжийн нэр <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="shipment-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Жишээ: 11.18 Сөүл Карго #1"
                    className="h-9 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="shipment-notes" className="text-xs font-bold text-slate-700 block">
                    Нэмэлт тэмдэглэл
                  </label>
                  <Input
                    id="shipment-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Жишээ: Онгоцоор илгээв, том цэнхэр хайрцаг..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* 2. CARGO CARRIER & RECEIPT AUDIT SECTION */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    Карго Компани ба Баримтын Мэдээлэл
                  </span>
                  <span className="text-[11px] text-slate-400">Тээврийн баталгаажуулалт</span>
                </div>

                {/* Carrier Name & Quick Pills */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Карго компанийн нэр
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COMMON_CARRIERS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCarrierName(c)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all border ${
                          carrierName === c
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Каргоны нэр бичих..."
                    className="h-9 text-xs bg-white font-medium"
                  />
                </div>

                {/* Waybill / Tracking & Box count */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Каргоны бичгийн № (Waybill / Tracking)
                    </label>
                    <Input
                      value={waybillNumber}
                      onChange={(e) => setWaybillNumber(e.target.value)}
                      placeholder="Жишээ: AC-98412"
                      className="h-9 text-xs bg-white font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Хайрцгийн тоо (Box count)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={boxCount}
                      onChange={(e) => setBoxCount(parseInt(e.target.value, 10) || 1)}
                      className="h-9 text-xs bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Нийт жин (кг)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={totalWeight}
                      onChange={(e) => setTotalWeight(e.target.value)}
                      placeholder="Жишээ: 14.5"
                      className="h-9 text-xs bg-white font-bold"
                    />
                  </div>
                </div>

                {/* Shipping cost & Receipt Image Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Каргоны нийт зардал
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        placeholder="Жишээ: 120000"
                        className="h-9 text-xs bg-white font-bold flex-1"
                      />
                      <div className="flex bg-slate-200/80 rounded-lg p-0.5 border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setCostCurrency("KRW")}
                          className={`px-2 py-1 text-[10px] font-black rounded ${
                            costCurrency === "KRW" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                          }`}
                        >
                          ₩ Вон
                        </button>
                        <button
                          type="button"
                          onClick={() => setCostCurrency("MNT")}
                          className={`px-2 py-1 text-[10px] font-black rounded ${
                            costCurrency === "MNT" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                          }`}
                        >
                          ₮ Төгрөг
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Photo Upload */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Каргоны хуудас / Баримтын зураг
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />

                    {receiptImageUrl ? (
                      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="w-8 h-8 rounded relative overflow-hidden shrink-0 border">
                          <Image src={receiptImageUrl} alt="Баримт" fill className="object-cover" />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 flex-1 truncate">
                          Баримтын зураг орсон
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceiptImageUrl(null)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Устгах"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingReceipt}
                        className="w-full h-9 border-dashed border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-600 font-semibold gap-1.5"
                      >
                        {uploadingReceipt ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{uploadingReceipt ? "Хуулж байна..." : "Зураг авах / Файл сонгох"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Selected Items Preview with Remove & Add more */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ачилтанд орох бараанууд ({ordersList.length})
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className="text-xs font-bold h-7 gap-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Өөр өдрөөс бараа нэмэх
                  </Button>
                </div>

                {/* Inline Search from other days */}
                {showSearch && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-indigo-600" />
                        Өмнөх өдрүүдээс захиалга хайх
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSearch(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleSearchOtherOrders()
                          }
                        }}
                        placeholder="Захиалгын #1042, утас, нэрээр хайх..."
                        className="h-8 text-xs bg-white font-medium"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSearchOtherOrders()}
                        disabled={isSearching || !searchQuery.trim()}
                        className="h-8 bg-indigo-600 text-white font-bold text-xs shrink-0"
                      >
                        {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Хайх"}
                      </Button>
                    </div>

                    {/* Search results list */}
                    {searchResults.length > 0 && (
                      <div className="divide-y divide-indigo-100/60 max-h-40 overflow-y-auto bg-white rounded-lg border border-indigo-100">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-700">
                                  #{item.orderNumber}
                                </span>
                                {item.displayDate && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-medium">
                                    {item.displayDate}
                                  </span>
                                )}
                                <span className="font-bold text-slate-900 truncate">
                                  {item.productName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.customerName} ({item.customerPhone}){" "}
                                {item.variantDesc && (
                                  <span className="text-indigo-600">[{item.variantDesc}]</span>
                                )}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddOrder(item)}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Нэмэх
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Orders List in this shipment */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/40">
                  {ordersList.map((o) => (
                    <div key={o.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">#{o.orderNumber}</span>
                          {o.displayDate && (
                            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded">
                              {o.displayDate}
                            </span>
                          )}
                          <span className="font-bold text-slate-800 truncate">{o.productName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{o.customerName} ({o.customerPhone})</span>
                          {o.variantDesc && (
                            <span className="text-indigo-600 font-medium">({o.variantDesc})</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="bg-white font-bold text-[11px]">
                          {o.quantity} ш
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrder(o.id)}
                          className="w-5 h-5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                          title="Хасах"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdShipment && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              className="text-xs sm:text-sm font-semibold"
            >
              Болих
            </Button>
            <Button
              form="create-shipment-form"
              type="submit"
              disabled={isPending || !ordersList.length}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Бүртгэж байна...
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4" />
                  Ачих & Каргонд Илгээх ({ordersList.length})
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
