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

// ── OrderGroup Component ─────────────────────────────────────────────────────

function OrderGroup({ orders, completed = false }: { orders: any[]; completed?: boolean }) {
  const first = orders[0]
  const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
  const allFinal = orders.every((o: any) => o.status?.isFinal)

  // Delivery: decide from the group
  const alreadyRequested = orders.some((o: any) => o.wantsDelivery)
  const deliveryAddress = orders.find((o: any) => o.deliveryAddress)?.deliveryAddress

  // Is any product at the deliverable stage?
  const anyDeliverable = orders.some((o: any) => o.status?.isDeliverable)

  // The "representative" status to show (pick latest / highest priority)
  const latestOrder = orders.slice().sort((a: any, b: any) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0]

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
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
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${allFinal ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {latestOrder.status?.name || "Хүлээгдэж байна"}
          </span>
          <span className="font-bold text-slate-900">₮{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y">
        {orders.map((order: any) => (
          <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Package className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{order.batch?.product?.name}</p>
                <p className="text-xs text-slate-400">#{order.orderNumber} · {order.quantity} ш</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${order.status?.isFinal ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
              {order.status?.name || "Хүлээгдэж байна"}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery section (shown once for the whole group) */}
      {!completed && (
        <div className="border-t px-6 py-4 bg-slate-50/50">
          {alreadyRequested ? (
            <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Хүргэлт захиалагдсан</p>
                {deliveryAddress && <p className="text-xs text-green-600 mt-0.5">{deliveryAddress}</p>}
              </div>
            </div>
          ) : anyDeliverable ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">🚚 Хүргэлт захиалах боломжтой</p>
              {/* Pass all active order ids for bulk delivery update */}
              <DeliveryRequestButton orderIds={orders.map((o: any) => o.id)} />
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-white rounded-lg px-4 py-3 border border-dashed">
              🕐{" "}
              <strong>
                {latestOrder.status?.name || "..."}
              </strong>{" "}
              статустай байгаа тул одоогоор хүргэлт захиалах боломжгүй. Бараа ирсний дараа автоматаар идэвхтэй болно.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
