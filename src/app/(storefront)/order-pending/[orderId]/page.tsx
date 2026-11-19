import { getOrderForPayment, getShopSettings } from "@/app/actions/settings-actions"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, AlertCircle, CreditCard } from "lucide-react"
import { CopyButton } from "./CopyButton"

export const dynamic = "force-dynamic"

export default async function OrderPendingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const [{ order, success }, settings] = await Promise.all([
    getOrderForPayment(orderId),
    getShopSettings()
  ])

  if (!success || !order) notFound()

  const totalAmount = Number(order.totalAmount || 0)
  const transactionRef = order.transactionRef ?? order.id.slice(-8).toUpperCase()
  const paymentStatus = order.paymentStatus

  if (paymentStatus === "CONFIRMED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Захиалга баталгаажлаа! 🎉</h1>
          <p className="text-slate-500 text-sm mb-6">Таны төлбөр хүлээн авагдаж, захиалга баталгаажлаа.</p>
          <p className="text-xs text-slate-400">Гүйлгээний утга: <span className="font-mono font-semibold">{transactionRef}</span></p>
        </div>
      </div>
    )
  }

  if (paymentStatus === "REJECTED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Захиалга цуцлагдлаа</h1>
          <p className="text-slate-500 text-sm">Төлбөр баталгаажаагүй тул захиалга цуцлагдлаа. Дэлгэрэнгүй мэдээлэл авахыг хүсвэл бидэнтэй холбогдоно уу.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">

        {/* Status header */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Төлбөр хүлээгдэж байна</p>
            <p className="text-amber-600 text-xs mt-0.5">Төлбөр орсны дараа админ баталгаажуулна</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" /> Захиалгын дэлгэрэнгүй
          </h2>
          <div className="space-y-2 text-sm">
            <Row label="Захиалагч" value={order.customerName} />
            <Row label="Бараа" value={order.batch?.product?.name ?? "Бараа"} />
            <Row label="Тоо" value={`${order.quantity} ширхэг`} />
            <Row label="Хүргэлт" value={order.wantsDelivery ? "Хүргэлтээр" : "Өөрөө ирнэ"} />
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Нийт төлбөр</span>
            <span className="text-xl font-bold text-indigo-600">₮{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment instructions */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-900">💳 Төлбөрийн мэдээлэл</h2>

          {/* QR placeholder */}
          <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
            <div className="text-slate-300 text-4xl mb-1">⬛</div>
            <p className="text-[10px] text-slate-400 text-center">QPay QR энд<br/>удахгүй байрлана</p>
          </div>

          {/* Bank details */}
          <div className="space-y-3">
            {/* Step 1: Transaction Note First */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-red-700 font-bold uppercase tracking-wider">1. Гүйлгээний утга (Эхлээд хуулна уу)</p>
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Маш чухал</span>
              </div>
              <p className="text-[11px] text-red-600 mb-2">Банкны апп дээрээ гүйлгээний утга дээр ЗӨВХӨН энэ кодыг бичнэ:</p>
              <div className="flex items-center justify-between gap-2 bg-white border border-red-200 rounded-lg px-3 py-2">
                <span className="font-mono font-bold text-red-950 text-base tracking-wider select-all">{transactionRef}</span>
                <CopyButton text={transactionRef} />
              </div>
            </div>

            {/* Step 2: Bank details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <p className="text-xs text-slate-700 font-bold uppercase tracking-wider">2. Дансны мэдээлэл (Шилжүүлэг хийх)</p>
              <PaymentRow label="Банк" value={settings.bank_name || "—"} />
              <PaymentRow label="Дансны дугаар" value={settings.bank_account || "—"} copyable />
              <PaymentRow label="Хүлээн авагч" value={settings.bank_holder || "—"} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p>1. Эхлээд гүйлгээний утга <strong>{transactionRef}</strong> кодыг хуулж авна</p>
            <p>2. Дээрх данс руу <strong>₮{totalAmount.toLocaleString()}</strong> шилжүүлнэ</p>
            <p>3. Админ гүйлгээг шалгаад захиалгыг баталгаажуулна</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Асуулт байвал: <span className="text-indigo-500 font-medium">{settings.shop_phone || settings.shop_secondary_phone || "+976 8853 9667"}</span>
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}

function PaymentRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-800 text-sm">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  )
}
