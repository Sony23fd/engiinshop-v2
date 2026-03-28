"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createBatch } from "@/app/actions/batch-actions"

export function CreateBatchForm({ categoryId, onSuccess }: { categoryId: string, onSuccess: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await createBatch({
      categoryId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      cargoFeeStatus: formData.get("cargoFeeStatus") as string,
      targetQuantity: Number(formData.get("targetQuantity") || 0),
      remainingQuantity: Number(formData.get("remainingQuantity") || 0),
      price: Number(formData.get("price") || 0),
      weight: Number(formData.get("weight") || 0),
    })

    if (result.success) {
      toast({ title: "Амжилттай", description: "Шинэ бараа үүсгэгдлээ." })
      setLoading(false)
      onSuccess()
    } else {
      toast({ variant: "destructive", title: "Алдаа гарлаа", description: result.error || "Бараа үүсгэхэд алдаа гарлаа." })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      
      <input type="hidden" name="categoryId" value={categoryId} />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
        <Input id="name" name="name" required placeholder="Нэр..." />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
        <Input id="description" name="description" placeholder="Жишээ: Карго авахгүй..." />
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
        <label htmlFor="cargoFeeStatus" className="text-sm font-medium">Карго үнэ төлөх эсэх</label>
        <Input id="cargoFeeStatus" name="cargoFeeStatus" placeholder="0" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">Барааны үнэ (₮)</label>
          <Input id="price" name="price" type="number" required placeholder="0" />
        </div>
        <div className="space-y-2">
          <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
          <Input id="weight" name="weight" type="number" step="0.01" placeholder="0.0" />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">
        {loading ? "Хадгалж байна..." : "Хадгалах"}
      </Button>
    </form>
  )
}
