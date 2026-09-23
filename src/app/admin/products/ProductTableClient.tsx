"use client"

import { useState } from "react"
import { EditProductSheet } from "./EditProductSheet"
import { BatchSaleToggle } from "./BatchSaleToggle"
import { ImageUploader } from "@/components/admin/ImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"
import { MergeProductsDialog } from "@/components/admin/MergeProductsDialog"
import { Package, Layers, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductTableClientProps {
  products: any[]
  categories: any[]
  search?: string
  success: boolean
}

export function ProductTableClient({
  products,
  categories,
  search,
  success
}: ProductTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map(p => p.id))
    }
  }

  const selectedBatches = products.filter(p => selectedIds.includes(p.id))

  return (
    <div className="space-y-3">
      {/* Floating Selection Action Bar */}
      {selectedIds.length >= 2 && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            <span>{selectedIds.length} бараа сонгогдсон байна</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-indigo-200 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Сонголт цэвэрлэх
            </button>
            <Button
              size="sm"
              onClick={() => setMergeDialogOpen(true)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs h-8 shadow"
            >
              🪄 Бараануудыг нэгтгэх
            </Button>
          </div>
        </div>
      )}

      {/* Merge Dialog */}
      <MergeProductsDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        selectedBatches={selectedBatches}
        categories={categories}
        onSuccess={() => setSelectedIds([])}
      />

      <div className="rounded-md border overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
            <tr>
              <th className="px-3 py-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={toggleSelectAll}
                  className="rounded text-indigo-600 cursor-pointer"
                  title="Бүгдийг сонгох"
                />
              </th>
              <th className="px-3 py-3">Бараа №</th>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3 text-center">Үйлдэл</th>
              <th className="px-4 py-3 text-center">Зураг</th>
              <th className="px-4 py-3">Зорилтот тоо</th>
              <th className="px-4 py-3">Үлдэгдэл</th>
              <th className="px-4 py-3">Үнэ</th>
              <th className="px-4 py-3">Жин</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3 text-right">Нүүрт гарах / Хүргэлтийн үнэ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {success && products && products.length > 0 ? (
              products.map((batch: any) => {
                const variantStock = batch.variantStock as Record<string, number> | null
                const variantCount = variantStock ? Object.keys(variantStock).length : 0
                const variantTotal = variantStock
                  ? Object.values(variantStock).reduce((s: number, v: number) => s + (Number(v) || 0), 0)
                  : 0
                const isChecked = selectedIds.includes(batch.id)

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isChecked ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(batch.id)}
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-700">#{batch.batchNumber}</td>
                    <td className="px-4 py-4 font-medium text-slate-900 max-w-[200px] truncate" title={batch.product?.name}>
                      {batch.product?.name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <EditProductSheet batch={batch} categories={categories} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <ImageUploader
                          productId={batch.product?.id}
                          currentImageUrl={batch.product?.imageUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                        <VideoUploader
                          productId={batch.product?.id}
                          currentVideoUrl={batch.product?.videoUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold">{batch.targetQuantity}</td>
                    <td className="px-4 py-4">
                      {(() => {
                        const hasVariants = variantCount > 0
                        const remaining = hasVariants
                          ? variantTotal
                          : batch.targetQuantity - (batch._calculatedOrderedSum || 0)

                        return (
                          <div className="space-y-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                remaining > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {remaining} / {batch.targetQuantity}
                            </span>
                            {/* Variant stock tooltip */}
                            {hasVariants && (
                              <div className="group relative">
                                <span className="text-[10px] text-indigo-600 font-bold cursor-help border-b border-dashed border-indigo-300">
                                  {variantCount} сонголт · Нийт {variantTotal}ш
                                </span>
                                <div className="absolute left-0 bottom-full mb-1 bg-slate-900 text-white text-[10px] rounded-lg p-2.5 hidden group-hover:block z-50 min-w-[160px] shadow-xl border border-slate-700">
                                  <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                                    <span>Сонголт</span>
                                    <span>Үлдэгдэл</span>
                                  </div>
                                  {Object.entries(variantStock!).map(([key, val]) => (
                                    <div key={key} className="flex justify-between gap-4 py-0.5">
                                      <span className="font-medium opacity-90 truncate max-w-[120px]">{key}</span>
                                      <span className={`font-bold ${val <= 0 ? "text-red-400" : "text-green-400"}`}>
                                        {val}ш
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      ₮
                      {(() => {
                        const bp = parseFloat(String(batch.price ?? 0))
                        const pp = parseFloat(String(batch.product?.price ?? 0))
                        return (bp > 0 ? bp : pp).toLocaleString()
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{Number(batch.product?.weight || 0)} кг</td>
                    <td className="px-4 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
                        {batch.status === "OPEN"
                          ? "Нээлттэй"
                          : batch.status === "CLOSED"
                            ? "Хаагдсан"
                            : batch.status === "SHIPPED"
                              ? "Илгээгдсэн"
                              : "Ирсэн"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <BatchSaleToggle
                        batchId={batch.id}
                        initialEnabled={batch.isAvailableForSale ?? false}
                        initialPreOrder={batch.isPreOrder ?? false}
                        initialFee={Number(batch.deliveryFee || 0)}
                        dynamicRemainingQty={
                          variantCount > 0
                            ? variantTotal
                            : batch.targetQuantity - (batch._calculatedOrderedSum || 0)
                        }
                        targetQty={batch.targetQuantity}
                        initialClosingDate={batch.closingDate ? new Date(batch.closingDate) : null}
                      />
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  {search ? `"${search}" хайлтад тохирох бараа олдсонгүй` : "Одоогоор бараа бүртгэгдээгүй байна"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
