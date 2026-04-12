import { getActiveProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { ActiveBatchesList } from "@/components/storefront/home/ActiveBatchesList"
import Link from "next/link"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string, category?: string, type?: string, page?: string }>
}) {
  const p = await searchParams
  const q = p.q || ""
  const categoryId = p.category || ""
  const type = p.type || "all"
  const page = Math.max(1, Number(p.page || 1))
  const limit = 20

  const [{ products, success }, { categories }] = await Promise.all([
    getActiveProducts({ search: q || undefined, categoryId: categoryId || undefined }),
    getCategories()
  ])

  const allProducts = products || []

  // Filter by type
  let filtered = allProducts
  if (type === "ready") filtered = allProducts.filter((p: any) => !p.isPreOrder)
  else if (type === "preorder") filtered = allProducts.filter((p: any) => p.isPreOrder)

  // Pagination
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / limit)
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (categoryId) sp.set("category", categoryId)
    if (type !== "all") sp.set("type", type)
    Object.entries(params).forEach(([k, v]) => v ? sp.set(k, v) : sp.delete(k))
    return `/shop?${sp.toString()}`
  }

  const activeCategories = (categories || []).filter((c: any) => !c.isArchived && !c.name?.includes("Сарын захиалга"))

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Дэлгүүр</h1>
          <p className="text-slate-500">Нийт <strong>{totalCount}</strong> бараа</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <form method="GET" action="/shop" className="flex gap-2">
            {categoryId && <input type="hidden" name="category" value={categoryId} />}
            {type !== "all" && <input type="hidden" name="type" value={type} />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Бараа хайх..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              Хайх
            </button>
          </form>

          {/* Type filter */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {[["all", "Бүгд"], ["ready", "Бэлэн"], ["preorder", "Урьдчилсан"]].map(([val, label]) => (
              <Link key={val} href={buildUrl({ type: val, page: "1" })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  type === val ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Category filter */}
          {activeCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Link href={buildUrl({ category: "", page: "1" })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  !categoryId ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}>
                Бүх ангилал
              </Link>
              {activeCategories.map((cat: any) => (
                <Link key={cat.id} href={buildUrl({ category: cat.id, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    categoryId === cat.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {paginated.length > 0 ? (
          <ActiveBatchesList batches={paginated} title="" subtitle="" badge="" />
        ) : (
          <div className="py-24 text-center text-slate-500">
            <p className="text-lg font-medium">Бараа олдсонгүй</p>
            <Link href="/shop" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">Шүүлтүүр арилгах</Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Link href={buildUrl({ page: String(Math.max(1, page - 1)) })}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
              Өмнөх
            </Link>
            <span className="text-sm font-medium text-slate-600 px-4">
              {page} / {totalPages}
            </span>
            <Link href={buildUrl({ page: String(Math.min(totalPages, page + 1)) })}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page >= totalPages ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
              Дараах
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
