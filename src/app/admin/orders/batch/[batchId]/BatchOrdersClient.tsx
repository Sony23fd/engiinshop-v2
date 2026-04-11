"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { updateBatchOrderStatusesByIds, updateOrderDetails, deleteOrder } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import { GroupAdminDeliveryButton } from "../../search/GroupAdminDeliveryButton"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function BatchOrdersClient({ activeOrders, completedOrders = [], batch, statuses, role }: { activeOrders: any[], completedOrders?: any[], batch: any, statuses: any[], role: string }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const filteredOrders = activeOrders.filter(o => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (o.accountNumber && o.accountNumber.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.orderNumber && String(o.orderNumber).toLowerCase().includes(q)) ||
      (o.transactionRef && o.transactionRef.toLowerCase().includes(q))
    )
  })

  const allSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id))
  const someSelected = filteredOrders.some(o => selectedIds.includes(o.id)) && !allSelected

  function toggleAll() {
    const visibleIds = filteredOrders.map(o => o.id)
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleEditOrder(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.target as HTMLFormElement)
    const data = {
      customerName: form.get("customerName") as string,
      customerPhone: form.get("customerPhone") as string,
      accountNumber: form.get("accountNumber") as string,
      quantity: Number(form.get("quantity") || 1),
      deliveryAddress: form.get("deliveryAddress") as string,
    }
    const res = await updateOrderDetails(editingOrder.id, data)
    setLoading(false)
    if (res.success) {
      toast({ 
        title: "Амжилттай шинэчлэгдлээ", 
        description: `${data.customerName}-ийн захиалгын мэдээллийг шинэчиллээ.` 
      })
      setEditingOrder(null)
      router.refresh()
    } else toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа" })
  }

  async function handleDeleteOrder(id: string) {
    const orderToDelete = activeOrders.find(o => o.id === id)
    if (!confirm("Энэ захиалгыг бүрмөсөн устгах уу?")) return
    setLoading(true)
    const res = await deleteOrder(id)
    setLoading(false)
    if (res.success) {
      toast({ 
        title: "Устгагдлаа", 
        description: `#${orderToDelete?.orderNumber || ""} дугаартай захиалгыг устгалаа.` 
      })
      router.refresh()
    } else toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа" })
  }

  async function handleBulkUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStatus) return toast({ variant: "destructive", title: "Алдаа", description: "Төлөв сонгоно уу" })
    if (selectedIds.length === 0) return toast({ variant: "destructive", title: "Алдаа", description: "Захиалга сонгоно уу" })

    setLoading(true)
    const res = await updateBatchOrderStatusesByIds(selectedIds, selectedStatus)
    setLoading(false)

    if (res.success) {
      const statusName = statuses.find(s => s.id === selectedStatus)?.name || ""
      toast({ 
        title: "Бөөнөөр шинэчиллээ", 
        description: `${selectedIds.length} захиалгын төлөвийг '${statusName}' болгож шинэчиллээ.` 
      })
      setSelectedIds([])
      setSelectedStatus("")
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа" })
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Input 
          placeholder="Данс, утас, нэр, гүйлгээний утгаар хайх..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/3 bg-slate-50 border-slate-200"
        />
        <div className="flex flex-col md:flex-row gap-4 md:w-2/3 justify-end lg:items-center">
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <GroupAdminDeliveryButton 
              selectedOrderIds={selectedIds} 
              onUpdated={() => {
                 setSelectedIds([])
                 window.location.reload()
              }} 
            />
            <form onSubmit={handleBulkUpdate} className="flex gap-2 items-center px-4 py-1.5 border border-indigo-100 rounded-md bg-indigo-50/30">
              <span className="text-sm font-semibold text-indigo-700 whitespace-nowrap">Сонгосон {selectedIds.length}ш:</span>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                required 
                className="rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="">-- Статус руу --</option>
                {statuses?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <Button type="submit" disabled={loading || selectedIds.length===0 || !selectedStatus} size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Хадгалах
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#ffffff] border-b-2 text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap tracking-wider">
            <tr>
              <th className="px-4 py-3 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={allSelected}
                  ref={input => { if (input) input.indeterminate = someSelected }}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-4 py-3">Захиалгын дугаар &nbsp;</th>
              <th className="px-4 py-3">Нэр &nbsp;</th>
              <th className="px-4 py-3">Дансны дугаар &nbsp;</th>
              <th className="px-4 py-3 text-center">Гүйлгээний утга &nbsp;</th>
              <th className="px-4 py-3 text-center">Тоо &nbsp;</th>

              <th className="px-4 py-3 text-center">Статус &nbsp;</th>
              <th className="px-4 py-3 text-center">Хаяг &nbsp;</th>
              <th className="px-4 py-3 text-center">Карго үнэ &nbsp;</th>
              <th className="px-4 py-3 text-center">Үйлдэл &nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: any, idx: number) => {
                const unitCargoFee = Number(batch.cargoFeeStatus || 0) * Number(batch.product?.weight || 0);
                const orderCustomFee = Number(order.cargoFee || 0);
                const baseTotal = unitCargoFee * Number(order.quantity || 1);
                const finalCargoFee = orderCustomFee > 0 ? orderCustomFee * Number(order.quantity || 1) : baseTotal;
                const isChecked = selectedIds.includes(order.id)

                return (
                <tr key={order.id} className={`border-b border-slate-100 transition-colors ${isChecked ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-6 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={isChecked}
                      onChange={() => toggleOne(order.id)}
                    />
                  </td>
                  <td className="px-4 py-6 font-medium text-slate-600 cursor-pointer" onClick={() => toggleOne(order.id)}>{order.orderNumber}</td>
                  <td className="px-4 py-6 min-w-[200px] cursor-pointer" onClick={() => toggleOne(order.id)}>
                    <div className="text-slate-500 text-xs font-medium space-y-1">
                      <p className="text-slate-800 text-sm uppercase">{order.customerName},</p>
                      <p>{order.customerPhone},</p>
                      <p>{batch.product?.name}</p>
                      <p className="text-slate-800">Карго: {finalCargoFee.toLocaleString()} ₮</p>
                      <p className="uppercase text-[10px] tracking-wider text-slate-400 pt-1 flex items-center gap-1">
                        <span className={order.creationSource === "ADMIN" ? "text-indigo-600 font-bold bg-indigo-50 px-1 rounded" : "text-green-600 font-bold bg-green-50 px-1 rounded"}>
                          {order.creationSource === "ADMIN" ? `Админ: ${order.createdByAdmin || "Тодорхойгүй"}` : "Вэб"}
                        </span>
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-slate-500 font-medium">{order.accountNumber}</td>
                  <td className="px-4 py-6 text-center">
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                      {order.transactionRef || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-6 font-semibold text-center text-slate-600">{order.quantity}</td>

                  <td className="px-4 py-6 min-w-[150px] text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <StatusBadge status={order.status?.name || "Шинэ"} color={order.status?.color} />
                    </div>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <span className="text-slate-400 font-medium">{order.deliveryAddress || "-"}</span>
                  </td>
                  <td className="px-4 py-6 text-center">
                     <span className="font-semibold text-slate-800">{finalCargoFee.toLocaleString()} ₮</span>
                  </td>
                  <td className="px-4 py-6 text-center space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {role === "ADMIN" && (
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    )}
                  </td>
                </tr>
              )})
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

      {/* Completed Orders Section */}
      {completedOrders.length > 0 && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span className={`transition-transform ${showCompleted ? "rotate-90" : ""}`}>▶</span>
            Дууссан захиалгууд ({completedOrders.length})
          </button>

          {showCompleted && (
            <div className="overflow-x-auto w-full mt-3 opacity-60">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 border-b text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Захиалгын дугаар</th>
                    <th className="px-4 py-3">Нэр</th>
                    <th className="px-4 py-3">Дансны дугаар</th>
                    <th className="px-4 py-3 text-center">Гүйлгээний утга</th>
                    <th className="px-4 py-3 text-center">Тоо</th>
                    <th className="px-4 py-3 text-center">Статус</th>
                    <th className="px-4 py-3 text-center">Хаяг</th>
                    <th className="px-4 py-3 text-center">Карго үнэ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedOrders.map((order: any) => {
                    const unitCargoFee = Number(batch.cargoFeeStatus || 0) * Number(batch.product?.weight || 0)
                    const orderCustomFee = Number(order.cargoFee || 0)
                    const finalCargoFee = orderCustomFee > 0 ? orderCustomFee * Number(order.quantity || 1) : unitCargoFee * Number(order.quantity || 1)
                    return (
                      <tr key={order.id} className="border-b border-slate-100 bg-slate-50/50">
                        <td className="px-4 py-4 font-medium text-slate-400">{order.orderNumber}</td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <div className="text-slate-400 text-xs space-y-0.5">
                            <p className="text-slate-500 text-sm uppercase">{order.customerName}</p>
                            <p>{order.customerPhone}</p>
                            <p>{batch.product?.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400">{order.accountNumber}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            {order.transactionRef || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-400">{order.quantity}</td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={order.status?.name || ""} color={order.status?.color} />
                        </td>
                        <td className="px-4 py-4 text-center text-slate-400">{order.deliveryAddress || "-"}</td>
                        <td className="px-4 py-4 text-center text-slate-400">{finalCargoFee.toLocaleString()} ₮</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Sheet open={!!editingOrder} onOpenChange={(open) => !open && !loading && setEditingOrder(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Захиалга засах</SheetTitle>
          </SheetHeader>
          {editingOrder && (
            <form onSubmit={handleEditOrder} className="space-y-4 mt-6 text-left">
              <div className="space-y-2">
                <label className="text-sm font-medium">Хэрэглэгчийн нэр</label>
                <Input name="customerName" required defaultValue={editingOrder.customerName} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Утасны дугаар</label>
                <Input name="customerPhone" required defaultValue={editingOrder.customerPhone} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дансны дугаар</label>
                  <Input name="accountNumber" defaultValue={editingOrder.accountNumber || ""} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Тоо ширхэг</label>
                  <Input name="quantity" type="number" required min="1" defaultValue={editingOrder.quantity} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Хүргэлтийн хаяг</label>
                <Input name="deliveryAddress" defaultValue={editingOrder.deliveryAddress || ""} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#4F46E5] mt-4">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Хадгалах
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
