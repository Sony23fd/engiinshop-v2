"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Plane,
  Package,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Filter,
  Plus,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface ShipmentItem {
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
  _count?: {
    orders: number
  }
}

interface ShipmentsListClientProps {
  initialShipments: ShipmentItem[]
}

export function ShipmentsListClient({ initialShipments }: ShipmentsListClientProps) {
  const [shipments] = useState<ShipmentItem[]>(initialShipments)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      // Status filter
      if (statusFilter !== "ALL" && s.status !== statusFilter) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesCode = s.code.toLowerCase().includes(q)
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesNotes = (s.notes || "").toLowerCase().includes(q)
        const matchesCreator = (s.createdBy || "").toLowerCase().includes(q)
        return matchesCode || matchesName || matchesNotes || matchesCreator
      }
      return true
    })
  }, [shipments, statusFilter, searchQuery])

  // Count summaries
  const inTransitCount = shipments.filter((s) => s.status === "IN_TRANSIT").length
  const partialCount = shipments.filter((s) => s.status === "PARTIAL").length
  const arrivedCount = shipments.filter((s) => s.status === "ARRIVED").length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Plane className="w-6 h-6" />
            </span>
            Карго Илгээмжүүд (Ачилт & Хүлээн Авах)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Солонгосоос илгээсэн ачилтуудыг хянах, Монголд буусан хайрцгийг нэг товшилтоор хүлээн авах
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin/orders/daily">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 h-9 border-slate-200 hover:bg-slate-50"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Өдрийн захиалгаас ачих
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <p className="text-[11px] font-semibold opacity-75">Нийт илгээмж</p>
          <p className="text-2xl font-black mt-0.5">{shipments.length}</p>
          <p className="text-[10px] opacity-65 mt-1">Бүх ачилтын түүх</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("IN_TRANSIT")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "IN_TRANSIT"
              ? "bg-sky-600 text-white border-sky-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:bg-sky-50/50"
          }`}
        >
          <p className="text-[11px] font-semibold opacity-75 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" />
            Замдаа яваа
          </p>
          <p className="text-2xl font-black mt-0.5">{inTransitCount}</p>
          <p className="text-[10px] opacity-65 mt-1">Монгол руу ниссэн / Хүлээгдэж буй</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PARTIAL")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "PARTIAL"
              ? "bg-amber-600 text-white border-amber-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:bg-amber-50/50"
          }`}
        >
          <p className="text-[11px] font-semibold opacity-75 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Хэсэгчлэн ирсэн
          </p>
          <p className="text-2xl font-black mt-0.5">{partialCount}</p>
          <p className="text-[10px] opacity-65 mt-1">Зарим бараа нь дутуу буусан</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ARRIVED")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "ARRIVED"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white text-slate-800 border-slate-200 hover:bg-emerald-50/50"
          }`}
        >
          <p className="text-[11px] font-semibold opacity-75 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Бүрэн хүлээн авсан
          </p>
          <p className="text-2xl font-black mt-0.5">{arrivedCount}</p>
          <p className="text-[10px] opacity-65 mt-1">Улаанбаатарт буусан</p>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className={`text-xs font-bold rounded-lg h-8 px-3 ${
              statusFilter === "ALL" ? "bg-slate-100 text-slate-900" : "text-slate-500"
            }`}
          >
            Бүгд ({shipments.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("IN_TRANSIT")}
            className={`text-xs font-bold rounded-lg h-8 px-3 ${
              statusFilter === "IN_TRANSIT" ? "bg-sky-100 text-sky-800" : "text-slate-500"
            }`}
          >
            Замдаа яваа ({inTransitCount})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("PARTIAL")}
            className={`text-xs font-bold rounded-lg h-8 px-3 ${
              statusFilter === "PARTIAL" ? "bg-amber-100 text-amber-800" : "text-slate-500"
            }`}
          >
            Хэсэгчлэн ({partialCount})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("ARRIVED")}
            className={`text-xs font-bold rounded-lg h-8 px-3 ${
              statusFilter === "ARRIVED" ? "bg-emerald-100 text-emerald-800" : "text-slate-500"
            }`}
          >
            Ирсэн ({arrivedCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Нэр, код, тайлбараар хайх..."
            className="pl-9 h-9 text-xs font-medium"
          />
        </div>
      </div>

      {/* Shipments Grid / List */}
      {filteredShipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShipments.map((s) => {
            const isAllArrived = s.status === "ARRIVED"
            const isPartial = s.status === "PARTIAL"
            const isInTransit = s.status === "IN_TRANSIT"
            const percent = s.totalOrders > 0 ? Math.round((s.arrivedOrders / s.totalOrders) * 100) : 0

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                        {s.code}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    {isAllArrived && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Бүрэн ирсэн
                      </span>
                    )}
                    {isPartial && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Хэсэгчлэн
                      </span>
                    )}
                    {isInTransit && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                        <Plane className="w-3 h-3 text-sky-600" />
                        Замдаа яваа
                      </span>
                    )}
                  </div>

                  {s.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                      {s.notes}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Ирсэн: <b>{s.arrivedOrders}</b> / {s.totalOrders} бараа
                      </span>
                      <span className="font-black text-slate-900">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isAllArrived
                            ? "bg-emerald-500"
                            : isPartial
                            ? "bg-amber-500"
                            : "bg-sky-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="pt-2 text-[11px] text-slate-400 space-y-1 border-t border-slate-50">
                    <p>
                      Ачсан: <b>{new Date(s.dispatchedAt).toLocaleDateString("mn-MN")}</b> (
                      {s.createdBy || "Admin"})
                    </p>
                    {s.arrivedAt && (
                      <p className="text-emerald-700 font-semibold">
                        Хүлээн авсан: <b>{new Date(s.arrivedAt).toLocaleDateString("mn-MN")}</b>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                  <Link
                    href={`/admin/orders/shipments/${s.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>Шалгах & Хүлээн авах</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center space-y-3">
          <Plane className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Илгээмж олдсонгүй</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Одоогоор энэ төлөвт илгээмж бүртгэгдээгүй байна. Та &ldquo;Өдрийн захиалгаас ачих&rdquo; товчоор шинэ ачилт үүсгэж болно.
          </p>
          <Link href="/admin/orders/daily">
            <Button size="sm" className="bg-indigo-600 text-white font-bold text-xs mt-2">
              Өдрийн захиалгын журнал руу очих
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
