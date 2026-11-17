"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Trash2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText
} from "lucide-react"
import { AdminProductCombobox } from "./AdminProductCombobox"
import { AdminBatchSearchResult, createAdminManualOrder } from "@/app/actions/admin-manual-order-actions"
import { normalizeOptions, getVariantKey } from "@/lib/variant-utils"

interface ItemState {
  id: string
  selectedBatch: AdminBatchSearchResult | null
  isCustom: boolean
  customName: string
  customLink: string
  customPrice: number
  quantity: number
  unitPrice: number
  selectedOptions: Record<string, string>
}

interface GlobalAddOrderModalProps {
  trigger?: React.ReactNode
  defaultBatch?: AdminBatchSearchResult | null
  onSuccess?: () => void
}

export function GlobalAddOrderModal({
  trigger,
  defaultBatch = null,
  onSuccess
}: GlobalAddOrderModalProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Customer state
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"CONFIRMED" | "PENDING">("CONFIRMED")

  // Items state
  const createInitialItem = (batch: AdminBatchSearchResult | null = null): ItemState => ({
    id: Math.random().toString(36).substring(2, 9),
    selectedBatch: batch,
    isCustom: false,
    customName: "",
    customLink: "",
    customPrice: 0,
    quantity: 1,
    unitPrice: batch ? batch.price : 0,
    selectedOptions: {}
  })

  const [items, setItems] = useState<ItemState[]>([createInitialItem(defaultBatch)])

  // Clean phone helper
  const cleanPhone = customerPhone.replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
  const isPhoneValid = /^[6-9]\d{7}$/.test(cleanPhone)

  // Calculate totals
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
  const grandTotal = items.reduce((sum, it) => {
    const price = it.isCustom ? (Number(it.customPrice) || 0) : (Number(it.unitPrice) || 0)
    return sum + price * (Number(it.quantity) || 1)
  }, 0)

  // Add new item row
  const handleAddItem = () => {
    setItems((prev) => [...prev, createInitialItem()])
  }

  // Remove item row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // Update item field
  const updateItem = (id: string, updates: Partial<ItemState>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        const next = { ...it, ...updates }

        // If batch changed, reset unitPrice and selectedOptions
        if (updates.selectedBatch !== undefined) {
          if (updates.selectedBatch) {
            next.unitPrice = updates.selectedBatch.price
            const norm = normalizeOptions(updates.selectedBatch.product.options)
            const initOpts: Record<string, string> = {}
            norm.forEach((opt) => {
              if (opt.values.length > 0) initOpts[opt.name] = opt.values[0]
            })
            next.selectedOptions = initOpts
          } else {
            next.unitPrice = 0
            next.selectedOptions = {}
          }
        }
        return next
      })
    )
  }

  // Reset form
  const resetForm = () => {
    setCustomerName("")
    setCustomerPhone("")
    setAccountNumber("")
    setDeliveryAddress("")
    setAdminNotes("")
    setPaymentStatus("CONFIRMED")
    setItems([createInitialItem(defaultBatch)])
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast({
        title: "Захиалагчийн нэр хоосон байна",
        description: "Хэрэглэгчийн нэрийг заавал оруулна уу.",
        variant: "destructive"
      })
      return
    }

    if (!isPhoneValid) {
      toast({
        title: "Утасны дугаар буруу байна",
        description: "8 оронтой гар утасны дугаар оруулна уу (6, 7, 8, 9-өөр эхэлсэн).",
        variant: "destructive"
      })
      return
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.isCustom) {
        if (!it.customName.trim()) {
          toast({
            title: "Барааны нэр дутуу байна",
            description: `${i + 1}-р захиалгат барааны нэрийг оруулна уу.`,
            variant: "destructive"
          })
          return
        }
        if (!it.customPrice || it.customPrice <= 0) {
          toast({
            title: "Барааны үнэ дутуу байна",
            description: `${i + 1}-р захиалгат барааны тохиролцсон үнийг оруулна уу.`,
            variant: "destructive"
          })
          return
        }
      } else {
        if (!it.selectedBatch) {
          toast({
            title: "Бараа сонгогдоогүй байна",
            description: `${i + 1}-р барааг каталогоос сонгоно уу.`,
            variant: "destructive"
          })
          return
        }
      }

      if (!it.quantity || it.quantity < 1) {
        toast({
          title: "Тоо ширхэг буруу байна",
          description: `${i + 1}-р барааны тоо хамгийн багадаа 1 байна.`,
          variant: "destructive"
        })
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        accountNumber: accountNumber.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
        paymentStatus: paymentStatus,
        items: items.map((it) => ({
          batchId: it.selectedBatch?.id,
          isCustom: it.isCustom,
          customName: it.customName.trim(),
          customLink: it.customLink.trim(),
          customPrice: Number(it.customPrice),
          quantity: Number(it.quantity),
          unitPrice: Number(it.isCustom ? it.customPrice : it.unitPrice),
          selectedOptions: Object.keys(it.selectedOptions).length > 0 ? it.selectedOptions : undefined
        }))
      }

      const res = await createAdminManualOrder(payload)

      if (res.success) {
        toast({
          title: "Захиалга амжилттай бүртгэгдлээ!",
          description: `${customerName} (${cleanPhone}) • ${res.count} бараа • ₮${res.grandTotal?.toLocaleString()}`
        })
        resetForm()
        setOpen(false)
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        toast({
          title: "Алдаа гарлаа",
          description: res.error || "Захиалга үүсгэж чадсангүй.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Серверийн алдаа",
        description: err.message || "Сүлжээний холболтоо шалгана уу.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold gap-1.5 shadow-sm transition-all text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Гараар захиалга нэмэх</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[96vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
          {/* Fixed Header */}
          <div className="px-6 py-4 border-b bg-slate-50/80 shrink-0 pr-12">
            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Админаас Захиалга Гараар Бүртгэх
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Дэлгүүрийн каталог дахь бараа болон тусгай захиалгыг нэгтгэн шууд баталгаажуулна.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-5">
          {/* Section 1: Customer Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              1. Захиалагчийн мэдээлэл
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Захиалагчийн нэр <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Жишээ: А.Болд"
                    className="pl-9 text-xs sm:text-sm bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Гар утас (8 оронтой) <span className="text-red-500">*</span>
                  </label>
                  {customerPhone && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        isPhoneValid ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isPhoneValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Зөв дугаар
                        </>
                      ) : (
                        "8 оронтой гар утас"
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="99112233"
                    maxLength={12}
                    className={`pl-9 text-xs sm:text-sm bg-white ${
                      customerPhone && !isPhoneValid ? "border-amber-400 focus:ring-amber-400" : ""
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Дансны дугаар (Гүйлгээ шалгахад)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="5046048013 (Сонголттой)"
                    className="pl-9 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Хүргэлтийн хаяг (Байгаа бол)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="ХУД, 15-р хороо, Рапид харш 12-40 (Сонголттой)"
                    className="pl-9 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Админы дотоод тэмдэглэл (Заавал биш)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Фэйсбүүк чатаар авсан, тусгай санамж г.м."
                  rows={2}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                2. Захиалж буй бараанууд ({items.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Өөр бараа нэмэх
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const normOptions = item.selectedBatch
                  ? normalizeOptions(item.selectedBatch.product.options)
                  : []

                const currentVariantKey =
                  normOptions.length > 0
                    ? getVariantKey(normOptions, item.selectedOptions)
                    : null

                const currentVariantStock =
                  currentVariantKey && item.selectedBatch?.variantStock
                    ? item.selectedBatch.variantStock[currentVariantKey]
                    : undefined

                const itemSubtotal = item.isCustom
                  ? (Number(item.customPrice) || 0) * (Number(item.quantity) || 1)
                  : (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Бараа #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Хасах
                        </Button>
                      )}
                    </div>

                    {/* Product Combobox */}
                    <AdminProductCombobox
                      selectedBatch={item.selectedBatch}
                      onSelectBatch={(batch) => updateItem(item.id, { selectedBatch: batch })}
                      isCustom={item.isCustom}
                      onToggleCustom={(val) => updateItem(item.id, { isCustom: val })}
                      disabled={loading}
                    />

                    {/* Custom Item Details */}
                    {item.isCustom && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Барааны нэр / загвар <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={item.customName}
                            onChange={(e) => updateItem(item.id, { customName: e.target.value })}
                            placeholder="Жишээ: Zara эмэгтэй пиджак хар (M)"
                            className="text-xs bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Тохиролцсон үнэ (₮) <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.customPrice || ""}
                            onChange={(e) =>
                              updateItem(item.id, { customPrice: Math.max(0, Number(e.target.value)) })
                            }
                            placeholder="120000"
                            className="text-xs font-bold text-slate-900 bg-white"
                            required
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">
                            Барааны холбоос / Линк (Сонголттой)
                          </label>
                          <Input
                            value={item.customLink}
                            onChange={(e) => updateItem(item.id, { customLink: e.target.value })}
                            placeholder="https://..."
                            className="text-xs bg-white text-slate-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Catalog Variant Options */}
                    {!item.isCustom && item.selectedBatch && normOptions.length > 0 && (
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-900">
                            Барааны сонголтууд (Size / Өнгө):
                          </span>
                          {currentVariantStock !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                currentVariantStock > 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              Үлдэгдэл нөөц: {currentVariantStock}ш
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {normOptions.map((opt) => (
                            <div key={opt.name}>
                              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                {opt.name}
                              </label>
                              <select
                                value={item.selectedOptions[opt.name] || ""}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    selectedOptions: {
                                      ...item.selectedOptions,
                                      [opt.name]: e.target.value
                                    }
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                              >
                                {opt.values.map((val) => (
                                  <option key={val} value={val}>
                                    {val}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity & Unit Price & Subtotal */}
                    <div className="flex items-center justify-between pt-2 border-t gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-medium">Тоо:</span>
                          <div className="flex items-center border rounded-lg bg-slate-50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })
                              }
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: Math.max(1, parseInt(e.target.value) || 1)
                                })
                              }
                              className="w-10 text-center text-xs font-bold bg-white py-1 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Editable Unit Price if Catalog */}
                        {!item.isCustom && item.selectedBatch && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-medium">Нэгж:</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(item.id, { unitPrice: Math.max(0, Number(e.target.value)) })
                              }
                              className="w-24 text-xs font-bold text-slate-900 border rounded px-2 py-1 bg-white"
                              title="Шаардлагатай бол үнийг гараар өөрчилж болно"
                            />
                            <span className="text-xs text-slate-400">₮</span>
                          </div>
                        )}
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 mr-1.5">Дүн:</span>
                        <span className="text-sm font-black text-indigo-900">
                          ₮{itemSubtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Summary & Payment Status */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">
                  Нийт тоо ширхэг: <b>{totalQuantity}ш</b>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-600">Төлбөрийн төлөв:</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="text-xs font-bold px-2 py-1 rounded bg-white border border-indigo-300 text-indigo-900"
                  >
                    <option value="CONFIRMED">✅ Баталгаажсан (Шууд олгоход бэлэн)</option>
                    <option value="PENDING">⏳ Төлбөр хүлээгдэж буй</option>
                  </select>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Нийт төлөх дүн</p>
                <p className="text-xl sm:text-2xl font-black text-indigo-700">
                  ₮{grandTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-3.5 border-t bg-slate-50/90 flex items-center justify-between shrink-0 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="text-xs font-semibold"
              >
                Болих
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs sm:text-sm px-6 gap-2 shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Захиалга Баталгаажуулж Бүртгэх
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
