"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Truck, ShoppingBag, AlertCircle, Info, CheckCircle2, Loader2, MessageSquare } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { createOrder } from "@/app/actions/order-actions"
import { startPhoneVerification } from "@/app/actions/verify-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Package } from "lucide-react"
import { getUpcomingDeliveryDates } from "@/lib/utils"
import { isValidPhone } from "@/lib/customer-utils"

interface Props {
  batchId: string
  unitPrice: number
  deliveryFee: number
  remainingQuantity: number
  termsOfService?: string
  deliveryTerms?: string
  isPreOrder?: boolean
  options?: Array<{ name: string, values: string[] }>
  variantStock?: Record<string, number> | null
  deliveryScheduleDays?: string
}

const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

function getNextDeliveryDate(scheduleDaysStr: string): string {
  const days = scheduleDaysStr.split(",").map(Number).filter(n => !isNaN(n))
  if (days.length === 0) return ""
  const now = new Date()
  for (let i = 1; i <= 7; i++) {
    const next = new Date(now)
    next.setDate(now.getDate() + i)
    if (days.includes(next.getDay())) {
      const month = next.getMonth() + 1
      const day = next.getDate()
      const dayName = DAY_NAMES[next.getDay()]
      return `${dayName}, ${month}-р сарын ${day}`
    }
  }
  return ""
}

