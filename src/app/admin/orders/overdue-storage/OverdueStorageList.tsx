"use client"

import { useState } from "react"
import { updateOrderAdminNotes } from "@/app/actions/order-actions"
import { Phone, Clock, FileEdit, Copy } from "lucide-react"

export function OverdueStorageList({ orders }: { orders: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSaveNotes = async (orderId: string) => {
    setLoading(true)
    const res = await updateOrderAdminNotes(orderId, notes)
    if (!res.success) {
      alert("Алдаа гарлаа: " + res.error)
    } else {
      setEditingId(null)
    }
    setLoading(false)
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    alert("Хуулагдлаа: " + phone)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 whitespace-nowrap">
            <tr>
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3">Харилцагч</th>
              <th className="px-4 py-3">Хүлээгдсэн</th>
              <th className="px-4 py-3">Тэмдэглэл</th>
              <th className="px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const daysWaiting = Math.floor((new Date().getTime() - new Date(order.updatedAt).getTime()) / (1000 * 3600 * 24))
              
              return (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="font-medium text-slate-900">
                      {order.batch?.product?.name || "Тодорхойгүй"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Тоо: {order.quantity} ширхэг
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-600 font-medium">{order.customerPhone}</span>
                      <button onClick={() => copyPhone(order.customerPhone)} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Дугаар хуулах">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a href={`tel:${order.customerPhone}`} className="p-1 hover:bg-green-100 hover:text-green-600 rounded text-slate-500" title="Залгах">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 w-max px-2 py-1 rounded-md">
                      <Clock className="w-4 h-4" />
                      {daysWaiting} хоног
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[250px]">
                    {editingId === order.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Хэрэглэгчтэй холбогдсон тухай..."
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs bg-slate-100 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Болих
                          </button>
                          <button 
                            onClick={() => handleSaveNotes(order.id)}
                            disabled={loading}
                            className="px-3 py-1.5 text-xs bg-blue-600 font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Хадгалах
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between group min-h-[40px]">
                        <div className="text-slate-700 text-sm whitespace-pre-wrap flex-1 pr-2">
                          {order.adminNotes || <span className="text-slate-400 italic">Тэмдэглэл байхгүй...</span>}
                        </div>
                        <button 
                          onClick={() => {
                            setEditingId(order.id)
                            setNotes(order.adminNotes || "")
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 rounded"
                          title="Тэмдэглэл засах"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/admin/orders/${order.id}`} target="_blank" className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                      Үзэх
                    </a>
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <p>Хугацаа хэтэрч агуулахад удсан бараа олдсонгүй.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
