"use client"

import { useState } from "react"
import { Truck, User } from "lucide-react"
import { GroupPendingActions } from "./GroupPendingActions"

export function PendingOrderGroup({ groupOrders }: { groupOrders: any[] }) {
  // Initialize with all order IDs selected
  const [selectedIds, setSelectedIds] = useState<string[]>(
    groupOrders.map(o => o.id)
  )

  const first = groupOrders[0]
  const wantsDelivery = groupOrders.some((o: any) => o.wantsDelivery)
  const deliveryAddress = groupOrders.find((o: any) => o.deliveryAddress)?.deliveryAddress

  // Compute total amount based on selected items
  const selectedOrders = groupOrders.filter(o => selectedIds.includes(o.id))
  const totalAmount = selectedOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)

  const toggleOrder = (orderId: string) => {
    setSelectedIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === groupOrders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(groupOrders.map(o => o.id))
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 ${
        wantsDelivery ? "border-l-blue-400" : "border-l-emerald-400"
      }`}
    >
      {/* Customer Header */}
      <div className="bg-slate-50 border-b px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.length === groupOrders.length && groupOrders.length > 0}
            ref={input => {
              if (input) {
                input.indeterminate = selectedIds.length > 0 && selectedIds.length < groupOrders.length;
              }
            }}
            onChange={toggleAll}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            title="Бүгдийг сонгох/арилгах"
          />
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900">{first.customerName}</span>
            <span className="text-slate-400 mx-2">·</span>
            <span className="text-slate-500 text-sm">{first.customerPhone}</span>
            {first.accountNumber && (
              <>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-500 text-sm font-mono">{first.accountNumber}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Хүлээгдэж байна
          </span>
          {wantsDelivery && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Truck className="w-3 h-3" /> Хүргэлт
            </span>
          )}
          <span className="font-bold text-indigo-600 text-sm">
            {selectedIds.length} сонгогдсон ₮{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Orders list */}
      <div className="divide-y">
        {groupOrders.map((order: any) => (
          <div
            key={order.id}
            className={`px-5 py-4 transition-colors ${
              selectedIds.includes(order.id) ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-3 flex-wrap">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(order.id)}
                  onChange={() => toggleOrder(order.id)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`font-semibold ${selectedIds.includes(order.id) ? "text-slate-800" : "text-slate-500 line-through decoration-slate-300"}`}>
                    {order.batch?.product?.name}
                  </span>
                  <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                  {order.batch?.category?.name && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 font-medium capitalize">
                      {order.batch.category.name}
                    </span>
                  )}
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm ${selectedIds.includes(order.id) ? "" : "opacity-60"}`}>
                  <div>
                    <span className="text-slate-400 text-xs block">Тоо</span>
                    <span className="font-medium text-slate-800">{order.quantity} ш</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Дүн</span>
                    <span className="font-semibold text-indigo-600">₮{Number(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Гүйлгээний утга</span>
                    <span className="font-mono text-xs font-semibold text-slate-700 tracking-wider">
                      {order.transactionRef || order.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Огноо</span>
                    <span className="text-xs text-slate-500" suppressHydrationWarning>
                      {new Date(order.createdAt).toLocaleString("mn-MN")}
                    </span>
                  </div>
                </div>
                {order.paymentProofUrl && (
                  <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline">
                    📎 Төлбөрийн баримт харах
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery address (shared) */}
      {deliveryAddress && (
        <div className="bg-blue-50 border-t px-5 py-2.5 text-sm text-blue-700 flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Хүргэлтийн хаяг: <strong>{deliveryAddress}</strong></span>
        </div>
      )}

      {/* Single grouped confirm / reject button */}
      <div className="border-t px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/60">
        <p className="text-xs text-slate-500">
          {selectedIds.length > 0 
            ? selectedIds.length > 1
              ? `${selectedIds.length} бараа сонгосон байна`
              : "Захиалгын төлбөрийг шалгаад баталгаажуулна уу"
            : "Бараа сонгоогүй байна (үйлдэл хийгдэхгүй)"}
        </p>
        <GroupPendingActions orderIds={selectedIds} />
      </div>
    </div>
  )
}
