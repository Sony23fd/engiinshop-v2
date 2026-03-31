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

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Хүргэлтийн мэдээлэл</h3>
      </div>

      {/* Already delivered orders */}
      {alreadyDelivered.length > 0 && (
        <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 border border-green-100">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Хүргэлт захиалагдсан ({alreadyDelivered.length} бараа)</p>
            {deliveryAddress && <p className="text-xs text-green-600 mt-0.5">{deliveryAddress}</p>}
          </div>
        </div>
      )}

      {/* Eligible orders — show the unified button */}
      {eligibleForDelivery.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            🚚 <strong>{eligibleForDelivery.length}</strong> бараа хүргэлтэд бэлэн байна. Нэг удаа хаягаа оруулахад бүгд хүргэгдэнэ.
          </p>
          <DeliveryRequestButton orderIds={eligibleForDelivery.map((o: any) => o.id)} />
        </div>
      )}

      {/* Not yet deliverable */}
      {notYetDeliverable.length > 0 && eligibleForDelivery.length === 0 && alreadyDelivered.length === 0 && (
        <div className="text-xs text-slate-400 bg-white rounded-lg px-4 py-3 border border-dashed">
          🕐 Таны {notYetDeliverable.length} бараа одоогоор карго дээр байгаа тул хүргэлт захиалах боломжгүй. Бараа ирсний дараа автоматаар идэвхтэй болно.
        </div>
      )}

      {notYetDeliverable.length > 0 && (eligibleForDelivery.length > 0 || alreadyDelivered.length > 0) && (
        <p className="text-xs text-slate-400">
          🕐 Үлдсэн {notYetDeliverable.length} бараа карго дээр явж байгаа тул хүргэлт захиалахад бэлэн болсны дараа энд автоматаар гарч ирнэ.
        </p>
      )}
    </div>
  )
}

// ── OrderGroup Component ─────────────────────────────────────────────────────

function OrderGroup({ orders, completed = false }: { orders: any[]; completed?: boolean }) {
  const first = orders[0]
  const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
  const allFinal = orders.every((o: any) => o.status?.isFinal)
  const allDeliveryRequested = orders.every((o: any) => o.wantsDelivery)
  const someDeliveryRequested = orders.some((o: any) => o.wantsDelivery)

  // The "representative" status to show (pick latest / highest priority)
  const latestOrder = orders.slice().sort((a: any, b: any) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0]

  // Card border color: green if all delivered, amber if some, default otherwise
  const borderClass = allDeliveryRequested 
    ? "border-l-4 border-l-green-400" 
    : someDeliveryRequested 
      ? "border-l-4 border-l-amber-400" 
      : ""

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${borderClass}`}>
      {/* Header */}
      <div className="bg-slate-50 border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${allFinal ? "bg-green-100" : "bg-blue-100"}`}>
            {allFinal
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <Clock className="w-4 h-4 text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {orders.length > 1 ? `${orders.length} бараа нэг захиалгад` : "Захиалга"}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(first.createdAt).toLocaleDateString("mn-MN")} захиалсан
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allDeliveryRequested && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Хүргэлтэд
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${allFinal ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {latestOrder.status?.name || "Хүлээгдэж байна"}
          </span>
          <span className="font-bold text-slate-900">₮{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y">
        {orders.map((order: any) => (
          <div key={order.id} className={`px-6 py-4 flex items-center justify-between gap-4 ${order.wantsDelivery ? "bg-green-50/30" : ""}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Package className={`w-4 h-4 flex-shrink-0 ${order.wantsDelivery ? "text-green-400" : "text-slate-300"}`} />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{order.batch?.product?.name}</p>
                <p className="text-xs text-slate-400">#{order.orderNumber} · {order.quantity} ш</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {order.wantsDelivery && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold flex items-center gap-0.5 whitespace-nowrap">
                  <Truck className="w-2.5 h-2.5" /> Хүргэлт
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${order.status?.isFinal ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                {order.status?.name || "Хүлээгдэж байна"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
