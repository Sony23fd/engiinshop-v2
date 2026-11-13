import { getShopProducts } from "@/app/actions/product-actions"
import { ShopClient } from "@/components/storefront/shop/ShopClient"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Дэлгүүр - Бүх бүтээгдэхүүн | Anar Korea Shop",
  description: "Солонгосоос шууд таны гарт хүргэх чанарын баталгаат, трэнд бүтээгдэхүүнүүдийн нэгдсэн каталог.",
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined
  const cat = typeof resolvedParams.cat === "string" ? resolvedParams.cat : undefined
  const status = typeof resolvedParams.status === "string" ? (resolvedParams.status as any) : undefined
  const freeCargo = resolvedParams.freeCargo === "true"
  const inStock = resolvedParams.inStock === "true"
  const minPrice = typeof resolvedParams.minPrice === "string" ? Number(resolvedParams.minPrice) : undefined
  const maxPrice = typeof resolvedParams.maxPrice === "string" ? Number(resolvedParams.maxPrice) : undefined
  const sort = typeof resolvedParams.sort === "string" ? (resolvedParams.sort as any) : "newest"
  const page = typeof resolvedParams.page === "string" ? Number(resolvedParams.page) : 1

  const res = await getShopProducts({
    search: q,
    categoryId: cat,
    status,
    isFreeCargo: freeCargo,
    inStockOnly: inStock,
    minPrice,
    maxPrice,
    sort,
    page,
    limit: 24,
  })

  return (
    <div className="bg-slate-50/50 min-h-screen">
      <ShopClient
        initialBatches={res.products || []}
        initialTotalCount={res.totalCount || 0}
        initialTotalPages={res.totalPages || 0}
        initialCurrentPage={res.currentPage || 1}
        categories={res.categories || []}
      />
    </div>
  )
}