export function ProductOrderForm({ batchId, unitPrice, deliveryFee, remainingQuantity, termsOfService, deliveryTerms, isPreOrder, options, variantStock, deliveryScheduleDays = "3,6" }: Props) {
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
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultOpts: Record<string, string> = {}
    if (options) {
      options.forEach(opt => {
        if (opt.values.length > 0) defaultOpts[opt.name] = opt.values[0]
      })
    }
    return defaultOpts
  })

  // ─── Phone Verification State ───
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifySessionId, setVerifySessionId] = useState<string | null>(null)
  const [verifySmsUri, setVerifySmsUri] = useState<string | null>(null)
  const [verifyInstruction, setVerifyInstruction] = useState<string | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const VERIFY_STORAGE_KEY = "anar_verified_phone"
  const VERIFY_TTL_MS = 24 * 60 * 60 * 1000

  function getStoredVerifiedPhone(): string | null {
    try {
      const raw = localStorage.getItem(VERIFY_STORAGE_KEY)
      if (!raw) return null
      const { phone, verifiedAt } = JSON.parse(raw)
      if (Date.now() - verifiedAt > VERIFY_TTL_MS) { localStorage.removeItem(VERIFY_STORAGE_KEY); return null }
      return phone
    } catch { return null }
  }

  function saveVerifiedPhone(phone: string) {
    try { localStorage.setItem(VERIFY_STORAGE_KEY, JSON.stringify({ phone, verifiedAt: Date.now() })) } catch {}
  }

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current) } }, [])

  const startPolling = useCallback((sid: string, exp: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      if (Date.now() > new Date(exp).getTime()) {
        if (pollRef.current) clearInterval(pollRef.current)
        setVerifyError("Хугацаа дууслаа. Дахин оролдоно уу."); setVerifySessionId(null); setVerifySmsUri(null); setVerifyInstruction(null); return
      }
      try {
        const res = await fetch(`/api/verify-mn/status/${sid}`)
        const data = await res.json()
        if (data.status === "VERIFIED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setPhoneVerified(true); setVerifySessionId(null); setVerifySmsUri(null); setVerifyInstruction(null)
          const pi = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement
          if (pi) saveVerifiedPhone(pi.value.replace(/\D/g, ""))
          toast({ title: "✅ Утас баталгаажлаа!", description: "Та захиалгаа үргэлжлүүлж болно." })
        } else if (data.status === "EXPIRED") {
          if (pollRef.current) clearInterval(pollRef.current)
          setVerifyError("Хугацаа дууслаа. Дахин оролдоно уу."); setVerifySessionId(null); setVerifySmsUri(null); setVerifyInstruction(null)
        }
      } catch {}
    }, 3000)
  }, [toast])

  async function handleVerifyPhone(phoneValue: string) {
    const digits = phoneValue.replace(/\D/g, "")
    if (!isValidPhone(digits)) return
    const stored = getStoredVerifiedPhone()
    if (stored === digits) { setPhoneVerified(true); return }
    setVerifyLoading(true); setVerifyError(null)
    const result = await startPhoneVerification(digits)
    if (!result.success) { setVerifyError(result.error || "Алдаа гарлаа"); setVerifyLoading(false); return }
    if (result.sessionId === "already-verified" || result.sessionId === "skipped") {
      setPhoneVerified(true); saveVerifiedPhone(digits); setVerifyLoading(false); return
    }
    setVerifySessionId(result.sessionId!); setVerifySmsUri(result.smsUri || null)
    setVerifyInstruction(result.displayInstruction || null); setVerifyLoading(false)
    if (result.sessionId && result.expiresAt) startPolling(result.sessionId, result.expiresAt)
  }

  // Compute variant key from selected options
  const currentVariantKey = useMemo(() => {
    if (!options || options.length === 0) return null
    return Object.values(selectedOptions).join('-')
  }, [selectedOptions, options])

  // Determine stock for current variant
  const currentStock = useMemo(() => {
    if (!variantStock || !currentVariantKey) return remainingQuantity
    return variantStock[currentVariantKey] ?? 0
  }, [variantStock, currentVariantKey, remainingQuantity])

  // Check if a specific option value is sold out
  const isOptionSoldOut = (optName: string, optValue: string): boolean => {
    if (!variantStock || !options) return false
    const tempSelection = { ...selectedOptions, [optName]: optValue }
    const key = Object.values(tempSelection).join('-')
    return (variantStock[key] ?? 0) <= 0
  }

  const itemTotal = qty * unitPrice
  const totalAmount = itemTotal + (wantsDelivery ? deliveryFee : 0)

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 8) { setPhoneError("Утасны дугаар заавал 8 оронтой байх ёстой"); setPhoneVerified(false) }
    else if (!isValidPhone(digits)) { setPhoneError("Зөв утасны дугаар оруулна уу (жишээ: 99112233)"); setPhoneVerified(false) }
    else {
      setPhoneError(null)
      const sp = getStoredVerifiedPhone()
      if (sp === digits) setPhoneVerified(true)
      else if (phoneVerified) setPhoneVerified(false)
    }
    if (pollRef.current) clearInterval(pollRef.current)
  }

  const canSubmit =
    agreedToTerms &&
    !phoneError &&
    phoneVerified &&
    (isPreOrder || currentStock > 0)

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

    // Variant stock check
    if (variantStock && currentVariantKey && !isPreOrder) {
      const available = variantStock[currentVariantKey] ?? 0
      if (available < qty) {
        setError(`Таны сонгосон хослолын үлдэгдэл хүрэлцэхгүй байна (${available} ширхэг)`)
        return
      }
    }

    setSubmitting(true)
    setError(null)

    const result = await createOrder({
      customerName: data.get("customerName") as string,
      phoneNumber: phone,
      accountNumber: data.get("accountNumber") as string,
      deliveryAddress: wantsDelivery ? (data.get("deliveryAddress") as string) : "Өөрөө ирж авна",
      deliveryDate: (wantsDelivery && !isPreOrder && selectedDeliveryDate) ? selectedDeliveryDate : undefined,
      quantity: qty,
      totalAmount,
      batchId,
      wantsDelivery: isPreOrder ? false : wantsDelivery,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
    })

    if (result.success) {
      removeItem(batchId)
      const orderId = result.order?.id
      toast({ title: "Амжилттай", description: "Захиалга үүсгэлээ." })
      setIsRedirecting(true)
      router.push(orderId ? `/order-pending/${orderId}` : `/order-success${result.order?.transactionRef ? `?ref=${result.order.transactionRef}` : ''}`)
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
          <div className="flex gap-2">
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              required
              maxLength={8}
              disabled={phoneVerified}
              placeholder="8 оронтой тоо"
              onChange={e => validatePhone(e.target.value)}
              className={phoneVerified ? "bg-green-50 border-green-300 text-green-800" : phoneError ? "border-red-400 focus-visible:ring-red-300" : ""}
            />
            {phoneVerified ? (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold px-3 bg-green-50 border border-green-200 rounded-lg whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" /> Баталгаажсан
              </div>
            ) : (
              <button type="button" disabled={!!phoneError || verifyLoading || !!verifySessionId}
                onClick={() => { const pi = document.getElementById('phoneNumber') as HTMLInputElement; if (pi) handleVerifyPhone(pi.value) }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                {verifyLoading ? "Уншиж байна..." : "Баталгаажуулах"}
              </button>
            )}
          </div>
          {phoneError && (<p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {phoneError}</p>)}
          {verifyError && (<p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {verifyError}</p>)}
          {verifySessionId && !phoneVerified && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 mt-2">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-indigo-900">SMS баталгаажуулалт</p>
                  {verifyInstruction && <p className="text-xs text-indigo-700 leading-relaxed">{verifyInstruction}</p>}
                  <p className="text-xs text-indigo-600">Доорх товчийг дарж SMS мессежээ илгээнэ үү.</p>
                </div>
              </div>
              {verifySmsUri && (<a href={verifySmsUri} className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"><MessageSquare className="w-4 h-4" />📱 SMS илгээх (144773)</a>)}
              <div className="flex items-center gap-2 text-xs text-indigo-500"><Loader2 className="w-3.5 h-3.5 animate-spin" />SMS хүлээж байна...</div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="accountNumber">Төлбөр төлсөн дансны дугаар</label>
        <Input id="accountNumber" name="accountNumber" type="tel" inputMode="numeric" pattern="[0-9]*" required placeholder="Жишээ: 5000123456"
          onInput={(e) => { const t = e.target as HTMLInputElement; t.value = t.value.replace(/\D/g, "") }} />
        <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" /> IBAN оруулах шаардлагагүй! Зөвхөн дансны тоон дугаарыг бичнэ үү.
        </p>
      </div>

      {/* Product Options (Variants) */}
      {options && options.length > 0 && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#4e3dc7]" /> Сонголт
          </h3>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{opt.name}</label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map(val => {
                    const soldOut = isOptionSoldOut(opt.name, val)
                    const isSelected = selectedOptions[opt.name] === val
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setSelectedOptions({ ...selectedOptions, [opt.name]: val })
                          setQty(1) // Reset qty when changing variant
                        }}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-all ${soldOut
                            ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                              ? "bg-[#4e3dc7] border-[#4e3dc7] text-white shadow-sm shadow-indigo-200"
                              : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                      >
                        {val}
                        {soldOut && <span className="ml-1 text-[10px] no-underline">(дууссан)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Show current variant stock */}
          {variantStock && currentVariantKey && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border mt-2 ${currentStock > 0
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
              }`}>
              {currentStock > 0 ? `Энэ сонголтонд ${currentStock} ширхэг үлдсэн` : "Энэ сонголт дууссан байна"}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Тоо ширхэг</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">−</button>
          <span className="min-w-[32px] text-center font-bold text-slate-900">{qty}</span>
          <button type="button" onClick={() => setQty(q => Math.min(currentStock, q + 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold">+</button>
          <span className="text-xs text-slate-400">/ {currentStock} ш үлдсэн</span>
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
              <strong>Урьдчилсан захиалга:</strong> Таны сонгосон бараа Монголд ирсний дараа хүргэлтийн асуудал тусад нь шийдэгдэх болно.
              {deliveryFee > 0 && (<> Хүргэлтийн үнэ <strong>₮{deliveryFee.toLocaleString()}</strong> (ирсний дараа тооцогдоно).</>)}
            </div>
          </div>
        </div>
      )}

      {/* Delivery schedule selection */}
      {wantsDelivery && !isPreOrder && (
        <div className="space-y-3 mt-4 border-t pt-4">
          <label className="text-sm font-medium text-slate-700 block mb-2">Хүргэлт гарах өдрийг сонгон уу.</label>
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

      {/* Address */}
      {wantsDelivery && !isPreOrder && (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="deliveryAddress">Хүргүүлэх хаяг</label>
          <Textarea id="deliveryAddress" name="deliveryAddress" required rows={2}
            placeholder="Хот, Дүүрэг, Хороо, Байр, Тоот..." className="resize-none" />
        </div>
      )}

      {/* Combined Terms */}
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
        {submitting ? "Илгээж байна..." : (isPreOrder || currentStock > 0) ? "✅ Захиалга баталгаажуулах" : "Дууссан"}
      </Button>

      {!agreedToTerms && (
        <p className="text-center text-xs text-slate-400">Үйлчилгээний нөхцөлтэй зөвшөөрснөөр захиалгаа дуусгана уу</p>
      )}
    </form>
  )
}
