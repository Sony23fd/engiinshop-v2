"use client"

import { useState, useEffect, useMemo } from "react"
import { updateProduct, syncBatchVariantStock } from "@/app/actions/product-actions"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2, Plus, Package, Trash2, Layers, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { normalizeOptions, generateVariantCombos, ProductOption } from "@/lib/variant-utils"
import { VariantImageUploader } from "@/components/admin/VariantImageUploader"

interface EditProductSheetProps {
  batch: any
  categories?: any[]
}

export function EditProductSheet({ batch, categories = [] }: EditProductSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(batch.categoryId || "")
  const router = useRouter()

  // Mode: "none" | "single" | "multi"
  const [variantMode, setVariantMode] = useState<"none" | "single" | "multi">("none")

  // Single option mode state
  const [singleOptionName, setSingleOptionName] = useState("Хэмжээ")
  const [singleItems, setSingleItems] = useState<{ value: string; stock: number; imageUrl?: string }[]>([])

  // Multi option mode state
  const [multiOptions, setMultiOptions] = useState<{ name: string; values: string }[]>([])
  const [multiVariantStock, setMultiVariantStock] = useState<Record<string, number>>({})
  const [multiOptionImages, setMultiOptionImages] = useState<Record<string, Record<string, string>>>({})
  const [bulkStockInput, setBulkStockInput] = useState<string>("")
  const [excludedCombos, setExcludedCombos] = useState<Record<string, boolean>>({})

  // Target and remaining quantity state for easy sync button
  const [targetQuantity, setTargetQuantity] = useState<number>(batch.targetQuantity || 0)
  const [remainingQuantity, setRemainingQuantity] = useState<number>(batch.remainingQuantity || 0)

  // Presets
  const OPTION_NAME_PRESETS = ["Хэмжээ", "Өнгө", "Төрөл", "Савлагаа", "Загвар"]

  // Initialize from batch data
  useEffect(() => {
    const rawOptions = batch.product?.options
    const norm = normalizeOptions(rawOptions)
    const rawVariantStock = batch.variantStock && typeof batch.variantStock === "object"
      ? (batch.variantStock as Record<string, number>)
      : null

    setTargetQuantity(batch.targetQuantity || 0)
    setRemainingQuantity(batch.remainingQuantity || 0)
    setSelectedCategoryId(batch.categoryId || "")

    if (norm.length === 1) {
      setVariantMode("single")
      setSingleOptionName(norm[0].name)
      setSingleItems(
        norm[0].values.map(val => ({
          value: val,
          stock: rawVariantStock ? (rawVariantStock[val] ?? 0) : 0,
          imageUrl: norm[0].images?.[val]
        }))
      )
      setMultiOptionImages({})
      setExcludedCombos({})
    } else if (norm.length > 1) {
      setVariantMode("multi")
      setMultiOptions(norm.map(o => ({ name: o.name, values: o.values.join(", ") })))
      setMultiVariantStock(rawVariantStock || {})
      const imagesMap: Record<string, Record<string, string>> = {}
      norm.forEach(o => {
        if (o.images && Object.keys(o.images).length > 0) {
          imagesMap[o.name] = { ...o.images }
        }
      })
      setMultiOptionImages(imagesMap)
      if (rawVariantStock && Object.keys(rawVariantStock).length > 0) {
        const excluded: Record<string, boolean> = {}
        const combos = generateVariantCombos(norm)
        combos.forEach(c => {
          if (rawVariantStock[c.key] === undefined) {
            excluded[c.key] = true
          }
        })
        setExcludedCombos(excluded)
      } else {
        setExcludedCombos({})
      }
    } else if (rawVariantStock && Object.keys(rawVariantStock).length > 0) {
      // Orphaned variantStock without formal options structure
      setVariantMode("single")
      setSingleOptionName("Сонголт")
      setSingleItems(
        Object.entries(rawVariantStock).map(([val, stock]) => ({
          value: val,
          stock: Number(stock) || 0
        }))
      )
      setMultiOptionImages({})
      setExcludedCombos({})
    } else {
      setVariantMode("none")
      setSingleOptionName("Хэмжээ")
      setSingleItems([{ value: "", stock: 0 }])
      setMultiOptions([{ name: "Өнгө", values: "" }, { name: "Хэмжээ", values: "" }])
      setMultiVariantStock({})
      setMultiOptionImages({})
      setExcludedCombos({})
    }
  }, [batch])

  // Single option helpers
  const addSingleItem = () => setSingleItems(prev => [...prev, { value: "", stock: 0 }])
  const removeSingleItem = (idx: number) => setSingleItems(prev => prev.filter((_, i) => i !== idx))
  const updateSingleItem = (idx: number, field: "value" | "stock" | "imageUrl", val: any) => {
    setSingleItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: field === "stock" ? Math.max(0, Number(val) || 0) : val }
      return next
    })
  }

  // Multi option helpers
  const addMultiOption = () => setMultiOptions(prev => [...prev, { name: "", values: "" }])
  const removeMultiOption = (idx: number) => setMultiOptions(prev => prev.filter((_, i) => i !== idx))
  const updateMultiOption = (idx: number, field: "name" | "values", val: string) => {
    setMultiOptions(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val }
      return next
    })
  }

  // Computed options
  const finalOptions = useMemo<ProductOption[]>(() => {
    if (variantMode === "none") return []
    if (variantMode === "single") {
      const validItems = singleItems.filter(i => i.value.trim())
      if (validItems.length === 0 || !singleOptionName.trim()) return []
      const images: Record<string, string> = {}
      for (const item of validItems) {
        if (item.imageUrl) {
          images[item.value.trim()] = item.imageUrl
        }
      }
      return [{
        name: singleOptionName.trim(),
        values: validItems.map(i => i.value.trim()),
        ...(Object.keys(images).length > 0 && { images })
      }]
    }
    return multiOptions
      .filter(o => o.name.trim() && o.values.trim())
      .map(o => {
        const name = o.name.trim()
        const values = o.values.split(",").map(v => v.trim()).filter(Boolean)
        const images = multiOptionImages[name]
        const cleanImages: Record<string, string> = {}
        if (images) {
          values.forEach(v => {
            if (images[v]) cleanImages[v] = images[v]
          })
        }
        return {
          name,
          values,
          ...(Object.keys(cleanImages).length > 0 && { images: cleanImages })
        }
      })
  }, [variantMode, singleOptionName, singleItems, multiOptions, multiOptionImages])

  const multiCombos = useMemo(() => {
    if (variantMode !== "multi") return []
    return generateVariantCombos(finalOptions)
  }, [variantMode, finalOptions])

  // Total stock from variants
  const totalVariantStock = useMemo(() => {
    if (variantMode === "none") return 0
    if (variantMode === "single") {
      return singleItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0)
    }
    return multiCombos.reduce((sum, c) => {
      if (excludedCombos[c.key]) return sum
      return sum + (multiVariantStock[c.key] || 0)
    }, 0)
  }, [variantMode, singleItems, multiCombos, multiVariantStock, excludedCombos])

  // Final variant stock map
  const finalVariantStockMap = useMemo<Record<string, number> | null>(() => {
    if (variantMode === "none") return null
    if (variantMode === "single") {
      const validItems = singleItems.filter(i => i.value.trim())
      if (validItems.length === 0) return null
      const map: Record<string, number> = {}
      for (const item of validItems) {
        map[item.value.trim()] = Math.max(0, Number(item.stock) || 0)
      }
      return map
    }
    if (multiCombos.length > 0) {
      const map: Record<string, number> = {}
      for (const c of multiCombos) {
        if (!excludedCombos[c.key]) {
          map[c.key] = Math.max(0, multiVariantStock[c.key] || 0)
        }
      }
      return map
    }
    return null
  }, [variantMode, singleItems, multiCombos, multiVariantStock, excludedCombos])

  async function handleQuickSync() {
    setSyncing(true)
    const res = await syncBatchVariantStock(batch.id)
    setSyncing(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Тэнцвэржүүлэхэд алдаа гарлаа")
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true)

    const hasVariants = variantMode !== "none" && finalOptions.length > 0 && finalVariantStockMap !== null
    const remainingQuantity = hasVariants
      ? totalVariantStock
      : Number(formData.get("remainingQuantity") || 0)

    const res = await updateProduct({
      productId: batch.product?.id,
      batchId: batch.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      targetQuantity: Number(formData.get("targetQuantity") || 0),
      remainingQuantity,
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
      sourceLink: formData.get("sourceLink") as string,
      categoryId: selectedCategoryId || undefined,
      options: hasVariants ? finalOptions : [],
      variantStock: hasVariants ? finalVariantStockMap : null
    })

    setLoading(false)
    if (res.success) {
      setOpen(false)
      router.refresh()
    } else {
      alert(res.error || "Алдаа гарлаа")
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer">
        <Pencil className="w-4 h-4" />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Бараа засах</SheetTitle>
          <SheetDescription>#{batch.batchNumber} - {batch.product?.name} мэдээллийг шинэчлэх.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="space-y-4 mt-6 pb-20">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
            <Input id="name" name="name" required defaultValue={batch.product?.name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">Ангилал (Категори)</label>
            <select
              id="categoryId"
              name="categoryId"
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Ангилал сонгох --</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.isArchived ? "(Архивлагдсан)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* OPTIONS / VARIANTS SECTION */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Барааны сонголтууд (Variant)</span>
              </div>
              {variantMode === "none" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVariantMode("single")
                    setSingleItems([{ value: "", stock: 0 }])
                  }}
                  className="h-7 px-2.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Plus className="w-3 h-3 mr-1" /> Сонголт нэмэх
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVariantMode("none")}
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Сонголтыг арилгах
                </Button>
              )}
            </div>

            {/* SINGLE OPTION MODE */}
            {variantMode === "single" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Сонголтын төрөл</label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {OPTION_NAME_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSingleOptionName(preset)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                          singleOptionName === preset
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Сонголтын нэр (Ж: Хэмжээ)"
                    value={singleOptionName}
                    onChange={e => setSingleOptionName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Сонголтын утгууд & Үлдэгдэл</span>
                    <span className="text-[11px] text-indigo-600 font-bold">Нийт: {totalVariantStock} ш</span>
                  </label>

                  <div className="space-y-2">
                    {singleItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                        <Input
                          placeholder={`Сонголт ${idx + 1}`}
                          value={item.value}
                          onChange={e => updateSingleItem(idx, "value", e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <VariantImageUploader
                          imageUrl={item.imageUrl}
                          onUploaded={url => updateSingleItem(idx, "imageUrl", url)}
                          onRemove={() => updateSingleItem(idx, "imageUrl", undefined)}
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Үлдэгдэл"
                            value={item.stock}
                            onChange={e => updateSingleItem(idx, "stock", e.target.value)}
                            className="w-20 h-8 text-xs text-center font-bold"
                          />
                          <span className="text-xs text-slate-400 font-medium">ш</span>
                        </div>
                        {singleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSingleItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSingleItem}
                      className="h-7 text-xs bg-white text-indigo-600 border-dashed border-indigo-300 hover:bg-indigo-50"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Утга нэмэх
                    </Button>

                    <button
                      type="button"
                      onClick={() => setVariantMode("multi")}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 underline underline-offset-2"
                    >
                      <Layers className="w-3 h-3" /> Хоёр ба түүнээс дээш сонголт нэмэх
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MULTI OPTION MODE */}
            {variantMode === "multi" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Олон давхар сонголтууд</span>
                  <button
                    type="button"
                    onClick={() => setVariantMode("single")}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Энгийн горим руу буцах
                  </button>
                </div>

                <div className="space-y-2">
                  {multiOptions.map((opt, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="space-y-1.5 flex-1">
                        <Input
                          placeholder="Төрөл (Ж: Өнгө)"
                          value={opt.name}
                          onChange={e => updateMultiOption(i, "name", e.target.value)}
                          className="h-8 text-xs font-semibold"
                        />
                        <Input
                          placeholder="Утгууд (Таслалаар тусгаарлах: Хар, Цагаан)"
                          value={opt.values}
                          onChange={e => updateMultiOption(i, "values", e.target.value)}
                          className="h-8 text-xs"
                        />
                        {opt.values.split(",").map(v => v.trim()).filter(Boolean).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 font-medium">Зураг:</span>
                            {opt.values.split(",").map(v => v.trim()).filter(Boolean).map(val => (
                              <div key={val} className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                <span className="font-medium text-slate-700">{val}</span>
                                <VariantImageUploader
                                  imageUrl={multiOptionImages[opt.name]?.[val]}
                                  onUploaded={url => {
                                    setMultiOptionImages(prev => ({
                                      ...prev,
                                      [opt.name]: { ...(prev[opt.name] || {}), [val]: url }
                                    }))
                                  }}
                                  onRemove={() => {
                                    setMultiOptionImages(prev => {
                                      const current = { ...(prev[opt.name] || {}) }
                                      delete current[val]
                                      return { ...prev, [opt.name]: current }
                                    })
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {multiOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMultiOption(i)}
                          className="text-slate-400 hover:text-red-500 p-1 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMultiOption}
                    className="h-7 text-xs bg-white text-indigo-600 border-dashed border-indigo-300 hover:bg-indigo-50"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Шинэ шинж чанар нэмэх
                  </Button>
                </div>

                {multiCombos.length > 0 && (
                  <div className="space-y-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Хослол тус бүрийн үлдэгдэл
                      </label>
                      <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        Нийт: {totalVariantStock} ш
                      </span>
                    </div>

                    {/* Bulk fill tool */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-md border border-indigo-100 text-xs">
                      <span className="text-[11px] font-medium text-slate-600">Бүх хослолд тоо оноох:</span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Тоо"
                          value={bulkStockInput}
                          onChange={e => setBulkStockInput(e.target.value)}
                          className="w-16 h-7 text-xs text-center font-bold"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const val = Math.max(0, Number(bulkStockInput) || 0)
                            const newStock: Record<string, number> = {}
                            multiCombos.forEach(c => {
                              if (!excludedCombos[c.key]) {
                                newStock[c.key] = val
                              }
                            })
                            setMultiVariantStock(prev => ({ ...prev, ...newStock }))
                          }}
                          className="h-7 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                        >
                          Оруулах
                        </Button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic">
                      💡 Байхгүй хослолыг <span className="text-red-500 font-bold">✕</span> дарж хасна уу.
                    </p>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {multiCombos.map(combo => {
                        const isExcluded = Boolean(excludedCombos[combo.key])
                        return (
                          <div
                            key={combo.key}
                            className={`flex items-center justify-between gap-2 p-2 rounded-md border text-xs transition-all ${
                              isExcluded
                                ? "bg-slate-100/80 border-dashed border-slate-300 opacity-60"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <button
                                type="button"
                                onClick={() => {
                                  setExcludedCombos(prev => ({ ...prev, [combo.key]: !prev[combo.key] }))
                                }}
                                title={isExcluded ? "Буцааж нэмэх" : "Байхгүй / Хасах"}
                                className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                  isExcluded
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-red-50 text-red-500 hover:bg-red-100"
                                }`}
                              >
                                {isExcluded ? "+" : "✕"}
                              </button>
                              <span className={`font-semibold truncate ${isExcluded ? "line-through text-slate-400" : "text-slate-700"}`}>
                                {combo.key}
                              </span>
                              {isExcluded && <span className="text-[10px] text-red-500 font-medium">(Байхгүй)</span>}
                            </div>

                            {!isExcluded && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] text-slate-400">Үлдэгдэл:</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={multiVariantStock[combo.key] ?? 0}
                                  onChange={e => setMultiVariantStock(prev => ({
                                    ...prev,
                                    [combo.key]: Math.max(0, Number(e.target.value) || 0)
                                  }))}
                                  className="w-16 h-7 text-xs text-center font-bold"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
            <Textarea id="description" name="description" defaultValue={batch.description || batch.product?.description} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
              <Input
                id="price"
                name="price"
                type="number"
                required
                defaultValue={(() => {
                  const bp = parseFloat(String(batch.price ?? 0))
                  const pp = parseFloat(String(batch.product?.price ?? 0))
                  return bp > 0 ? bp : pp
                })()}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                defaultValue={Number(batch.product?.weight || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="targetQuantity" className="text-sm font-medium">Зорилтот тоо</label>
                {variantMode !== "none" && (
                  <button
                    type="button"
                    onClick={() => setTargetQuantity(totalVariantStock)}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    title="Зорилтот тоог сонголтын нийлбэртэй тэнцүүлэх"
                  >
                    = {totalVariantStock} болгох
                  </button>
                )}
              </div>
              <Input
                id="targetQuantity"
                name="targetQuantity"
                type="number"
                required
                value={targetQuantity}
                onChange={e => setTargetQuantity(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="remainingQuantity" className="text-sm font-medium">
                  Үлдэгдэл {variantMode !== "none" && <span className="text-indigo-600 text-[10px] font-bold">(Автомат)</span>}
                </label>
                {variantMode === "none" && (
                  <button
                    type="button"
                    onClick={() => {
                      const ordered = batch._calculatedOrderedSum || 0
                      setRemainingQuantity(Math.max(0, targetQuantity - ordered))
                    }}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline"
                    title="Зорилтот тооноос одоогийн захиалгыг хасаж үлдэгдлийг автоматаар тэнцүүлнэ"
                  >
                    Тооцооллоор тэнцүүлэх
                  </button>
                )}
              </div>
              <Input
                id="remainingQuantity"
                name="remainingQuantity"
                type="number"
                required
                disabled={variantMode !== "none"}
                value={variantMode !== "none" ? totalVariantStock : remainingQuantity}
                onChange={e => setRemainingQuantity(Number(e.target.value) || 0)}
                className={variantMode !== "none" ? "bg-slate-100 text-slate-700 font-bold" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="sourceLink" className="text-sm font-medium">Эх сурвалжийн холбоос</label>
            <Input id="sourceLink" name="sourceLink" type="url" defaultValue={batch.product?.sourceLink || ""} />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] hover:bg-[#4338ca] mt-6 py-6 font-bold shadow-md">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            ӨӨРЧЛӨЛТИЙГ ХАДГАЛАХ
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
