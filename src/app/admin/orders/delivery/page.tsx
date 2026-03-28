import { getDeliveryOrders } from "@/app/actions/order-actions"
import { Truck, Package, User } from "lucide-react"
import { DeliveryGroupCard } from "./DeliveryGroupCard"
import { DeliveryFilter } from "./DeliveryFilter"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"

export const dynamic = "force-dynamic"

export default async function DeliveryQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string, q?: string }>
}) {
  const resolvedParams = await searchParams
  const dateFilter = resolvedParams.date
  const q = resolvedParams.q?.toLowerCase() || ""

  const { orders } = await getDeliveryOrders(dateFilter)
  
  let filteredOrders = orders || []
  if (q) {
    filteredOrders = filteredOrders.filter((o: any) => 
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.accountNumber?.toLowerCase().includes(q) ||
      o.batch?.product?.name?.toLowerCase().includes(q) ||
      o.deliveryAddress?.toLowerCase().includes(q) ||
      o.orderNumber?.toString().includes(q) ||
      o.transactionRef?.toLowerCase().includes(q)
    )
  }

  // Group by customerPhone
  const grouped: Record<string, any[]> = {}
  for (const order of filteredOrders) {
    const key = order.customerPhone || order.id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(order)
  }
  const groups = Object.values(grouped)

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Хүргэлтийн захиалгууд
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {dateFilter ? <strong>{dateFilter}</strong> : "Нийт"} өдөрт хүргэлт шаардлагатай <strong>{orders?.length || 0}</strong> ширхэг бараа — <strong>{groups.length}</strong> багц
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListSearchFilter />
          <DeliveryFilter />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Одоогоор хүргэлт хүлээгдэж буй захиалга байхгүй.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((groupOrders) => {
            return <DeliveryGroupCard key={groupOrders[0].customerPhone || groupOrders[0].id} groupOrders={groupOrders} />
          })}
        </div>
      )}
    </div>
  )
}
