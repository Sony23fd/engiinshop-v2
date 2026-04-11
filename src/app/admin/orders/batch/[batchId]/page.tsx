import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Plus, Package, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getBatchById } from "@/app/actions/batch-actions"
import { getOrderStatuses } from "@/app/actions/order-actions"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { getCurrentAdmin } from "@/lib/auth"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ExportButton } from "./ExportButton"
import { ImportButton } from "./ImportButton"
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
          <ImportButton batchId={batchId} batchName={batch.product?.name || "Тодорхойгүй"} />
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-slate-100 hover:text-accent-foreground text-sm bg-white h-9 px-3 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Нэмэх
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Шинэ захиалга бүртгэх</SheetTitle>
              </SheetHeader>
              <form action={async (formData) => {
                "use server"
                const { addOrderToBatch } = await import("@/app/actions/order-actions")
                const res = await addOrderToBatch(batch.id, {
                  customerName: formData.get("customerName") as string,
                  customerPhone: formData.get("customerPhone") as string,
                  accountNumber: formData.get("accountNumber") as string,
                  quantity: Number(formData.get("quantity")) || 1,
                  arrivalDate: formData.get("arrivalDate") as string,
                  deliveryDate: formData.get("deliveryDate") as string,
                  deliveryAddress: formData.get("deliveryAddress") as string,
                  statusId: formData.get("statusId") as string,
                })
                
                if (!res.success) {
                  // We'll throw it to the closest error boundary or we can handle it via UI toast.
                  // For now, logging to server console so we can see the exact error.
                  console.error("ADD ORDER FAILED:", res.error)
                }
              }} className="space-y-4 mt-6 text-left">
                
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-medium block">Хэрэглэгчийн нэр</label>
                  <Input id="customerName" name="customerName" required placeholder="Нэр..." />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="customerPhone" className="text-sm font-medium block">Утасны дугаар</label>
                  <Input id="customerPhone" name="customerPhone" required placeholder="Утас..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="accountNumber" className="text-sm font-medium block">Дансны дугаар</label>
                    <Input id="accountNumber" name="accountNumber" placeholder="Данс..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium block">Тоо ширхэг</label>
                    <Input id="quantity" name="quantity" type="number" required defaultValue="1" min="1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="arrivalDate" className="text-sm font-medium block">Ирэх өдөр</label>
                    <Input id="arrivalDate" name="arrivalDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="deliveryDate" className="text-sm font-medium block">Хүргүүлэх өдөр</label>
                    <Input id="deliveryDate" name="deliveryDate" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="deliveryAddress" className="text-sm font-medium block">Хаяг</label>
                  <Input id="deliveryAddress" name="deliveryAddress" placeholder="Хаяг..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-slate-500">Карго үнэ (₮)</label>
                    <Input type="text" value="Автоматаар бодогдоно" readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="statusId" className="text-sm font-medium block">Статус</label>
                    <select 
                      id="statusId" 
                      name="statusId" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Сонгох...</option>
                      {statuses?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">Хадгалах</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>



      {/* Client Component with Checkboxes */}
      <BatchOrdersClient activeOrders={activeOrders} completedOrders={validOrders.filter((o: any) => o.status?.isFinal)} batch={batch} statuses={statuses || []} role={admin?.role || "CARGO_ADMIN"} />
    </div>
  )
}
