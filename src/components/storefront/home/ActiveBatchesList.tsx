import Link from "next/link"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Clock, TrendingUp } from "lucide-react"

export function ActiveBatchesList({ 
  batches,
  title = "Яг одоо захиалах",
  subtitle = "Хамгийн эрэлттэй, захиалга нь нээлттэй байгаа бараанууд",
  badge = "Тренд бараанууд"
}: { 
  batches: any[],
  title?: string,
  subtitle?: string,
  badge?: string
}) {
  if (!batches || batches.length === 0) return null;

  return (
    <div id="batches" className="py-20 bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            {badge && (
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-indigo-100/50 rounded-full border border-indigo-200/50">
                <TrendingUp className="w-4 h-4 text-[#4e3dc7]" />
                <span className="text-xs font-bold text-[#4e3dc7] uppercase tracking-wider">{badge}</span>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batches.map((batch: any) => {
            const progress = batch.quantity > 0 
              ? Math.min(100, Math.max(0, ((batch.quantity - batch.remainingQuantity) / batch.quantity) * 100))
              : 0;

            return (
              <div key={batch.id} className="bg-white rounded-2xl p-4 flex flex-col group border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Link href={`/product/${batch.id}`} className="block relative bg-slate-100 rounded-xl overflow-hidden aspect-square mb-4">
                  {batch.product?.videoUrl ? (
                    <video
                      src={batch.product.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    />
                  ) : batch.product?.imageUrl ? (
                    <img
                      src={batch.product.imageUrl}
                      alt={batch.product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Зураггүй</div>
                  )}
                  {/* Urgency Badge */}
                  {batch.isPreOrder ? (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Урьдчилсан захиалга</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Нээлттэй</span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 flex flex-col gap-3">
                  {batch.category && (
                    <div className="text-[10px] font-bold text-[#4e3dc7] uppercase tracking-wider">
                      {batch.category.name}
                    </div>
                  )}
                  <Link href={`/product/${batch.id}`}>
                    <h3 className="font-semibold text-slate-900 leading-snug hover:text-[#4e3dc7] transition-colors line-clamp-2">
                      {batch.product?.name}
                    </h3>
                  </Link>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xl font-black text-slate-900 tracking-tight">
                          ₮{Number(batch.price || batch.product?.price || 0).toLocaleString()}
                        </p>
                        {Number(batch.deliveryFee) > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">+₮{Number(batch.deliveryFee).toLocaleString()} хүргэлт</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Захиалга дүүрэлт</span>
                        <span className="text-[#4e3dc7]">{batch.remainingQuantity} үлдсэн</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#4e3dc7] to-indigo-400 rounded-full transition-all duration-1000" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <AddToCartButton
                      batchId={batch.id}
                      name={batch.product?.name ?? ""}
                      imageUrl={batch.product?.imageUrl}
                      unitPrice={Number(batch.price || batch.product?.price || 0)}
                      deliveryFee={Number(batch.deliveryFee || 0)}
                      isPreOrder={batch.isPreOrder}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
