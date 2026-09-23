"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mergeProducts } from "@/app/actions/product-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Layers, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"

interface MergeProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBatches: any[]
  categories: any[]
  onSuccess?: () => void
}

interface VariantDraft {
  batchId: string
  batchNumber: number
  originalName: string
  value: string
  stock: number
  imageUrl?: string
}

export function MergeProductsDialog({
  open,
  onOpenChange,
  selectedBatches,
  categories,
  onSuccess
}: MergeProductsDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [primaryBatchId, setPrimaryBatchId] = useState<string>("")
  const [newProductName, setNewProductName] = useState<string>("")
  const [optionName, setOptionName] = useState<string>("Хэмжээ")
  const [archiveCategoryId, setArchiveCategoryId] = useState<string>("")
  const [disableSecondarySales, setDisableSecondarySales] = useState<boolean>(true)
  const [variants, setVariants] = useState<VariantDraft[]>([])

  // Extract a guessed clean value from name (e.g. "Calvin Klein M" -> "M", "NIKE 220/35" -> "220/35")
  function extractOptionValue(name: string): string {
    const sizeMatch = name.match(/\b(XS|S|M|L|XL|2XL|3XL|XXL|XXXL|[0-9]{2,3}(?:\/[0-9.]+)?)\b/i)
    if (sizeMatch) return sizeMatch[1]

    const slashMatch = name.match(/([0-9]+(?:\/[0-9.]+)?)/)
    if (slashMatch) return slashMatch[1]

    return name.split(" ").pop() || ""
  }

  // Extract cleaned product name without size suffix
  function cleanCommonName(name: string): string {
    return name
      .replace(/\s+(XS|S|M|L|XL|2XL|3XL|XXL|XXXL|[0-9]{2,3}(?:\/[0-9.]+)?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  useEffect(() => {
    if (!open || selectedBatches.length === 0) return

    // Pick first batch as default primary
    const primary = selectedBatches[0]
    setPrimaryBatchId(primary.id)

    // Suggest cleaned name from first batch
    const baseName = cleanCommonName(primary.product?.name || "")
    setNewProductName(baseName || primary.product?.name || "")

    // Pre-select archive category if one exists with "Архив" or "Нэгтгэсэн" in name
    const archiveCat = categories.find((c: any) =>
      c.name.includes("Архив") || c.name.includes("Нэгтгэсэн") || c.isArchived
    )
    if (archiveCat) {
      setArchiveCategoryId(archiveCat.id)
    } else {
      setArchiveCategoryId("__NEW_ARCHIVE__")
    }

    // Build initial variants from selected batches
    const drafts: VariantDraft[] = selectedBatches.map(b => {
      const rawName = b.product?.name || ""
      const guessedVal = extractOptionValue(rawName)
      const stock = Number(b.remainingQuantity || 0)

      return {
        batchId: b.id,
        batchNumber: b.batchNumber,
        originalName: rawName,
        value: guessedVal || `#${b.batchNumber}`,
        stock: Math.max(0, stock),
        imageUrl: b.product?.imageUrl
      }
    })

    setVariants(drafts)
  }, [open, selectedBatches, categories])

  const updateVariantValue = (idx: number, field: "value" | "stock", val: any) => {
    setVariants(prev => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        [field]: field === "stock" ? Math.max(0, Number(val) || 0) : val
      }
      return next
    })
  }

  async function handleConfirmMerge() {
    if (!primaryBatchId) {
      alert("Үндсэн багцыг сонгоно уу")
      return
    }
    if (!newProductName.trim()) {
      alert("Шинэ нэгдсэн нэр оруулна уу")
      return
    }
    if (!optionName.trim()) {
      alert("Сонголтын төрлийг оруулна уу (Ж нь: Хэмжээ)")
      return
    }

    const secondaryBatchIds = selectedBatches
      .map(b => b.id)
      .filter(id => id !== primaryBatchId)

    setLoading(true)
    const res = await mergeProducts({
      primaryBatchId,
      secondaryBatchIds,
      newProductName: newProductName.trim(),
      optionName: optionName.trim(),
      variants: variants.map(v => ({
        value: v.value.trim(),
        stock: v.stock,
        imageUrl: v.imageUrl
      })),
      archiveCategoryId: archiveCategoryId || undefined,
      disableSecondarySales
    })

    setLoading(false)
    if (res.success) {
      toast({
        title: "Амжилттай нэгтгэгдлээ",
        description: `${selectedBatches.length} бараа амжилттай 1 сонголттой бараа болон нэгтгэгдлээ.`
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа гарлаа",
        description: res.error || "Бараа нэгтгэхэд алдаа гарлаа"
      })
    }
  }

  const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Layers className="w-5 h-5 text-indigo-600" /> Сонгосон {selectedBatches.length} барааг нэгтгэх
          </DialogTitle>
          <DialogDescription className="text-xs">
            Эдгээр тусдаа бараануудыг нэгтгэж, нэг бараан дотор сонголт (Variant) болгоно. Өмнөх захиалгуудын түүх өөрсдийн багц дээрээ бүрэн хадгалагдана.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* 1. Primary product name */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800">
              Нэгдсэн шинэ барааны нэр
            </label>
            <Input
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              placeholder="Жишээ нь: Calvin Klein Cotton Stretch эрэгтэй дотуур өмд"
              className="bg-white text-sm"
            />
            <p className="text-[11px] text-slate-500">
              Дэлгүүрийн нүүрэн талд энэ нэрээр ганц цэвэрхэн бараа харагдах болно.
            </p>
          </div>

          {/* 2. Choose primary active batch */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Үндсэн (Active) багц болгохыг сонгох
            </label>
            <select
              value={primaryBatchId}
              onChange={e => setPrimaryBatchId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {selectedBatches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  #{b.batchNumber} - {b.product?.name} (Үлдэгдэл: {b.remainingQuantity}ш)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Сонгосон энэ багц нүүр хуудсанд идэвхтэй зарагдах бөгөөд бусад багцууд автоматаар хаагдана.
            </p>
          </div>

          {/* 3. Option name and variants table */}
          <div className="space-y-2.5 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Сонголтын төрөл:</span>
                <Input
                  value={optionName}
                  onChange={e => setOptionName(e.target.value)}
                  placeholder="Хэмжээ / Өнгө"
                  className="h-7 w-28 text-xs font-semibold bg-white"
                />
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded border border-indigo-200">
                Нийт үлдэгдэл: {totalVariantStock} ш
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {variants.map((v, idx) => (
                <div key={v.batchId} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 w-8">
                    #{v.batchNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-500 truncate mb-1" title={v.originalName}>
                      {v.originalName}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={v.value}
                        onChange={e => updateVariantValue(idx, "value", e.target.value)}
                        placeholder="Сонголтын нэр (M, L)"
                        className="h-7 text-xs flex-1"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={e => updateVariantValue(idx, "stock", e.target.value)}
                          className="w-16 h-7 text-xs text-center font-bold"
                        />
                        <span className="text-slate-400">ш</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Secondary Batches Handling (Archive & Deactivation) */}
          <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Хуучин багцуудыг хамгаалах тохиргоо
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                checked={disableSecondarySales}
                onChange={e => setDisableSecondarySales(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span>Бусад {selectedBatches.length - 1} хуучин багцын "Борлуулах"-ыг унтрааж дэлгүүрээс нуух</span>
            </label>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Хуучин багцуудыг шилжүүлэх ангилал (Сонголтоор):
              </label>
              <select
                value={archiveCategoryId}
                onChange={e => setArchiveCategoryId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-white px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="__NEW_ARCHIVE__">✨ Шинэ: "📦 Нэгтгэсэн хуучин багцууд (Архив)" үүсгэж тийш зөөх</option>
                <option value="">-- Одоо байгаа ангилалд нь үлдээх --</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isArchived ? "(Архивлагдсан)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Зөвлөмж: "📦 Нэгтгэсэн хуучин багцууд (Архив)" ангилал руу зөөвөл хуучин захиалгууд нь тэндээ цэвэрхэн эмх цэгцтэй үлдэнэ.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Болих
          </Button>
          <Button
            type="button"
            onClick={handleConfirmMerge}
            disabled={loading || !primaryBatchId || !newProductName.trim()}
            className="bg-[#4e3dc7] hover:bg-[#4332b8] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Нэгтгэж байна...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Бараануудыг нэгтгэх
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
