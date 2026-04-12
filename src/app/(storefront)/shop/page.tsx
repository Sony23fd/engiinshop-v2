import { getActiveProducts } from "@/app/actions/product-actions"
import { ActiveBatchesList } from "@/components/storefront/home/ActiveBatchesList"
import { ShopFilters } from "@/components/storefront/ShopFilters"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ type?: string, q?: string }> }) {
  const params = await searchParams
  const filterType = params.type || "all"
  const query = params.q?.toLowerCase() || ""
  
  const { products, success } = await getActiveProducts()
  let displayProducts = products || []
  
  // Apply Type Filter
  if (filterType === "ready") {
    displayProducts = displayProducts.filter((p: any) => !p.isPreOrder)
  } else if (filterType === "preorder") {
    displayProducts = displayProducts.filter((p: any) => p.isPreOrder)
  }

  // Apply Search Query Filter
  if (query) {
    displayProducts = displayProducts.filter((p: any) => 
      p.product?.name?.toLowerCase().includes(query)
    )
  }

  // Dynamic titles based on filter
  let title = "Бүх бараа"
  let subtitle = "Манай дэлгүүрт байгаа бүх барааны жагсаалт"
  let theme = "ready"
  let badge = "Каталог"
  
  if (filterType === "ready") {
    title = "Бэлэн байгаа бараа"
    subtitle = "Шууд худалдан авах боломжтой, бэлэн байгаа бараанууд"
    theme = "ready"
  } else if (filterType === "preorder") {
    title = "Урьдчилсан захиалга"
    subtitle = "Тун удахгүй ирэх бараануудыг урьдчилан захиалах"
    theme = "preorder"
  }

  if (query) {
    subtitle = `"${params.q}" хайлтад олдсон бараанууд`
  }

  return (
    <div className="bg-white min-h-screen pt-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Дэлгүүр</h1>
      </div>
      
      <ShopFilters />

      {displayProducts.length > 0 ? (
        <ActiveBatchesList 
          batches={displayProducts} 
          title={title}
          subtitle={subtitle}
          badge={badge}
          theme={theme}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <Package className="w-16 h-16 text-slate-200 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Одоогоор бараа олдсонгүй</h2>
          <p className="text-slate-500 text-center max-w-md">Таны хайсан нөхцөлд тохирох бараа байхгүй байна.</p>
        </div>
      )}
    </div>
  )
}

