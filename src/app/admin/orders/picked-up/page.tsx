import { getPickedUpOrders } from "@/app/actions/order-actions"
import { GroupPickedUpActions } from "./GroupPickedUpActions"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import { Handshake, Package, Truck, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PickedUpOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string, q?: string, page?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const q = p.q?.toLowerCase() || "";
  const page = p.page ? parseInt(p.page, 10) : 1;
  const itemsPerPage = 50;

  const { orders } = await getPickedUpOrders(days)

  let filteredOrders = orders || []
  if (q) {
    filteredOrders = filteredOrders.filter((o: any) =>
      o.customerName?.toLowerCase().includes(q) ||
      o.customerPhone?.includes(q) ||
      o.accountNumber?.toLowerCase().includes(q) ||
      o.batch?.product?.name?.toLowerCase().includes(q) ||
      o.deliveryAddress?.toLowerCase().includes(q) ||
      o.orderNumber?.toString().includes(q) ||
      o.transactionRef?.toLowerCase().includes(q) ||
      o.totalAmount?.toString().includes(q)
    )
  }

  // Group by transactionRef (same cart = same ref) then by customerPhone
  const grouped: Record<string, any[]> = {}
  for (const order of filteredOrders) {
    const key = order.transactionRef || order.customerPhone || order.id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(order)
  }
  const allGroups = Object.values(grouped)
  const totalPages = Math.ceil(allGroups.length / itemsPerPage);
  const groups = allGroups.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Handshake className="w-6 h-6 text-emerald-500" />
            Өөрөө ирж авсан захиалга
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Нийт <strong>{filteredOrders.length}</strong> ширхэг бараа — <strong>{allGroups.length}</strong> багц
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListSearchFilter />
          <DateRangeFilter days={days} />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Одоогоор өөрөө авсан захиалга байхгүй.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((groupOrders) => {
            const first = groupOrders[0]
            const totalAmount = groupOrders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0)
            const wantsDelivery = groupOrders.some((o: any) => o.wantsDelivery)
            const deliveryAddress = groupOrders.find((o: any) => o.deliveryAddress)?.deliveryAddress

            return (
              <div key={first.transactionRef || first.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 border-l-emerald-400`}
              >
                {/* Customer Header */}
                <div className="bg-slate-50 border-b px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{first.customerName}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-slate-500 text-sm">{first.customerPhone}</span>
                      {first.accountNumber && (
                        <>
                          <span className="text-slate-400 mx-2">·</span>
                          <span className="text-slate-500 text-sm font-mono">{first.accountNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Өөрөө авсан
                    </span>
                    {wantsDelivery && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Хүргэлт
                      </span>
                    )}
                    <span className="font-bold text-slate-600 text-sm">
                      Нийт ₮{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Orders list */}
                <div className="divide-y">
                  {groupOrders.map((order: any) => (
                    <div key={order.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-slate-800">{order.batch?.product?.name}</span>
                            <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                            <div>
                              <span className="text-slate-400 text-xs block">Тоо</span>
                              <span className="font-medium text-slate-800">{order.quantity} ш</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Дүн</span>
                              <span className="font-semibold text-slate-600">₮{Number(order.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Үүсгэсэн</span>
                              <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("mn-MN")}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Олгосон</span>
                              <span className="text-xs text-emerald-600 font-medium">{new Date(order.updatedAt).toLocaleString("mn-MN")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Restore button */}
                <div className="border-t px-5 py-4 flex items-center justify-between gap-4 bg-slate-50/60">
                  <p className="text-xs text-slate-400">
                    Энэ хэрэглэгч ачаагаа өөрөө ирж авсан байна
                  </p>
                  <GroupPickedUpActions orderIds={groupOrders.map((o: any) => o.id)} />
                </div>
              </div>
            )
          })}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <a href={`?days=${days}&q=${q}&page=${page > 1 ? page - 1 : 1}`}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
                Өмнөх
              </a>
              <span className="text-sm font-medium text-slate-600 px-4">
                Хуудас {page} / {totalPages}
              </span>
              <a href={`?days=${days}&q=${q}&page=${page < totalPages ? page + 1 : totalPages}`}
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
