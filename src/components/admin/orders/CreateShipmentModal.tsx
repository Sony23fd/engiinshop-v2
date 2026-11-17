"use client"

import { useState, useTransition, useEffect } from "react"
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
  Check
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
    }
  }, [isOpen, selectedOrders])

  // Search orders from other days
  const handleSearchOtherOrders = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    const res = await getEligibleOrdersForShipment({ search: searchQuery.trim() })
    setIsSearching(false)
    if (res.success) {
      // Exclude already added orders
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
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Plane className="w-5 h-5" />
              </span>
              Карго Ачилт Үүсгэх (Shipment Manifest)
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Сонгосон {ordersList.length} барааг каргонд ачиж, төлөвийг нь &ldquo;🛫 Солонгосоос хөдөлсөн&rdquo; болгоно.
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
                  Ачилт Амжилттай Бүртгэгдлээ!
                </h3>
                <p className="text-sm text-slate-600">
                  Илгээмжийн код: <strong className="font-mono text-indigo-700">{createdShipment.code}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Нийт {ordersList.length} барааны төлөв &ldquo;Солонгосоос хөдөлсөн&rdquo; болж шинэчлэгдлээ.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/admin/orders/shipments/${createdShipment.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Package className="w-4 h-4" />
                  Илгээмжийг харах / Хэвлэх
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

              {/* Shipment Name */}
              <div className="space-y-1.5">
                <label htmlFor="shipment-name" className="text-xs font-bold text-slate-700 block">
                  Илгээмжийн нэр <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="shipment-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Жишээ нь: 11.18 Сөүл Карго #1"
                  className="h-10 text-sm font-semibold"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Карго админ энэ нэрээр хайрцаг болон илгээмжээ шууд танина.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="shipment-notes" className="text-xs font-bold text-slate-700 block">
                  Нэмэлт тэмдэглэл (Сонголттой)
                </label>
                <Textarea
                  id="shipment-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Жишээ: МИАТ нислэгээр явуулав, том цэнхэр хайрцагт байгаа..."
                  className="text-xs sm:text-sm min-h-[60px] resize-none"
                />
              </div>

              {/* Selected Items Preview with Remove & Add more */}
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
