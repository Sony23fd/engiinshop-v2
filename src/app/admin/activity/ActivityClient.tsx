"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  Shield, 
  Truck, 
  Clock, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  Package, 
  Settings, 
  User, 
  Key, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Activity
} from "lucide-react"
import { getActivityLogs } from "@/app/actions/activity-actions"

interface ActivityClientProps {
  initialLogs: any[]
  initialTotal: number
  initialTotalPages: number
  initialCurrentPage: number
  adminUsers: Array<{ id: string; username: string; role: string }>
  stats: {
    todayTotal: number
    orderChangesToday: number
    topUserToday: { name: string; count: number } | null
  } | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  ORDER: { label: "Захиалга", icon: Package, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  PRODUCT: { label: "Бараа", icon: Sparkles, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  SETTINGS: { label: "Тохиргоо", icon: Settings, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  USER: { label: "Хэрэглэгч", icon: User, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  PAYMENT: { label: "Төлбөр", icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  AUTH: { label: "Нэвтрэлт", icon: Key, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
  GENERAL: { label: "Ерөнхий", icon: Activity, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
}

export function ActivityClient({
  initialLogs,
  initialTotal,
  initialTotalPages,
  initialCurrentPage,
  adminUsers,
  stats,
}: ActivityClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams?.get("q") || "")
  const [userId, setUserId] = useState(searchParams?.get("userId") || "all")
  const [type, setType] = useState(searchParams?.get("type") || "all")
  const [dateRange, setDateRange] = useState(searchParams?.get("dateRange") || "all")

  const [logs, setLogs] = useState<any[]>(initialLogs)
  const [total, setTotal] = useState<number>(initialTotal)
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage)
  const [loading, setLoading] = useState(false)

  // Fetch with current filters
  async function fetchLogs(newPage = 1) {
    setLoading(true)
    const res = await getActivityLogs({
      page: newPage,
      limit: 50,
      q,
      userId,
      type,
      dateRange,
    })

    if (res.success) {
      setLogs(res.logs || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 0)
      setCurrentPage(res.currentPage || 1)
    }
    setLoading(false)

    // Sync URL params
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (userId !== "all") params.set("userId", userId)
    if (type !== "all") params.set("type", type)
    if (dateRange !== "all") params.set("dateRange", dateRange)
    if (newPage > 1) params.set("page", String(newPage))
    const queryStr = params.toString() ? `?${params.toString()}` : "/admin/activity"
    window.history.replaceState(null, "", queryStr)
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchLogs(1)
  }

  function handleReset() {
    setQ("")
    setUserId("all")
    setType("all")
    setDateRange("all")
    setTimeout(() => {
      getActivityLogs({ page: 1, limit: 50 }).then((res) => {
        if (res.success) {
          setLogs(res.logs)
          setTotal(res.total)
          setTotalPages(res.totalPages)
          setCurrentPage(1)
        }
      })
      window.history.replaceState(null, "", "/admin/activity")
    }, 50)
  }

  function formatDate(d: string) {
    const dt = new Date(d)
    return dt.toLocaleString("mn-MN", {
      timeZone: "Asia/Ulaanbaatar",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-indigo-600" />
            <span>Системийн үйлдлийн лог</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ажилтнуудын захиалга, төлөв, бараа, тохиргоонд хийсэн бүх өөрчлөлтийн дэлгэрэнгүй түүх (Нийт {total} бичлэг)
          </p>
        </div>

        {/* Quick Refresh */}
        <button
          type="button"
          onClick={() => fetchLogs(currentPage)}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Шинэчлэх</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Өнөөдрийн нийт үйлдэл</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">{stats.todayTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Захиалгын өөрчлөлтүүд</p>
              <p className="text-xl font-black text-blue-700 tracking-tight">{stats.orderChangesToday.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Хамгийн идэвхтэй ажилтан</p>
              <p className="text-sm font-black text-slate-900 truncate">
                {stats.topUserToday ? `${stats.topUserToday.name} (${stats.topUserToday.count} үйлдэл)` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search & Multi-Faceted Filters Form */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Захиалгын дугаар, утас, нэр..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* User Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Бүх ажилтан</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Бүх төрлийн үйлдэл</option>
              <option value="ORDER">📦 Захиалга (ORDER)</option>
              <option value="PRODUCT">🛍️ Бараа бүтээгдэхүүн (PRODUCT)</option>
              <option value="SETTINGS">⚙️ Тохиргоо (SETTINGS)</option>
              <option value="USER">👥 Хэрэглэгчийн эрх (USER)</option>
              <option value="PAYMENT">💳 Төлбөр (PAYMENT)</option>
              <option value="AUTH">🔑 Нэвтрэлт (AUTH)</option>
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Бүх хугацаа</option>
              <option value="today">Өнөөдөр</option>
              <option value="yesterday">Өчигдөр</option>
              <option value="week">Сүүлийн 7 хоног</option>
              <option value="month">Сүүлийн 30 хоног</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            Олдсон: <strong className="text-slate-800">{total}</strong> бичлэг
          </div>
          <div className="flex items-center gap-2">
            {(q || userId !== "all" || type !== "all" || dateRange !== "all") && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Цэвэрлэх
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Шүүх</span>
            </button>
          </div>
        </div>
      </form>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase text-slate-500 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Хэзээ</th>
                <th className="px-4 py-3.5">Хэн</th>
                <th className="px-4 py-3.5">Төрөл</th>
                <th className="px-4 py-3.5">Үйлдэл</th>
                <th className="px-4 py-3.5">Холбогдох объект</th>
                <th className="px-4 py-3.5">Дэлгэрэнгүй тайлбар</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Лог бичлэг олдсонгүй</p>
                    <p className="text-[11px] text-slate-400 mt-1">Та шүүлтүүрээ өөрчилж дахин хайна уу.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const typeCfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.GENERAL
                  const TypeIcon = typeCfg.icon

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 uppercase">
                            {log.userName?.[0] || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{log.userName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {log.userRole === "ADMIN" ? "Админ" : log.userRole === "CARGO_ADMIN" ? "Карго" : log.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeCfg.label}</span>
                        </span>
                      </td>

                      {/* Action Name */}
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800">
                        {log.action}
                      </td>

                      {/* Target Object with Direct Clickable Jump */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.targetUrl ? (
                          <Link
                            href={log.targetUrl}
                            className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors group-hover:border-indigo-200"
                            title="Шууд очиж үзэх"
                          >
                            <span>{log.target || log.targetUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : log.target ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {log.target}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Detailed Description */}
                      <td className="px-4 py-3 text-slate-600 max-w-md">
                        <p className="line-clamp-2 leading-relaxed" title={log.detail || ""}>
                          {log.detail || "—"}
                        </p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Хуудас <strong className="text-slate-800">{currentPage}</strong> / {totalPages} (Нийт {total} бичлэг)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

