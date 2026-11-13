"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShopFiltersSidebar } from "./ShopFiltersSidebar"
import { ShopSortingBar } from "./ShopSortingBar"
import { ShopProductCard } from "./ShopProductCard"
import { QuickViewModal } from "@/components/storefront/product/QuickViewModal"
import { getShopProducts, ShopProductsQuery } from "@/app/actions/product-actions"
import { X, Search, RefreshCw, Loader2, Sparkles, ShoppingBag } from "lucide-react"

interface ShopClientProps {
  initialBatches: any[]
  initialTotalCount: number
  initialTotalPages: number
  initialCurrentPage: number
  categories: any[]
}

export function ShopClient({
  initialBatches,
  initialTotalCount,
  initialTotalPages,
  initialCurrentPage,
  categories,
}: ShopClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State from URL or initial
  const [search, setSearch] = useState<string>(searchParams?.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams?.get("cat") || "all")
  const [status, setStatus] = useState<"all" | "ready" | "preorder">(
    (searchParams?.get("status") as any) || "all"
  )
  const [isFreeCargo, setIsFreeCargo] = useState<boolean>(searchParams?.get("freeCargo") === "true")
  const [inStockOnly, setInStockOnly] = useState<boolean>(searchParams?.get("inStock") === "true")
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams?.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  )
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams?.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined
  )
  const [sort, setSort] = useState<string>(searchParams?.get("sort") || "newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Products state
  const [products, setProducts] = useState<any[]>(initialBatches)
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount)
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages)
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage)

  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  // Quick view modal
  const [quickViewBatch, setQuickViewBatch] = useState<any | null>(null)

  // Mobile filters drawer open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false)

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (search.trim()) count++
    if (selectedCategory !== "all") count++
    if (status !== "all") count++
    if (isFreeCargo) count++
    if (inStockOnly) count++
    if (minPrice !== undefined || maxPrice !== undefined) count++
    return count
  }, [search, selectedCategory, status, isFreeCargo, inStockOnly, minPrice, maxPrice])

  // Active filter chips for quick removal
  const activeChips = useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = []
    if (search.trim()) {
      chips.push({ label: `Хайлт: "${search}"`, onRemove: () => setSearch("") })
    }
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === selectedCategory)
      chips.push({
        label: `Ангилал: ${cat?.name || selectedCategory}`,
        onRemove: () => setSelectedCategory("all"),
      })
    }
    if (status === "ready") {
      chips.push({ label: "Бэлэн байгаа", onRemove: () => setStatus("all") })
    } else if (status === "preorder") {
      chips.push({ label: "Урьдчилсан захиалга", onRemove: () => setStatus("all") })
    }
    if (isFreeCargo) {
      chips.push({ label: "✈️ Карго 0₮", onRemove: () => setIsFreeCargo(false) })
    }
    if (inStockOnly) {
      chips.push({ label: "Зөвхөн үлдэгдэлтэй", onRemove: () => setInStockOnly(false) })
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      let label = "Үнэ: "
      if (minPrice && maxPrice) label += `${minPrice.toLocaleString()}₮ - ${maxPrice.toLocaleString()}₮`
      else if (minPrice) label += `>${minPrice.toLocaleString()}₮`
      else if (maxPrice) label += `<${maxPrice.toLocaleString()}₮`
      chips.push({ label, onRemove: () => { setMinPrice(undefined); setMaxPrice(undefined); } })
    }
    return chips
  }, [search, selectedCategory, status, isFreeCargo, inStockOnly, minPrice, maxPrice, categories])

  // Fetch products whenever filters change (with debounce on search)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await getShopProducts({
        search,
        categoryId: selectedCategory,
        status,
        isFreeCargo,
        inStockOnly,
        minPrice,
        maxPrice,
        sort: sort as any,
        page: 1,
        limit: 24,
      })

      if (active) {
        if (res.success) {
          setProducts(res.products)
          setTotalCount(res.totalCount)
          setTotalPages(res.totalPages)
          setCurrentPage(1)
        }
        setLoading(false)
      }

      // Sync URL query params without full page reload
      const params = new URLSearchParams()
      if (search.trim()) params.set("q", search.trim())
      if (selectedCategory !== "all") params.set("cat", selectedCategory)
      if (status !== "all") params.set("status", status)
      if (isFreeCargo) params.set("freeCargo", "true")
      if (inStockOnly) params.set("inStock", "true")
      if (minPrice !== undefined) params.set("minPrice", String(minPrice))
      if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice))
      if (sort !== "newest") params.set("sort", sort)

      const qs = params.toString()
      const newUrl = qs ? `/shop?${qs}` : "/shop"
      window.history.replaceState(null, "", newUrl)
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search, selectedCategory, status, isFreeCargo, inStockOnly, minPrice, maxPrice, sort])

  // Load more pagination
  async function handleLoadMore() {
    if (currentPage >= totalPages || loadingMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    const res = await getShopProducts({
      search,
      categoryId: selectedCategory,
      status,
      isFreeCargo,
      inStockOnly,
      minPrice,
      maxPrice,
      sort: sort as any,
      page: nextPage,
      limit: 24,
    })
    setLoadingMore(false)
    if (res.success) {
      setProducts((prev) => [...prev, ...res.products])
      setCurrentPage(nextPage)
    }
  }

  function handleResetAll() {
    setSearch("")
    setSelectedCategory("all")
    setStatus("all")
    setIsFreeCargo(false)
    setInStockOnly(false)
    setMinPrice(undefined)
    setMaxPrice(undefined)
    setSort("newest")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs & Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <span>Нүүр</span>
          <span>/</span>
          <span className="text-indigo-600">Дэлгүүр</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Бүх бүтээгдэхүүн</span>
              <Sparkles className="w-6 h-6 text-amber-500 hidden sm:inline" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Солонгос улсаас шууд захиалах болон Монголд бэлэн байгаа баталгаат бараанууд
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sidebar (Left Column) */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-20 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <ShopFiltersSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            status={status}
            onStatusChange={setStatus}
            isFreeCargo={isFreeCargo}
            onToggleFreeCargo={setIsFreeCargo}
            inStockOnly={inStockOnly}
            onToggleInStockOnly={setInStockOnly}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={(min, max) => {
              setMinPrice(min)
              setMaxPrice(max)
            }}
            search={search}
            onSearchChange={setSearch}
            onResetAll={handleResetAll}
            activeFiltersCount={activeFiltersCount}
            totalCount={totalCount}
          />
        </div>

        {/* Products Section (Right Column) */}
        <div className="flex-1 w-full min-w-0">
          {/* Sorting Bar */}
          <ShopSortingBar
            totalCount={initialTotalCount}
            filteredCount={totalCount}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            activeFiltersCount={activeFiltersCount}
            activeChips={activeChips}
          />

          {/* Product Grid / List / Skeletons */}
          {loading ? (
            <div
              className={`grid gap-3 sm:gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-3 border border-slate-200/60 shadow-2xs animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-8">
              <div
                className={`grid gap-3 sm:gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {products.map((batch) => (
                  <ShopProductCard
                    key={batch.id}
                    batch={batch}
                    viewMode={viewMode}
                    onQuickView={setQuickViewBatch}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {currentPage < totalPages && (
                <div className="text-center pt-6 pb-12">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>{loadingMore ? "Уншиж байна..." : "Цааш үзэх (Цааш 24 бараа)"}</span>
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    Нийт {totalCount} бараанаас {products.length}-г харуулж байна
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4 my-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Илэрц олдсонгүй</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Таны сонгосон хайлт болон шүүлтүүрт тохирох бүтээгдэхүүн олдсонгүй. Шүүлтүүрээ өөрчлөөд дахин үзнэ үү.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Бүх шүүлтүүрийг цэвэрлэх
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in flex justify-end">
          <div
            className="w-full max-w-xs bg-white h-full overflow-y-auto p-5 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Шүүлтүүр</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ShopFiltersSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId)
                  setMobileFiltersOpen(false)
                }}
                status={status}
                onStatusChange={setStatus}
                isFreeCargo={isFreeCargo}
                onToggleFreeCargo={setIsFreeCargo}
                inStockOnly={inStockOnly}
                onToggleInStockOnly={setInStockOnly}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  setMinPrice(min)
                  setMaxPrice(max)
                }}
                search={search}
                onSearchChange={setSearch}
                onResetAll={handleResetAll}
                activeFiltersCount={activeFiltersCount}
                totalCount={totalCount}
              />
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#4F46E5] text-white py-3 rounded-xl font-bold text-sm shadow-md"
              >
                {totalCount} бараа үзэх
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal batch={quickViewBatch} onClose={() => setQuickViewBatch(null)} />
    </div>
  )
}

