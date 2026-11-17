"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Tag, 
  Info, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from "lucide-react"
import { addOrderToBatch } from "@/app/actions/order-actions"
import { ProductOption, getVariantKey } from "@/lib/variant-utils"

interface AddOrderSheetProps {
  batchId: string
  batch: any
  normOptions: ProductOption[]
  statuses: any[]
}

export function AddOrderSheet({ batchId, batch, normOptions, statuses }: AddOrderSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [arrivalDate, setArrivalDate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [statusId, setStatusId] = useState("")

  // Selected options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    normOptions.forEach(opt => {
      if (opt.values.length > 0) {
        init[opt.name] = opt.values[0]
      }
    })
    return init
  })

  const variantStock = (batch.variantStock && typeof batch.variantStock === "object") 
    ? (batch.variantStock as Record<string, number>) 
    : null

  // Compute selected variant key and stock
  const currentVariantKey = getVariantKey(normOptions, selectedOptions)
  const currentStock = currentVariantKey && variantStock ? variantStock[currentVariantKey] : undefined

  // Pricing calculations
  const unitPrice = Number(batch.price || 0)
  const totalAmount = unitPrice * Math.max(1, quantity)
  const weightKg = Number(batch.product?.weightKg || 0)
  const estimatedCargo = Math.round(weightKg * 15000) * Math.max(1, quantity)

  // Quick reset form
  const resetForm = () => {
    setCustomerName("")
    setCustomerPhone("")
    setAccountNumber("")
    setQuantity(1)
    setArrivalDate("")
    setDeliveryDate("")
    setDeliveryAddress("")
    setStatusId("")
    const init: Record<string, string> = {}
    normOptions.forEach(opt => {
      if (opt.values.length > 0) init[opt.name] = opt.values[0]
    })
    setSelectedOptions(init)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clean phone
    const cleanPhone = customerPhone.replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
    if (!cleanPhone || cleanPhone.length < 8) {
      toast({
        title: "Утасны дугаар дутуу байна",
        description: "Хэрэглэгчийн 8 оронтой утасны дугаарыг заавал оруулна уу.",
        variant: "destructive"
      })
      return
    }

    if (!customerName.trim()) {
      toast({
        title: "Хэрэглэгчийн нэр хоосон байна",
        description: "Захиалагчийн нэрийг оруулна уу.",
        variant: "destructive"
      })
      return
    }

    if (quantity < 1) {
      toast({
        title: "Тоо ширхэг буруу байна",
        description: "Захиалах тоо хамгийн багадаа 1 байна.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const res = await addOrderToBatch(batchId, {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        accountNumber: accountNumber.trim() || undefined,
        quantity: Number(quantity),
        arrivalDate: arrivalDate || undefined,
        deliveryDate: deliveryDate || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        statusId: statusId || undefined,
        selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
      })

      if (res.success) {
        toast({
          title: "Захиалга амжилттай бүртгэгдлээ!",
          description: `#${res.order?.orderNumber || ""} ${customerName} (${totalAmount.toLocaleString()}₮)`
        })
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Захиалга нэмэхэд алдаа гарлаа",
          description: res.error || "Үлдэгдэл нөөц эсвэл өгөгдлийг шалгана уу.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Системийн алдаа",
        description: err.message || "Сервертэй холбогдоход алдаа гарлаа.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-slate-100 hover:text-accent-foreground text-sm bg-white h-9 px-3 shadow-sm">
        <Plus className="w-4 h-4 mr-2" /> Нэмэх
      </SheetTrigger>
      
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg p-6">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Гараар шинэ захиалга бүртгэх
          </SheetTitle>
          <p className="text-xs text-slate-500">
            Багц: <strong className="text-slate-800">{batch.product?.name}</strong>
          </p>
        </SheetHeader>

        {/* Informative Guidance Alert */}
        <div className="mt-4 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Админы санамж: Гараар бүртгэх дүрэм</span>
          </div>
          <ul className="space-y-1 text-amber-800 text-[11.5px] pl-5 list-disc leading-relaxed">
            <li>
              <strong>Утасны дугаар</strong>: Хэрэглэгч <code>/track</code> хуудсаар дугаараараа хайх, хүргэлтийн жолооч залгахад ашиглагдах тул заавал 8 оронтой тоо оруулна.
            </li>
            <li>
              <strong>Сонголт / Size</strong>: Сонгосон хэмжээний үлдэгдэл нөөцөөс автоматаар хасагдана.
            </li>
            <li>
              <strong>Хүргэх хаяг</strong>: Хаяг оруулбал шууд "Хүргэлтээр авах" болж хүргэлтийн жагсаалт руу очно. Хоосон үлдээвэл "Салбараас өөрөө авах" болно.
            </li>
            <li>
              <strong>Үнийн дүн</strong>: Багцын нэгжийн үнээр нийт дүн, барааны жингээр карго үнэ автоматаар бодогдож хадгалагдана.
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-left">
          
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label htmlFor="customerName" className="text-xs font-bold text-slate-700 block">
              Хэрэглэгчийн нэр <span className="text-red-500">*</span>
            </label>
            <Input 
              id="customerName" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required 
              placeholder="Жишээ: Д. Болд, Сараа..." 
              className="h-9 text-sm"
            />
          </div>
          
          {/* Customer Phone */}
          <div className="space-y-1.5">
            <label htmlFor="customerPhone" className="text-xs font-bold text-slate-700 block flex items-center justify-between">
              <span>Утасны дугаар <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">8 оронтой тоо</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                id="customerPhone" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required 
                placeholder="Жишээ: 99112233" 
                className="pl-9 h-9 text-sm"
                maxLength={12}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Захиалагч энэ дугаараараа <code>/track</code> хуудсаар захиалгаа шалгана.
            </p>
          </div>

          {/* Product Variant / Options */}
          {normOptions.length > 0 && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
              <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Сонголт / Size сонгох
              </p>
              {normOptions.map((opt) => (
                <div key={opt.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{opt.name}</span>
                    {variantStock && (
                      <span className="text-[11px] text-indigo-600 font-medium">
                        Сонгосон үлдэгдэл: {currentStock !== undefined ? `${currentStock}ш` : "тодорхойгүй"}
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedOptions[opt.name] || ""}
                    onChange={(e) => {
                      setSelectedOptions(prev => ({
                        ...prev,
                        [opt.name]: e.target.value
                      }))
                    }}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {opt.values.map((val) => {
                      // If single option, lookup stock directly
                      const singleKey = normOptions.length === 1 ? val : null
                      const itemStock = singleKey && variantStock ? variantStock[singleKey] : undefined
                      return (
                        <option key={val} value={val}>
                          {val} {itemStock !== undefined ? (itemStock === 0 ? " (Нөөц дууссан - 0ш)" : ` (${itemStock}ш үлдсэн)`) : ""}
                        </option>
                      )
                    })}
                  </select>
                </div>
              ))}

              {/* Stock Warning if 0 */}
              {currentStock !== undefined && currentStock <= 0 && (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100/70 p-2 rounded-md text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Анхааруулга: Сонгосон хувилбарын үлдэгдэл 0ш байна!</span>
                </div>
              )}
            </div>
          )}
          
          {/* Quantity and Total Price Calculation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="text-xs font-bold text-slate-700 block">
                Тоо ширхэг <span className="text-red-500">*</span>
              </label>
              <Input 
                id="quantity" 
                type="number" 
                required 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1" 
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="accountNumber" className="text-xs font-bold text-slate-700 block">Дансны дугаар</label>
              <Input 
                id="accountNumber" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Заавал биш..." 
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Pricing Preview Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Багцын нэгжийн үнэ:</span>
              <span className="font-semibold text-slate-800">{unitPrice.toLocaleString()}₮</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Нийт захиалгын дүн:</span>
              <span className="font-bold text-indigo-700 text-sm">{totalAmount.toLocaleString()}₮</span>
            </div>
            {estimatedCargo > 0 && (
              <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <span>Тооцоолсон карго ({weightKg}кг):</span>
                <span>{estimatedCargo.toLocaleString()}₮</span>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label htmlFor="deliveryAddress" className="text-xs font-bold text-slate-700 block flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Хүргэх хаяг
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Хоосон үлдээвэл салбараас авна</span>
            </label>
            <Input 
              id="deliveryAddress" 
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Дүүрэг, хороо, байр, орц, тоот..." 
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-slate-500">
              {deliveryAddress.trim() ? (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                  Хүргэлтээр авах гэж бүртгэгдэж, Хүргэлтийн хуудас руу автоматаар шилжинэ.
                </span>
              ) : (
                <span className="text-slate-400">
                  Хоосон үлдээвэл "Өөрөө салбараас ирж авах" төлөвтэй бүртгэгдэнэ.
                </span>
              )}
            </p>
          </div>

          {/* Dates: Arrival & Delivery */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="arrivalDate" className="text-xs font-bold text-slate-700 block">Ирэх өдөр</label>
              <Input 
                id="arrivalDate" 
                type="date" 
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="deliveryDate" className="text-xs font-bold text-slate-700 block">Хүргүүлэх өдөр</label>
              <Input 
                id="deliveryDate" 
                type="date" 
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label htmlFor="statusId" className="text-xs font-bold text-slate-700 block">Захиалгын статус</label>
            <select 
              id="statusId" 
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Үндсэн статус (Захиалга баталгаажсан)</option>
              {statuses?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Гараар нэмэгдсэн захиалгын төлбөрийн төлөв шууд "CONFIRMED" болж хадгалагдана.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] h-10 text-sm font-bold shadow-md shadow-indigo-100 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Хадгалж байна...
              </span>
            ) : (
              "Захиалга хадгалах"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
