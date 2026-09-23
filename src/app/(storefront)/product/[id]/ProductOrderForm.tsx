"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Truck, ShoppingBag, AlertCircle, Info, ShoppingCart, Check, Package } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { createOrder } from "@/app/actions/order-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getUpcomingDeliveryDates } from "@/lib/utils"
import { 
  normalizeOptions, 
  getVariantKey, 
  getSelectionStock, 
  isOptionValueCompletelySoldOut,
  isOptionAvailableForSelection,
  generateVariantCombos,
  getVariantImageUrl
} from "@/lib/variant-utils"

interface Props {
  batchId: string
  productName?: string
  productImage?: string | null
  activeVariantImageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  remainingQuantity: number
  termsOfService?: string
  deliveryTerms?: string
  isPreOrder?: boolean
  options?: any
  variantStock?: Record<string, number> | null
  deliveryScheduleDays?: string
  selectedOptions?: Record<string, string>
  onSelectOption?: (optName: string, optValue: string) => void
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

export function ProductOrderForm({
  batchId,
  productName,
  productImage,
  activeVariantImageUrl,
  unitPrice,
  deliveryFee,
  remainingQuantity,
  termsOfService,
  deliveryTerms,
  isPreOrder,
  options,
  variantStock,
  deliveryScheduleDays = "3,6",
  selectedOptions: controlledSelectedOptions,
  onSelectOption
}: Props) {
  const router = useRouter()
  const { addItem, removeItem } = useCart()
  const { toast } = useToast()

  const [wantsDelivery, setWantsDelivery] = useState(false)
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string | null>(null)
  const [cartAdded, setCartAdded] = useState(false)

  // Normalize product options safely
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options])

  // Internal selection fallback if not controlled by parent
  const [internalSelectedOptions, setInternalSelectedOptions] = useState<Record<string, string>>(() => {
    const defaultOpts: Record<string, string> = {}
    const norm = normalizeOptions(options)
    if (norm.length === 0) return defaultOpts

    if (variantStock && typeof variantStock === 'object') {
      const combos = generateVariantCombos(norm)
      const availableCombo = combos.find(c => (variantStock[c.key] ?? 0) > 0)
      if (availableCombo) {
        return { ...availableCombo.labels }
      }
    }

    norm.forEach(opt => {
      if (opt.values.length > 0) {
        defaultOpts[opt.name] = opt.values[0]
      }
    })
    return defaultOpts
  })

  const selectedOptions = controlledSelectedOptions || internalSelectedOptions

  // Canonical variant key from selections
  const currentVariantKey = useMemo(() => {
    return getVariantKey(normalizedOptions, selectedOptions)
  }, [selectedOptions, normalizedOptions])

  // Current stock for selected variant or entire batch
  const currentStock = useMemo(() => {
    return getSelectionStock(normalizedOptions, variantStock, selectedOptions, remainingQuantity)
  }, [variantStock, normalizedOptions, selectedOptions, remainingQuantity])

  // Context-aware availability: Is this option value available given other selections?
  const isOptionAvailable = (optName: string, optValue: string): boolean => {
    return isOptionAvailableForSelection(normalizedOptions, variantStock, selectedOptions, optName, optValue)
  }

  // Handle smart option click
  const handleSelectOption = (optName: string, optValue: string) => {
    if (onSelectOption) {
      onSelectOption(optName, optValue)
      setQty(1)
      return
    }

    const next = { ...internalSelectedOptions, [optName]: optValue }

    // If multi options, verify whether other previously selected options are available with this new selection
    if (normalizedOptions.length > 1 && variantStock) {
      for (const otherOpt of normalizedOptions) {
        if (otherOpt.name === optName) continue
        const currentVal = next[otherOpt.name]
        const available = isOptionAvailableForSelection(normalizedOptions, variantStock, next, otherOpt.name, currentVal)
        if (!available) {
          // Switch to first available value for this other option
          const firstAvail = otherOpt.values.find(v =>
            isOptionAvailableForSelection(normalizedOptions, variantStock, next, otherOpt.name, v)
          )
          if (firstAvail) {
            next[otherOpt.name] = firstAvail
          }
        }
      }
    }

    setInternalSelectedOptions(next)
    setQty(1)
  }

  // Effective variant image URL
  const effectiveVariantImageUrl = useMemo(() => {
    return activeVariantImageUrl || getVariantImageUrl(normalizedOptions, selectedOptions, productImage)
  }, [activeVariantImageUrl, normalizedOptions, selectedOptions, productImage])

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
    (isPreOrder || currentStock > 0)

  function handleAddToCart() {
    if (!isPreOrder && currentStock < qty) {
      setError(`Таны сонгосон хувилбарын үлдэгдэл хүрэлцэхгүй байна (${currentStock} ширхэг үлдсэн)`)
      return
    }
    addItem({
      batchId,
      name: productName || "Бараа",
      imageUrl: effectiveVariantImageUrl || productImage,
      unitPrice,
      deliveryFee,
      isPreOrder,
      qty,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
    })
    setCartAdded(true)
    toast({ title: "Сагсанд нэмэгдлээ", description: `${qty} ширхэг сагсанд амжилттай нэмэгдлээ.` })
    setTimeout(() => setCartAdded(false), 2000)
  }

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
      if (currentStock < qty) {
        setError(`Таны сонгосон хослолын үлдэгдэл хүрэлцэхгүй байна (${currentStock} ширхэг үлдсэн)`)
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

      {/* Product Options (Variants) */}
      {normalizedOptions && normalizedOptions.length > 0 && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#4e3dc7]" /> Сонголт
          </h3>
          <div className="space-y-3">
            {normalizedOptions.map((opt, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{opt.name}</label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map(val => {
                    const available = isOptionAvailable(opt.name, val)
                    const isSelected = selectedOptions[opt.name] === val
                    const valImage = opt.images?.[val]
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!available}
                        onClick={() => handleSelectOption(opt.name, val)}
                        className={`text-sm px-3.5 py-2 rounded-xl border font-medium transition-all inline-flex items-center gap-2 ${
                          !available
                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60"
                            : isSelected
                              ? "bg-[#4e3dc7] border-[#4e3dc7] text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-1"
                              : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {valImage && (
                          <img
                            src={valImage}
                            alt={val}
                            className={`w-6 h-6 object-cover rounded-md border ${
                              isSelected ? "border-white/60" : "border-slate-200"
                            }`}
                          />
                        )}
                        <span>{val}</span>
                        {!available && <span className="ml-1 text-[10px] no-underline opacity-80">(дууссан)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Show current variant stock status */}
          {variantStock && currentVariantKey && (
            <div className={`text-xs font-bold px-3 py-2 rounded-lg border mt-2 flex items-center justify-between ${
              currentStock > 0
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              <span>
                {currentStock > 0
                  ? `✓ Сонгосон хувилбарт ${currentStock} ширхэг үлдсэн`
                  : "⚠️ Энэ сонголт дууссан байна (Өөр сонголт хийнэ үү)"}
              </span>
              {currentStock > 0 && <span className="text-[11px] opacity-75 font-semibold">Бэлэн байгаа</span>}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Тоо ширхэг</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold"
          >
            −
          </button>
          <span className="min-w-[32px] text-center font-bold text-slate-900">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(q => Math.min(Math.max(1, currentStock), q + 1))}
            disabled={!isPreOrder && qty >= currentStock}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-slate-100 text-lg font-bold disabled:opacity-40"
          >
            +
          </button>
          <span className="text-xs text-slate-400">/ {currentStock} ш үлдсэн</span>
        </div>
      </div>

      {/* Delivery Type */}
      {!isPreOrder ? (
        <div className="space-y-3">
          <label className="text-sm font-medium">Хүлээн авах хэлбэр</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setWantsDelivery(false) }}
              className={`border-2 rounded-xl p-4 text-center transition-all ${!wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <ShoppingBag className={`w-5 h-5 mx-auto mb-1 ${!wantsDelivery ? "text-indigo-500" : "text-slate-400"}`} />
              <p className="text-sm font-semibold text-slate-700">Өөрөө ирнэ</p>
              <p className="text-xs text-slate-400">Нэмэлт үнэгүй</p>
            </button>
            <button
              type="button"
              onClick={() => setWantsDelivery(true)}
              className={`border-2 rounded-xl p-4 text-center transition-all ${wantsDelivery ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
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
            </div>
          </div>
        </div>
      )}

      {/* Delivery Schedule Options */}
      {wantsDelivery && !isPreOrder && (
        <div className="space-y-2 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900">Хүргэлтийн өдөр сонгох</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {getUpcomingDeliveryDates(deliveryScheduleDays).map((opt) => (
              <label
                key={opt.date.toISOString()}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedDeliveryDate === opt.date.toISOString()
                    ? 'border-indigo-500 bg-white shadow-sm ring-1 ring-indigo-500'
                    : 'border-indigo-100 bg-white/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryScheduleDate"
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
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
          <Textarea
            id="deliveryAddress"
            name="deliveryAddress"
            required
            rows={2}
            placeholder="Хот, Дүүрэг, Хороо, Байр, Тоот..."
            className="resize-none"
          />
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

      {/* Actions: Add to Cart and Direct Order */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!isPreOrder && currentStock <= 0}
          onClick={handleAddToCart}
          className="flex-1 py-6 border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-semibold"
        >
          {cartAdded ? <><Check className="w-4 h-4 mr-1 text-green-600" /> Сагсанд нэмэгдлээ</> : <><ShoppingCart className="w-4 h-4 mr-1" /> Сагслах</>}
        </Button>
        <Button
          type="submit"
          disabled={submitting || !canSubmit}
          className="flex-2 bg-[#4F46E5] hover:bg-[#4338ca] py-6 text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
        >
          {submitting
            ? "Илгээж байна..."
            : (!isPreOrder && currentStock <= 0)
              ? "Дууссан"
              : "✅ Захиалах"}
        </Button>
      </div>

      {!agreedToTerms && (
        <p className="text-center text-xs text-slate-400">Үйлчилгээний нөхцөлтэй зөвшөөрснөөр захиалгаа дуусгана уу</p>
      )}
    </form>
  )
}
