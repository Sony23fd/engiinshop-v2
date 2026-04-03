"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Edit2, Trash2, MoveRight } from "lucide-react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateBatch, deleteBatch } from "@/app/actions/batch-actions"
import { MoveBatchCategoryDialog } from "@/components/admin/MoveBatchCategoryDialog"

export function BatchRowActions({ batch, categoryId, role, allCategories }: { batch: any, categoryId: string, role?: string, allCategories: any[] }) {
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleUpdate(formData: FormData) {
    setIsUpdating(true)
    const result = await updateBatch(batch.id, {
      categoryId: categoryId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      cargoFeeStatus: formData.get("cargoFeeStatus") as string,
      targetQuantity: Number(formData.get("targetQuantity") || 0),
      remainingQuantity: Number(formData.get("remainingQuantity") || 0),
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
    })
    setIsUpdating(false)

    if (result.success) {
      toast({
        title: "Амжилттай",
        description: "Захиалгын мэдээлэл шинэчлэгдлээ.",
      })
      setIsEditOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа гарлаа",
        description: result.error || "Хадгалах үед алдаа гарлаа.",
      })
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteBatch(batch.id)
    setIsDeleting(false)

    if (result.success) {
      toast({
        title: "Амжилттай",
        description: "Захиалга устгагдлаа.",
      })
      setIsDeleteOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа гарлаа",
        description: result.error || "Устгах үед алдаа гарлаа. Захиалга бүртгэгдсэн байж магадгүй.",
      })
    }
  }

  return (
    <div className="flex items-center space-x-1">
      <Link href={`/admin/orders/batch/${batch.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-8 w-8 text-[#4F46E5] hover:bg-slate-100" title="Захиалгууд харах">
        <Eye className="w-4 h-4" />
      </Link>

      <button onClick={() => setIsMoveOpen(true)} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-8 w-8 text-indigo-500" title="Категори шилжүүлэх">
        <MoveRight className="w-4 h-4" />
      </button>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-8 w-8 text-amber-500" title="Засах">
          <Edit2 className="w-4 h-4" />
        </SheetTrigger>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Захиалга засах (#{batch.batchNumber})</SheetTitle>
          </SheetHeader>
          <form action={handleUpdate} className="space-y-4 mt-6 text-left">
            <input type="hidden" name="categoryId" value={categoryId} />

            <div className="space-y-2">
              <label htmlFor={`edit-name-${batch.id}`} className="text-sm font-medium block">Барааны нэр</label>
              <Input id={`edit-name-${batch.id}`} name="name" required defaultValue={batch.product?.name} />
            </div>
            
            <div className="space-y-2">
              <label htmlFor={`edit-desc-${batch.id}`} className="text-sm font-medium block">Тайлбар</label>
              <Input id={`edit-desc-${batch.id}`} name="description" defaultValue={batch.description || ""} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={`edit-tq-${batch.id}`} className="text-sm font-medium block">Зорилтот тоо</label>
                <Input id={`edit-tq-${batch.id}`} name="targetQuantity" type="number" required defaultValue={batch.targetQuantity} disabled={role === "CARGO_ADMIN"} />
              </div>
              <div className="space-y-2">
                <label htmlFor={`edit-rq-${batch.id}`} className="text-sm font-medium block">Үлдэгдэл</label>
                <Input id={`edit-rq-${batch.id}`} name="remainingQuantity" type="number" required defaultValue={batch.remainingQuantity} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={`edit-cfs-${batch.id}`} className="text-sm font-medium block">Карго үнэ төлөх эсэх</label>
              <Input id={`edit-cfs-${batch.id}`} name="cargoFeeStatus" defaultValue={batch.cargoFeeStatus || ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={`edit-price-${batch.id}`} className="text-sm font-medium block">Барааны үнэ (₮)</label>
                <Input id={`edit-price-${batch.id}`} name="price" type="number" required defaultValue={Number(batch.price || 0)} />
              </div>
              <div className="space-y-2">
                <label htmlFor={`edit-weight-${batch.id}`} className="text-sm font-medium block">Жин (кг)</label>
                <Input id={`edit-weight-${batch.id}`} name="weight" type="number" step="0.01" defaultValue={Number(batch.product?.weight || 0)} />
              </div>
            </div>

            <Button type="submit" disabled={isUpdating} className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">
              {isUpdating ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-8 w-8 text-red-500" title="Устгах">
          <Trash2 className="w-4 h-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Захиалга устгах уу?</DialogTitle>
            <DialogDescription>
              Та "#{batch.batchNumber} - {batch.product?.name}" захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй бөгөөд хэрэв тус багцад хэрэглэгчийн захиалга орсон байвал устгах боломжгүйг анхаарна уу.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Устгаж байна..." : "Тийм, устгах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MoveBatchCategoryDialog 
        open={isMoveOpen} 
        onOpenChange={setIsMoveOpen} 
        batch={batch} 
        categories={allCategories} 
      />
    </div>
  )
}
