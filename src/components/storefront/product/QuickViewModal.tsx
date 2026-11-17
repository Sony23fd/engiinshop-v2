"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Clock, CheckCircle2, Truck, ExternalLink } from "lucide-react"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"

interface QuickViewModalProps {
  batch: any | null
  onClose: () => void
}

export function QuickViewModal({ batch, onClose }: QuickViewModalProps) {
  if (!batch) return null

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          title="Хаах"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Side */}
        <div className="md:w-1/2 bg-slate-50 relative aspect-square md:aspect-auto">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name || "Бараа"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Зураггүй
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
            {isPreOrder ? (
              <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Урьдчилсан захиалга
              </span>
            ) : (
              <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Бэлэн байгаа
              </span>
            )}

            {isFreeCargo && (
              <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-md border border-emerald-400/40">
                ✈️ Карго 0₮
              </div>
            )}
          </div>
        </div>

        {/* Product Details Side */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            {batch.category?.name && (
              <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {batch.category.name}
              </span>
            )}

            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₮{displayPrice.toLocaleString()}
              </span>
              {deliveryFee > 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  +₮{deliveryFee.toLocaleString()} хүргэлт
                </span>
              )}
            </div>

            {isFreeCargo && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Энэ бараанд олон улсын каргоны төлбөр тооцогдохгүй (0₮).</span>
              </div>
            )}

            {product.description && (
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 pt-1">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <AddToCartButton
                  batchId={batch.id}
                  name={product.name ?? ""}
                  imageUrl={product.imageUrl}
                  unitPrice={displayPrice}
                  deliveryFee={deliveryFee}
                  isPreOrder={isPreOrder}
                  isFreeCargo={isFreeCargo}
                  hasVariants={hasVariants}
                />
              </div>
              <Link
                href={`/product/${batch.id}`}
                onClick={onClose}
                className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                title="Бүтэн дэлгэрэнгүйг үзэх"
              >
                <span>Дэлгэрэнгүй</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

