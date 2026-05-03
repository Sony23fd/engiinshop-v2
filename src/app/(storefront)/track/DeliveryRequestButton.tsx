"use client"

import { useState } from "react"
import { Truck, Copy, CheckCircle2, QrCode, Loader2 } from "lucide-react"
import { requestDelivery, checkDeliveryPayment, confirmManualDeliveryRequest } from "@/app/actions/order-actions"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { getUpcomingDeliveryDates } from "@/lib/utils"

export default function DeliveryRequestButton({ orderIds, deliveryScheduleDays = "3,6" }: { orderIds: string[], deliveryScheduleDays?: string }) {
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [qrData, setQrData] = useState<{ text: string, urls: any[], invoiceId: string } | null>(null)
  const [manualData, setManualData] = useState<any>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [copiedData, setCopiedData] = useState("")




  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedData(text)
    toast({ title: "Амжилттай хуулагдлаа!", description: text })
    setTimeout(() => setCopiedData(""), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) return
    setLoading(true)
    setError(null)
    const res = await requestDelivery(orderIds, address, selectedDeliveryDate || undefined)
    setLoading(false)
    if (res.success) {
      const data = res as any;
      if (data.directlyConfirmed) {
        setDone(true)
        setOpen(false)
      } else if (data.isManual) {
        setManualData(data.manualData)
      } else if (data.invoiceId) {
        setQrData({ text: data.qpayQrText, urls: data.qpayUrls, invoiceId: data.invoiceId })
      }
    } else {
      setError(res.error || "Алдаа гарлаа")
    }
  }

  async function verifyPayment() {
    if (!qrData) return
    setCheckingPayment(true)
    setError(null)
    const res = await checkDeliveryPayment(orderIds, qrData.invoiceId)
    setCheckingPayment(false)
    if (res.success && res.paid) {
      setDone(true)
      setQrData(null)
      setOpen(false)
    } else if (res.success && !res.paid) {
      setError("Төлбөр хараахан төлөгдөөгүй байна. Дахин шалгана уу.")
    } else {
      setError(res.error || "Төлбөр шалгах үед алдаа гарлаа")
    }
  }

  async function handleManualConfirm() {
    setLoading(true)
    const res = await confirmManualDeliveryRequest(orderIds, address, selectedDeliveryDate || undefined)
    setLoading(false)
    if (res.success) {
      setDone(true)
      setManualData(null)
      setOpen(false)
    } else {
      setError(res.error || "Алдаа гарлаа")
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
        <Truck className="w-4 h-4 mt-0.5" />
        <div>
          <p className="font-semibold">Хүргэлт амжилттай захиалагдлаа!</p>
          <p className="text-xs text-green-600">Таны бараа удахгүй хүргэгдэх болно.</p>
        </div>
      </div>
    )
  }

  if (manualData) {
    return (
      <div className="space-y-4 bg-white rounded-xl border p-5 shadow-sm animate-in fade-in">
        <div className="text-center mb-4">
          <p className="font-bold text-slate-800 text-[15px]">Хүргэлтийн хураамж төлөх</p>
          <p className="text-xs text-slate-500 mt-1">{manualData.bank_note || "Доорх данс руу шилжүүлгэ хийж баталгаажуулна уу"}</p>
        </div>

        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 text-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-yellow-700 font-medium">Төлөх дүн:</span>
            <span className="font-bold text-lg">{Number(manualData.fee).toLocaleString()} ₮</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
            <span className="text-yellow-700 font-medium">Банк:</span>
            <span className="font-bold">{manualData.bank_name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
            <span className="text-yellow-700 font-medium">Данс:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{manualData.bank_account}</span>
              <button
                onClick={() => copyToClipboard(manualData.bank_account)}
                className="flex items-center gap-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded text-[10px] uppercase font-bold transition-colors"
              >
                {copiedData === manualData.bank_account ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedData === manualData.bank_account ? "Хуулсан" : "Хуулах"}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
            <span className="text-yellow-700 font-medium">Дансны нэр:</span>
            <span className="font-bold">{manualData.bank_holder}</span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 text-center">{error}</p>
        )}

        <button
          onClick={handleManualConfirm}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          {loading ? "Түр хүлээнэ үү..." : "Би шилжүүлсэн"}
        </button>
      </div>
    )
  }

  if (qrData) {
    return (
      <div className="space-y-4 bg-white rounded-xl border p-4 shadow-sm animate-in fade-in">
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm">Хүргэлтийн хураамж төлөх</p>
          <p className="text-xs text-slate-500 mt-1">Доорх QR кодыг уншуулж төлбөрөө төлнө үү</p>
        </div>

        <div className="flex justify-center bg-white p-2 rounded-xl mx-auto w-fit border">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData.text)}`}
            alt="QPay QR"
            className="w-40 h-40 object-contain"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {qrData.urls?.map((item: any, idx: number) => (
            <a
              key={idx}
              href={item.link}
              className="flex flex-col items-center justify-center p-2 rounded-xl border bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <img src={item.logo} alt={item.name} className="w-8 h-8 rounded-lg mb-1" />
              <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">{item.name}</span>
            </a>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 text-center">{error}</p>
        )}

        <button
          onClick={verifyPayment}
          disabled={checkingPayment}
          className="w-full py-2.5 bg-[#002f5a] text-white text-sm font-semibold rounded-xl hover:bg-[#001f3f] transition-colors flex items-center justify-center gap-2"
        >
          {checkingPayment ? "Шалгаж байна..." : "Төлбөр төлсөн (Шалгах)"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <div className="space-y-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Truck className="w-4 h-4" />
            Хүргэлт захиалах
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-indigo-50 rounded-xl border border-indigo-100 p-4 animate-in fade-in">
          <label className="block text-sm font-semibold text-slate-800">
            🏠 Хүргүүлэх хаяг оруулна уу
          </label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            required
            placeholder="Дүүрэг, хороо, хаяг, утасны дугаар..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <label className="block text-sm font-semibold text-slate-800 mt-2">
            📅 Хүргэлт гарах өдрийг сонгоно уу.
          </label>
          <div className="grid grid-cols-1 gap-2">
            {getUpcomingDeliveryDates(deliveryScheduleDays, 2).map((opt, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedDeliveryDate === opt.date.toISOString() ? 'border-indigo-500 bg-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="deliveryDateChoice"
                  className="mt-1"
                  required
                  checked={selectedDeliveryDate === opt.date.toISOString()}
                  onChange={() => setSelectedDeliveryDate(opt.date.toISOString())}
                  value={opt.date.toISOString()}
                />
                <div>
                  <p className={`text-sm font-bold ${selectedDeliveryDate === opt.date.toISOString() ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.formatted}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Товлосон өдрөөс хойш 24-72ц дотор</p>
                </div>
              </label>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Захиалж байна..." : "Батлах"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
            >
              Болих
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
