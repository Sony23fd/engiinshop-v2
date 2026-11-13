"use client"

import { Search, X, Filter, Check, Package, Clock, Sparkles } from "lucide-react"

interface ShopFiltersSidebarProps {
  status: "all" | "ready" | "preorder"
  onStatusChange: (status: "all" | "ready" | "preorder") => void
  isFreeCargo: boolean
  onToggleFreeCargo: (val: boolean) => void
  inStockOnly: boolean
  onToggleInStockOnly: (val: boolean) => void
  minPrice?: number
  maxPrice?: number
  onPriceChange: (min?: number, max?: number) => void
  search: string
  onSearchChange: (q: string) => void
  onResetAll: () => void
  activeFiltersCount: number
  totalCount: number
}

const PRICE_PRESETS = [
  { label: "Бүгд", min: undefined, max: undefined },
  { label: "< 50,000₮", min: undefined, max: 50000 },
  { label: "50k - 100k", min: 50000, max: 100000 },
  { label: "100k - 200k", min: 100000, max: 200000 },
  { label: "> 200,000₮", min: 200000, max: undefined },
]

export function ShopFiltersSidebar({
  status,
  onStatusChange,
  isFreeCargo,
  onToggleFreeCargo,
  inStockOnly,
  onToggleInStockOnly,
  minPrice,
  maxPrice,
  onPriceChange,
  search,
  onSearchChange,
  onResetAll,
  activeFiltersCount,
}: ShopFiltersSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Header with Active Filters count & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">Шүүлтүүр</h2>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Цэвэрлэх
          </button>
        )}
      </div>

      {/* 1. Keyword Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Түлхүүр үгээр хайх
        </label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Барааны нэрээр хайх..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Segmented Controls */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Барааны төлөв
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              status === "all"
                ? "bg-white text-indigo-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Бүгд
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("ready")}
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              status === "ready"
                ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-3 h-3 text-emerald-600" /> Бэлэн
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("preorder")}
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              status === "preorder"
                ? "bg-white text-amber-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" /> Захиалга
          </button>
        </div>
      </div>

      {/* 3. Free Cargo & Stock Toggles */}
      <div className="space-y-2.5 pt-1 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Онцлох шүүлтүүр
        </label>

        {/* Free Cargo Toggle */}
        <label
          onClick={() => onToggleFreeCargo(!isFreeCargo)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
            isFreeCargo
              ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
              : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <div>
              <p className="text-xs font-bold leading-tight">Каргоны төлбөргүй</p>
              <p className="text-[10px] text-slate-500">Монгол дахь карго 0₮</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
              isFreeCargo ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
            }`}
          >
            {isFreeCargo && <Check className="w-3.5 h-3.5" />}
          </div>
        </label>

        {/* In-stock Only */}
        <label
          onClick={() => onToggleInStockOnly(!inStockOnly)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
            inStockOnly
              ? "bg-indigo-50 border-indigo-300 text-indigo-950 shadow-xs"
              : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-xs font-bold leading-tight">Зөвхөн үлдэгдэлтэй</p>
              <p className="text-[10px] text-slate-500">Дууссан барааг нуух</p>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
              inStockOnly ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white"
            }`}
          >
            {inStockOnly && <Check className="w-3.5 h-3.5" />}
          </div>
        </label>
      </div>

      {/* 4. Price Presets */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Үнийн интервал
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((p, idx) => {
            const isSelected = minPrice === p.min && maxPrice === p.max
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onPriceChange(p.min, p.max)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
