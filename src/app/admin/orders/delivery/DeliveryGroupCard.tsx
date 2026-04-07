"use client"

import { useState } from "react"
import { User, Truck } from "lucide-react"
import { GroupDeliveryActions } from "./GroupDeliveryActions"

export function DeliveryGroupCard({ groupOrders }: { groupOrders: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(groupOrders.map(o => o.id))

  const first = groupOrders[0]
  const deliveryAddress = groupOrders.find((o: any) => o.deliveryAddress)?.deliveryAddress

  const allSelected = selectedIds.length === groupOrders.length
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleAll() {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(groupOrders.map(o => o.id))
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 border-l-amber-400`}>
      {/* Customer Header */}
      <div className="bg-slate-50 border-b px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <span className="font-bold text-slate-900">{first.customerName}</span>
               <span className="text-slate-400">·</span>
               <span className="text-slate-500 text-sm font-semibold">{first.customerPhone}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
              <p>⏱️ Хүсэлт өгсөн: <span className="font-medium text-slate-500" suppressHydrationWarning>{new Date(first.deliveryRequestedAt || first.updatedAt).toLocaleString("mn-MN")}</span></p>
              {first.deliveryDate && (
                <p>📅 Хүргүүлэх өдөр: <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded" suppressHydrationWarning>{new Date(first.deliveryDate).toLocaleDateString("mn-MN")}</span></p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Truck className="w-3 h-3" /> Хүргэлтэнд бэлтгэх
          </span>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y">
        <div className="px-5 py-2 bg-slate-50/50 flex items-center gap-3 border-b">
           <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              checked={allSelected}
              ref={input => { if (input) input.indeterminate = someSelected }}
              onChange={toggleAll}
            />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Бүгдийг сонгох</span>
        </div>
        {groupOrders.map((order: any) => {
          const isChecked = selectedIds.includes(order.id)
          return (
          <div key={order.id} className={`px-5 py-4 transition-colors ${isChecked ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="mt-1">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  checked={isChecked}
                  onChange={() => toggleOne(order.id)}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 cursor-pointer" onClick={() => toggleOne(order.id)}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-800">{order.batch?.product?.name}</span>
                  <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Тоо</span>
                    <span className="font-medium text-slate-800">{order.quantity} ш</span>
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <span className="text-slate-400 text-xs block">Хүргүүлэх хаяг</span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-1 rounded">{deliveryAddress || "Хаяг оруулаагүй байна!"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Confirm Delivery button */}
      <div className="border-t px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/60">
        <p className="text-xs text-slate-400">
          Сонгосон <strong className="text-slate-600">{selectedIds.length}</strong> захиалгыг хүргэлтэнд гаргаж, эзэнд нь хүлээлгэн өгсөн бол баталгаажуулна уу
        </p>
        <GroupDeliveryActions orderIds={selectedIds} />
      </div>
    </div>
  )
}
