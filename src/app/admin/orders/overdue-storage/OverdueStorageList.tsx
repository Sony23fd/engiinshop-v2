"use client"

import { useState } from "react"
import { updateOrderAdminNotes, markDeliveryAsPickedUp, moveOverdueOrderToDelivery } from "@/app/actions/order-actions"
import { Phone, Clock, FileEdit, Copy, CheckCircle2, Truck, ExternalLink, Loader2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function OverdueStorageList({ orders }: { orders: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [ageFilter, setAgeFilter] = useState<"all" | "90" | "60">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSaveNotes = async (orderId: string) => {
    setActionLoading(`notes-${orderId}`)
    const res = await updateOrderAdminNotes(orderId, notes)
    if (!res.success) {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    } else {
      setEditingId(null)
      toast({ title: "Амжилттай", description: "Тэмдэглэл хадгалагдлаа." })
    }
    setActionLoading(null)
  }

  const handleMarkPickedUp = async (ids: string[]) => {
    if (ids.length === 0) return
    if (!confirm(`Сонгосон ${ids.length} ширхэг барааг "Өөрөө ирж авсан" төлөвт шилжүүлж дуусгах уу?`)) return

    setActionLoading("bulk-pickup")
    const res = await markDeliveryAsPickedUp(ids)
    setActionLoading(null)

    if (res.success) {
      toast({ title: "Амжилттай", description: `${ids.length} барааг "Өөрөө ирж авсан" болгон баталлаа.` })
      setSelectedIds([])
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  const handleMoveToDelivery = async (orderId: string, currentAddress?: string) => {
    const address = prompt("Хүргүүлэх хаяг оруулна уу:", currentAddress || "")
    if (!address || !address.trim()) return

    setActionLoading(`delivery-${orderId}`)
    const res = await moveOverdueOrderToDelivery(orderId, address)
    setActionLoading(null)

    if (res.success) {
      toast({ title: "Амжилттай", description: "Хүргэлтийн жагсаалт руу шилжүүллээ." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast({ title: "Хуулагдлаа", description: phone })
  }

  // Filter orders
  const now = Date.now()
  const filtered = orders.filter((o) => {
    const days = Math.floor((now - new Date(o.updatedAt).getTime()) / (1000 * 3600 * 24))
    if (ageFilter === "90" && days < 90) return false
    if (ageFilter === "60" && days < 60) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = o.customerName?.toLowerCase().includes(q)
      const matchPhone = o.customerPhone?.includes(q)
      const matchProd = o.batch?.product?.name?.toLowerCase().includes(q)
      const matchOrderNum = o.orderNumber?.toString().includes(q)
      if (!matchName && !matchPhone && !matchProd && !matchOrderNum) return false
    }
    return true
  })

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id))
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((o) => o.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Нэр, утас, бараагаар хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setAgeFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${ageFilter === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              Бүгд ({orders.length})
            </button>
            <button
              onClick={() => setAgeFilter("60")}
              className={`px-2.5 py-1 rounded-md transition-colors ${ageFilter === "60" ? "bg-white text-amber-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              60+ хоног
            </button>
            <button
              onClick={() => setAgeFilter("90")}
              className={`px-2.5 py-1 rounded-md transition-colors ${ageFilter === "90" ? "bg-white text-red-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"}`}
            >
              90+ хоног
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs animate-in fade-in">
            <span className="font-semibold text-indigo-900">
              Сонгосон: <strong className="font-bold text-indigo-700">{selectedIds.length}</strong>
            </span>
            <Button
              size="sm"
              onClick={() => handleMarkPickedUp(selectedIds)}
              disabled={actionLoading === "bulk-pickup"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-bold px-3 ml-2"
            >
              {actionLoading === "bulk-pickup" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              Өөрөө авснаар бөөнөөр батлах
            </Button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Бараа</th>
                <th className="px-4 py-3">Харилцагч</th>
                <th className="px-4 py-3">Агуулахад удсан</th>
                <th className="px-4 py-3">Тэмдэглэл</th>
                <th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const daysWaiting = Math.floor((now - new Date(order.updatedAt).getTime()) / (1000 * 3600 * 24))
                const isSelected = selectedIds.includes(order.id)

                return (
                  <tr key={order.id} className={`hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-indigo-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(order.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-semibold text-slate-900">
                        {order.batch?.product?.name || "Тодорхойгүй"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>#{order.orderNumber}</span>
                        <span>·</span>
                        <span>Тоо: <strong className="text-slate-700">{order.quantity} ш</strong></span>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <div className="font-medium text-slate-900">{order.customerName}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-blue-600 font-semibold text-xs">{order.customerPhone || "Утасгүй"}</span>
                        {order.customerPhone && (
                          <>
                            <button onClick={() => copyPhone(order.customerPhone)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600" title="Дугаар хуулах">
                              <Copy className="w-3 h-3" />
                            </button>
                            <a href={`tel:${order.customerPhone}`} className="p-1 hover:bg-green-100 rounded text-slate-400 hover:text-green-600" title="Залгах">
                              <Phone className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`flex items-center gap-1.5 font-bold text-xs w-max px-2.5 py-1 rounded-md ${
                        daysWaiting >= 90 ? "bg-red-100 text-red-700" : daysWaiting >= 60 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {daysWaiting} хоног
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(order.updatedAt).toLocaleDateString("mn-MN")}
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      {editingId === order.id ? (
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border rounded-md text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            placeholder="Хэрэглэгчтэй холбогдсон тухай..."
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                            >
                              Болих
                            </button>
                            <button
                              onClick={() => handleSaveNotes(order.id)}
                              disabled={actionLoading === `notes-${order.id}`}
                              className="px-2.5 py-1 text-xs bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
                            >
                              Хадгалах
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between group min-h-[30px]">
                          <div className="text-slate-700 text-xs whitespace-pre-wrap flex-1 pr-2">
                            {order.adminNotes || <span className="text-slate-400 italic">Тэмдэглэл байхгүй...</span>}
                          </div>
                          <button
                            onClick={() => {
                              setEditingId(order.id)
                              setNotes(order.adminNotes || "")
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            title="Тэмдэглэл засах"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPickedUp([order.id])}
                          disabled={actionLoading === "bulk-pickup"}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-7 text-xs font-semibold px-2.5"
                          title="Өөрөө ирж авсан гэж батлах"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Өөрөө авсан
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveToDelivery(order.id, order.deliveryAddress)}
                          disabled={actionLoading === `delivery-${order.id}`}
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-7 text-xs font-semibold px-2.5"
                          title="Хүргэлтийн жагсаалт руу шилжүүлэх"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Хүргэлт
                        </Button>
                        <a
                          href={`/admin/orders/batch/${order.batchId}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Багцыг нээх"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p>Хугацаа хэтэрч агуулахад удсан бараа олдсонгүй.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
