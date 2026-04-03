"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { updateBatch } from "@/app/actions/batch-actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"

interface MoveBatchCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: any
  categories: any[]
}

export function MoveBatchCategoryDialog({ open, onOpenChange, batch, categories }: MoveBatchCategoryDialogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleMove() {
    if (!selectedCategoryId) return
    setLoading(true)
    const res = await updateBatch(batch.id, {
      categoryId: selectedCategoryId
    })
    setLoading(false)
    if (res.success) {
      toast({ title: "Амжилттай шилжлээ" })
      onOpenChange(false)
      // Redirect to the new category page to show the batch there
      router.push(`/admin/orders/category/${selectedCategoryId}`)
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  // Filter out the current category
  const otherCategories = categories.filter(c => c.id !== batch.categoryId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Багцыг шилжүүлэх</DialogTitle>
          <DialogDescription>
            "#{batch.batchNumber} - {batch.product?.name}" багцыг өөр категори руу шилжүүлэх.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Шилжүүлэх категори сонгох</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">-- Сонгох --</option>
              {otherCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 font-medium italic">* Шилжүүлсний дараа тухайн категорийн хуудас руу шилжинэ.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Цуцлах
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={loading || !selectedCategoryId}
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
