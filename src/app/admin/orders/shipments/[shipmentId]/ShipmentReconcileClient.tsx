"use client"

import { useState, useTransition, useMemo, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Plane,
  Package,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Barcode,
  Check,
  Loader2,
  AlertCircle,
  Truck,
  Phone,
  User,
  ExternalLink,
  Plus,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  receiveShipmentItems,
  addOrdersToShipment,
  getEligibleOrdersForShipment,
} from "@/app/actions/shipment-actions"

interface ShipmentDetailOrder {
  id: string
  orderNumber: number
  customerName: string
  customerPhone: string
  quantity: number
  statusId: string | null
  arrivalDate: Date | string | null
  totalAmount: any
  selectedOptions: any
  deliveryAddress: string | null
  wantsDelivery: boolean
  adminNotes: string | null
  batch?: {
    batchNumber: number
    product?: {
      name: string
      imageUrl: string | null
    }
  }
  status?: {
    name: string
    color: string | null
  } | null
}

interface ShipmentDetail {
  id: string
  code: string
  name: string
  status: string
  notes: string | null
  totalOrders: number
  arrivedOrders: number
  dispatchedAt: Date | string
  arrivedAt: Date | string | null
  createdBy: string | null
  orders: ShipmentDetailOrder[]
}

interface ShipmentReconcileClientProps {
  initialShipment: ShipmentDetail
  arrivedStatusId: string
}

