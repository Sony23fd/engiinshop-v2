"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Truck, Loader2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { forceAddDeliveryAddress } from "@/app/actions/order-actions"

export function GroupAdminDeliveryButton({
  selectedOrderIds,
  onUpdated
}: {
  selectedOrderIds: string[]
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const { toast } = useToast()

  async function handleBulkDelivery(e: React.FormEvent) {
    e.preventDefault()
    if (selectedOrderIds.length === 0) {
      toast({ variant: "destructive", title: "Захиалга сонгоно уу", description: "Хүргэлтэнд гаргах захиалгуудаа Checkbox-оор сонгоно уу." })
      return
    }
    if (!address.trim()) {
      toast({ variant: "destructive", title: "Хаяг оруулна уу" })
      return
    }

    setLoading(true)
    const res = await forceAddDeliveryAddress(selectedOrderIds, address)
    setLoading(false)

    if (res.success) {
      toast({ title: "Амжилттай", description: `Сонгогдсон ${selectedOrderIds.length} захиалга дээр хүргэлт бүртгэгдлээ.` })
      setAddress("")
      setOpen(false)
      onUpdated()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  if (!open) {
    return (
      <Button 
        variant="outline"
        size="sm"
        className="bg-slate-50 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium transition-colors shadow-sm"
        onClick={() => setOpen(true)}
        disabled={selectedOrderIds.length === 0}
      >
        <Truck className="w-4 h-4 mr-2" />
        Хүргэлт нэмэх ({selectedOrderIds.length})
      </Button>
    )
  }

  return (
    <form onSubmit={handleBulkDelivery} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Дүүрэг, Хороо, Тоот..."
        className="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 min-w-[200px] shadow-sm"
      />
      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={loading || selectedOrderIds.length === 0 || !address.trim()} 
          size="sm" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
          Хадгалах
        </Button>
        <Button 
          type="button" 
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-700"
        >
          Цуцлах
        </Button>
      </div>
    </form>
  )
}
