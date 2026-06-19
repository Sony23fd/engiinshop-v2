import { getOrdersByAccount } from "@/app/actions/order-actions"
import { getShopSettings } from "@/app/actions/settings-actions"
import Image from "next/image"
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Search, 
  History,
  AlertTriangle,
  Phone,
  Home
} from "lucide-react"
import DeliveryRequestButton from "./DeliveryRequestButton"
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline"
import { RefreshButton } from "@/components/storefront/track/RefreshButton"

export const dynamic = "force-dynamic"

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>
}) {
  const resolvedParams = await searchParams
  const account = resolvedParams.account

  const [settings, accountData] = await Promise.all([
    getShopSettings(),
    account ? getOrdersByAccount(account) : Promise.resolve({ orders: [], success: true })
  ])
  const { orders, success } = accountData

  // Define logic used in results
  const grouped: Record<string, any[]> = {}
  for (const order of (orders || [])) {
    const key = order.transactionRef || order.id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(order)
  }

  const isOrderFinished = (o: any) => 
    o.status?.isFinal === true || 
    o.paymentStatus === "REJECTED" || 
    o.status?.name === "Цуцлагдсан" ||
    o.status?.name?.toLowerCase().includes("rejected");

  const activeGroups = Object.values(grouped).filter(g => g.some((o: any) => !isOrderFinished(o)))
  const completedGroups = Object.values(grouped).filter(g => g.every((o: any) => isOrderFinished(o)))
  const totalOrders = orders?.length || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Global Delivery Delay Warning */}
      {settings.delivery_delay_active === "true" && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm shadow-amber-100/50 flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0 shadow-sm text-amber-600">
            <AlertTriangle className="w-6 h-6 fill-amber-50" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-amber-900 leading-tight">Хүргэлтийн Анхааруулга</h4>
            <p className="text-sm text-amber-800/80 font-medium leading-relaxed italic">
              "{settings.delivery_delay_message}"
            </p>
          </div>
        </div>
      )}

      {!account ? (
        <div className="py-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-50 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-6 shadow-inner">
              <Search className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Захиалгаа шалгах</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Та захиалга хийх үед бүртгүүлсэн <strong className="text-indigo-600">утасны дугаар</strong>, гүйлгээний утга дээр бичсэн <strong className="text-indigo-600">дансны дугаар</strong> эсвэл захиалгын <strong className="text-indigo-600">линкээ</strong> оруулан захиалгынхаа төлөвийг шалгах боломжтой.
            </p>

            <form action="/track" className="flex flex-col sm:flex-row relative group w-full gap-3 shadow-sm rounded-2xl">
              <input
                type="text"
                name="account"
                required
                placeholder="Утасны дугаар, данс, линк..."
                className="w-full bg-slate-50 border-2 border-slate-200 text-slate-800 px-6 py-4 rounded-xl focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-400/20 transition-all placeholder:text-slate-400 font-medium text-lg"
              />
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-[#3c27c4] text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Шалгах
              </button>
            </form>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Утасны дугаар</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Захиалга өгөхдөө ашигласан утасны дугаараа оруулах</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Дансны дугаар</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Төлбөр шилжүүлэх үедээ гүйлгээний утга дээр бичсэн дугаар</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Захиалгын линк</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Танд очсон захиалгын баталгаажих линкийг хуулж тавих</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                Хайлтын үр дүн: <span className="text-[#4F46E5]">{account}</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium italic">Нийт захиалга: {totalOrders}</p>
            </div>
            <RefreshButton />
          </div>

          {!success || totalOrders === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Захиалга олдсонгүй</h3>
              <p className="text-slate-500 mb-6">
                <strong>{account}</strong> гэсэн утгаар хайхад ямар ч захиалга олдсонгүй. Та дараах шалтгаануудыг шалгаад дахин оролдоно уу:
              </p>
              <ul className="text-left bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3 text-sm text-slate-700 mx-auto max-w-md inline-block">
                <li className="flex gap-2 items-start"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Захиалга өгөхдөө өөр утасны дугаар ашигласан байх.</li>
                <li className="flex gap-2 items-start"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Төлбөр шилжүүлэхдээ гүйлгээний утгаа буруу бичсэн эсвэл мартсан байх.</li>
                <li className="flex gap-2 items-start"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Системд захиалга тань бүртгэгдэж амжаагүй байж болзошгүй (10-20 минут хүлээнэ үү).</li>
              </ul>
              <div className="mt-8 flex justify-center gap-3">
                <a href="/track" className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">Дахин хайх</a>
                <a href={settings.facebook_link || "https://facebook.com"} target="_blank" className="bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#4338ca] transition-colors">Админтай холбогдох</a>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Active Orders */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Идэвхтэй захиалга
                </h2>
                {activeGroups.length > 0 ? (
                  <div className="space-y-6">
                    <UnifiedDeliverySection groups={activeGroups} settings={settings} />
                    {activeGroups.map((groupOrders) => (
                      <OrderGroup key={groupOrders[0].transactionRef || groupOrders[0].id} orders={groupOrders} deliveryScheduleDays={settings.delivery_schedule_days || "3,6"} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500 border border-slate-100 font-medium italic">
                    Одоогоор идэвхтэй захиалга алга байна.
                  </div>
                )}
              </div>

              {/* Completed Orders */}
              {completedGroups.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-green-500" /> Өмнөх түүх
                  </h2>
                  <div className="space-y-6">
                    {completedGroups.map((groupOrders) => (
                      <OrderGroup key={groupOrders[0].transactionRef || groupOrders[0].id} orders={groupOrders} completed deliveryScheduleDays={settings.delivery_schedule_days || "3,6"} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UnifiedDeliverySection({ groups, settings }: { groups: any[][], settings: any }) {
  const deliveryScheduleDays = settings.delivery_schedule_days || "3,6"
  const allOrders = groups.flat()
  const alreadyDelivered = allOrders.filter((o: any) => o.wantsDelivery)
  const deliveryAddress = alreadyDelivered.find((o: any) => o.deliveryAddress)?.deliveryAddress
  const isStatusDeliverable = (status: any) => {
    if (!status) return false;
    if (status.isDeliverable) return true;
    if (status.isFinal) return false;
    const name = status.name?.toLowerCase() || "";
    return ["ирсэн", "arrived", "монголд", "улаанбаатарт", "ub"].some(k => name.includes(k));
  }

  const eligibleForDelivery = allOrders.filter((o: any) => isStatusDeliverable(o.status) && !o.wantsDelivery)
  const notYetDeliverable = allOrders.filter((o: any) => !isStatusDeliverable(o.status) && !o.wantsDelivery && !o.status?.isFinal)

  if (alreadyDelivered.length === 0 && eligibleForDelivery.length === 0 && notYetDeliverable.length === 0) return null
  const hasMixedDeliverable = eligibleForDelivery.length > 0 && notYetDeliverable.length > 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Хүргэлтийн мэдээлэл</h3>
      </div>
      {alreadyDelivered.length > 0 && (
        <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50/80 rounded-xl px-4 py-3 border border-green-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 mt-0 flex-shrink-0 text-green-500" />
          <div>
            <p className="font-semibold text-green-800">Хүргэлт захиалагдсан ({alreadyDelivered.length} бараа)</p>
            {deliveryAddress && <p className="text-xs font-medium text-green-600/90 mt-0.5">{deliveryAddress}</p>}
          </div>
        </div>
      )}
      {eligibleForDelivery.length > 0 && (
        <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
          <p className="text-sm text-slate-700 font-medium">
            🚚 <strong>{eligibleForDelivery.length}</strong> бараа хүргэлтэд бэлэн байна.
          </p>
          <DeliveryRequestButton orderIds={eligibleForDelivery.map((o: any) => o.id)} deliveryScheduleDays={deliveryScheduleDays} />
          
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-indigo-500" /> Дэлгүүрээс өөрөө ирж авах бол
            </h4>
            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p><strong>Хаяг:</strong> {settings.store_address || "Дэлгүүрийн хаяг тохируулаагүй байна."}</p>
              <p><strong>Цагийн хуваарь:</strong> {settings.store_hours || "Даваа - Баасан: 10:00 - 18:00"}</p>
              <p><strong>Утас:</strong> {settings.store_phone || ""}</p>
            </div>
          </div>

          {hasMixedDeliverable && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm leading-relaxed">
              <div className="flex gap-2 font-bold text-amber-900 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Танд ирээгүй {notYetDeliverable.length} бараа байна!</p>
              </div>
              <p className="text-amber-800 font-medium mb-3">Хэрэв та одоо ирсэн барааг салгаж хүргүүлэх бол:</p>
              <ul className="space-y-2 text-amber-700 mb-4">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" /> Үлдсэн барааг ирэхэд <strong>дахин хүргэлтийн төлбөр гарна.</strong></li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" /> Дээрх товч дээр дараад зөвхөн одоо ирсэн барааны хүргэлтийг баталгаажуулна.</li>
              </ul>
              <p className="text-amber-800 font-medium border-t border-amber-200/60 pt-3">
                Хэрэв та үлдсэн бараагаа хүлээгээд <strong>бөөнөөр нь 1 удаагийн төлбөрөөр</strong> хүргүүлэх бол одоо хүргэлтээ баталгаажуулах шаардлагагүй (зүгээр л хүлээнэ үү).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderGroup({ orders, completed = false, deliveryScheduleDays = "3,6" }: { orders: any[]; completed?: boolean; deliveryScheduleDays?: string }) {
  const first = orders[0]
  const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
  const allRejected = orders.every((o: any) => o.status?.name === "Цуцлагдсан" || o.paymentStatus === "REJECTED")
  const anyRejected = orders.some((o: any) => o.status?.name === "Цуцлагдсан" || o.paymentStatus === "REJECTED")
  const allFinal = orders.every((o: any) => o.status?.isFinal)
  const allDelivered = allFinal && !anyRejected
  const allDeliveryRequested = orders.every((o: any) => o.wantsDelivery)
  const someDeliveryRequested = orders.some((o: any) => o.wantsDelivery)

  // Determine styles (Neutralize if completed)
  let borderClass = "border-slate-200/60 shadow-slate-200/50"
  let accentClass = ""
  let headerIconBg = "bg-white border-slate-200 text-slate-500"
  let HeaderIcon = Package

  if (completed) {
    // If in history, always use muted/neutral colors regardless of status
    borderClass = "border-slate-200 shadow-sm opacity-70 grayscale-[0.3]"
    accentClass = "border-l-4 border-l-slate-300"
    headerIconBg = "bg-slate-50 border-slate-100 text-slate-400"
    HeaderIcon = allRejected ? XCircle : (allDelivered ? CheckCircle2 : Package)
  } else if (allRejected) {
    borderClass = "border-slate-200 shadow-sm"
    accentClass = "border-l-4 border-l-red-500/80"
    headerIconBg = "bg-red-50 border-red-100 text-red-500"
    HeaderIcon = XCircle
  } else if (allDelivered) {
    borderClass = "border-emerald-200 shadow-emerald-500/5 ring-1 ring-emerald-500/10"
    accentClass = "border-l-4 border-l-emerald-500/80"
    headerIconBg = "bg-emerald-50 border-emerald-100 text-emerald-600"
    HeaderIcon = CheckCircle2
  } else if (allDeliveryRequested) {
    borderClass = "border-emerald-200 shadow-sm"
    accentClass = "border-l-4 border-l-emerald-400"
  } else if (someDeliveryRequested) {
    borderClass = "border-amber-200 shadow-sm"
    accentClass = "border-l-4 border-l-amber-400"
  }

  return (
    <div className={`bg-white rounded-xl border transition-all overflow-hidden ${borderClass} ${accentClass}`}>
      <div className="bg-slate-50/30 border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${headerIconBg}`}>
            <HeaderIcon className="w-4 h-4" />
          </div>
          <div>
            <p className={`text-sm font-extrabold tracking-tight ${allRejected || completed ? "text-slate-500" : "text-slate-800"}`}>
              {allRejected ? "Цуцлагдсан захиалга" : (orders.length > 1 ? `${orders.length} ширхэг бараа` : "Захиалсан бараа")}
            </p>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              {new Date(first.createdAt).toLocaleDateString("mn-MN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allDeliveryRequested && !allRejected && !completed && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1.5 border border-emerald-200 shadow-sm">
              <Truck className="w-3 h-3" /> ХҮРГЭЛТ
            </span>
          )}
          {totalAmount > 0 ? (
            <span className={`font-black text-lg tracking-tighter ${allRejected || completed ? "text-slate-400" : "text-slate-900"}`}>
              ₮{totalAmount.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">Төлөгдсөн</span>
          )}
        </div>
      </div>

      <div className="px-5 py-2 border-b border-slate-50">
        <OrderStatusTimeline 
          status={allRejected ? "Цуцлагдсан" : (first.status?.name || "")} 
          isFinal={first.status?.isFinal} 
          deliveryScheduleDays={deliveryScheduleDays}
        />
      </div>

      <div className="divide-y divide-slate-100 text-left">
        {orders.map((order: any) => {
          const isCancelled = order.status?.name === "Цуцлагдсан" || order.paymentStatus === "REJECTED";
          const isPending = !isCancelled && !order.status?.isDeliverable && !order.status?.isFinal;
          
          return (
            <div key={order.id} className={`px-5 py-4 flex items-center justify-between gap-4 transition-colors ${order.wantsDelivery && !isCancelled && !completed ? "bg-emerald-50/20" : "hover:bg-slate-50/50"} ${isPending || isCancelled || completed ? "opacity-75" : ""}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {order.batch?.product?.imageUrl ? (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden relative border border-slate-200">
                    <Image src={order.batch.product.imageUrl} alt={order.batch.product.name || "Бараа"} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 border border-slate-200">
                    <Package className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${isCancelled || completed ? "text-slate-400 font-bold" : isPending ? "text-slate-500" : "text-slate-800"}`}>
                    {order.batch?.product?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wide">#{order.orderNumber} · {order.quantity} ширхэг</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {order.wantsDelivery && !isCancelled && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border shadow-sm ${completed ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                    ХҮРГЭЛТ
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-tight uppercase border ${
                  isCancelled || completed
                    ? "bg-slate-50 border-slate-200 text-slate-400"
                    : order.status?.isFinal 
                      ? "bg-emerald-50 border-emerald-200/50 text-emerald-600" 
                      : isPending
                        ? "bg-slate-50 border-slate-200/60 text-slate-500"
                        : "bg-blue-50 border-blue-100 text-blue-600"
                }`}>
                  {order.status?.name || "Хүлээгдэж байна"}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {allRejected && first.cancellationReason && (
        <div className="px-5 py-3 bg-red-50/50 border-t border-red-100 text-left">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-red-800/60 uppercase tracking-widest mb-1">Админ тайлбар:</p>
              <p className="text-[11px] text-red-700 font-bold italic leading-relaxed">
                "{first.cancellationReason}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
