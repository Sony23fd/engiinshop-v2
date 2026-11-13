"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock, Eye, CheckCircle2 } from "lucide-react"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"

interface ShopProductCardProps {
  batch: any
  viewMode?: "grid" | "list"
  onQuickView?: (batch: any) => void
}

export function ShopProductCard({ batch, viewMode = "grid", onQuickView }: ShopProductCardProps) {
  const product = batch.product || {}
  const bp = parseFloat(String(batch.price ?? 0))
  const pp = parseFloat(String(product.price ?? 0))
  const displayPrice = bp > 0 ? bp : pp
  const isFreeCargo = Boolean(batch.isFreeCargo || product.isFreeCargo)
  const isPreOrder = Boolean(batch.isPreOrder)
  const deliveryFee = Number(batch.deliveryFee || 0)
  const hasVariants = Boolean(
    (batch.variantStock && typeof batch.variantStock === "object" && Object.keys(batch.variantStock).length > 0) ||
    (Array.isArray(product.options) && product.options.length > 0)
  )

  const isOutOfStock = !isPreOrder && batch.remainingQuantity <= 0

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/70 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center group">
        <Link
          href={`/product/${batch.id}`}
          className="relative w-full sm:w-44 h-44 shrink-0 rounded-xl overflow-hidden bg-slate-100 aspect-square sm:aspect-auto"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name || "Бараа"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="180px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Зураггүй
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isPreOrder ? (
              <span className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/60">
                <Clock className="w-3 h-3 text-amber-500" /> Урьдчилсан
              </span>
            ) : (
              <span className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/60">
                <Clock className="w-3 h-3 text-emerald-500" /> Бэлэн
              </span>
            )}
          </div>

          {isFreeCargo && (
            <div className="absolute top-2 right-2 bg-emerald-600/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-sm border border-emerald-400/40 z-10">
              ✈️ Карго 0₮
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {batch.category?.name && (
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                  {batch.category.name}
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  Дууссан
                </span>
              )}
            </div>

            <Link href={`/product/${batch.id}`}>
              <h3 className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>

            {product.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xl font-black text-slate-900 tracking-tight">
                ₮{displayPrice.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {deliveryFee > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    +₮{deliveryFee.toLocaleString()} хүргэлт
                  </span>
                )}
                {isFreeCargo && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Карго төлбөргүй
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onQuickView && (
                <button
                  type="button"
                  onClick={() => onQuickView(batch)}
                  className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Шуурхай харах"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Харах</span>
                </button>
              )}
              <AddToCartButton
                batchId={batch.id}
                name={product.name ?? ""}
                imageUrl={product.imageUrl}
                unitPrice={displayPrice}
                deliveryFee={deliveryFee}
                isPreOrder={isPreOrder}
                isFreeCargo={isFreeCargo}
                hasVariants={hasVariants}
                disabled={isOutOfStock}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid Mode (Default)
  return (
    <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/70 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square mb-3">
        <Link href={`/product/${batch.id}`} className="block w-full h-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name || "Бараа"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Зураггүй
            </div>
          )}
        </Link>

        {/* Top-Left Status Badge */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          {isPreOrder ? (
            <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/50">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Урьдчилсан</span>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/50">
              <Clock className="w-3 h-3 text-emerald-500" />
              <span>Бэлэн</span>
            </div>
          )}
        </div>

        {/* Top-Right Free Cargo Badge */}
        {isFreeCargo && (
          <div className="absolute top-2 right-2 bg-emerald-600/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-md border border-emerald-400/40 z-10 pointer-events-none">
            ✈️ Карго 0₮
          </div>
        )}

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(batch)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 z-10 hover:scale-105"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" /> Шуурхай харах
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          {batch.category?.name && (
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 truncate">
              {batch.category.name}
            </p>
          )}

          <Link href={`/product/${batch.id}`}>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug hover:text-indigo-600 hover:underline transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div>
              <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ₮{displayPrice.toLocaleString()}
              </p>
            </div>
            <AddToCartButton
              batchId={batch.id}
              name={product.name ?? ""}
              imageUrl={product.imageUrl}
              unitPrice={displayPrice}
              deliveryFee={deliveryFee}
              isPreOrder={isPreOrder}
              isFreeCargo={isFreeCargo}
              hasVariants={hasVariants}
              disabled={isOutOfStock}
              iconOnly
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            {deliveryFee > 0 ? (
              <span>+₮{deliveryFee.toLocaleString()} хүргэлт</span>
            ) : (
              <span>Хүргэлт тусдаа</span>
            )}
            {isFreeCargo && (
              <span className="text-emerald-600 font-bold">Карго 0₮</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

