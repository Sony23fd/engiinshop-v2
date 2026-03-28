import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Search, Download, Upload, Plus, Package, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getBatchById } from "@/app/actions/batch-actions"
import { getOrderStatuses } from "@/app/actions/order-actions"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [{ batch, success }, { statuses }] = await Promise.all([
    getBatchById(id),
    getOrderStatuses()
  ])

  if (!success || !batch) {
    notFound()
  }

  const validOrders = batch.orders.filter((o: any) => o.paymentStatus !== 'REJECTED' && o.status?.name !== 'Цуцлагдсан')
  const totalQuantity = validOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)
  const totalOrders = validOrders.length

  return (
    <div className="w-full bg-[#fafafa] min-h-screen p-4 md:p-8 space-y-6">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{batch.product?.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600 mt-6">
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 mb-1 font-medium">Захиалгын огноо</p>
              <p className="font-semibold text-slate-900">{new Date(batch.createdAt).toISOString().split('T')[0]}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1 font-medium">Тайлбар</p>
              <p className="font-semibold text-slate-900">{batch.description || "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1 font-medium text-right md:text-left">Үүсгэсэн хэрэглэгч</p>
            {/* Can link to admin user if relations exist. Assuming generic admin for now */}
          </div>
        </div>
      </div>

      {/* Orders Section Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-lg font-bold">Захиалгын зүйлс</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="bg-white h-9 shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Экспорт
          </Button>
          <Button variant="outline" size="sm" className="bg-white h-9 shadow-sm">
            <Upload className="w-4 h-4 mr-2" /> Импорт
          </Button>
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
                  cargoFee: Number(formData.get("cargoFee")) || 0,
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
                    <label htmlFor="cargoFee" className="text-sm font-medium block">Карго үнэ (₮)</label>
                    <Input id="cargoFee" name="cargoFee" type="number" defaultValue="0" min="0" />
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#eff6ff] rounded border-none p-6 flex justify-between items-center bg-gradient-to-r from-[#eef2fe] to-[#e0e7ff] h-28">
          <div>
            <p className="text-[#3b82f6] text-sm font-semibold mb-2">Нийт ширхэг</p>
            <h3 className="text-4xl font-bold text-[#1e3a8a]">{totalQuantity}</h3>
          </div>
          <div className="w-14 h-14 bg-cover bg-center" style={{backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238b5cf6"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15 6.04 7.5 12 10.85l5.96-3.35L12 4.15M5 15.91l6 3.38v-6.71L5 9.19v6.72m14 0v-6.72l-6 3.39v6.71l6-3.38"/></svg>')`}}>
            {/* Decorative box icon like the screenshot */}
          </div>
        </div>
        
        <div className="bg-[#f0fdf4] rounded border-none p-6 flex justify-between items-center bg-gradient-to-r from-[#eefbf4] to-[#dcfce7] h-28">
          <div>
            <p className="text-[#22c55e] text-sm font-semibold mb-2">Нийт захиалга</p>
            <h3 className="text-4xl font-bold text-[#14532d]">{totalOrders}</h3>
          </div>
          <div className="w-14 h-14 bg-cover bg-center" style={{backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1m2 14H7v-2h7v2m3-4H7v-2h10v2m0-4H7V7h10v2z"/></svg>')`}}>
            {/* Decorative clipboard icon like the screenshot */}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Input 
            placeholder="Дансны дугаараар хайх" 
            className="md:w-1/3 bg-slate-50 border-slate-200"
          />
          <select className="md:w-1/4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none">
            <option value="">Бүх статус</option>
            {statuses?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse">
             <thead className="bg-[#ffffff] border-b-2 text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap tracking-wider">
              <tr>
                <th className="px-4 py-3 w-10"># &nbsp;</th>
                <th className="px-4 py-3">Захиалгын дугаар &nbsp;</th>
                <th className="px-4 py-3">Нэр &nbsp;</th>
                <th className="px-4 py-3">Дансны дугаар &nbsp;</th>
                <th className="px-4 py-3 text-center">Тоо &nbsp;</th>
                <th className="px-4 py-3 text-center">Статус &nbsp;</th>
                <th className="px-4 py-3 text-center">Хаяг &nbsp;</th>
                <th className="px-4 py-3 text-center">Карго үнэ &nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {batch.orders && batch.orders.length > 0 ? (
                batch.orders.map((order: any, idx: number) => (
                  <tr key={order.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="px-4 py-6 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-6 font-medium text-slate-600">{order.orderNumber}</td>
                    <td className="px-4 py-6 min-w-[200px]">
                      <div className="text-slate-500 text-xs font-medium space-y-1">
                        <p className="text-slate-800 text-sm uppercase">{order.customerName},</p>
                        <p>{order.customerPhone},</p>
                        <p>{batch.product?.name}</p>
                        <p className="text-slate-800">Карго: {Number(order.cargoFee || 0)} ₮</p>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-slate-500 font-medium">{order.accountNumber}</td>
                    <td className="px-4 py-6 font-semibold text-center text-slate-600">{order.quantity}</td>

                    <td className="px-4 py-6 min-w-[150px] text-center">
                      <div className="flex items-center gap-2 mx-auto w-fit">
                        <StatusBadge status={order.status?.name || "Шинэ"} color={order.status?.color} />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className="text-slate-400 font-medium">{order.deliveryAddress || "-"}</span>
                    </td>
                    <td className="px-4 py-6 text-center">
                       <span className="font-semibold text-slate-800">{Number(order.cargoFee || 0).toLocaleString()} ₮</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    Энэ захиалга дотор бүртгэгдсэн хэрэглэгчийн захиалга алга байна.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder matching screenshot */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-4">
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1 text-slate-400 hover:text-slate-600 font-bold">&lt;</button>
            <button className="px-2 py-1 bg-white border border-[#4F46E5] text-[#4F46E5] rounded font-bold">1</button>
            <button className="px-2 py-1 text-slate-400 hover:text-slate-600 font-bold">&gt;</button>
          </div>
          <div>
            <select className="border border-slate-200 rounded bg-slate-50 px-3 py-1.5 text-slate-600 font-medium">
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