export function ShipmentReconcileClient({
  initialShipment,
  arrivedStatusId,
}: ShipmentReconcileClientProps) {
  const [shipment, setShipment] = useState<ShipmentDetail>(initialShipment)
  const [isPending, startTransition] = useTransition()
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Scanner input state
  const [scanInput, setScanInput] = useState("")
  const [lastScannedOrder, setLastScannedOrder] = useState<number | null>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Search filter
  const [searchFilter, setSearchFilter] = useState("")

  // Row selection for partial receive
  const [selectedOrderIds, setSelectedOrderIds] = useState<Record<string, boolean>>({})

  // Add more orders modal
  const [showAddMoreModal, setShowAddMoreModal] = useState(false)
  const [addMoreQuery, setAddMoreQuery] = useState("")
  const [addMoreResults, setAddMoreResults] = useState<any[]>([])
  const [isSearchingAddMore, setIsSearchingAddMore] = useState(false)

  // Search orders to add to this shipment
  const handleSearchAddMore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!addMoreQuery.trim()) return

    setIsSearchingAddMore(true)
    const res = await getEligibleOrdersForShipment({ search: addMoreQuery.trim() })
    setIsSearchingAddMore(false)
    if (res.success) {
      const currentIds = new Set(shipment.orders.map((o) => o.id))
      setAddMoreResults(res.orders.filter((o) => !currentIds.has(o.id)))
    }
  }

  // Add order to current shipment
  const handleAddOrderToShipment = (item: any) => {
    startTransition(async () => {
      const res = await addOrdersToShipment({
        shipmentId: shipment.id,
        orderIds: [item.id],
      })

      if (res.success) {
        setShipment((prev) => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          orders: [
            ...prev.orders,
            {
              id: item.id,
              orderNumber: item.orderNumber,
              customerName: item.customerName,
              customerPhone: item.customerPhone,
              quantity: item.quantity,
              statusId: "cmndey7um0004r0s79bya29yt",
              arrivalDate: null,
              totalAmount: item.totalAmount,
              selectedOptions: item.selectedOptions,
              deliveryAddress: null,
              wantsDelivery: false,
              adminNotes: null,
              batch: {
                batchNumber: 0,
                product: {
                  name: item.productName,
                  imageUrl: item.imageUrl,
                },
              },
              status: {
                name: "Солонгосоос хөдөлсөн",
                color: "sky",
              },
            },
          ],
        }))
        setAddMoreResults((prev) => prev.filter((o) => o.id !== item.id))
        setNotification({
          type: "success",
          text: `Захиалга #${item.orderNumber} (${item.customerName}) амжилттай энэ ачилтанд нэмэгдлээ!`,
        })
      } else {
        setNotification({ type: "error", text: res.error || "Алдаа гарлаа." })
      }
    })
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!searchFilter.trim()) return shipment.orders
    const q = searchFilter.toLowerCase().trim()
    return shipment.orders.filter((o) => {
      const matchNum = o.orderNumber.toString().includes(q)
      const matchCust = o.customerName.toLowerCase().includes(q)
      const matchPhone = o.customerPhone.includes(q)
      const matchProd = (o.batch?.product?.name || "").toLowerCase().includes(q)
      return matchNum || matchCust || matchPhone || matchProd
    })
  }, [shipment.orders, searchFilter])

  // Summary counts
  const arrivedCount = shipment.orders.filter((o) => o.statusId === arrivedStatusId).length
  const totalCount = shipment.orders.length
  const pendingCount = totalCount - arrivedCount
  const percent = totalCount > 0 ? Math.round((arrivedCount / totalCount) * 100) : 0
  const isAllArrived = arrivedCount >= totalCount && totalCount > 0

  // 1-Click Receive All
  const handleReceiveAll = () => {
    if (isAllArrived) return
    if (!confirm(`Энэ илгээмжийн БҮХ ${totalCount} барааг "Улаанбаатарт ирсэн" төлөвт шилжүүлэхдээ итгэлтэй байна уу?`)) {
      return
    }

    setNotification(null)
    startTransition(async () => {
      const res = await receiveShipmentItems({
        shipmentId: shipment.id,
        receiveAll: true,
      })

      if (res.success && res.shipment) {
        setShipment((prev) => ({
          ...prev,
          status: res.shipment.status,
          arrivedOrders: res.arrivedOrders,
          orders: prev.orders.map((o) => ({
            ...o,
            statusId: arrivedStatusId,
            status: { name: "Улаанбаатарт ирсэн", color: "emerald" },
          })),
        }))
        setSelectedOrderIds({})
        setNotification({
          type: "success",
          text: `Амжилттай! Бүх ${totalCount} бараа "Улаанбаатарт ирсэн" төлөвт шилжиж, хэрэглэгчийн хүргэлт авах эрх нээгдлээ.`,
        })
      } else {
        setNotification({ type: "error", text: res.error || "Алдаа гарлаа." })
      }
    })
  }

  // Receive Selected items
  const handleReceiveSelected = () => {
    const ids = Object.keys(selectedOrderIds).filter((id) => selectedOrderIds[id])
    if (ids.length === 0) return

    setNotification(null)
    startTransition(async () => {
      const res = await receiveShipmentItems({
        shipmentId: shipment.id,
        orderIds: ids,
      })

      if (res.success && res.shipment) {
        setShipment((prev) => ({
          ...prev,
          status: res.shipment.status,
          arrivedOrders: res.arrivedOrders,
          orders: prev.orders.map((o) =>
            ids.includes(o.id)
              ? {
                  ...o,
                  statusId: arrivedStatusId,
                  status: { name: "Улаанбаатарт ирсэн", color: "emerald" },
                }
              : o
          ),
        }))
        setSelectedOrderIds({})
        setNotification({
          type: "success",
          text: `Сонгосон ${ids.length} бараа "Улаанбаатарт ирсэн" төлөвт шилжлээ. Нийт ирсэн: ${res.arrivedOrders}/${totalCount}`,
        })
      } else {
        setNotification({ type: "error", text: res.error || "Алдаа гарлаа." })
      }
    })
  }

  // Receive a single order
  const handleReceiveSingle = (orderId: string) => {
    setNotification(null)
    startTransition(async () => {
      const res = await receiveShipmentItems({
        shipmentId: shipment.id,
        orderIds: [orderId],
      })

      if (res.success && res.shipment) {
        setShipment((prev) => ({
          ...prev,
          status: res.shipment.status,
          arrivedOrders: res.arrivedOrders,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  statusId: arrivedStatusId,
                  status: { name: "Улаанбаатарт ирсэн", color: "emerald" },
                }
              : o
          ),
        }))
        setNotification({
          type: "success",
          text: `Захиалга амжилттай хүлээн авагдлаа. Нийт ирсэн: ${res.arrivedOrders}/${totalCount}`,
        })
      } else {
        setNotification({ type: "error", text: res.error || "Алдаа гарлаа." })
      }
    })
  }

  // Handle barcode / order number scan
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = scanInput.trim()
    if (!raw) return

    // Extract digits (handles "#1024", "1024", barcode formats)
    const orderNumMatch = raw.replace(/\D/g, "")
    if (!orderNumMatch) {
      setNotification({ type: "error", text: `Зөвхөн захиалгын дугаар оруулна уу: "${raw}"` })
      setScanInput("")
      return
    }

    const orderNum = parseInt(orderNumMatch, 10)
    const targetOrder = shipment.orders.find((o) => o.orderNumber === orderNum)

    if (!targetOrder) {
      setNotification({
        type: "error",
        text: `Захиалга #${orderNum} энэ илгээмжинд (${shipment.code}) олдсонгүй!`,
      })
      setScanInput("")
      return
    }

    if (targetOrder.statusId === arrivedStatusId) {
      setNotification({
        type: "success",
        text: `Захиалга #${orderNum} (${targetOrder.customerName}) өмнө нь хүлээн авагдсан байна.`,
      })
      setLastScannedOrder(orderNum)
      setScanInput("")
      return
    }

    // Auto receive scanned order
    startTransition(async () => {
      const res = await receiveShipmentItems({
        shipmentId: shipment.id,
        orderIds: [targetOrder.id],
      })

      if (res.success && res.shipment) {
        setShipment((prev) => ({
          ...prev,
          status: res.shipment.status,
          arrivedOrders: res.arrivedOrders,
          orders: prev.orders.map((o) =>
            o.id === targetOrder.id
              ? {
                  ...o,
                  statusId: arrivedStatusId,
                  status: { name: "Улаанбаатарт ирсэн", color: "emerald" },
                }
              : o
          ),
        }))
        setLastScannedOrder(orderNum)
        setNotification({
          type: "success",
          text: `✅ Захиалга #${orderNum} (${targetOrder.customerName} - ${targetOrder.batch?.product?.name}) хүлээн авлаа! (${res.arrivedOrders}/${totalCount})`,
        })
      } else {
        setNotification({ type: "error", text: res.error || "Алдаа гарлаа." })
      }
      setScanInput("")
      if (scanInputRef.current) scanInputRef.current.focus()
    })
  }

  // Toggle row selection
  const toggleRowSelect = (id: string) => {
    setSelectedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Toggle select all non-arrived
  const toggleSelectAllNonArrived = () => {
    const nonArrived = shipment.orders.filter((o) => o.statusId !== arrivedStatusId)
    const allSelected = nonArrived.every((o) => selectedOrderIds[o.id])
    if (allSelected) {
      setSelectedOrderIds({})
    } else {
      const newSel: Record<string, boolean> = {}
      nonArrived.forEach((o) => {
        newSel[o.id] = true
      })
      setSelectedOrderIds(newSel)
    }
  }

  const selectedCount = Object.values(selectedOrderIds).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Print */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/orders/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Бүх карго илгээмжүүд рүү буцах
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddMoreModal(true)}
            className="text-xs font-bold gap-1.5 h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Захиалга нэмж оруулах
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold gap-1.5 h-8 border-slate-200 hover:bg-slate-50"
            title="Ачилтын жагсаалтыг цаасан дээр хэвлэх"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Ачилтын хуудас хэвлэх
          </Button>
        </div>
      </div>

      {/* Shipment Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-md">
                {shipment.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {shipment.name}
              </h1>
              {isAllArrived ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Бүрэн хүлээн авсан
                </span>
              ) : shipment.status === "PARTIAL" ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Хэсэгчлэн ирсэн
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  <Plane className="w-3.5 h-3.5 text-sky-600" />
                  Замдаа яваа
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Солонгосоос илгээсэн: <b>{new Date(shipment.dispatchedAt).toLocaleDateString("mn-MN")}</b> (
              {shipment.createdBy || "Admin"})
              {shipment.notes && <span className="ml-2 font-medium italic">— {shipment.notes}</span>}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-right">
              <p className="text-[11px] font-semibold text-slate-500">Нийт бараа</p>
              <p className="text-xl font-black text-slate-900">{totalCount}ш</p>
            </div>
            <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-right">
              <p className="text-[11px] font-semibold text-emerald-700">Ирсэн тоо</p>
              <p className="text-xl font-black text-emerald-800">{arrivedCount}ш</p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200 text-right">
                <p className="text-[11px] font-semibold text-amber-700">Хүлээгдэж буй</p>
                <p className="text-xl font-black text-amber-800">{pendingCount}ш</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              Хүлээн авалтын явц: <b>{arrivedCount}</b> / {totalCount} бараа ({percent}%)
            </span>
            <span className="text-slate-500 font-medium">
              {isAllArrived ? "Бүх бараа Улаанбаатарт бэлэн" : `${pendingCount} бараа дутуу байна`}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isAllArrived ? "bg-emerald-500" : percent > 0 ? "bg-amber-500" : "bg-sky-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline opacity-70 hover:opacity-100"
          >
            Хаах
          </button>
        </div>
      )}

      {/* ACTION BAR: One-Click Receive & Barcode Scanner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-5 rounded-2xl text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-300" />
              Хүлээн авалтын удирдлага (Монголын Карго Админ)
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Хайрцаг бүрэн ирсэн бол ганц товшилтоор бүх барааг &ldquo;Улаанбаатарт ирсэн&rdquo; болгох эсвэл баркод уншуулан шалгана уу.
            </p>
          </div>

          {/* Big One-Click Receive Button */}
          <div>
            {isAllArrived ? (
              <div className="px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Бүх бараа хүлээн авагдсан
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleReceiveAll}
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-sm h-12 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Бүртгэж байна...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    БҮХ {pendingCount} БАРААГ &ldquo;ИРСЭН&rdquo; БОЛГОХ
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Barcode & Search inputs row */}
        <div className="pt-3 border-t border-indigo-700/60 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Scanner form */}
          <form onSubmit={handleScanSubmit} className="relative flex items-center">
            <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
            <input
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Баркод / Захиалгын дугаар уншуулах (#1024)..."
              disabled={isPending}
              className="w-full pl-10 pr-24 py-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder:text-indigo-300/70 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:bg-indigo-950/80"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !scanInput.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg px-3"
            >
              Шалгах
            </Button>
          </form>

          {/* Quick Filter */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Жагсаалтаас нэр, утас, бараагаар шүүх..."
              className="w-full pl-10 pr-3 py-2.5 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder:text-indigo-300/70 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:bg-indigo-950/80"
            />
          </div>
        </div>
      </div>

      {/* Multi-select Action Bar (when rows are checked) */}
      {selectedCount > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 text-white font-bold text-xs">
              {selectedCount} сонгогдсон
            </Badge>
            <span className="text-xs text-indigo-900 font-semibold">
              Зөвхөн сонгосон барааг &ldquo;Улаанбаатарт ирсэн&rdquo; болгох
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrderIds({})}
              className="text-xs font-semibold h-8"
            >
              Цуцлах
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReceiveSelected}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 flex items-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Сонгосон {selectedCount} барааг хүлээн авах
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              Ачилтанд Багтсан Барааны Жагсаалт
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Бараа бүр тус тусдаа төлөвтэй бөгөөд хэрэглэгчийн гар утсан дээр шууд харагдана
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAllNonArrived}
              disabled={isAllArrived}
              className="text-xs font-bold h-8 border-slate-200"
            >
              Ирээгүй бүгдийг сонгох
            </Button>
            <span className="text-xs font-bold text-slate-600">
              Нийт: <b>{filteredOrders.length}</b> бараа
            </span>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((o) => {
              const isArrived = o.statusId === arrivedStatusId
              const isSelected = Boolean(selectedOrderIds[o.id])
              const isScannedJustNow = lastScannedOrder === o.orderNumber

              return (
                <div
                  key={o.id}
                  className={`p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isScannedJustNow
                      ? "bg-emerald-50 ring-2 ring-emerald-400"
                      : isSelected
                      ? "bg-indigo-50/50"
                      : isArrived
                      ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {!isArrived ? (
                      <button
                        type="button"
                        onClick={() => toggleRowSelect(o.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 hover:border-indigo-500 bg-white"
                        }`}
                        title={isSelected ? "Сонгогдсон" : "Сонгох"}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Product Thumbnail */}
                    {o.batch?.product?.imageUrl ? (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                        <Image
                          src={o.batch.product.imageUrl}
                          alt={o.batch.product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          #{o.orderNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {o.batch?.product?.name || "Бараа"}
                        </h4>
                        <Badge variant="outline" className="font-bold text-[11px] bg-white">
                          {o.quantity}ш
                        </Badge>
                      </div>

                      {/* Variant Options */}
                      {o.selectedOptions && typeof o.selectedOptions === "object" && (
                        <p className="text-xs font-semibold text-indigo-700">
                          Сонголт: {Object.values(o.selectedOptions).join(", ")}
                        </p>
                      )}

                      {/* Customer info */}
                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <User className="w-3 h-3 text-slate-400" />
                          {o.customerName}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {o.customerPhone}
                        </span>
                        {o.wantsDelivery && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-purple-200">
                            <Truck className="w-3 h-3" /> Хүргэлт хүссэн
                          </span>
                        )}
                        {o.deliveryAddress && (
                          <span className="text-[11px] text-slate-400 truncate max-w-xs">
                            {o.deliveryAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      {isArrived ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Улаанбаатарт ирсэн
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <Plane className="w-3.5 h-3.5 text-sky-500" />
                          Солонгосоос хөдөлсөн
                        </span>
                      )}
                    </div>

                    {!isArrived && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleReceiveSingle(o.id)}
                        disabled={isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Хүлээн авах
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            Хайлтад тохирох бараа олдсонгүй
          </div>
        )}
      </div>

      {/* Add More Orders Modal */}
      <Dialog open={showAddMoreModal} onOpenChange={setShowAddMoreModal}>
        <DialogContent className="w-[96vw] sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Илгээмжинд нэмэлт захиалга хавсаргах
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Өмнөх өдрүүдээс эсвэл хоцорч бэлэн болсон захиалгыг энэ ачилтанд нэгтгэн оруулна.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Search input */}
            <form onSubmit={handleSearchAddMore} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={addMoreQuery}
                  onChange={(e) => setAddMoreQuery(e.target.value)}
                  placeholder="Захиалгын #1042, утас, нэрээр хайх..."
                  className="pl-9 h-9 text-xs font-medium"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isSearchingAddMore || !addMoreQuery.trim()}
                className="bg-indigo-600 text-white font-bold text-xs h-9 px-4 shrink-0"
              >
                {isSearchingAddMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Хайх"}
              </Button>
            </form>

            {/* Results */}
            {addMoreResults.length > 0 ? (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
                {addMoreResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          #{item.orderNumber}
                        </span>
                        {item.displayDate && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold border border-indigo-100">
                            {item.displayDate}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 truncate">
                          {item.productName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.customerName} ({item.customerPhone}){" "}
                        {item.variantDesc && (
                          <span className="text-indigo-600 font-medium">[{item.variantDesc}]</span>
                        )}
                        {" "}• <b>{item.quantity}ш</b>
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddOrderToShipment(item)}
                      disabled={isPending}
                      className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Нэмж ачих
                    </Button>
                  </div>
                ))}
              </div>
            ) : addMoreQuery && !isSearchingAddMore ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                Ачигдаагүй тохирох захиалга олдсонгүй
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                Захиалгын дугаар эсвэл утасны дугаараар хайж сонгоно уу
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddMoreModal(false)}
              className="text-xs font-semibold"
            >
              Хаах
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
