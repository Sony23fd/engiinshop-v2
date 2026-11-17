import { notFound } from "next/navigation"
import { Package, ClipboardList } from "lucide-react"
import { getBatchById } from "@/app/actions/batch-actions"
import { getOrderStatuses } from "@/app/actions/order-actions"
import { getCurrentAdmin } from "@/lib/auth"
import { normalizeOptions } from "@/lib/variant-utils"
import { ExportButton } from "./ExportButton"
import { ImportModal } from "./ImportModal"
import { AddOrderSheet } from "./AddOrderSheet"
import { BatchOrdersClient } from "./BatchOrdersClient"

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  
  const [{ batch, success }, { statuses }, admin] = await Promise.all([
    getBatchById(batchId),
    getOrderStatuses(),
    getCurrentAdmin()
  ])

  if (!success || !batch) {
    notFound()
  }

  const validOrders = batch.orders.filter((o: any) => o.paymentStatus === 'CONFIRMED' && o.status?.name !== 'Цуцлагдсан')
  const totalQuantity = validOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)
  const totalOrders = validOrders.length
  
  const activeOrders = validOrders.filter((o: any) => !o.status?.isFinal)
  const activeQuantity = activeOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)
  const normOptions = normalizeOptions(batch.product?.options)

  return (
    <div className="w-full bg-[#fafafa] min-h-screen p-4 md:p-8 space-y-6">
      {/* Header Card */}
      <div className="bg-white px-6 py-4 rounded-xl shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{batch.product?.name}</h1>
          {batch.description && (
            <p className="text-sm text-slate-500 mt-1 sm:max-w-md truncate">{batch.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div className="bg-blue-50/50 px-3 py-1.5 rounded-md border border-blue-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <span>Ширхэг: <strong className="text-blue-700">{activeQuantity}</strong> <span className="text-blue-400 font-normal">/ {totalQuantity}</span></span>
          </div>
          <div className="bg-green-50/50 px-3 py-1.5 rounded-md border border-green-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-green-400" />
            <span>Захиалга: <strong className="text-green-700">{activeOrders.length}</strong> <span className="text-green-400 font-normal">/ {totalOrders}</span></span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-md border flex items-center gap-2">
            <span className="text-slate-500">Огноо:</span>
            <span className="font-semibold text-slate-900">{new Date(batch.createdAt).toISOString().split('T')[0]}</span>
          </div>
        </div>
      </div>

      {/* Orders Section Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-lg font-bold">Захиалгын зүйлс</h2>
        <div className="flex space-x-2">
          <ExportButton batchId={batchId} />
          <ImportModal batchId={batchId} batch={batch} />
          <AddOrderSheet 
            batchId={batchId} 
            batch={batch} 
            normOptions={normOptions} 
            statuses={statuses || []} 
          />
        </div>
      </div>



      {/* Client Component with Checkboxes */}
      <BatchOrdersClient activeOrders={activeOrders} batch={batch} statuses={statuses || []} role={admin?.role || "CARGO_ADMIN"} />
    </div>
  )
}
