import Link from "next/link"
import { Clock } from "lucide-react"

export function RelatedBatches({ batches, title }: { batches: any[], title: string }) {
  if (!batches || batches.length === 0) return null

  return (
    <div className="mt-16 mb-24 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold text-slate-900 mb-6 px-4">{title}</h3>
      
      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto gap-4 pb-6 px-4 snap-x snap-mandatory hide-scrollbar">
        {batches.map((batch: any) => (
          <div 
            key={batch.id} 
            className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start bg-white rounded-2xl p-3 flex flex-col group border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Link href={`/product/${batch.id}`} className="block relative bg-slate-100 rounded-xl overflow-hidden aspect-[4/5] mb-3">
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
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">Зураггүй</div>
              )}
              {/* Urgency Badge */}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/50">
                <Clock className="w-3 h-3 text-orange-500" />
                <span>Нээлттэй</span>
              </div>
            </Link>

            <div className="flex-1 flex flex-col">
              <Link href={`/product/${batch.id}`}>
                <h4 className="font-semibold text-slate-900 text-sm leading-snug hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                  {batch.product?.name}
                </h4>
              </Link>
              
              <div className="mt-auto">
                <p className="text-lg font-bold text-slate-900 leading-none">
                  ₮{(() => { const bp = parseFloat(String(batch.price ?? 0)); const pp = parseFloat(String(batch.product?.price ?? 0)); return (bp > 0 ? bp : pp).toLocaleString(); })()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
