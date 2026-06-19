import { getShopSettings } from "@/app/actions/settings-actions"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Clock, AlertCircle } from "lucide-react"
import { ManualPaymentClient } from "./ManualPaymentClient"
import { PaymentConfirmationClient } from "./PaymentConfirmationClient"

export const dynamic = "force-dynamic"

export default async function ManualCheckoutPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  
  const orders = await db.order.findMany({
    where: { transactionRef: ref }
  })

  if (!orders || orders.length === 0) {
    notFound()
  }

  const settings = await getShopSettings()
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  return (
    <div className="max-w-xl mx-auto px-4 py-20 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8 relative overflow-hidden">
        {/* Pending header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Таны захиалга хүлээн авлаа</h1>
          <p className="text-slate-500">
            Таны төлбөр төлөгдсөнөөр захиалга баталгаажна.
          </p>
        </div>

        {/* Amount */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
          <p className="text-indigo-600 text-sm font-semibold mb-1">ТӨЛБӨР ТӨЛӨХ ДҮН</p>
          <div className="text-4xl font-black text-indigo-900 font-mono">
            ₮{totalAmount.toLocaleString()}
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0 border border-slate-200 mt-1">1</div>
            <div className="flex-1 space-y-3">
              <h3 className="font-bold text-slate-800 text-lg">Дансны мэдээлэл</h3>
              <p className="text-sm text-slate-500">Доорх данс руу шилжүүлэг хийнэ үү.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Хүлээн авагч банк</p>
                  <p className="font-medium text-slate-800">{settings.bank_name || "Хаан банк"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Дансны нэр</p>
                  <p className="font-medium text-slate-800">{settings.bank_holder || "Байгууллага"}</p>
                </div>
                <div className="sm:col-span-2 pt-2">
                  <ManualPaymentClient label="Дансны дугаар" value={settings.bank_account || "Данс оруулаагүй байна"} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0 border border-slate-200 mt-1">2</div>
            <div className="flex-1 space-y-3">
              <h3 className="font-bold text-slate-800 text-lg">Гүйлгээний утга (Маш чухал!)</h3>
              <p className="text-sm text-slate-500">Гүйлгээний утга дээр <strong>ЗӨВХӨН</strong> доорх кодыг хуулж тавина уу.</p>
              <div className="bg-red-50 border-2 border-red-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Маш чухал</div>
                <div className="mb-3 mt-2">
                  <ManualPaymentClient value={ref} large />
                </div>
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                  ⚠️ Хэрэв та өөр зүйл бичвэл таны захиалга системд танигдахгүй бөгөөд баталгаажихгүй болохыг хатуу анхаарна уу!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0 border border-slate-200 mt-1">3</div>
            <div className="flex-1 space-y-3 pt-1">
              <h3 className="font-bold text-slate-800 text-lg">Баталгаажуулах</h3>
              <PaymentConfirmationClient />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
