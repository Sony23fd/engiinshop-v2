"use client"

import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { Trash2, Minus, Plus, ShoppingCart, Truck, ShoppingBag, Package, AlertCircle, Info } from "lucide-react"
import { createOrder, validateCartStock } from "@/app/actions/order-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getUpcomingDeliveryDates } from "@/lib/utils"

export function CartClient({ termsOfService, deliveryTerms, qpayEnabled, globalDeliveryFee = 0, deliveryScheduleDays = "3,6" }: { 
  termsOfService?: string; 
  deliveryTerms?: string; 
  qpayEnabled?: boolean;
  globalDeliveryFee?: number;
  deliveryScheduleDays?: string;
}) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCart()
  const router = useRouter()
  const { toast } = useToast()
  const [wantsDelivery, setWantsDelivery] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "")
    setPhoneError(digits.length !== 8 ? "Утасны дугаар заавал 8 оронтой байх ёстой" : null)
  }

  const hasPreOrder = items.some(i => i.isPreOrder)
  const hasInStock = items.some(i => !i.isPreOrder)
  const isMixedCart = hasPreOrder && hasInStock

  // One-time delivery fee = highest delivery fee among cart items, fallback to global if all are 0
  const maxItemFee = items.length > 0 ? Math.max(0, ...items.map(i => i.deliveryFee || 0)) : 0
  const singleDeliveryFee = (wantsDelivery && !hasPreOrder)
    ? (maxItemFee > 0 ? maxItemFee : globalDeliveryFee)
    : 0
  const grandTotal = totalPrice + singleDeliveryFee

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#4F46E5] rounded-full border-t-transparent animate-spin"></div>
          <Package className="absolute inset-0 m-auto w-8 h-8 text-[#4F46E5] animate-pulse" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Захиалга үүсгэж байна...</h2>
        <p className="text-slate-500 text-sm sm:text-base mb-8">Төлбөрийн хуудас руу шилжиж байна, түр хүлээнэ үү</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-9 h-9 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Таны сагс хоосон байна</h1>
        <p className="text-slate-500 mb-8 text-sm">Нүүр хуудсаас бараа сонгоорой</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4338ca] transition-colors">
          <Package className="w-4 h-4" /> Бараа үзэх
        </Link>
      </div>
    )
  }

  async function handleCheckout(formData: FormData) {
    setSubmitting(true)
    setError(null)
    try {
      const customerName = formData.get("customerName") as string
      const phoneNumber = formData.get("phoneNumber") as string
      const accountNumber = formData.get("accountNumber") as string
      const deliveryAddress = formData.get("deliveryAddress") as string

      // Validate stock before placing orders
      const stockCheck = await validateCartStock(items.map(i => ({ batchId: i.batchId, qty: i.qty })))
      if (!stockCheck.success) {
        setError(stockCheck.errors[0])
        setSubmitting(false)
        return
      }

      // Generate one shared transactionRef for all cart orders
      const sharedRef = `ANR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Delivery fee is a ONE-TIME charge — only added to the first order.
      const results = await Promise.all(
        items.map((item, idx) =>
          createOrder({
            customerName,
            phoneNumber,
            accountNumber,
            deliveryAddress: (wantsDelivery && !hasPreOrder) ? deliveryAddress : "Өөрөө ирж авна",
            deliveryDate: (wantsDelivery && !hasPreOrder && selectedDeliveryDate) ? selectedDeliveryDate : undefined,
            quantity: item.qty,
            totalAmount: item.unitPrice * item.qty + (wantsDelivery && !hasPreOrder && idx === 0 ? singleDeliveryFee : 0),
            batchId: item.batchId,
            wantsDelivery: hasPreOrder ? false : wantsDelivery,
            transactionRef: sharedRef,
          })
        )
      )

      const failed = results.find(r => !r.success)
      if (failed) {
        setError(failed.error ?? "Захиалга үүсгэхэд алдаа гарлаа")
        setSubmitting(false)
        return
      }

      toast({ title: "Амжилттай", description: "Захиалгууд үүсгэгдлээ." })
      setIsRedirecting(true)
      clearCart()
      // Redirect to specific page based on QPay availability
      if (qpayEnabled) {
        router.push(`/order-pending/ref/${sharedRef}`)
      } else {
        router.push(`/order-manual/ref/${sharedRef}`)
      }
    } catch (e: any) {
      setError(e.message || "Алдаа гарлаа")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-indigo-500" />
        Миний сагс
        <span className="text-base font-normal text-slate-400">({items.length} бараа)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-3">
          {items.map(item => (
            <div key={item.batchId} className="bg-white rounded-xl border p-4 flex gap-4 items-start">
              <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  {item.isPreOrder && (
                    <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase">Урьдчилсан захиалга</span>
                  )}
                </div>
                <p className="text-sm text-indigo-600 font-semibold mt-1">₮{item.unitPrice.toLocaleString()}</p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => updateQty(item.batchId, item.qty - 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[24px] text-center font-semibold text-slate-900 text-sm">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.batchId, item.qty + 1)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <p className="font-bold text-slate-900">₮{(item.unitPrice * item.qty).toLocaleString()}</p>
                <button
                  onClick={() => removeItem(item.batchId)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const phone = (fd.get("phoneNumber") as string || "").replace(/\D/g, "")
              if (phone.length !== 8) {
                setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой")
                return
              }
              if (!agreedToTerms) { setError("Нөхцөлүүдтэй зөвшөөрнө үү"); return }
              await handleCheckout(fd)
            }}
            className="bg-white rounded-xl border p-6 space-y-5 sticky top-6"
          >
            <h2 className="font-bold text-slate-900 text-lg">Захиалгын мэдээлэл</h2>

            {/* Accuracy notice */}
            <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Мэдээллээ <strong>үнэн зөв</strong> оруулна уу. Утасны болон дансны дугаар нь захиалгыг баталгаажуулах гол баримт болно. Мөн хүргүүлэх хаягаа зөв бичнэ үү. Баярлалаа
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Таны нэр</label>
              <input name="customerName" required placeholder="Жишээ: Отгоо" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Утасны дугаар</label>
              <input
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                required
                maxLength={8}
                placeholder="Утасны дугаар"
                onChange={e => validatePhone(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${phoneError ? "border-red-400 focus:ring-red-300" : "focus:ring-indigo-300"}`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {phoneError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Дансны дугаар</label>
              <input name="accountNumber" required placeholder="Төлбөр төлсөн дансны дугаар" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3 h-3 shrink-0" /> Үнэн зөв оруулна уу
              </p>
            </div>

            {/* Delivery toggle */}
            {!hasPreOrder ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Хүлээн авах хэлбэр</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setWantsDelivery(false)}
                    className={`border-2 rounded-xl p-3 text-center transition-all text-sm ${!wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <ShoppingBag className={`w-4 h-4 mx-auto mb-1 ${!wantsDelivery ? "text-indigo-500" : "text-slate-500"}`} />
                    <p className="font-semibold text-slate-700">Өөрөө ирнэ</p>
                    <p className="text-xs text-slate-400">Үнэгүй</p>
                  </button>
                  <button type="button" onClick={() => setWantsDelivery(true)}
                    className={`border-2 rounded-xl p-3 text-center transition-all text-sm ${wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <Truck className={`w-4 h-4 mx-auto mb-1 ${wantsDelivery ? "text-indigo-500" : "text-slate-500"}`} />
                    <p className="font-semibold text-slate-700">Хүргэлтээр</p>
                    {singleDeliveryFee > 0
                      ? <p className="text-xs text-indigo-500 font-medium">+₮{singleDeliveryFee.toLocaleString()}</p>
                      : <p className="text-xs text-green-500">+Хүргэлтийн үнэ</p>
                    }
                  </button>
                </div>
                {wantsDelivery && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <label className="text-sm font-medium text-slate-700 block mb-2">Хүргүүлэх өдөр сонгох</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getUpcomingDeliveryDates(deliveryScheduleDays, 2).map((opt, i) => (
                        <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedDeliveryDate === opt.date.toISOString() ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
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
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isMixedCart ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start text-amber-800">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold leading-relaxed">
                        Сагсанд урьдчилсан захиалгын бараа орсон тул хүргэлтийн товч хаагдлаа.
                      </p>
                    </div>
                    <p className="text-xs text-amber-700 ml-7 leading-relaxed">
                      Урьдчилан захиалсан барааг Монголд ирсний дараа хүргэлтийг шийдэх бөгөөд бэлэн бараагаа яг одоо хүргүүлэх бол <b>урьдчилсан захиалгаа сагснаасаа устгаж тусад нь захиална уу!</b>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <strong>Урьдчилсан захиалга:</strong> Таны сонгосон бараануудыг Монголд ирсний дараа хүргэлтийн асуудлыг тусад нь шийдэх болно.
                    </div>
                  </div>
                )}
              </div>
            )}

            {wantsDelivery && !hasPreOrder && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Хүргүүлэх хаяг</label>
                  <textarea name="deliveryAddress" required={wantsDelivery} rows={2}
                    placeholder="Дүүрэг, Хороо, Байр, Тоот..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                </div>
              </div>
            )}

            {/* Combined Terms — ABOVE total */}
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
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="accent-indigo-600" />
                  <span className="text-xs text-slate-700 font-medium">Дээрх нөхцөлүүдтэй танилцаж, зөвшөөрч байна</span>
                </label>
              </div>
            )}

            {/* Price Summary */}
            <div className="border-t pt-4 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Барааны нийт</span>
                <span>₮{totalPrice.toLocaleString()}</span>
              </div>
              {wantsDelivery && !hasPreOrder && singleDeliveryFee > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Хүргэлт <span className="text-xs text-slate-400">(1 удаа)</span></span>
                  <span>+₮{singleDeliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
                <span>Нийт төлөх</span>
                <span className="text-indigo-600">₮{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !agreedToTerms || !!phoneError}
              className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Илгээж байна..." : "📦 Захиалга илгээх"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
