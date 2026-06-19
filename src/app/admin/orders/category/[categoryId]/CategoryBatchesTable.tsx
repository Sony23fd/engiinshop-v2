"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BatchRowActions } from "./BatchRowActions"
import Link from "next/link"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2, PackageCheck, Truck, XCircle, DollarSign } from "lucide-react"
import { bulkUpdateBatchStatus } from "@/app/actions/batch-actions"
import { useToast } from "@/components/ui/use-toast"
import { BatchStatus } from "@prisma/client"

export function CategoryBatchesTable({ 
  batches, 
  query, 
  filterPreOrder, 
  categoryId, 
  role, 
  categories,
  page,
  itemsPerPage
}: { 
  batches: any[], 
  query: string, 
  filterPreOrder: boolean, 
  categoryId: string, 
  role: string, 
  categories: any[],
  page: number,
  itemsPerPage: number
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const filteredBatches = batches.filter((b: any) => {
    const matchQ = !query || b.product?.name?.toLowerCase().includes(query) || b.batchNumber?.toString().includes(query) || b.description?.toLowerCase().includes(query);
    const matchP = !filterPreOrder || b.isPreOrder;
    return matchQ && matchP;
  });

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginatedBatches = filteredBatches.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBatches.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredBatches.map(b => b.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBulkUpdate = async (status?: BatchStatus, cargoFee?: string) => {
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      const res = await bulkUpdateBatchStatus(selectedIds, { status, cargoFeeStatus: cargoFee })
      if (res.success) {
        toast({
          title: "Амжилттай",
          description: `${selectedIds.length} багцыг амжилттай шинэчиллээ`,
        })
        setSelectedIds([])
      } else {
        toast({
          title: "Алдаа",
          description: res.error || "Алдаа гарлаа",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Алдаа",
        description: "Шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </div>
            <span className="text-sm font-semibold text-indigo-700">Багц сонгогдлоо</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  Бөөнөөр шинэчлэх
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Бөөнөөр хийх үйлдэл</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkUpdate(BatchStatus.ARRIVED)} className="text-green-600">
                  <PackageCheck className="w-4 h-4 mr-2" /> Монголд ирсэн болгох
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkUpdate(BatchStatus.SHIPPED)} className="text-blue-600">
                  <Truck className="w-4 h-4 mr-2" /> Солонгосоос гарсан болгох
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkUpdate(BatchStatus.CLOSED)} className="text-slate-600">
                  <XCircle className="w-4 h-4 mr-2" /> Захиалга хаах
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedIds([])} className="text-rose-600">
                  Сонголтыг цуцлах
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
            <tr>
              <th className="px-4 py-3 w-[40px]">
                <Checkbox 
                  checked={selectedIds.length === paginatedBatches.length && paginatedBatches.length > 0} 
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3">Дугаар</th>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3">Тайлбар</th>
              <th className="px-4 py-3">Зорилтот тоо</th>
              <th className="px-4 py-3">Үлдэгдэл</th>
              <th className="px-4 py-3 text-right">Карго үнэ</th>
              <th className="px-4 py-3 text-right">Жин</th>
              <th className="px-4 py-3 text-right">Карго нийт үнэ</th>
              <th className="px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {paginatedBatches.length > 0 ? (
              paginatedBatches.map((batch: any) => {
                const orderedAmount = batch.orders?.filter((o: any) => o.paymentStatus === 'CONFIRMED' && o.status?.name !== 'Цуцлагдсан').reduce((acc: number, o: any) => acc + o.quantity, 0) || 0;
                const remaining = Math.max(0, batch.targetQuantity - orderedAmount);
                const progressPercent = Math.min(100, Math.round((orderedAmount / (batch.targetQuantity || 1)) * 100));

                return (
                  <tr key={batch.id} className={cn(
                    "hover:bg-slate-50/50 transition-colors group",
                    selectedIds.includes(batch.id) && "bg-indigo-50/30"
                  )}>
                    <td className="px-4 py-4">
                      <Checkbox 
                        checked={selectedIds.includes(batch.id)} 
                        onCheckedChange={() => toggleSelect(batch.id)}
                      />
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      <Link href={`/admin/orders/batch/${batch.id}`}>#{batch.batchNumber}</Link>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900 max-w-[200px] truncate">
                      <Link href={`/admin/orders/batch/${batch.id}`} className="hover:text-indigo-600 transition-colors">
                        {batch.product?.name}
                        {batch.isPreOrder && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest whitespace-nowrap">
                            ✈️ Карго хүлээж буй
                          </span>
                        )}
                        {batch.status === BatchStatus.ARRIVED && (
                           <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-widest whitespace-nowrap">
                            Ирсэн
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-500 max-w-[150px] truncate">
                      {batch.description || "-"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{batch.targetQuantity}</td>
                    <td className="px-4 py-4 font-semibold">
                      <div className="flex flex-col gap-1.5 w-full min-w-[120px]">
                        <div className="flex justify-between text-[11px] items-center uppercase tracking-wider">
                          <span className="font-bold text-[#4e3dc7]">
                             {orderedAmount} / {batch.targetQuantity}
                          </span>
                          <span className={remaining === 0 ? "text-rose-500 font-bold" : "text-slate-500 font-bold"}>
                            Үлдсэн: {remaining}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-rose-500' : 'bg-[#4e3dc7]'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="bg-slate-100 rounded px-2 py-1 inline-block text-slate-600 text-xs font-medium min-w-[30px] text-center">
                         {batch.cargoFeeStatus || "0"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="bg-slate-100 rounded px-2 py-1 inline-block text-slate-600 text-xs font-medium min-w-[30px] text-center">
                         {Number(batch.product?.weight || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {(Number(batch.cargoFeeStatus || 0) * Number(batch.product?.weight || 0)).toLocaleString()} ₮
                    </td>
                    <td className="px-4 py-3 text-right sticky right-0 bg-white">
                      <BatchRowActions batch={batch} categoryId={categoryId} role={role} allCategories={categories || []} />
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                  Мэдээлэл олдсонгүй.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <a href={`?q=${query}&filter=${filterPreOrder ? 'preorder' : ''}&page=${page > 1 ? page - 1 : 1}`}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
            Өмнөх
          </a>
          <span className="text-sm font-medium text-slate-600 px-4">
            Хуудас {page} / {totalPages}
          </span>
          <a href={`?q=${query}&filter=${filterPreOrder ? 'preorder' : ''}&page=${page < totalPages ? page + 1 : totalPages}`}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page >= totalPages ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
            Дараах
          </a>
        </div>
      )}
    </div>
  )
}
