"use client"

import { useState } from "react"
import { toggleOrderRefund } from "@/app/actions/order-actions"
import { ExternalLink, CreditCard, Banknote, User, Phone, CheckCircle2, RotateCcw, Box } from "lucide-react"
import Link from "next/link"

export function RefundList({ pending, completed }: { pending: any[], completed: any[] }) {
  const [tab, setTab] = useState<"pending" | "completed">("pending")
  const data = tab === "pending" ? pending : completed
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleRefund = async (orderId: string, isRefunded: boolean) => {
    setLoadingId(orderId)
    const res = await toggleOrderRefund(orderId, isRefunded)
    if (!res.success) {
      alert(res.error || "Алдаа гарлаа")
    }
    setLoadingId(null)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${tab === "pending" ? "bg-white text-rose-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
        >
          Хүлээгдэж байна ({pending.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${tab === "completed" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
        >
          Буцаагдсан ({completed.length})
        </button>
      </div>

      {data.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">Одоогоор энэ жагсаалт хоосон байна</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Захиалга & Бараа</th>
                <th className="px-6 py-4">Хэрэглэгч & Холбогдох</th>
                <th className="px-6 py-4">Төлбөр</th>
                <th className="px-6 py-4 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link href={`/admin/orders/${order.id}`} className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        #{order.orderNumber}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Box className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{order.batch?.product?.name || "Тодорхойгүй бараа"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                        <User className="w-4 h-4 text-slate-400" />
                        {order.customerName}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs text-rose-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-rose-400" />
                        {order.customerPhone} 
                        <span className="text-slate-400 ml-1">гэж залгаж дансаа асууна уу</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        ₮{Number(order.totalAmount).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                        {order.accountNumber ? `Данснаас: ${order.accountNumber}` : "Данс: Тодорхойгүй (Асуух)"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {tab === "pending" ? (
                      <button
                        onClick={() => handleToggleRefund(order.id, true)}
                        disabled={loadingId === order.id}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors border border-emerald-200 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {loadingId === order.id ? "Хадгалж байна..." : "Мөнгө шилжүүлэв"}
                      </button>
                    ) : (
                      <button
                         onClick={() => {
                           if (window.confirm("Энэ захиалгын буцаалтыг цуцлах уу? (Хүлээгдэж буй жагсаалт руу буцна)")) {
                             handleToggleRefund(order.id, false)
                           }
                         }}
                         disabled={loadingId === order.id}
                         className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 font-medium px-4 py-2 rounded-lg text-xs transition-colors border border-transparent hover:border-slate-200 hover:bg-white disabled:opacity-50"
                      >
                         <RotateCcw className="w-4 h-4" />
                         {loadingId === order.id ? "Уншиж байна..." : "Буцаах"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
