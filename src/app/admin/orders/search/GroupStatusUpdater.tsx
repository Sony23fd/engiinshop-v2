"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateBatchOrderStatusesByIds } from "@/app/actions/order-actions"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/admin/StatusBadge"

export function GroupStatusUpdater({
  selectedOrderIds,
  statuses,
  onUpdated
}: {
  selectedOrderIds: string[]
  statuses: any[]
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const { toast } = useToast()

  async function handleBulkUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStatus) {
      toast({ variant: "destructive", title: "Төлөв сонгоно уу", description: "Жагсаалтаас аль нэг төлөвийг сонгоно уу." })
      return
    }
    if (selectedOrderIds.length === 0) {
      toast({ variant: "destructive", title: "Захиалга сонгоно уу", description: "Өөрчлөх захиалгуудаа Checkbox-оор сонгоно уу." })
      return
    }

    setLoading(true)
    const res = await updateBatchOrderStatusesByIds(selectedOrderIds, selectedStatus)
    setLoading(false)

    if (res.success) {
      toast({ title: "Амжилттай", description: `Сонгогдсон ${selectedOrderIds.length} захиалгын төлөв өөрчлөгдлөө.` })
      setSelectedStatus("")
      onUpdated()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  return (
    <form onSubmit={handleBulkUpdate} className="flex flex-wrap items-center gap-3 w-full sm:w-auto p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
      <span className="text-sm font-semibold text-indigo-800 whitespace-nowrap">
        {selectedOrderIds.length} ш сонгогдсон
      </span>
      <select 
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 min-w-[150px] shadow-sm"
      >
        <option value="">-- Төлөв рүү шилжүүлэх --</option>
        {statuses?.map((s: any) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <Button 
        type="submit" 
        disabled={loading || selectedOrderIds.length === 0 || !selectedStatus} 
        size="sm" 
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Хадгалах
      </Button>
    </form>
  )
}
