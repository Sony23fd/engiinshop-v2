"use client"

import { useState } from "react"
import { createProduct } from "@/app/actions/product-actions"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateProductSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const res = await createProduct({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      targetQuantity: Number(formData.get("targetQuantity") || 0),
      remainingQuantity: Number(formData.get("remainingQuantity") || 0),
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
      sourceLink: formData.get("sourceLink") as string,
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
      <SheetTrigger className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca]">
        <Plus className="w-4 h-4 mr-2" />
        Бараа нэмэх
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Шинэ бараа нэмэх</SheetTitle>
          <SheetDescription>Дэлгүүрт худалдаалах шинэ барааны мэдээллийг оруулна уу.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
            <Input id="name" name="name" required placeholder="Нэр..." />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
            <Textarea id="description" name="description" placeholder="Барааны дэлгэрэнгүй..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
              <Input id="price" name="price" type="number" required placeholder="0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
              <Input id="weight" name="weight" type="number" step="0.01" placeholder="0.0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="targetQuantity" className="text-sm font-medium">Зорилтот тоо</label>
              <Input id="targetQuantity" name="targetQuantity" type="number" required placeholder="0" />
            </div>
            <div className="space-y-2">
              <label htmlFor="remainingQuantity" className="text-sm font-medium">Үлдэгдэл</label>
              <Input id="remainingQuantity" name="remainingQuantity" type="number" required placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="sourceLink" className="text-sm font-medium">Эх сурвалжийн холбоос</label>
            <Input id="sourceLink" name="sourceLink" type="url" placeholder="https://..." />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] mt-4">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Хадгалах
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
