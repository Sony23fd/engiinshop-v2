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
  // 1. Filter first
  if (stockFilter === "in_stock") {
    filteredProducts = filteredProducts.filter((b: any) => (b.targetQuantity - (b._calculatedOrderedSum || 0)) > 0);
  } else if (stockFilter === "out_of_stock") {
    filteredProducts = filteredProducts.filter((b: any) => (b.targetQuantity - (b._calculatedOrderedSum || 0)) <= 0);
  }

  // 2. Sort second
  filteredProducts = filteredProducts.sort((a: any, b: any) => {
    const aRem = a.targetQuantity - (a._calculatedOrderedSum || 0);
    const bRem = b.targetQuantity - (b._calculatedOrderedSum || 0);

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
          <span className="text-slate-500 text-xs">— "Зарна" гэж тохируулсан бараа нүүр хуудасны "Бэлэн бүтээгдэхүүн" хэсэгт харагдана.</span>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">Бараа №</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3 text-center">Үйлдэл</th>
                <th className="px-4 py-3 text-center">Зураг</th>
                <th className="px-4 py-3">Зорилтот тоо</th>
                <th className="px-4 py-3">Үлдэгдэл</th>
                <th className="px-4 py-3">Үнэ</th>
                <th className="px-4 py-3">Жин</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Нүүрт гарах / Хүргэлтийн үнэ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {success && filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((batch: any) => {
                  const variantStock = batch.variantStock as Record<string, number> | null
                  const variantCount = variantStock ? Object.keys(variantStock).length : 0
                  const variantTotal = variantStock ? Object.values(variantStock).reduce((s: number, v: number) => s + v, 0) : 0

                  return (
                  <tr key={batch.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium">#{batch.batchNumber}</td>
                    <td className="px-4 py-4 font-medium text-slate-900 max-w-[200px] truncate">{batch.product?.name}</td>
                    <td className="px-4 py-4 text-center">
                      <EditProductSheet batch={batch} />
                    </td>
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
                    <td className="px-4 py-4 text-slate-700 font-semibold">{batch.targetQuantity}</td>
                    <td className="px-4 py-4">
                      {(() => {
                        const ordered = batch._calculatedOrderedSum || 0
                        const remaining = batch.targetQuantity - ordered
                        return (
                          <div className="space-y-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {remaining} / {batch.targetQuantity}
                            </span>
                            {/* Variant stock tooltip */}
                            {variantCount > 0 && (
                              <div className="group relative">
                                <span className="text-[10px] text-indigo-500 font-bold cursor-help border-b border-dashed border-indigo-300">
                                  {variantCount} variant · Нийт {variantTotal}ш
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
                        )
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">₮{(() => { const bp = parseFloat(String(batch.price ?? 0)); const pp = parseFloat(String(batch.product?.price ?? 0)); return (bp > 0 ? bp : pp).toLocaleString(); })()}</td>
                    <td className="px-4 py-4 text-slate-600">{Number(batch.product?.weight || 0)} кг</td>
                    <td className="px-4 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
                        {batch.status === 'OPEN' ? 'Нээлттэй' : 
                         batch.status === 'CLOSED' ? 'Хаагдсан' : 
                         batch.status === 'SHIPPED' ? 'Илгээгдсэн' : 'Ирсэн'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <BatchSaleToggle
                        batchId={batch.id}
                        initialEnabled={batch.isAvailableForSale ?? false}
                        initialPreOrder={batch.isPreOrder ?? false}
                        initialFee={Number(batch.deliveryFee || 0)}
                        dynamicRemainingQty={batch.targetQuantity - (batch._calculatedOrderedSum || 0)}
                        targetQty={batch.targetQuantity}
                        initialClosingDate={batch.closingDate ? new Date(batch.closingDate) : null}
                      />
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
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
