"use client"

import { useState } from "react"
import { courierConfirmDelivered, courierReportIssue } from "@/app/actions/courier-actions"
import { 
  Truck, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  Loader2, 
  RotateCw, 
  Search, 
  Package, 
  Tag,
  Clock
} from "lucide-react"
import { formatSelectedOptions } from "@/lib/variant-utils"
import { useRouter } from "next/navigation"

interface CourierClientProps {
  activeGroups: any[][]
  deliveredGroups: any[][]
  activeCount: number
  deliveredCount: number
  pin?: string
}

export function CourierClient({
  activeGroups,
  deliveredGroups,
  activeCount,
  deliveredCount,
  pin
}: CourierClientProps) {
  const [tab, setTab] = useState<"active" | "delivered">("active")
  const [search, setSearch] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [issueNote, setIssueNote] = useState("")
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)
  const router = useRouter()

  const currentGroups = tab === "active" ? activeGroups : deliveredGroups

  const filteredGroups = currentGroups.filter((g) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    const first = g[0]
    return (
      first?.customerName?.toLowerCase().includes(q) ||
      first?.customerPhone?.includes(q) ||
      first?.deliveryAddress?.toLowerCase().includes(q) ||
      g.some((o: any) => o.batch?.product?.name?.toLowerCase().includes(q))
    )
  })

  const handleConfirm = async (orderIds: string[]) => {
    if (orderIds.length === 0) return
    const first = activeGroups.find(g => g.some(o => o.id === orderIds[0]))?.[0]
    const customer = first?.customerName || "хэрэглэгч"

    if (!confirm(`${customer}-д ачааг бүрэн хүлээлгэн өгсөн гэж батлах уу?`)) return

    setLoadingId(orderIds[0])
    const res = await courierConfirmDelivered(orderIds, pin)
    setLoadingId(null)

    if (res.success) {
      router.refresh()
    } else {
      alert("Алдаа гарлаа: " + res.error)
    }
  }

  const handleReport = async (orderIds: string[]) => {
    if (!issueNote.trim()) return
    setLoadingId(`report-${orderIds[0]}`)
    const res = await courierReportIssue(orderIds, issueNote.trim(), pin)
    setLoadingId(null)
    setReportingId(null)
    setIssueNote("")

    if (res.success) {
      alert("Тэмдэглэл хадгалагдлаа.")
      router.refresh()
    } else {
      alert("Алдаа гарлаа: " + res.error)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPhone(id)
    setTimeout(() => setCopiedPhone(null), 2000)
  }

  const totalGroups = activeGroups.length + deliveredGroups.length
  const progressPercent = totalGroups > 0 ? Math.round((deliveredGroups.length / totalGroups) * 100) : 0

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-indigo-900 text-white shadow-md">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight leading-none text-white">Anar Korea Shop</h1>
              <p className="text-[11px] text-indigo-200 mt-1 font-medium">Хүргэлтийн мобайл систем</p>
            </div>
          </div>
          <button
            onClick={() => router.refresh()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-indigo-200"
            title="Шинэчлэх"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress summary banner */}
        <div className="bg-indigo-950/80 px-4 py-2 border-t border-indigo-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-300">Үлдсэн: {activeGroups.length}</span>
            <span className="text-indigo-400">·</span>
            <span className="font-bold text-emerald-400">Хүргэсэн: {deliveredGroups.length}</span>
          </div>
          <div className="text-[11px] font-bold text-indigo-300">
            {progressPercent}% гүйцэтгэл
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-indigo-950 h-1">
          <div
            className="bg-emerald-400 h-1 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 bg-indigo-900 border-t border-indigo-800 text-xs font-bold text-center">
          <button
            onClick={() => setTab("active")}
            className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === "active"
                ? "border-amber-400 text-amber-300 bg-white/5"
                : "border-transparent text-indigo-200 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Хүргэх ачаа ({activeGroups.length})
          </button>
          <button
            onClick={() => setTab("delivered")}
            className={`py-2.5 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === "delivered"
                ? "border-emerald-400 text-emerald-300 bg-white/5"
                : "border-transparent text-indigo-200 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Хүргэгдсэн ({deliveredGroups.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border-b sticky top-[108px] z-20 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Нэр, утас, хаягаар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="p-3 space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2 mt-4 shadow-xs">
            {tab === "active" ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Хүргэх ачаа байхгүй байна!</h3>
                <p className="text-xs text-slate-500">Бүх хүргэлт амжилттай дууссан эсвэл хараахан ачаа хуваарилагдаагүй байна.</p>
              </>
            ) : (
              <>
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Хүргэгдсэн ачаа алга</h3>
                <p className="text-xs text-slate-500">Өнөөдөр хараахан хүргэгдсэн захиалга бүртгэгдээгүй байна.</p>
              </>
            )}
          </div>
        ) : (
          filteredGroups.map((group, index) => {
            const first = group[0]
            const orderIds = group.map((o: any) => o.id)
            const address = group.find((o: any) => o.deliveryAddress)?.deliveryAddress || "Хаяг оруулаагүй"
            const isConfirmed = tab === "delivered"
            const isCurrentLoading = loadingId === orderIds[0]

            return (
              <div
                key={first.customerPhone || first.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isConfirmed ? "border-slate-200 opacity-90" : "border-indigo-100 hover:border-indigo-300"
                }`}
              >
                {/* Header: Customer Name & Call Button */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h2 className="font-bold text-slate-900 text-base truncate">{first.customerName}</h2>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-extrabold text-indigo-700 text-sm tracking-wide">
                        {first.customerPhone}
                      </span>
                      <button
                        onClick={() => handleCopy(first.customerPhone, first.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-medium"
                      >
                        {copiedPhone === first.id ? "Хуулагдлаа!" : "Хуулах"}
                      </button>
                    </div>
                  </div>

                  {/* 1-Tap Call Button */}
                  <a
                    href={`tel:${first.customerPhone}`}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    Залгах
                  </a>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Address Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Хүргэх хаяг
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(address, `addr-${first.id}`)}
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedPhone === `addr-${first.id}` ? "Хуулагдлаа!" : "Хуулах"}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" /> Газрын зураг
                        </a>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {address}
                    </p>
                  </div>

                  {/* Packages list */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Бараанууд ({group.length})</p>
                    <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden bg-slate-50/50">
                      {group.map((order: any) => (
                        <div key={order.id} className="p-2.5 flex items-start justify-between gap-2 text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {order.batch?.product?.name || "Бараа"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-slate-400">#{order.orderNumber}</span>
                              {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Tag className="w-2.5 h-2.5 text-indigo-500" />
                                  {formatSelectedOptions(order.selectedOptions)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-slate-800 shrink-0 bg-white border px-2 py-0.5 rounded-md shadow-2xs">
                            {order.quantity} ш
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Pre-paid Notice */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold leading-tight">
                      ✓ ТӨЛБӨР ТӨЛӨГДСӨН (Хэрэглэгчээс мөнгө авахгүй)
                    </span>
                  </div>

                  {/* Admin notes if exists */}
                  {first.adminNotes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 space-y-0.5">
                      <p className="font-bold text-[11px] text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Тэмдэглэл:
                      </p>
                      <p className="whitespace-pre-wrap font-medium">{first.adminNotes}</p>
                    </div>
                  )}

                  {/* Issue reporting box */}
                  {reportingId === first.id && (
                    <div className="bg-slate-100 p-3 rounded-xl space-y-2 border border-slate-300 animate-in fade-in">
                      <p className="text-xs font-bold text-slate-700">Асуудлын шалтгаан:</p>
                      <textarea
                        value={issueNote}
                        onChange={(e) => setIssueNote(e.target.value)}
                        placeholder="Утас нь салгаатай байна / Маргааш хүргүүлэхээр тохиров..."
                        className="w-full p-2 text-xs bg-white border rounded-lg outline-none focus:border-indigo-500"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReportingId(null)}
                          className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg font-medium"
                        >
                          Болих
                        </button>
                        <button
                          onClick={() => handleReport(orderIds)}
                          disabled={!issueNote.trim() || loadingId === `report-${orderIds[0]}`}
                          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-bold"
                        >
                          {loadingId === `report-${orderIds[0]}` ? "Хадгалж байна..." : "Хадгалах"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                {!isConfirmed ? (
                  <div className="p-3 bg-slate-50 border-t flex items-center gap-2">
                    <button
                      onClick={() => setReportingId(reportingId === first.id ? null : first.id)}
                      className="px-3 py-3 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 shrink-0"
                      title="Асуудал бүртгэх"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </button>

                    <button
                      onClick={() => handleConfirm(orderIds)}
                      disabled={isCurrentLoading}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {isCurrentLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Баталж байна...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> ХҮРГЭСЭН ГЭЖ БАТЛАХ</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Хүргэгдсэн
                    </span>
                    <span className="text-[11px] text-emerald-600">
                      {new Date(first.updatedAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
