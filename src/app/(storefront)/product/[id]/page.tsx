import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Package, Truck, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductOrderForm } from "./ProductOrderForm"
import { RelatedBatches } from "@/components/storefront/product/RelatedBatches"
import { getShopSettings } from "@/app/actions/settings-actions"

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

  const unitPrice = Number(batch.price || batch.product?.price || 0)
  const batchFee = Number((batch as any).deliveryFee || 0)
  const globalFee = Number(shopSettings.delivery_fee || 0)
  const deliveryFee = batchFee > 0 ? batchFee : globalFee

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium bg-white px-4 py-2 rounded-xl border shadow-sm">
        <ArrowLeft className="w-4 h-4" />
        Буцах
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row">

        {/* Product Info Side */}
        <div className="md:w-1/2 p-8 bg-slate-50 border-r flex flex-col">
          <div className="aspect-[4/5] sm:aspect-square bg-slate-200 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
            {(batch.product as any)?.videoUrl ? (
              <video src={(batch.product as any).videoUrl} autoPlay loop muted playsInline className="object-cover w-full h-full" />
            ) : batch.product?.imageUrl ? (
              <Image src={batch.product.imageUrl} alt={batch.product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-2">
                <Package className="w-12 h-12" />
                <span className="text-sm font-medium">{batch.product?.name}</span>
              </div>
            )}
            
            {/* Pre-order Badge Overlay */}
            {(batch as any).isPreOrder && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 flex items-center gap-1.5 shadow-sm border border-amber-200 uppercase tracking-widest">
                <span>📌 Урьдчилсан захиалга</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{batch.product?.name}</h1>
          <p className="text-slate-600 mb-6 flex-1">
            {batch.description || batch.product?.description || "Тайлбар оруулаагүй байна."}
          </p>

          <div className="space-y-3 bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Нэгж үнэ:</span>
              <span className="font-bold text-xl text-slate-900">₮{unitPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Үлдэгдэл:</span>
              <span className={`font-bold ${(batch as any).isPreOrder || batch.remainingQuantity > 0 ? "text-green-600" : "text-red-500"}`}>
                {(batch as any).isPreOrder 
                  ? "Хязгааргүй (Урьдчилсан)"
                  : batch.remainingQuantity > 0 ? `${batch.remainingQuantity} ширхэг` : "Дууссан"
                }
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="text-slate-500 text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-400" /> Хүргэлтийн үнэ:
                </span>
                <span className="font-semibold text-slate-800">
                  {Number(batch.deliveryFee) > 0 ? `₮${Number(batch.deliveryFee).toLocaleString()}` : "Үнэгүй"}
                </span>
              </div>
            )}
            
            {/* Delivery Estimate */}
            <div className="flex items-center gap-2 mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Хүргэгдэх хугацаа</p>
                <p className="text-sm font-bold text-slate-800">
                  {Number(batch.cargoFeeStatus) > 0 ? "Ойролцоогоор 7-14 хоног (Солонгосоос)" : "Бэлэн байгаа (Өнөөдөр / Маргааш)"}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
                <span className="text-green-500 text-lg leading-none">✓</span> 100% Баталгаат
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
                <span className="text-green-500 text-lg leading-none">✓</span> Найдвартай
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form Side */}
        <div id="order-form" className="md:w-1/2 p-8 scroll-mt-6 hover:scroll-mt-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-500" /> Захиалга өгөх
          </h2>
          <ProductOrderForm
            batchId={batch.id}
            unitPrice={unitPrice}
            deliveryFee={deliveryFee}
            remainingQuantity={batch.remainingQuantity}
            termsOfService={shopSettings.terms_of_service}
            deliveryTerms={shopSettings.delivery_terms}
            isPreOrder={(batch as any).isPreOrder}
            options={(batch.product as any)?.options}
          />
        </div>

      </div>
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
