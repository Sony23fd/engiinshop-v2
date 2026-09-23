import { getProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { CreateProductSheet } from "./CreateProductSheet"
import { ProductTableClient } from "./ProductTableClient"
import { ProductFilters } from "@/components/admin/ProductFilters"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string, sort?: string, q?: string, page?: string }> }) {
  const p = await searchParams;
  const stockFilter = p.stock || "all";
  const sortFilter = p.sort || "remaining_desc";
  const search = p.q || "";
  const page = Math.max(1, Number(p.page || 1));

  const [{ products, success, totalCount = 0, totalPages = 1, currentPage = 1 }, { categories }] = await Promise.all([
    getProducts({ search: search || undefined, page, limit: 20 }),
    getCategories()
  ])
  
  let filteredProducts = products || [];

  function getEffectiveRemaining(b: any) {
    if (b.variantStock && typeof b.variantStock === "object" && Object.keys(b.variantStock).length > 0) {
      return Object.values(b.variantStock as Record<string, number>).reduce((s: number, v: number) => s + (Number(v) || 0), 0)
    }
    return b.targetQuantity - (b._calculatedOrderedSum || 0)
  }

  // 1. Filter first
  if (stockFilter === "in_stock") {
    filteredProducts = filteredProducts.filter((b: any) => getEffectiveRemaining(b) > 0);
  } else if (stockFilter === "out_of_stock") {
    filteredProducts = filteredProducts.filter((b: any) => getEffectiveRemaining(b) <= 0);
  }

  // 2. Sort second
  filteredProducts = filteredProducts.sort((a: any, b: any) => {
    const aRem = getEffectiveRemaining(a);
    const bRem = getEffectiveRemaining(b);

    if (sortFilter === "remaining_desc") {
      return bRem - aRem;
    } else if (sortFilter === "remaining_asc") {
      return aRem - bRem;
    } else if (sortFilter === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortFilter === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  // Build pagination URL params
  function buildPageUrl(pageNum: number) {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (stockFilter !== "all") params.set("stock", stockFilter)
    if (sortFilter !== "remaining_desc") params.set("sort", sortFilter)
    params.set("page", String(pageNum))
    return `/admin/products?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бараанууд</h1>
          <p className="text-sm text-slate-500 mt-1">
            Нийт <strong>{totalCount}</strong> бараа
            {search && <> · "<span className="text-indigo-600 font-medium">{search}</span>" хайлт</>}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ListSearchFilter placeholder="Барааны нэрээр хайх..." />
          <ProductFilters currentStock={stockFilter} currentSort={sortFilter} />
          <CreateProductSheet categories={categories || []} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-600 text-sm font-medium">📦 Монголд бэлэн бараа</span>
          <span className="text-slate-500 text-xs">— "Зарна" гэж тохируулсан бараа нүүр хуудасны "Бэлэн бүтээгдэхүүн" хэсэгт харагдана. Олон барааг нэгтгэхийн тулд урд талын нүдийг чагтална уу.</span>
        </div>

        <ProductTableClient
          products={filteredProducts}
          categories={categories || []}
          search={search}
          success={success}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-xs text-slate-500">
              Нийт <strong>{totalCount}</strong> барааны <strong>{currentPage}</strong> / <strong>{totalPages}</strong> хуудас
            </p>
            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                      pageNum === currentPage
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              {currentPage < totalPages && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
