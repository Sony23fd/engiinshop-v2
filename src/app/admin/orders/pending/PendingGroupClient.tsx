"use client"

import { useState } from "react"
import { Truck } from "lucide-react"
import { GroupPendingActions } from "./GroupPendingActions"

export function PendingGroupClient({ groupOrders, deliveryAddress }: { groupOrders: any[], deliveryAddress?: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(groupOrders.map(o => o.id))

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <>
      {/* Orders list */}
      <div className="divide-y">
        {groupOrders.map((order: any) => (
          <div key={order.id} className={`px-5 py-4 transition-colors ${selectedIds.includes(order.id) ? '' : 'opacity-50 bg-slate-50/50'}`}>
            <div className="flex items-start gap-3 flex-wrap">
              <input
                type="checkbox"
                checked={selectedIds.includes(order.id)}
                onChange={() => toggle(order.id)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-800">{order.batch?.product?.name}</span>
                  <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                  {order.batch?.category?.name && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 font-medium capitalize">
                      {order.batch.category.name}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
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
                    <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("mn-MN")}</span>
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

      {/* Delivery address */}
      {deliveryAddress && (
        <div className="bg-blue-50 border-t px-5 py-2.5 text-sm text-blue-700 flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Хүргэлтийн хаяг: <strong>{deliveryAddress}</strong></span>
        </div>
      )}

      {/* Actions */}
      <div className="border-t px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/60">
        <p className="text-xs text-slate-400">
          {selectedIds.length === 0
            ? "Захиалга сонгоно уу"
            : selectedIds.length < groupOrders.length
              ? `${selectedIds.length} / ${groupOrders.length} захиалга сонгогдсон`
              : groupOrders.length > 1 ? `${groupOrders.length} бараа нэг дор баталгаажуулна` : "Захиалгын төлбөрийг шалгаад баталгаажуулна уу"}
        </p>
        <GroupPendingActions orderIds={selectedIds} />
      </div>
    </>
  )
}
