import { Button } from "@/components/ui/button"
import { Plus, Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getBatchesByCategory, createBatch } from "@/app/actions/batch-actions"
import { getCategoryById } from "@/app/actions/category-actions"
import { getCurrentAdmin } from "@/lib/auth"
import Link from "next/link"
import { notFound } from "next/navigation"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
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
import { Eye, Edit2, Trash2 } from "lucide-react"
import { BatchRowActions } from "./BatchRowActions"
import { CategoryDeliveryFeeEditor } from "./CategoryDeliveryFeeEditor"
import { ArchiveCategoryButton } from "./ArchiveCategoryButton"
import { CreateBatchSheet } from "./CreateBatchSheet"
import { CategorySearch } from "./CategorySearch"

export default async function CategoryBatchesPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ categoryId: string }> 
  searchParams?: Promise<{ q?: string; filter?: string }>
}) {
  const { categoryId } = await params;
  const sp = searchParams ? await searchParams : ({} as { q?: string; filter?: string });
  const query = sp.q?.toLowerCase() || "";
  const filterPreOrder = sp.filter === 'preorder';

  const admin = await getCurrentAdmin()
  const role = admin?.role || "ADMIN"

  const [{ batches, success }, { category }] = await Promise.all([
    getBatchesByCategory(categoryId),
    getCategoryById(categoryId)
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/admin/orders" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{category.name} - Ангиллын бараанууд</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Category delivery fee — applies to all batches */}
        <div className="flex-1">
          <CategoryDeliveryFeeEditor
            categoryId={categoryId}
            initialFee={Number((category as any).deliveryFee || 0)}
          />
        </div>
        <ArchiveCategoryButton categoryId={categoryId} isArchived={(category as any).isArchived ?? false} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <CategorySearch />
            <Link href={filterPreOrder ? `/admin/orders/category/${categoryId}` : `/admin/orders/category/${categoryId}?filter=preorder`}
              className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${filterPreOrder ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white hover:bg-slate-50 text-slate-600'}`}>
              ✈️ Карго хүлээж буй харах
            </Link>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== "CARGO_ADMIN" && (
              <CreateBatchSheet categoryId={categoryId} categoryName={category.name} />
            )}
          </div>
        </div>

        {/* Batches Table */}
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
              <tr>
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
              {success && batches && batches.length > 0 ? (
                batches.filter((b: any) => {
                  const matchQ = !query || b.product?.name?.toLowerCase().includes(query) || b.batchNumber?.toString().includes(query) || b.description?.toLowerCase().includes(query);
                  const matchP = !filterPreOrder || b.isPreOrder;
                  return matchQ && matchP;
                })
                .map((batch: any) => {
                  const orderedAmount = batch.orders?.filter((o: any) => o.paymentStatus !== 'REJECTED' && o.status?.name !== 'Цуцлагдсан').reduce((acc: number, o: any) => acc + o.quantity, 0) || 0;
                  const remaining = Math.max(0, batch.targetQuantity - orderedAmount);
                  const progressPercent = Math.min(100, Math.round((orderedAmount / (batch.targetQuantity || 1)) * 100));

                  return (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors group">
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
                    <BatchRowActions batch={batch} categoryId={categoryId} role={role} />
                  </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    Одоогоор энэ ангилалд бараа үүсээгүй байна.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
