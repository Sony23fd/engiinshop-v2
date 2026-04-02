import { getOrdersByAccount } from "@/app/actions/order-actions"
import { Search, Package, CheckCircle2, Clock, History, Truck } from "lucide-react"
import DeliveryRequestButton from "./DeliveryRequestButton"

export const dynamic = "force-dynamic"

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>
}) {
  const resolvedParams = await searchParams
  const account = resolvedParams.account

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Хайлт хийгдсэнгүй</h2>
        <p className="text-slate-500">Та дээрх хайлтын хэсэгт дансны дугаараа оруулан хайна уу.</p>
      </div>
    )
  }

  const { orders, success } = await getOrdersByAccount(account)

  // Group by transactionRef (same cart checkout)
  const grouped: Record<string, any[]> = {}
  for (const order of (orders || [])) {
    const key = order.transactionRef || order.id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(order)
  }

  const activeGroups = Object.values(grouped).filter(g => g.some((o: any) => !o.status?.isFinal))
  const completedGroups = Object.values(grouped).filter(g => g.every((o: any) => o.status?.isFinal))

  const totalOrders = orders?.length || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Хайлтын үр дүн: <span className="text-[#4F46E5]">{account}</span>
        </h1>
        <p className="text-slate-500 mt-1">Нийт захиалга: {totalOrders}</p>
      </div>

      {!success || totalOrders === 0 ? (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center text-slate-500">
          Энэ дансны дугаар дээр бүртгэлтэй захиалга олдсонгүй.
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
                {/* ── Unified Delivery Section ── */}
                <UnifiedDeliverySection groups={activeGroups} />

                {activeGroups.map((groupOrders) => (
                  <OrderGroup key={groupOrders[0].transactionRef || groupOrders[0].id} orders={groupOrders} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500 border border-slate-100">
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
                  <OrderGroup key={groupOrders[0].transactionRef || groupOrders[0].id} orders={groupOrders} completed />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Unified Delivery Section ─────────────────────────────────────────────────
// Shows a single delivery button for ALL active orders that haven't requested delivery yet.

function UnifiedDeliverySection({ groups }: { groups: any[][] }) {
  const allOrders = groups.flat()
  
  // Orders that already have delivery requested
  const alreadyDelivered = allOrders.filter((o: any) => o.wantsDelivery)
  const deliveryAddress = alreadyDelivered.find((o: any) => o.deliveryAddress)?.deliveryAddress

  // Orders eligible for delivery (deliverable status + not yet requested)
  const eligibleForDelivery = allOrders.filter((o: any) => o.status?.isDeliverable && !o.wantsDelivery)
  
  // Orders not yet deliverable (still in cargo, etc.)
  const notYetDeliverable = allOrders.filter((o: any) => !o.status?.isDeliverable && !o.wantsDelivery && !o.status?.isFinal)

  // If everything is already handled, don't show anything
  if (alreadyDelivered.length === 0 && eligibleForDelivery.length === 0 && notYetDeliverable.length === 0) return null

  const hasMixedDeliverable = eligibleForDelivery.length > 0 && notYetDeliverable.length > 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Хүргэлтийн мэдээлэл</h3>
      </div>

      {/* Already delivered orders */}
      {alreadyDelivered.length > 0 && (
        <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50/80 rounded-xl px-4 py-3 border border-green-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 mt-0 flex-shrink-0 text-green-500" />
          <div>
            <p className="font-semibold text-green-800">Хүргэлт захиалагдсан ({alreadyDelivered.length} бараа)</p>
            {deliveryAddress && <p className="text-xs font-medium text-green-600/90 mt-0.5">{deliveryAddress}</p>}
          </div>
        </div>
      )}

      {/* Eligible orders — show the unified button */}
      {eligibleForDelivery.length > 0 && (
        <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
          <p className="text-sm text-slate-700 font-medium">
            🚚 <strong>{eligibleForDelivery.length}</strong> бараа хүргэлтэд бэлэн байна.
          </p>
          <DeliveryRequestButton orderIds={eligibleForDelivery.map((o: any) => o.id)} />
          
          {hasMixedDeliverable && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed font-medium">
              ⚠️ <strong className="text-amber-900">Анхаарах:</strong> Танд ирээгүй <strong>{notYetDeliverable.length}</strong> бараа байна. 
              Та ирсэн барааг нь одоо салгаж хүргүүлэх бол, дараа нь үлдсэн барааг хүргэхэд <strong>ДАХИН хүргэлтийн төлбөр төлнө</strong> гэдгийг анхаарна уу!
            </div>
          )}
        </div>
      )}

      {/* Not yet deliverable */}
      {notYetDeliverable.length > 0 && eligibleForDelivery.length === 0 && alreadyDelivered.length === 0 && (
        <div className="text-sm text-slate-500 bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm flex gap-3 items-start">
          <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Таны {notYetDeliverable.length} бараа одоогоор хүлээгдэж байгаа тул хүргэлт захиалах боломжгүй. 
            Бараа тань Монголд ирсний дараа автоматаар хүргэлт захиалах боломжтой болно.
          </p>
        </div>
      )}

      {notYetDeliverable.length > 0 && (eligibleForDelivery.length > 0 || alreadyDelivered.length > 0) && (
        <p className="text-xs text-slate-500 font-medium px-1">
          🕐 Үлдсэн {notYetDeliverable.length} бараа хүлээгдэж байна. Бэлэн болсны дараа автоматаар хүргэлтийн товч нээгдэнэ.
        </p>
      )}
    </div>
  )
}

// ── OrderGroup Component ─────────────────────────────────────────────────────

function getStatusIcon(statusName: string | undefined) {
  if (!statusName) return "🕒";
  const name = statusName.toLowerCase();
  if (name.includes("солонгосоос хөдөлсөн") || name.includes("замдаа")) return "✈️";
  if (name.includes("улаанбаатарт ирсэн") || name.includes("ирсэн")) return "✅";
  if (name.includes("баталгаажсан")) return "🛒";
  if (name.includes("хүргэгдсэн") || name.includes("хүргэлтэнд")) return "🚚";
  return "🕒";
}

function OrderGroup({ orders, completed = false }: { orders: any[]; completed?: boolean }) {
  const first = orders[0]
  const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
  const allFinal = orders.every((o: any) => o.status?.isFinal)
  const allDeliveryRequested = orders.every((o: any) => o.wantsDelivery)
  const someDeliveryRequested = orders.some((o: any) => o.wantsDelivery)

  // Card border color: green if all delivered, amber if some, default otherwise
  const borderClass = allDeliveryRequested 
    ? "border-emerald-300 shadow-emerald-500/10 ring-1 ring-emerald-500/20" 
    : someDeliveryRequested 
      ? "border-amber-300 shadow-amber-500/10 ring-1 ring-amber-500/20" 
      : "border-slate-200/60 shadow-slate-200/50"

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-all overflow-hidden ${borderClass}`}>
      {/* Header */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${allFinal ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-slate-200 text-slate-500"}`}>
            {allFinal
              ? <CheckCircle2 className="w-4 h-4" />
              : <Package className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {orders.length > 1 ? `${orders.length} ширхэг бараа` : "Захиалсан бараа"}
            </p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {new Date(first.createdAt).toLocaleDateString("mn-MN")} захиалсан
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allDeliveryRequested && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1.5 border border-emerald-200 shadow-sm">
              <Truck className="w-3 h-3" /> БҮГД ХҮРГЭЛТЭД
            </span>
          )}
          {totalAmount > 0 ? (
            <span className="font-extrabold text-slate-800 text-lg tracking-tight">₮{totalAmount.toLocaleString()}</span>
          ) : (
             <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">Төлөгдсөн</span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-50">
        {orders.map((order: any) => {
          const isPending = !order.status?.isDeliverable && !order.status?.isFinal;
          return (
            <div key={order.id} className={`px-5 py-4 flex items-center justify-between gap-4 transition-colors ${order.wantsDelivery ? "bg-emerald-50/30" : "hover:bg-slate-50/50"} ${isPending ? "opacity-75" : ""}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isPending ? (
                  <Clock className="w-4 h-4 flex-shrink-0 text-slate-300" />
                ) : (
                  <Package className={`w-4 h-4 flex-shrink-0 ${order.wantsDelivery ? "text-emerald-400" : "text-indigo-400"}`} />
                )}
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${isPending ? "text-slate-500" : "text-slate-800"}`}>
                    {order.batch?.product?.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">#{order.orderNumber} · {order.quantity} ш</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {order.wantsDelivery && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-700 font-bold flex items-center gap-1 whitespace-nowrap border border-emerald-200/60 shadow-sm">
                    <Truck className="w-3 h-3" /> Хүргэлт
                  </span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap border shadow-sm flex items-center gap-1.5 ${
                  order.status?.isFinal 
                    ? "bg-emerald-50 border-emerald-200/50 text-emerald-700" 
                    : isPending
                      ? "bg-slate-50 border-slate-200/60 text-slate-600"
                      : "bg-blue-50 border-blue-200/50 text-blue-700"
                }`}>
                  <span className="text-sm leading-none">{getStatusIcon(order.status?.name)}</span>
                  {order.status?.name || "Хүлээгдэж байна"}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
