import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ProductDetailClient } from "@/components/storefront/product/ProductDetailClient"
import { RelatedBatches } from "@/components/storefront/product/RelatedBatches"
import { getShopSettings } from "@/app/actions/settings-actions"
import { BackButtonClient } from "@/components/storefront/product/BackButtonClient"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const batch = await db.batch.findUnique({
    where: { id },
    include: { product: true }
  })

  if (!batch || !batch.isAvailableForSale) {
    notFound()
  }

  const [relatedBatches, shopSettings] = await Promise.all([
    db.batch.findMany({
      where: { 
        isAvailableForSale: true, 
        id: { not: batch.id } 
      } as any,
      include: { product: true, category: true },
      take: 4,
      orderBy: { createdAt: "desc" }
    }),
    getShopSettings()
  ])

  const batchPrice = parseFloat(String(batch.price ?? 0))
  const productPrice = parseFloat(String(batch.product?.price ?? 0))
  const unitPrice = batchPrice > 0 ? batchPrice : productPrice
  const batchFee = Number((batch as any).deliveryFee || 0)
  const globalFee = Number(shopSettings.delivery_fee || 0)
  const deliveryFee = batchFee > 0 ? batchFee : globalFee

  // Serialize Prisma Decimal and Date fields to plain JSON object
  const serializedBatch = JSON.parse(JSON.stringify(batch))

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <BackButtonClient />
        <ProductDetailClient
          batch={serializedBatch}
          unitPrice={unitPrice}
          deliveryFee={deliveryFee}
          shopSettings={shopSettings}
        />
      </div>

    {/* Sticky Mobile Buy Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] pb-safe-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium truncate mb-0.5">
              {batch.product?.name}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-none">
              ₮{unitPrice.toLocaleString()}
            </p>
          </div>
          <Link href="#order-form" className="bg-[#4F46E5] text-white px-8 py-3 rounded-xl font-bold text-sm shrink-0 shadow-sm shadow-indigo-200">
            Захиалах
          </Link>
        </div>
      </div>
      
      {relatedBatches.length > 0 && (
        <RelatedBatches 
          batches={relatedBatches as any} 
          title="Танд санал болгох" 
        />
      )}
    </>
  )
}
