"use client"

import { Filter, LayoutGrid, Rows, ArrowUpDown, X } from "lucide-react"

interface ShopSortingBarProps {
  totalCount: number
  filteredCount: number
  sort: string
  onSortChange: (sort: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onOpenMobileFilters: () => void
  activeFiltersCount: number
  activeChips: Array<{ label: string; onRemove: () => void }>
}

const SORT_OPTIONS = [
  { value: "newest", label: "Шинэ нь эхэндээ" },
  { value: "price_asc", label: "Үнэ: Хямдаас үнэтэй" },
  { value: "price_desc", label: "Үнэ: Үнэтэйгээс хямд" },
  { value: "popular", label: "Эрэлттэй бараа" },
  { value: "name_asc", label: "Нэрээр (А - Я)" },
]

export function ShopSortingBar({
  totalCount,
  filteredCount,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilters,
  activeFiltersCount,
  activeChips
}: ShopSortingBarProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Left: Total products count + Mobile Filter Button */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Нийт <strong className="text-slate-900 font-extrabold">{filteredCount}</strong> бүтээгдэхүүн
            {filteredCount !== totalCount && (
              <span className="text-slate-400 text-xs ml-1">({totalCount}-аас)</span>
            )}
          </p>

          {/* Mobile Filter Trigger Button */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="sm:hidden inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-indigo-200"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Шүүлтүүр</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Sorting Select & View Mode Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="Тор хэлбэрээр харах"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="Жагсаалтаар харах"
            >
              <Rows className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Идэвхтэй:</span>
          {activeChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full shadow-2xs animate-in fade-in"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:bg-indigo-200/60 rounded-full p-0.5 text-indigo-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

