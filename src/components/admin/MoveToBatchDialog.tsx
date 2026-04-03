"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCategories } from "@/app/actions/category-actions"
import { getBatchesByCategory } from "@/app/actions/batch-actions"
import { moveOrdersToBatch } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"

interface MoveToBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrderIds: string[]
  onSuccess?: () => void
}

export function MoveToBatchDialog({ open, onOpenChange, selectedOrderIds, onSuccess }: MoveToBatchDialogProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  async function fetchCategories() {
    setFetching(true)
    const res = await getCategories()
    if (res.success) {
      setCategories(res.categories || [])
    }
    setFetching(false)
  }

  async function handleCategoryChange(catId: string) {
    setSelectedCategoryId(catId)
    setSelectedBatchId("")
    if (!catId) {
      setBatches([])
      return
    }
    setFetching(true)
    const res = await getBatchesByCategory(catId)
    if (res.success) {
      setBatches(res.batches || [])
    }
    setFetching(false)
  }

  async function handleMove() {
    if (!selectedBatchId) return
    setLoading(true)
    const res = await moveOrdersToBatch(selectedOrderIds, selectedBatchId)
    setLoading(false)
    if (res.success) {
      toast({ title: "Амжилттай шилжлээ" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Захиалга шилжүүлэх</DialogTitle>
          <DialogDescription>
            Сонгогдсон {selectedOrderIds.length} ширхэг захиалгыг өөр категори эсвэл багц руу шилжүүлэх.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Категори сонгох</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={fetching}
            >
              <option value="">-- Сонгох --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">2. Багц (Batch) сонгох</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={fetching || !selectedCategoryId}
            >
              <option value="">-- Сонгох --</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  #{batch.batchNumber} - {batch.product?.name?.substring(0, 30)}
                </option>
              ))}
            </select>
            {batches.length === 0 && selectedCategoryId && !fetching && (
              <p className="text-xs text-rose-500">Энэ категорид идэвхтэй багц алга байна.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Цуцлах
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={loading || !selectedBatchId || fetching}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            Шилжүүлэх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
