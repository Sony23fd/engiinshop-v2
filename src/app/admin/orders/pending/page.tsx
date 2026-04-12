import { getPendingOrders } from "@/app/actions/settings-actions"
import { Clock, Package, Truck, User } from "lucide-react"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import { groupOrdersByCustomer } from "@/lib/customer-utils"
import { PendingGroupClient } from "./PendingGroupClient"

export const dynamic = "force-dynamic"

export default async function PendingOrdersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string, page?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const q = resolvedParams.q?.toLowerCase() || ""
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const itemsPerPage = 50;

  const { orders } = await getPendingOrders()

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

  // Group by canonical customer ID (normalized phone > account > transactionRef > id)
  const grouped = groupOrdersByCustomer(filteredOrders)
  const allGroups = Object.values(grouped)
  const totalPages = Math.ceil(allGroups.length / itemsPerPage);
  const groups = allGroups.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            Төлбөр хүлээгдэж байна
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Нийт <strong>{filteredOrders.length}</strong> захиалга — <strong>{allGroups.length}</strong> хэрэглэгч
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListSearchFilter />
        </div>
      </div>

      {allGroups.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Одоогоор хүлээгдэж буй захиалга байхгүй</p>
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
                className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 ${wantsDelivery ? "border-l-blue-400" : "border-l-emerald-400"}`}
              >
                {/* Customer Header */}
                <div className="bg-slate-50 border-b px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
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
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Хүлээгдэж байна
                    </span>
                    {wantsDelivery && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Хүргэлт
                      </span>
                    )}
                    <span className="font-bold text-indigo-600 text-sm">
                      Нийт ₮{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Orders list + Actions (client component with checkboxes) */}
                <PendingGroupClient
                  groupOrders={groupOrders}
                  deliveryAddress={deliveryAddress}
                />
              </div>
            )
          })}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <a href={`?q=${q}&page=${page > 1 ? page - 1 : 1}`}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
                Өмнөх
              </a>
              <span className="text-sm font-medium text-slate-600 px-4">
                Хуудас {page} / {totalPages}
              </span>
              <a href={`?q=${q}&page=${page < totalPages ? page + 1 : totalPages}`}
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
