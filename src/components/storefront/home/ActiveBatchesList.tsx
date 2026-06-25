"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { Clock, TrendingUp, ChevronDown } from "lucide-react"
import { PreOrderCountdown } from "@/components/storefront/home/PreOrderCountdown"

export function ActiveBatchesList({ 
  batches,
  title = "Яг одоо захиалах",
  subtitle = "Хамгийн эрэлттэй, захиалга нь нээлттэй байгаа бараанууд",
  badge = "Тренд бараанууд",
  theme = "ready"
}: { 
  batches: any[],
  title?: string,
  subtitle?: string,
  badge?: string,
  theme?: "ready" | "preorder" | string
}) {
  const [visibleCount, setVisibleCount] = useState(8)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const saved = sessionStorage.getItem(`visibleCount-${theme}`)
    if (saved) {
      setVisibleCount(parseInt(saved, 10))
    }
  }, [theme])

  useEffect(() => {
    if (isClient) {
      sessionStorage.setItem(`visibleCount-${theme}`, visibleCount.toString())
    }
  }, [visibleCount, theme, isClient])

  if (!batches || batches.length === 0) return null;

  const displayedBatches = batches.slice(0, visibleCount);

  return (
    <div id="batches" className="pt-12 pb-16 border-b border-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            {badge && (
              <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border ${theme === "preorder" ? "bg-amber-100/50 border-amber-200/50 text-amber-600" : "bg-indigo-100/50 border-indigo-200/50 text-[#4e3dc7]"}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{badge}</span>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
            {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {displayedBatches.map((batch: any, index: number) => {
            const progress = batch.targetQuantity > 0 
              ? Math.min(100, Math.max(0, ((batch.targetQuantity - batch.remainingQuantity) / batch.targetQuantity) * 100))
              : 0;
            
            // If it's a pre-order, you might want to hide the quantity text or just show a different message
            const showQty = !batch.isPreOrder || batch.remainingQuantity > 0;

            return (
              <div key={batch.id} className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 flex flex-col group border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Link href={`/product/${batch.id}`} className="block relative bg-slate-100 rounded-lg sm:rounded-xl overflow-hidden aspect-square mb-3">
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
                    <Image
                      src={batch.product.imageUrl}
                      alt={batch.product.name || "Бараа"}
                      fill
                      priority={theme === "ready" && index < 4}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Зураггүй</div>
                  )}
                  {/* Urgency Badge */}
                  {batch.isPreOrder ? (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="hidden sm:inline">Урьдчилсан захиалга</span>
                      <span className="sm:hidden">Урьдчилсан</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm border border-slate-200/50">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Нээлттэй</span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 flex flex-col gap-3">
                  <Link href={`/product/${batch.id}`}>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 leading-snug hover:text-[#4e3dc7] hover:underline transition-colors line-clamp-2">
                      {batch.product?.name}
                    </h3>
                  </Link>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                          ₮{(() => { const bp = parseFloat(String(batch.price ?? 0)); const pp = parseFloat(String(batch.product?.price ?? 0)); return (bp > 0 ? bp : pp).toLocaleString(); })()}
                        </p>
                        {Number(batch.deliveryFee) > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">+₮{Number(batch.deliveryFee).toLocaleString()} хүргэлт</p>
                        )}
                      </div>
                      <AddToCartButton
                        batchId={batch.id}
                        name={batch.product?.name ?? ""}
                        imageUrl={batch.product?.imageUrl}
                        unitPrice={(() => { const bp = parseFloat(String(batch.price ?? 0)); const pp = parseFloat(String(batch.product?.price ?? 0)); return bp > 0 ? bp : pp; })()}
                        deliveryFee={Number(batch.deliveryFee || 0)}
                        isPreOrder={batch.isPreOrder}
                        iconOnly
                      />
                    </div>

                    <div className="space-y-1.5 mt-auto">
                      {batch.isPreOrder ? (
                        <div className="space-y-2">
                           {batch.closingDate ? (
                             <PreOrderCountdown closingDate={batch.closingDate} />
                           ) : (
                             <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
                               🎉 Захиалга нээлттэй хадгалагдсан
                             </div>
                           )}
                           <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                             Захиалга хаагдсанаас хойш<br/>7-14 хоногт ирнэ
                           </p>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {batches.length > visibleCount && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 8)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#4e3dc7] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
              Цааш үзэх (Үлдсэн {batches.length - visibleCount})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
