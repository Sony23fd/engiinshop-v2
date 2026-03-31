"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Truck, ShoppingBag, AlertCircle, Info } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { createOrder } from "@/app/actions/order-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Package } from "lucide-react"

interface Props {
  batchId: string
  unitPrice: number
  deliveryFee: number
  remainingQuantity: number
  termsOfService?: string
  deliveryTerms?: string
  isPreOrder?: boolean
}

export function ProductOrderForm({ batchId, unitPrice, deliveryFee, remainingQuantity, termsOfService, deliveryTerms, isPreOrder }: Props) {
  const router = useRouter()
  const { removeItem } = useCart()
  const { toast } = useToast()
  const [wantsDelivery, setWantsDelivery] = useState(false)
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const itemTotal = qty * unitPrice
  const totalAmount = itemTotal + (wantsDelivery ? deliveryFee : 0)

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 8) {
      setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
    } else {
      setPhoneError(null)
    }
  }

  const canSubmit =
    agreedToTerms &&
    !phoneError &&
    (isPreOrder || remainingQuantity > 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const data = new FormData(e.currentTarget)
    const phone = (data.get("phoneNumber") as string || "").replace(/\D/g, "")
    if (phone.length !== 8) {
      setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
      return
    }

    if (!agreedToTerms) {
      setError("Нөхцөлүүдтэй зөвшөөрнө үү")
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await createOrder({
      customerName: data.get("customerName") as string,
      phoneNumber: phone,
      accountNumber: data.get("accountNumber") as string,
      deliveryAddress: wantsDelivery ? (data.get("deliveryAddress") as string) : "Өөрөө ирж авна",
      quantity: qty,
      totalAmount,
      batchId,
      wantsDelivery: isPreOrder ? false : wantsDelivery,
    })

    if (result.success) {
      removeItem(batchId)
      const orderId = result.order?.id
      toast({ title: "Амжилттай", description: "Захиалга үүсгэлээ." })
      setIsRedirecting(true)
      router.push(orderId ? `/order-pending/${orderId}` : "/order-success")
    } else {
      setError(result.error ?? "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#4F46E5] rounded-full border-t-transparent animate-spin"></div>
          <Package className="absolute inset-0 m-auto w-6 h-6 text-[#4F46E5] animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Захиалга үүсгэж байна...</h3>
        <p className="text-slate-500 text-sm">Төлбөрийн хуудас руу шилжиж байна</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Accuracy notice */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2.5">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          Мэдээллээ <strong>үнэн зөв</strong> оруулна уу. Утасны дугаар болон дансны дугаар нь таны захиалгыг баталгаажуулах гол баримт болно.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="customerName">Таны нэр</label>
          <Input id="customerName" name="customerName" required placeholder="Жишээ: Отгоо" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="phoneNumber">Утасны дугаар</label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            required
            maxLength={8}
            placeholder="8 оронтой тоо"
            onChange={e => validatePhone(e.target.value)}
            className={phoneError ? "border-red-400 focus-visible:ring-red-300" : ""}
          />
          {phoneError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {phoneError}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="accountNumber">Төлбөр төлсөн дансны дугаар</label>
        <Input id="accountNumber" name="accountNumber" required placeholder="Дансны дугаараа бичнэ үү" />
        <p className="text-xs text-slate-400 flex items-start gap-1.5">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          Захиалгаа шалгах гол мэдээлэл — үнэн зөв оруулна уу.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Тоо ширхэг</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">−</button>
          <span className="min-w-[32px] text-center font-bold text-slate-900">{qty}</span>
          <button type="button" onClick={() => setQty(q => Math.min(remainingQuantity, q + 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">+</button>
          <span className="text-xs text-slate-400">/ {remainingQuantity} ш үлдсэн</span>
        </div>
      </div>

      {/* Delivery Type */}
      {!isPreOrder ? (
        <div className="space-y-3">
          <label className="text-sm font-medium">Хүлээн авах хэлбэр</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setWantsDelivery(false) }}
              className={`border-2 rounded-xl p-4 text-center transition-all ${!wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <ShoppingBag className={`w-5 h-5 mx-auto mb-1 ${!wantsDelivery ? "text-indigo-500" : "text-slate-400"}`} />
              <p className="text-sm font-semibold text-slate-700">Өөрөө ирнэ</p>
              <p className="text-xs text-slate-400">Нэмэлт үнэгүй</p>
            </button>
            <button type="button" onClick={() => setWantsDelivery(true)}
              className={`border-2 rounded-xl p-4 text-center transition-all ${wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <Truck className={`w-5 h-5 mx-auto mb-1 ${wantsDelivery ? "text-indigo-500" : "text-slate-400"}`} />
              <p className="text-sm font-semibold text-slate-700">Хүргэлтээр</p>
              {deliveryFee > 0
                ? <p className={`text-xs font-medium ${wantsDelivery ? "text-indigo-500" : "text-slate-400"}`}>+₮{deliveryFee.toLocaleString()}</p>
                : <p className="text-xs text-green-500 font-medium">Үнэгүй</p>
              }
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>Урьдчилсан захиалга:</strong> Таны сонгосон бараа Монголд ирсний дараа хүргэлтийн асуудал тусад нь шийдэгдэх болно. Яг одоо хүргэлт сонгох боломжгүй.
            </div>
          </div>
        </div>
      )}

      {/* Address — only when delivery is selected OR if it is preorder to collect address in advance optionally? Actually user explicitly says no delivery option now */}
      {wantsDelivery && !isPreOrder && (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="deliveryAddress">Хүргүүлэх хаяг</label>
          <Textarea id="deliveryAddress" name="deliveryAddress" required rows={2}
            placeholder="Хот, Дүүрэг, Хороо, Байр, Тоот..." className="resize-none" />
        </div>
      )}

      {/* Combined Terms — shown ABOVE total */}
      {(termsOfService || (wantsDelivery && deliveryTerms)) && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          {termsOfService && (
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Үйлчилгээний нөхцөл:</strong> {termsOfService}
            </p>
          )}
          {wantsDelivery && deliveryTerms && (
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Хүргэлтийн нөхцөл:</strong> {deliveryTerms}
            </p>
          )}
          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 accent-indigo-600"
            />
            <span className="text-xs text-slate-700 font-medium">Дээрх нөхцөлүүдтэй танилцаж, зөвшөөрч байна</span>
          </label>
        </div>
      )}

      {/* Total */}
      <div className="bg-slate-50 rounded-xl p-4 border space-y-1.5">
        <div className="flex justify-between text-sm text-slate-500">
          <span>₮{unitPrice.toLocaleString()} × {qty}</span>
          <span>₮{itemTotal.toLocaleString()}</span>
        </div>
        {wantsDelivery && !isPreOrder && deliveryFee > 0 && (
          <div className="flex justify-between text-sm text-slate-500">
            <span>Хүргэлт</span>
            <span>+₮{deliveryFee.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-slate-900 text-base border-t pt-2">
          <span>Нийт төлөх</span>
          <span className="text-indigo-600">₮{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting || !canSubmit}
        className="w-full bg-[#4F46E5] hover:bg-[#4338ca] py-6 text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Илгээж байна..." : (isPreOrder || remainingQuantity > 0) ? "✅ Захиалга баталгаажуулах" : "Дууссан"}
      </Button>

      {!agreedToTerms && (
        <p className="text-center text-xs text-slate-400">Үйлчилгээний нөхцөлтэй зөвшөөрснөөр захиалгаа дуусгана уу</p>
      )}
    </form>
  )
}
