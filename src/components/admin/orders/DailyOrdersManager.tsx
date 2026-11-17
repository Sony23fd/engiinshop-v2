"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Calendar,
  Package,
  ShoppingBag,
  Search,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  Check,
  FileSpreadsheet,
  FolderOpen,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GlobalAddOrderModal } from "@/components/admin/orders/GlobalAddOrderModal"
import {
  DailySummaryItem,
  DailyOrderDetailsResult,
  getDailyOrderDetails,
  PurchasingItem
} from "@/app/actions/daily-order-actions"

interface DailyOrdersManagerProps {
  initialDays: DailySummaryItem[]
  initialDateStr: string
  initialDetails: DailyOrderDetailsResult | null
}

export function DailyOrdersManager({
  initialDays,
  initialDateStr,
  initialDetails
}: DailyOrdersManagerProps) {
  const [days, setDays] = useState<DailySummaryItem[]>(initialDays)
  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr)
  const [details, setDetails] = useState<DailyOrderDetailsResult | null>(initialDetails)
  const [isPending, startTransition] = useTransition()

  // Sub-tab: "purchasing" vs "orders"
  const [activeTab, setActiveTab] = useState<"purchasing" | "orders">("purchasing")

  // Search filter inside selected date
  const [searchFilter, setSearchFilter] = useState("")

  // Checked items state for shopper in Korea (persisted in local state)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  // Date list filter
  const [dateSearch, setDateSearch] = useState("")

  // Filtered date list
  const filteredDays = useMemo(() => {
    if (!dateSearch.trim()) return days
    const q = dateSearch.toLowerCase()
    return days.filter(
      (d) =>
        d.dateStr.includes(q) ||
        d.displayDate.includes(q) ||
        d.dayOfWeek.toLowerCase().includes(q)
    )
  }, [days, dateSearch])

  // Select another date
  const handleSelectDate = (dateStr: string) => {
    if (dateStr === selectedDate && details) return
    setSelectedDate(dateStr)
    setSearchFilter("")
    startTransition(async () => {
      const res = await getDailyOrderDetails(dateStr)
      if (res.success) {
        setDetails(res)
      }
    })
  }

  // Toggle item checked
  const toggleItemChecked = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Filtered purchasing list
  const filteredPurchasingList = useMemo(() => {
    if (!details?.purchasingList) return []
    if (!searchFilter.trim()) return details.purchasingList
    const q = searchFilter.toLowerCase()
    return details.purchasingList.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.variantDesc.toLowerCase().includes(q) ||
        item.customers.some(
          (c) =>
            c.customerName.toLowerCase().includes(q) ||
            c.customerPhone.includes(q) ||
            c.orderNumber.toString().includes(q)
        )
    )
  }, [details?.purchasingList, searchFilter])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!details?.orders) return []
    if (!searchFilter.trim()) return details.orders
    const q = searchFilter.toLowerCase()
    return details.orders.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.orderNumber?.toString().includes(q) ||
        o.deliveryAddress?.toLowerCase().includes(q) ||
        o.batch?.product?.name?.toLowerCase().includes(q)
    )
  }, [details?.orders, searchFilter])

  // Export CSV of purchasing items
  const handleExportCSV = () => {
    if (!details || !details.purchasingList.length) return
    const headers = [
      "Барааны нэр",
      "Сонголт/Размер",
      "Нийт тоо",
      "Нэгж үнэ",
      "Нийт дүн",
      "Захиалагчид (Нэр, Утас, Тоо)"
    ]
    const rows = details.purchasingList.map((item) => [
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.variantDesc.replace(/"/g, '""')}"`,
      item.totalQuantity,
      item.unitPrice,
      item.totalEstimatedAmount,
      `"${item.customers.map((c) => `${c.customerName} (${c.customerPhone}) x${c.quantity}`).join("; ").replace(/"/g, '""')}"`
    ])

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Shopping-List-${details.dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print view
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Өдрийн Захиалгын Журнал & Таталт
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Захиалгуудыг өдөр өдрөөр нь хянах, Солонгосоос татах барааны нэгдсэн жагсаалт харах
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <span className="px-3 py-1.5 rounded-md text-xs font-bold bg-white text-indigo-700 shadow-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Өдрөөр
            </span>
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Сарын Ангиллаар
            </Link>
          </div>

          <GlobalAddOrderModal />
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Date List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Өдрүүдийн жагсаалт ({days.length})
              </span>
              <span className="text-[11px] text-slate-400">Сүүлийн 60 хоног</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
                placeholder="Огноогоор хайх (09.06, Даваа)..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredDays.length > 0 ? (
              filteredDays.map((d) => {
                const isSelected = d.dateStr === selectedDate
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(d.dateStr)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {d.displayDate}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-indigo-500 text-indigo-50"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {d.dayOfWeek}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-xs mt-1 ${
                          isSelected ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        <span>
                          <b>{d.orderCount}</b> захиалга
                        </span>
                        <span>•</span>
                        <span>
                          <b>{d.totalItemCount}</b> бараа
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-black ${isSelected ? "text-white" : "text-indigo-700"}`}>
                        ₮{d.totalAmount.toLocaleString()}
                      </p>
                      {d.pendingCount > 0 && (
                        <span
                          className={`text-[9px] font-bold px-1 rounded inline-block mt-0.5 ${
                            isSelected
                              ? "bg-amber-400 text-amber-950"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {d.pendingCount} хүлээгдэж буй
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed">
                Илэрц олдсонгүй
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Date Details & Purchasing List */}
        <div className="lg:col-span-8 space-y-4">
          {isPending ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {selectedDate} өдрийн мэдээллийг нэгтгэж байна...
              </p>
            </div>
          ) : details ? (
            <>
              {/* Date Header Card with Stat Badges */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-black text-slate-900">
                        {details.displayDate}
                      </h2>
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60">
                        Өдрийн хураангуй
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Энэ өдөр системд бүртгэгдсэн бүх захиалга болон татах барааны нэгдсэн тооцоолол
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="text-xs font-bold gap-1.5 h-8 border-slate-200 hover:bg-slate-50"
                      title="Худалдан авалтын жагсаалтыг хэвлэх"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Хэвлэх
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="text-xs font-bold gap-1.5 h-8 border-slate-200 hover:bg-slate-50 text-emerald-700"
                      title="Excel CSV хэлбэрээр татах"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Excel CSV
                    </Button>
                  </div>
                </div>

                {/* 3 Key Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-500" />
                      Нийт захиалга
                    </p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {details.summary.totalOrders}{" "}
                      <span className="text-xs font-normal text-slate-500">хэрэглэгч</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Баталгаажсан: {details.summary.confirmedCount} • Хүлээгдэж буй: {details.summary.pendingCount}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                      Татах бараа (Ширхэг)
                    </p>
                    <p className="text-lg font-black text-indigo-900 mt-0.5">
                      {details.summary.totalItems}{" "}
                      <span className="text-xs font-normal text-indigo-600">
                        ширхэг ({details.summary.uniqueProductsCount} төрөл)
                      </span>
                    </p>
                    <p className="text-[10px] text-indigo-600/80 mt-0.5">
                      Солонгосоос бэлтгэх нийт тоо хэмжээ
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Нийт дүн
                    </p>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">
                      ₮{details.summary.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600/80 mt-0.5">
                      Өдрийн нийт борлуулалт
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 border-b sm:border-b-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("purchasing")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "purchasing"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Татах барааны жагсаалт ({details.purchasingList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "orders"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Захиалагчдын бүртгэл ({details.orders.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Бараа, утас, нэрээр шүүх..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* TAB 1: PURCHASING / SHOPPING LIST (FOR SHOPPER IN KOREA) */}
              {activeTab === "purchasing" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                        Солонгосоос Татах Барааны Тооцоолол
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Дэлгүүрт явж байхдаа авсан бараагаа чагтлаад явах боломжтой
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      Нийт: <b>{filteredPurchasingList.length}</b> төрөл
                    </span>
                  </div>

                  {filteredPurchasingList.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filteredPurchasingList.map((item, idx) => {
                        const isChecked = Boolean(checkedItems[item.key])
                        return (
                          <div
                            key={item.key}
                            className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                              isChecked ? "bg-emerald-50/50 opacity-75" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Checkbox for shopper */}
                              <button
                                type="button"
                                onClick={() => toggleItemChecked(item.key)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isChecked
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-300 hover:border-indigo-500 bg-white"
                                }`}
                                title={isChecked ? "Авсан (Чеклэгдсэн)" : "Авах (Чеклэх)"}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-400">
                                    #{idx + 1}
                                  </span>
                                  <h4
                                    className={`text-sm font-bold leading-snug break-words ${
                                      isChecked ? "line-through text-slate-500" : "text-slate-900"
                                    }`}
                                  >
                                    {item.productName}
                                  </h4>
                                </div>

                                {item.variantDesc && (
                                  <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md w-max mt-1 border border-indigo-100">
                                    Сонголт: {item.variantDesc}
                                  </p>
                                )}

                                {/* Customer list */}
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] text-slate-400">Захиалагчид:</span>
                                  {item.customers.map((c) => (
                                    <span
                                      key={c.orderId}
                                      className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                                    >
                                      {c.customerName} ({c.customerPhone}){" "}
                                      <b className="text-indigo-700">x{c.quantity}</b>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Total Quantity pill */}
                            <div className="text-right shrink-0">
                              <span className="text-xs text-slate-400 block mb-0.5">Авах тоо:</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-base font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                                {item.totalQuantity}ш
                              </span>
                              {item.unitPrice > 0 && (
                                <p className="text-[11px] font-bold text-slate-500 mt-1">
                                  ~₮{item.totalEstimatedAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Хайлтад тохирох бараа олдсонгүй
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER ORDERS LIST */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        Захиалагчдын Нэгдсэн Бүртгэл
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Энэ өдөр орсон бүх харилцагчийн захиалга
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      Нийт: <b>{filteredOrders.length}</b> захиалга
                    </span>
                  </div>

                  {filteredOrders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {filteredOrders.map((o) => (
                        <div
                          key={o.id}
                          className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                #{o.orderNumber}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {o.customerName}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {o.customerPhone}
                              </span>
                              {o.paymentStatus === "CONFIRMED" || o.paymentStatus === "PAID" ? (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                  Төлөгдсөн
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                  Хүлээгдэж буй
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 truncate">
                              Бараа: <b>{o.batch?.product?.name || "Бараа"}</b>{" "}
                              {o.selectedOptions && typeof o.selectedOptions === "object" && (
                                <span className="text-indigo-600 font-semibold">
                                  ({Object.values(o.selectedOptions).join(", ")})
                                </span>
                              )}{" "}
                              • <b>{o.quantity}ш</b>
                            </p>

                            {o.deliveryAddress && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                Хаяг: {o.deliveryAddress}
                              </p>
                            )}

                            {o.adminNotes && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 w-max">
                                Тэмдэглэл: {o.adminNotes}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-900">
                              ₮{Number(o.totalAmount || 0).toLocaleString()}
                            </p>
                            <span className="text-[11px] text-slate-400 block">
                              {new Date(o.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Хайлтад тохирох захиалга олдсонгүй
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-2 shadow-xs">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Огноо сонгогдоогүй байна</p>
              <p className="text-xs text-slate-400">Зүүн талын жагсаалтаас аль нэг өдрийг сонгоно уу.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
