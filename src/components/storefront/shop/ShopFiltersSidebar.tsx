"use client"

import { Search, X, Filter, Check, Plane, Package, Clock, Sparkles } from "lucide-react"

interface ShopFiltersSidebarProps {
  categories: Array<{ id: string; name: string; _count?: { batches: number } }>
  selectedCategory: string
  onSelectCategory: (id: string) => void
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
  categories,
  selectedCategory,
  onSelectCategory,
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
  totalCount
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
            className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            className={`py-2 px-1 rounded-lg transition-all text-center ${
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
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
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
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              status === "preorder"
                ? "bg-white text-amber-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" /> Захиалга
          </button>
        </div>
      </div>

      {/* 3. Special Feature Toggles (Free Cargo & In-Stock) */}
      <div className="space-y-2 pt-1">
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
            <span className="text-base">✈️</span>
            <div>
              <p className="text-xs font-bold leading-tight">Карго төлөхгүй</p>
              <p className="text-[10px] text-slate-500">Карго 0₮ бараанууд</p>
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
              <p className="text-xs font-bold leading-tight">Зөвхөн бэлэн үлдэгдэлтэй</p>
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
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all ${
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

      {/* 5. Categories List */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Ангилал & Багц
          </label>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className="text-[11px] text-indigo-600 hover:underline font-bold"
            >
              Бүгд
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Бүх ангилал</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count = cat._count?.batches || 0
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

