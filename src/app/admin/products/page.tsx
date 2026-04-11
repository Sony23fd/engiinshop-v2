import { getProducts } from "@/app/actions/product-actions"
import { getCategories } from "@/app/actions/category-actions"
import { CreateProductSheet } from "./CreateProductSheet"
import { EditProductSheet } from "./EditProductSheet"
import { BatchSaleToggle } from "./BatchSaleToggle"
import { ImageUploader } from "@/components/admin/ImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"
import { ProductFilters } from "@/components/admin/ProductFilters"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string, sort?: string, q?: string, page?: string, view?: string, category?: string, preOrder?: string }> }) {
  const p = await searchParams;
  const stockFilter = p.stock || "all";
  const sortFilter = p.sort || "remaining_desc";
  const search = p.q || "";
  const page = Math.max(1, Number(p.page || 1));
  const viewFilter = p.view || "on_sale"; // Default to "on_sale" tab
  const categoryFilter = p.category || "all";
  const preOrderFilter = p.preOrder || "all";

  const [{ products, success, totalCount = 0, totalPages = 1, currentPage = 1 }, { categories }] = await Promise.all([
    getProducts({
      search: search || undefined,
      page,
      limit: 20,
      stockFilter,
      sortFilter,
      saleFilter: viewFilter === "on_sale" ? "on_sale" : "all",
      categoryFilter: categoryFilter !== "all" ? categoryFilter : undefined,
      preOrderFilter
    }),
    getCategories()
  ])

  let filteredProducts = products || [];
  // Client-side filtering is now minimal since most filtering happens in getProducts()
  // We keep this for backward compatibility but it should rarely filter anything

  // Build pagination URL params
  function buildPageUrl(pageNum: number) {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (stockFilter !== "all") params.set("stock", stockFilter)
    if (sortFilter !== "remaining_desc") params.set("sort", sortFilter)
    if (viewFilter !== "on_sale") params.set("view", viewFilter)
    if (categoryFilter !== "all") params.set("category", categoryFilter)
    if (preOrderFilter !== "all") params.set("preOrder", preOrderFilter)
    params.set("page", String(pageNum))
    return `/admin/products?${params.toString()}`
  }

  // Count products for each tab
  const onSaleCount = await getProducts({ saleFilter: "on_sale", limit: 1 }).then(r => r.totalCount)
  const allCount = totalCount

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
          <ProductFilters
            currentStock={stockFilter}
            currentSort={sortFilter}
            currentCategory={categoryFilter}
            currentPreOrder={preOrderFilter}
            categories={categories || []}
          />
          <CreateProductSheet categories={categories || []} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b">
        <Link
          href={`/admin/products?view=on_sale${search ? `&q=${search}` : ''}`}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            viewFilter === "on_sale"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Зарагдаж буй ({onSaleCount})
        </Link>
        <Link
          href={`/admin/products?view=all${search ? `&q=${search}` : ''}`}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            viewFilter === "all"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Бүх бараа ({allCount})
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-600 text-sm font-medium">📦 Монголд бэлэн бараа</span>
          <span className="text-slate-500 text-xs">— "Зарна" гэж тохируулсан бараа нүүр хуудасны "Бэлэн бүтээгдэхүүн" хэсэгт харагдана.</span>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">Бараа №</th>
                <th className="px-4 py-3">Нэр + Ангилал</th>
                <th className="px-4 py-3 text-center">Үйлдэл</th>
                <th className="px-4 py-3 text-center">Медиа</th>
                <th className="px-4 py-3">Үлдэгдэл</th>
                <th className="px-4 py-3">Үнэ + Жин</th>
                <th className="px-4 py-3 text-right">Зарах / Хүргэлт</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {success && filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((batch: any) => {
                  const variantStock = batch.variantStock as Record<string, number> | null
                  const variantCount = variantStock ? Object.keys(variantStock).length : 0
                  const variantTotal = variantStock ? Object.values(variantStock).reduce((s: number, v: number) => s + v, 0) : 0
                  const ordered = batch._calculatedOrderedSum || 0
                  const remaining = batch.targetQuantity - ordered

                  return (
                  <tr key={batch.id} className="hover:bg-slate-50/50">
                    {/* Batch Number */}
                    <td className="px-4 py-4 font-medium text-slate-600">#{batch.batchNumber}</td>

                    {/* Name + Category */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{batch.product?.name}</span>
                        {batch.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 w-fit">
                            {batch.category.name}
                          </span>
                        )}
                        {batch.isPreOrder && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                            ⏰ Урьдчилсан
                            {batch.closingDate && (
                              <span className="text-[10px]">
                                · {new Date(batch.closingDate).toLocaleDateString('mn-MN')}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center">
                      <EditProductSheet batch={batch} />
                    </td>

                    {/* Media (Image + Video combined) */}
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <ImageUploader
                          productId={batch.product?.id}
                          currentImageUrl={batch.product?.imageUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                        <VideoUploader
                          productId={batch.product?.id}
                          currentVideoUrl={batch.product?.videoUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                      </div>
                    </td>

                    {/* Remaining Stock */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold w-fit ${
                          remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {remaining} / {batch.targetQuantity}
                        </span>
                        {variantCount > 0 && (
                          <div className="group relative">
                            <span className="text-[10px] text-indigo-600 font-medium cursor-help border-b border-dashed border-indigo-300">
                              {variantCount} variant
                            </span>
                            <div className="absolute left-0 bottom-full mb-1 bg-slate-900 text-white text-[10px] rounded-lg p-2 hidden group-hover:block z-50 min-w-[140px] shadow-lg">
                              {Object.entries(variantStock!).map(([key, val]) => (
                                <div key={key} className="flex justify-between gap-4 py-0.5">
                                  <span className="font-medium opacity-80">{key}</span>
                                  <span className="font-bold">{val}ш</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Price + Weight */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900">₮{Number(batch.price || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-500">{Number(batch.product?.weight || 0)}кг</span>
                      </div>
                    </td>

                    {/* Sale Toggle + Delivery Fee */}
                    <td className="px-4 py-4 text-right">
                      <BatchSaleToggle batch={batch} />
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {search ? `"${search}" хайлтад тохирох бараа олдсонгүй` : "Одоогоор бараа бүртгэгдээгүй байна"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
