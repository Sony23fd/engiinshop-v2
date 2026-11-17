"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plane, Package, AlertCircle, CheckCircle2, Loader2, Printer, ArrowRight } from "lucide-react"
import { createShipmentManifest } from "@/app/actions/shipment-actions"
import Link from "next/link"

export interface SelectedOrderItem {
  id: string
  orderNumber: number
  customerName: string
  customerPhone: string
  productName: string
  quantity: number
  variantDesc?: string
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

  // Default values
  const today = new Date()
  const dateFormatted = defaultDateStr || `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`

  const [name, setName] = useState(`${dateFormatted} Сөүл Карго`)
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrders.length) {
      setError("Ачилтанд оруулах захиалга сонгогдоогүй байна.")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await createShipmentManifest({
        name,
        notes,
        orderIds: selectedOrders.map((o) => o.id),
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
              Сонгосон {selectedOrders.length} барааг каргонд ачиж, төлөвийг нь &ldquo;🛫 Солонгосоос хөдөлсөн&rdquo; болгоно.
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
                  Нийт {selectedOrders.length} барааны төлөв &ldquo;Солонгосоос хөдөлсөн&rdquo; болж шинэчлэгдлээ.
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
                  className="text-xs sm:text-sm min-h-[70px] resize-none"
                />
              </div>

              {/* Selected Items Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Ачилтанд орох бараанууд ({selectedOrders.length})
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    Бүх төлөв &ldquo;Солонгосоос хөдөлсөн&rdquo; болно
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/40">
                  {selectedOrders.map((o) => (
                    <div key={o.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">#{o.orderNumber}</span>
                          <span className="font-bold text-slate-800 truncate">{o.productName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{o.customerName} ({o.customerPhone})</span>
                          {o.variantDesc && (
                            <span className="text-indigo-600 font-medium">({o.variantDesc})</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white font-bold text-[11px] shrink-0">
                        {o.quantity} ш
                      </Badge>
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
              disabled={isPending || !selectedOrders.length}
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
                  Ачих & Каргонд Илгээх ({selectedOrders.length})
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
