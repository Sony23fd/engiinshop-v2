import { getPendingOrders } from "@/app/actions/settings-actions"
import { PendingOrderGroup } from "./PendingOrderGroup"
import { Clock, Package } from "lucide-react"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import { groupOrdersByCustomer } from "@/lib/customer-utils"

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
            return <PendingOrderGroup key={first.transactionRef || first.id} groupOrders={groupOrders} />
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
