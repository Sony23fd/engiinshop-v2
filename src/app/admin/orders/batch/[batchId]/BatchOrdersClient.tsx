"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { updateBatchOrderStatusesByIds, updateOrderDetails, deleteOrder, updateOrderStatus } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GroupAdminDeliveryButton } from "../../search/GroupAdminDeliveryButton"
import { Loader2, Pencil, Trash2, Tag, Layers, X, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CustomerProfileModal } from "@/components/admin/CustomerProfileModal"
import { PrintLabelsButton } from "@/components/admin/PrintLabelsButton"
import { getVariantBreakdown, formatSelectedOptions, normalizeOptions, getVariantKey } from "@/lib/variant-utils"
import { cn } from "@/lib/utils"

export function BatchOrdersClient({ activeOrders, batch, statuses, role }: { activeOrders: any[], batch: any, statuses: any[], role: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVariantFilter, setSelectedVariantFilter] = useState<string | null>(null)
  const [profilePhone, setProfilePhone] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const normOptions = useMemo(() => normalizeOptions(batch.product?.options), [batch.product?.options])

  // Compute aggregate statistics for sizes / variants
  const variantBreakdown = useMemo(() => {
    return getVariantBreakdown(activeOrders, batch.product?.options)
  }, [activeOrders, batch.product?.options])

  const filteredOrders = activeOrders.filter(o => {
    // 1. Variant / Size filter
    if (selectedVariantFilter) {
      const orderKey = (o.selectedOptions && typeof o.selectedOptions === "object" && Object.keys(o.selectedOptions).length > 0)
        ? (getVariantKey(normOptions, o.selectedOptions) || formatSelectedOptions(o.selectedOptions))
        : "standard"
      if (orderKey !== selectedVariantFilter) return false
    }

    // 2. Search query filter (matches customer, phone, account, order number, ref, AND option text!)
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase().trim()
    const optText = formatSelectedOptions(o.selectedOptions).toLowerCase()
    return (
      (o.accountNumber && o.accountNumber.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.orderNumber && String(o.orderNumber).toLowerCase().includes(q)) ||
      (o.transactionRef && o.transactionRef.toLowerCase().includes(q)) ||
      optText.includes(q)
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
    
    // Collect edited options if product has options
    const editedOptions: Record<string, string> = {}
    if (normOptions.length > 0) {
      for (const opt of normOptions) {
        const val = form.get(`option_${opt.name}`) as string
        if (val) editedOptions[opt.name] = val
      }
    }

    const data: any = {
      customerName: form.get("customerName") as string,
      customerPhone: form.get("customerPhone") as string,
      accountNumber: form.get("accountNumber") as string,
      quantity: Number(form.get("quantity") || 1),
      deliveryAddress: form.get("deliveryAddress") as string,
      ...(normOptions.length > 0 && {
        selectedOptions: Object.keys(editedOptions).length > 0 ? editedOptions : undefined
      })
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
      const skippedMsg = res.skippedFinalCount ? ` (${res.skippedFinalCount} дууссан захиалга хамгаалагдаж алгасагдсан)` : ""
      toast({ 
        title: "Бөөнөөр шинэчиллээ", 
        description: `${res.count ?? selectedIds.length} захиалгын төлөвийг '${statusName}' болгож шинэчиллээ.${skippedMsg}` 
      })
      setSelectedIds([])
      setSelectedStatus("")
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа" })
    }
  }

  async function handleSingleStatusChange(orderId: string, newStatusId: string) {
    if (!newStatusId || newStatusId === "none") return;
    setLoading(true)
    const res = await updateOrderStatus(orderId, newStatusId)
    setLoading(false)
    if (res.success) {
      toast({ title: "Амжилттай", description: "Төлөв өөрчлөгдлөө." })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Алдаа", description: res.error || "Алдаа гарлаа" })
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
      
      {/* 1. VARIANT SUMMARY & INSTANT FILTER BAR */}
      {variantBreakdown.hasVariants && variantBreakdown.items.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Сонголтын нэгдсэн тооцоо (Size & Variant Breakdown)
              </span>
              <span className="text-xs text-slate-400">
                • Нийт {variantBreakdown.totalQuantity} ширхэг бараа
              </span>
            </div>
            {selectedVariantFilter && (
              <button
                onClick={() => setSelectedVariantFilter(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" /> Шүүлтүүр арилгах
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {/* "All" button */}
            <button
              onClick={() => setSelectedVariantFilter(null)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs cursor-pointer",
                selectedVariantFilter === null
                  ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-300"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
              )}
            >
              <span>Бүгд</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                selectedVariantFilter === null ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {variantBreakdown.totalQuantity} ш
              </span>
            </button>

            {/* Per-variant pills */}
            {variantBreakdown.items.map((item) => {
              const isSelected = selectedVariantFilter === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedVariantFilter(isSelected ? null : item.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border shadow-2xs cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 scale-[1.02]"
                      : "bg-white text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-200 border-slate-200"
                  )}
                >
                  <Tag className={cn("w-3 h-3", isSelected ? "text-indigo-200" : "text-indigo-500")} />
                  <span>{item.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                    isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                  )}>
                    {item.totalQuantity} ш
                  </span>
                  <span className={cn("text-[10px] opacity-75 font-medium", isSelected ? "text-indigo-100" : "text-slate-400")}>
                    ({item.orderCount} захиалга • {item.percentage}%)
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. FILTERS AND BULK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative md:w-1/3">
          <Input 
            placeholder="Хайх (Нэр, утас, данс, Size, огноо)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border-slate-200"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:w-2/3 justify-end lg:items-center">
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <GroupAdminDeliveryButton 
              selectedOrderIds={selectedIds} 
              onUpdated={() => {
                 setSelectedIds([])
                 window.location.reload()
              }} 
            />
            <PrintLabelsButton orders={filteredOrders.filter(o => selectedIds.includes(o.id))} />
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

      {/* 3. ORDERS TABLE */}
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
              <th className="px-4 py-3">Захиалгын дугаар</th>
              <th className="px-4 py-3">Хэрэглэгч</th>
              <th className="px-4 py-3 text-center">Сонголт / Size</th>
              <th className="px-4 py-3 text-center">Тоо</th>
              <th className="px-4 py-3">Данс</th>
              <th className="px-4 py-3 text-center">Гүйлгээний утга</th>
              <th className="px-4 py-3 text-center">Статус</th>
              <th className="px-4 py-3 text-center">Хаяг</th>
              <th className="px-4 py-3 text-center">Карго үнэ</th>
              <th className="px-4 py-3 text-center">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: any) => {
                const unitCargoFee = Number(batch.cargoFeeStatus || 0) * Number(batch.product?.weight || 0);
                const orderCustomFee = Number(order.cargoFee || 0);
                const baseTotal = unitCargoFee * Number(order.quantity || 1);
                const finalCargoFee = orderCustomFee > 0 ? orderCustomFee * Number(order.quantity || 1) : baseTotal;
                const isChecked = selectedIds.includes(order.id)
                const hasOptions = order.selectedOptions && Object.keys(order.selectedOptions).length > 0

                return (
                <tr key={order.id} className={`border-b border-slate-100 transition-colors ${isChecked ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                  {/* Select Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={isChecked}
                      onChange={() => toggleOne(order.id)}
                    />
                  </td>

                  {/* Order Number & Source */}
                  <td className="px-4 py-4 font-semibold text-slate-700 cursor-pointer" onClick={() => toggleOne(order.id)}>
                    <div>
                      <span>#{order.orderNumber}</span>
                      <p className="text-[10px] text-slate-400 font-normal">
                        {order.creationSource === "ADMIN" ? `Админ: ${order.createdByAdmin || "Тийм"}` : "Вэб захиалга"}
                      </p>
                    </div>
                  </td>

                  {/* Customer Info & Date */}
                  <td className="px-4 py-4 min-w-[180px] cursor-pointer" onClick={() => toggleOne(order.id)}>
                    <div className="space-y-0.5">
                      <p className="text-slate-900 text-sm font-bold uppercase">{order.customerName}</p>
                      <p 
                        className="text-indigo-600 font-bold hover:underline cursor-pointer inline-block text-xs" 
                        onClick={(e) => { e.stopPropagation(); setProfilePhone(order.customerPhone); }}
                      >
                        📞 {order.customerPhone}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString("mn-MN")} {new Date(order.createdAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </p>
                    </div>
                  </td>

                  {/* Option / Size Badge Column */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {hasOptions ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {formatSelectedOptions(order.selectedOptions)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">-</span>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-4 font-extrabold text-center text-slate-900 text-sm">
                    {order.quantity} ш
                  </td>

                  {/* Account */}
                  <td className="px-4 py-4 text-slate-500 font-medium text-xs">
                    {order.accountNumber || "-"}
                  </td>

                  {/* Ref */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {order.transactionRef || "-"}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-4 min-w-[140px] text-center">
                    <div className="flex justify-center">
                      <Select 
                        defaultValue={order.statusId || "none"} 
                        onValueChange={(val) => handleSingleStatusChange(order.id, val)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full sm:w-[140px] bg-slate-50 border-slate-200 h-8 text-xs">
                          <SelectValue placeholder="Төлөв">
                            {order.statusId ? (
                              <StatusBadge status={statuses.find((s: any) => s.id === order.statusId)?.name || ""} color={statuses.find((s: any) => s.id === order.statusId)?.color} />
                            ) : "Сонгох..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s: any) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              <StatusBadge status={s.name} color={s.color} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-4 text-center max-w-[150px] truncate text-xs text-slate-500" title={order.deliveryAddress || ""}>
                    {order.deliveryAddress || "-"}
                  </td>

                  {/* Cargo Fee */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                     <span className="font-semibold text-slate-800 text-xs">{finalCargoFee.toLocaleString()} ₮</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-center space-x-1.5 whitespace-nowrap">
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
                <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                  {selectedVariantFilter ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">Энэ сонголтод захиалга олдсонгүй.</p>
                      <button onClick={() => setSelectedVariantFilter(null)} className="text-xs text-indigo-600 underline font-bold">Бүх захиалгыг харах</button>
                    </div>
                  ) : (
                    "Энэ багцад бүртгэгдсэн захиалга олдсонгүй."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CustomerProfileModal phone={profilePhone} isOpen={!!profilePhone} onClose={() => setProfilePhone(null)} />

      {/* EDIT ORDER SHEET */}
      <Sheet open={!!editingOrder} onOpenChange={(open) => !open && !loading && setEditingOrder(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Захиалга засах (#{editingOrder?.orderNumber})</SheetTitle>
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

              {/* Dynamic options selection when editing */}
              {normOptions.length > 0 && (
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-indigo-600" />
                    Сонголт / Size өөрчлөх
                  </p>
                  {normOptions.map((opt) => {
                    const currentVal = editingOrder.selectedOptions?.[opt.name] || opt.values[0]
                    return (
                      <div key={opt.name} className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">{opt.name}</label>
                        <select
                          name={`option_${opt.name}`}
                          defaultValue={currentVal}
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {opt.values.map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )}

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
