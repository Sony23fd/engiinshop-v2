import { getDeliveryOrders } from "@/app/actions/order-actions"
import { Truck, Box } from "lucide-react"
import { DeliveryGroupCard } from "./DeliveryGroupCard"
import { DeliveryFilter } from "./DeliveryFilter"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DeliveryQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string, q?: string, page?: string, tab?: string }>
}) {
  const resolvedParams = await searchParams
  const dateFilter = resolvedParams.date
  const q = resolvedParams.q?.toLowerCase() || ""
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1
  const currentTab = resolvedParams.tab === "in_transit" ? "in_transit" : "ready"
  const itemsPerPage = 50

  const { orders, readyCount = 0, inTransitCount = 0 } = await getDeliveryOrders(dateFilter, currentTab)
  
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
  const allGroups = Object.values(grouped).sort((a, b) => {
    const latestA = Math.max(...a.map((o: any) => new Date(o.deliveryRequestedAt || o.updatedAt || o.createdAt).getTime()));
    const latestB = Math.max(...b.map((o: any) => new Date(o.deliveryRequestedAt || o.updatedAt || o.createdAt).getTime()));
    return latestB - latestA;
  })
  const totalPages = Math.ceil(allGroups.length / itemsPerPage);
  const groups = allGroups.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Хүргэлтийн удирдлага
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {currentTab === "ready" ? (
              <>{dateFilter ? <strong>{dateFilter}</strong> : "Нийт"} хүргэлтэд бэлтгэх <strong>{filteredOrders.length}</strong> ширхэг бараа — <strong>{allGroups.length}</strong> багц</>
            ) : (
              <>{dateFilter ? <strong>{dateFilter}</strong> : "Нийт"} жолоочтой замдаа яваа <strong>{filteredOrders.length}</strong> ширхэг бараа — <strong>{allGroups.length}</strong> багц</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListSearchFilter />
          <DeliveryFilter />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <Link
          href={`?tab=ready${dateFilter ? `&date=${dateFilter}` : ""}${q ? `&q=${q}` : ""}`}
          className={cn(
            "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all",
            currentTab === "ready" 
              ? "border-amber-500 text-amber-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Box className="w-4 h-4" />
          <span>Хүргэлтэд бэлтгэх (Хүлээгдэж буй)</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-bold",
            currentTab === "ready" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          )}>
            {readyCount}
          </span>
        </Link>
        <Link
          href={`?tab=in_transit${dateFilter ? `&date=${dateFilter}` : ""}${q ? `&q=${q}` : ""}`}
          className={cn(
            "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all",
            currentTab === "in_transit" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Truck className="w-4 h-4" />
          <span>Хүргэлтэд гарсан (Замдаа яваа)</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-bold",
            currentTab === "in_transit" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
          )}>
            {inTransitCount}
          </span>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          {currentTab === "ready" ? (
            <>
              <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Одоогоор хүргэлтэд бэлтгэх (хүлээгдэж буй) захиалга байхгүй.</p>
            </>
          ) : (
            <>
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Одоогоор жолоочид хүлээлгэн өгсөн, замдаа яваа захиалга байхгүй.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((groupOrders) => {
            return <DeliveryGroupCard key={groupOrders[0].customerPhone || groupOrders[0].id} groupOrders={groupOrders} />
          })}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <a href={`?tab=${currentTab}&date=${dateFilter || ""}&q=${q}&page=${page > 1 ? page - 1 : 1}`}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
                Өмнөх
              </a>
              <span className="text-sm font-medium text-slate-600 px-4">
                Хуудас {page} / {totalPages}
              </span>
              <a href={`?tab=${currentTab}&date=${dateFilter || ""}&q=${q}&page=${page < totalPages ? page + 1 : totalPages}`}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page >= totalPages ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
                Дараах
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
