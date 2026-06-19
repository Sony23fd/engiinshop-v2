"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { getCustomerProfile } from "@/app/actions/customer-actions"
import { Loader2, Phone, AlertTriangle, CheckCircle, Package } from "lucide-react"
import { StatusBadge } from "./StatusBadge"

export function CustomerProfileModal({ phone, isOpen, onClose }: { phone: string | null, isOpen: boolean, onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (phone && isOpen) {
      setLoading(true)
      setError(null)
      getCustomerProfile(phone).then(res => {
        setLoading(false)
        if (res.success) {
          setData(res)
        } else {
          setError(res.error || "Алдаа гарлаа")
        }
      })
    }
  }, [phone, isOpen])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
            <Phone className="w-6 h-6 text-indigo-500" />
            {phone}
          </SheetTitle>
          <SheetDescription>
            Хэрэглэгчийн худалдан авалтын түүх болон статистик
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Мэдээлэл татаж байна...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            {error}
          </div>
        ) : data && data.stats ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Нийт орлого</p>
                <p className="text-xl font-bold text-slate-900">₮{data.stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Захиалгын тоо</p>
                <p className="text-xl font-bold text-slate-900">{data.stats.totalOrders} <span className="text-sm font-normal text-slate-500">удаа</span></p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Амжилттай авсан</p>
                <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {data.stats.completedOrders}
                </p>
              </div>
              <div className={`bg-white p-4 rounded-xl border shadow-sm ${data.stats.cancellationRate > 20 ? 'bg-red-50 border-red-200' : ''}`}>
                <p className="text-xs text-slate-500 mb-1">Цуцлалтын хувь</p>
                <p className={`text-xl font-bold flex items-center gap-2 ${data.stats.cancellationRate > 20 ? 'text-red-600' : 'text-slate-900'}`}>
                  {data.stats.cancellationRate > 20 && <AlertTriangle className="w-5 h-5" />}
                  {data.stats.cancellationRate}%
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-2">Хэрэглэгчийн нэрс</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(data.orders.map((o: any) => o.customerName))).map((name: any, idx) => (
                  <span key={idx} className="bg-slate-100 px-3 py-1 rounded-full text-sm font-medium text-slate-700">{name}</span>
                ))}
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Захиалгын түүх
              </h3>
              <div className="space-y-3">
                {data.orders.map((order: any) => (
                  <div key={order.id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{order.batch?.product?.name || "Тодорхойгүй бараа"}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString()} · {order.quantity} ширхэг</p>
                      </div>
                      <StatusBadge status={order.status?.name || "Шинэ"} color={order.status?.color} />
                    </div>
                    <div className="flex justify-between items-end mt-2 pt-2 border-t">
                      <p className="text-xs text-slate-400 font-mono">Багц: {order.batch?.batchNumber}</p>
                      <p className="font-bold text-indigo-600">₮{Number(order.totalAmount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
