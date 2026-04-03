"use client"

import { useState, useEffect } from "react"
import { updateProduct } from "@/app/actions/product-actions"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditProductSheetProps {
  batch: any;
}

export function EditProductSheet({ batch }: EditProductSheetProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<{name: string, values: string}[]>([])
  const router = useRouter()

  useEffect(() => {
    if (batch.product?.options) {
      const rawOptions = Array.isArray(batch.product.options) ? batch.product.options : []
      const formatted = rawOptions.map((opt: any) => ({
        name: opt.name || "",
        values: Array.isArray(opt.values) ? opt.values.join(", ") : (opt.values || "")
      }))
      setOptions(formatted)
    }
  }, [batch])

  const addOption = () => setOptions([...options, { name: "", values: "" }])
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx))
  const handleOptionChange = (idx: number, field: "name" | "values", val: string) => {
    const newOpts = [...options]
    newOpts[idx][field] = val
    setOptions(newOpts)
  }

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const formattedOptions = options
      .filter(o => o.name.trim() && o.values.trim())
      .map(o => ({
        name: o.name.trim(),
        values: o.values.split(",").map(v => v.trim()).filter(v => v)
      }));

    const res = await updateProduct({
      productId: batch.product?.id,
      batchId: batch.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      targetQuantity: Number(formData.get("targetQuantity") || 0),
      remainingQuantity: Number(formData.get("remainingQuantity") || 0),
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
      sourceLink: formData.get("sourceLink") as string,
      options: formattedOptions.length > 0 ? formattedOptions : []
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
      <SheetTrigger>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 cursor-pointer">
          <Pencil className="w-4 h-4" />
        </div>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Бараа засах</SheetTitle>
          <SheetDescription>#{batch.batchNumber} - {batch.product?.name} мэдээллийг шинэчлэх.</SheetDescription>
        </SheetHeader>
        <form action={onSubmit} className="space-y-4 mt-6 pb-20">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
            <Input id="name" name="name" required defaultValue={batch.product?.name} />
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">Сонголтууд (Өнгө, Хэмжээ г.м)</label>
              <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 px-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Нэмэх
              </Button>
            </div>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-start gap-2 bg-white p-2 border rounded-md shadow-sm">
                  <div className="space-y-2 flex-1">
                    <Input 
                      placeholder="Төрөл (Ж: Өнгө)" 
                      value={opt.name} 
                      onChange={(e) => handleOptionChange(i, "name", e.target.value)} 
                      className="h-8 text-xs"
                    />
                    <Input 
                      placeholder="Утгууд (Ж: Хар, Цагаан таслалаар тусгаарлах)" 
                      value={opt.values} 
                      onChange={(e) => handleOptionChange(i, "values", e.target.value)} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)} className="h-8 w-8 text-red-500 shrink-0">
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
            <Textarea id="description" name="description" defaultValue={batch.description || batch.product?.description} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
              <Input id="price" name="price" type="number" required defaultValue={Number(batch.price || batch.product?.price || 0)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
              <Input id="weight" name="weight" type="number" step="0.01" defaultValue={Number(batch.product?.weight || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="targetQuantity" className="text-sm font-medium">Зорилтот тоо</label>
              <Input id="targetQuantity" name="targetQuantity" type="number" required defaultValue={batch.targetQuantity} />
            </div>
            <div className="space-y-2">
              <label htmlFor="remainingQuantity" className="text-sm font-medium">Үлдэгдэл</label>
              <Input id="remainingQuantity" name="remainingQuantity" type="number" required defaultValue={batch.remainingQuantity} />
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
