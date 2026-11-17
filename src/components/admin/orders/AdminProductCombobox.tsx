"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Image from "next/image"
import { Search, Package, Check, X, Loader2, Sparkles, PlusCircle } from "lucide-react"
import { searchBatchesForAdmin, AdminBatchSearchResult } from "@/app/actions/admin-manual-order-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AdminProductComboboxProps {
  selectedBatch: AdminBatchSearchResult | null
  onSelectBatch: (batch: AdminBatchSearchResult | null) => void
  isCustom: boolean
  onToggleCustom: (isCustom: boolean) => void
  disabled?: boolean
}

export function AdminProductCombobox({
  selectedBatch,
  onSelectBatch,
  isCustom,
  onToggleCustom,
  disabled = false
}: AdminProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [batches, setBatches] = useState<AdminBatchSearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch batches when dropdown opens or query changes
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchBatchesForAdmin(searchQuery)
        if (res.success) {
          setBatches(res.batches)
          setHasSearched(true)
        }
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isCustom) {
    return (
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">Каталогт байхгүй захиалгат бараа (Линк / Тусгай)</p>
            <p className="text-[11px] text-amber-700">Барааны нэр, үнийг доорх талбарт шууд оруулна уу</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleCustom(false)}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          Каталогоос сонгох
        </Button>
      </div>
    )
  }

  if (selectedBatch) {
    return (
      <div className="p-2.5 bg-slate-50 border border-indigo-200 rounded-lg flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white border shrink-0">
            {selectedBatch.product.imageUrl ? (
              <Image
                src={selectedBatch.product.imageUrl}
                alt={selectedBatch.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                #{selectedBatch.batchNumber}
              </span>
              <span className="text-xs font-bold text-slate-900 truncate">
                {selectedBatch.product.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span className="font-bold text-indigo-700">₮{selectedBatch.price.toLocaleString()}</span>
              <span>•</span>
              <span className="truncate">{selectedBatch.category.name}</span>
              {selectedBatch.isFreeCargo && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✈️ Карго 0₮
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelectBatch(null)}
          disabled={disabled}
          className="h-8 px-2 text-slate-400 hover:text-red-600 shrink-0"
          title="Өөр бараа сонгох"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Барааны нэр, багцын дугаар, сараар хайх..."
          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-xs"
        />
        {isPending ? (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
        ) : searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto overflow-x-hidden">
          {/* Custom Link Item shortcut */}
          <div className="p-2 border-b bg-amber-50/50">
            <button
              type="button"
              onClick={() => {
                onToggleCustom(true)
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100/70 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-600" />
                Каталогт байхгүй захиалгат бараа (Линкээр захиалах)
              </span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                Шинэ
              </span>
            </button>
          </div>

          {/* Results list */}
          {batches.length > 0 ? (
            <div className="p-1 space-y-0.5">
              {batches.map((batch) => {
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => {
                      onSelectBatch(batch)
                      setIsOpen(false)
                    }}
                    className="w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-slate-50 text-slate-800"
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-100 border shrink-0">
                      {batch.product.imageUrl ? (
                        <Image
                          src={batch.product.imageUrl}
                          alt={batch.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          #{batch.batchNumber}
                        </span>
                        <p className="text-xs font-bold truncate">{batch.product.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-indigo-600">₮{batch.price.toLocaleString()}</span>
                        <span>•</span>
                        <span className="truncate">{batch.category.name}</span>
                        {batch.isFreeCargo && (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1 rounded">
                            Карго 0₮
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {batch.product.options && Array.isArray(batch.product.options) && batch.product.options.length > 0 ? (
                        <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                          Сонголттой
                        </span>
                      ) : batch.remainingQuantity > 0 ? (
                        <span className="text-[10px] text-slate-500">
                          Үлдэгдэл: <b className="text-slate-800">{batch.remainingQuantity}ш</b>
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : hasSearched && !isPending ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Бараа олдсонгүй. Дээрх товчоор каталогт байхгүй бараа үүсгэх боломжтой.
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Бараа хайх утгаа бичнэ үү...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
