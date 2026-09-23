"use client"

import { useState, useMemo } from "react"
import { ProductGallery } from "./ProductGallery"
import { ProductOrderForm } from "@/app/(storefront)/product/[id]/ProductOrderForm"
import { Truck, ShoppingBag, CheckCircle2 } from "lucide-react"
import {
  normalizeOptions,
  generateVariantCombos,
  isOptionAvailableForSelection,
  getVariantImageUrl,
  getSelectionStock
} from "@/lib/variant-utils"

interface ProductDetailClientProps {
  batch: any
  unitPrice: number
  deliveryFee: number
  shopSettings: any
}

export function ProductDetailClient({
  batch,
  unitPrice,
  deliveryFee,
  shopSettings
}: ProductDetailClientProps) {
  // Normalize options safely
  const normalizedOptions = useMemo(() => normalizeOptions(batch.product?.options), [batch.product?.options])

  // Initialize selected options with first in-stock combination
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultOpts: Record<string, string> = {}
    if (normalizedOptions.length === 0) return defaultOpts

    if (batch.variantStock && typeof batch.variantStock === "object") {
      const combos = generateVariantCombos(normalizedOptions)
      const availableCombo = combos.find(c => (batch.variantStock[c.key] ?? 0) > 0)
      if (availableCombo) {
        return { ...availableCombo.labels }
      }
    }

    normalizedOptions.forEach(opt => {
      if (opt.values.length > 0) {
        defaultOpts[opt.name] = opt.values[0]
      }
    })
    return defaultOpts
  })

  // Smart option selection handler
  const handleSelectOption = (optName: string, optValue: string) => {
    const next = { ...selectedOptions, [optName]: optValue }

    // If multi options, verify whether other previously selected options are available with this new selection
    if (normalizedOptions.length > 1 && batch.variantStock) {
      for (const otherOpt of normalizedOptions) {
        if (otherOpt.name === optName) continue
        const currentVal = next[otherOpt.name]
        const available = isOptionAvailableForSelection(
          normalizedOptions,
          batch.variantStock,
          next,
          otherOpt.name,
          currentVal
        )
        if (!available) {
          const firstAvail = otherOpt.values.find(v =>
            isOptionAvailableForSelection(normalizedOptions, batch.variantStock, next, otherOpt.name, v)
          )
          if (firstAvail) {
            next[otherOpt.name] = firstAvail
          }
        }
      }
    }

    setSelectedOptions(next)
  }

  // Active variant image based on selection
  const activeVariantImageUrl = useMemo(() => {
    return getVariantImageUrl(normalizedOptions, selectedOptions, batch.product?.imageUrl)
  }, [normalizedOptions, selectedOptions, batch.product?.imageUrl])

  // Selection stock
  const currentStock = useMemo(() => {
    return getSelectionStock(normalizedOptions, batch.variantStock, selectedOptions, batch.remainingQuantity)
  }, [normalizedOptions, batch.variantStock, selectedOptions, batch.remainingQuantity])

  const hasVariants = normalizedOptions.length > 0 && batch.variantStock

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row">
      {/* Product Info Side (Left Column) */}
      <div className="md:w-1/2 p-6 sm:p-8 bg-slate-50/70 border-r flex flex-col">
        {/* Gallery with variant image switching and thumbnail row */}
        <ProductGallery
          defaultImageUrl={batch.product?.imageUrl}
          activeImageUrl={activeVariantImageUrl}
          productName={batch.product?.name || "Бараа"}
          videoUrl={batch.product?.videoUrl}
          isPreOrder={batch.isPreOrder}
          options={normalizedOptions}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
        />

        <h1 className="text-2xl font-bold text-slate-900 mb-2 mt-5">{batch.product?.name}</h1>
        <p className="text-slate-600 mb-6 flex-1 text-sm leading-relaxed whitespace-pre-line">
          {batch.description || batch.product?.description || "Тайлбар оруулаагүй байна."}
        </p>

        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Нэгж үнэ:</span>
            <span className="font-bold text-xl text-slate-900">₮{unitPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Үлдэгдэл:</span>
            <span
              className={`font-bold text-sm ${
                batch.isPreOrder || currentStock > 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {batch.isPreOrder
                ? "Хязгааргүй (Урьдчилсан)"
                : currentStock > 0
                  ? hasVariants
                    ? `${currentStock} ш бэлэн (${Object.values(selectedOptions).join(" / ")})`
                    : `${currentStock} ширхэг`
                  : hasVariants
                    ? "Сонгосон хувилбар дууссан"
                    : "Дууссан"}
            </span>
          </div>

          {deliveryFee > 0 && (
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-slate-500 text-sm flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-400" /> Хүргэлтийн үнэ:
              </span>
              <span className="font-semibold text-slate-800 text-sm">
                {batch.isPreOrder
                  ? `₮${deliveryFee.toLocaleString()} (ирсний дараа)`
                  : `₮${deliveryFee.toLocaleString()}`}
              </span>
            </div>
          )}

          {/* Delivery Estimate */}
          <div className="flex items-center gap-2.5 mt-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100/70">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Хүргэгдэх хугацаа</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {Number(batch.cargoFeeStatus) > 0
                  ? "Ойролцоогоор 7-14 хоног (Солонгосоос)"
                  : (() => {
                      const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]
                      const scheduleDays = (shopSettings.delivery_schedule_days || "3,6")
                        .split(",")
                        .map(Number)
                      const dayNames = scheduleDays.map((d: number) => DAY_NAMES[d]).filter(Boolean).join(", ")
                      return dayNames ? `🚚 Хүргэлт ${dayNames} гарагт гарна` : "Бэлэн байгаа"
                    })()}
              </p>
              {Number(batch.cargoFeeStatus) <= 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">Товлосон өдрөөс 24-72 цагийн дотор хүргэгдэнэ</p>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> 100% Баталгаат
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Найдвартай
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Form Side (Right Column) */}
      <div id="order-form" className="md:w-1/2 p-6 sm:p-8 scroll-mt-6 hover:scroll-mt-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-500" /> Захиалга өгөх
        </h2>
        <ProductOrderForm
          batchId={batch.id}
          productName={batch.product?.name}
          productImage={batch.product?.imageUrl}
          activeVariantImageUrl={activeVariantImageUrl}
          unitPrice={unitPrice}
          deliveryFee={deliveryFee}
          remainingQuantity={batch.remainingQuantity}
          termsOfService={shopSettings.terms_of_service}
          deliveryTerms={shopSettings.delivery_terms}
          isPreOrder={batch.isPreOrder}
          options={batch.product?.options}
          variantStock={batch.variantStock}
          deliveryScheduleDays={shopSettings.delivery_schedule_days || "3,6"}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
        />
      </div>
    </div>
  )
}
