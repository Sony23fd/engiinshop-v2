"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/context/CartContext"
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Sparkles, Plane, Package } from "lucide-react"

export function MiniCartDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const { items, removeItem, updateQty, totalCount, totalPrice } = useCart()

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)

    window.addEventListener("open-cart-drawer", handleOpen)
    window.addEventListener("close-cart-drawer", handleClose)

    return () => {
      window.removeEventListener("open-cart-drawer", handleOpen)
      window.removeEventListener("close-cart-drawer", handleClose)
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Таны сагс</h3>
              <p className="text-[11px] text-slate-500 font-medium">Нийт {totalCount} бараа</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Хаах"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Сагс хоосон байна</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              Та сонирхсон бараагаа дэлгүүрийн каталогоос үзэж сагсандаа нэмнэ үү.
            </p>
            <Link
              href="/shop"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-600/20 transition-all"
            >
              Дэлгүүр рүү очих
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-slate-100 space-y-4">
            {items.map((item) => {
              const itemKey = item.itemKey || item.batchId
              const itemTotal = item.unitPrice * item.qty
              const hasOptions = item.selectedOptions && Object.keys(item.selectedOptions).length > 0

              return (
                <div key={itemKey} className="pt-4 first:pt-0 flex gap-3.5 group">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                        {item.name}
                      </h5>
                      <button
                        onClick={() => removeItem(itemKey)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-1"
                        title="Устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Badges / options */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {item.isFreeCargo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✨ Каргогүй
                        </span>
                      )}
                      {item.isPreOrder && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Онгоцоор
                        </span>
                      )}
                      {hasOptions && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {Object.entries(item.selectedOptions || {})
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Price and Quantity Controls */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQty(itemKey, item.qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                          aria-label="Хасах"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(itemKey, item.qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                          aria-label="Нэмэх"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-indigo-700">
                          ₮{itemTotal.toLocaleString()}
                        </div>
                        {item.qty > 1 && (
                          <div className="text-[10px] text-slate-400">
                            ₮{item.unitPrice.toLocaleString()} / ш
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Нийт дүн:</span>
              <span className="text-lg font-black text-slate-900 tracking-tight">
                ₮{totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center transition-colors"
              >
                Дэлгүүр рүү
              </Link>
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center shadow-md hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Захиалах</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

