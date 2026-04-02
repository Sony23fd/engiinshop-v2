import { getArchivedConfirmedOrders } from "@/app/actions/order-actions"
import { CheckCircle, Package, Truck, User, ChevronLeft, ChevronRight } from "lucide-react"
import { ListSearchFilter } from "@/components/admin/ListSearchFilter"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ConfirmedOrdersArchivePage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; page?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const q = resolvedParams.q?.toLowerCase() || ""
  const page = parseInt(resolvedParams.page || "1", 10)
  const limit = 20

  const { orders, total } = await getArchivedConfirmedOrders(page, limit, q)
  const totalPages = Math.ceil((total || 0) / limit)

  // Group by transactionRef (same cart = same ref) then by customerPhone
  const grouped: Record<string, any[]> = {}
  for (const order of orders || []) {
    const key = order.transactionRef || order.customerPhone || order.id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(order)
  }
  const groups = Object.values(grouped)

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Баталгаажсан захиалгууд
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Нийт <strong>{total || 0}</strong> ширхэг баталгаажсан захиалга байна.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListSearchFilter />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Одоогоор баталгаажсан захиалга алга байна</p>
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
                className={`bg-white rounded-xl border shadow-sm overflow-hidden border-l-4 ${wantsDelivery ? "border-l-blue-400" : "border-l-green-400"}`}
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
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Баталгаажсан
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

                {/* Orders list */}
                <div className="divide-y">
                  {groupOrders.map((order: any) => (
                    <div key={order.id} className="px-5 py-4">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-slate-800">{order.batch?.product?.name}</span>
                            <span className="text-slate-400 text-sm">#{order.orderNumber}</span>
                            {order.status && (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {order.status.name}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                            <div>
                              <span className="text-slate-400 text-xs block">Тоо</span>
                              <span className="font-medium text-slate-800">{order.quantity} ш</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Дүн</span>
                              <span className="font-semibold text-indigo-600">₮{Number(order.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Гүйлгээний утга</span>
                              <span className="font-mono text-xs font-semibold text-slate-700 tracking-wider">
                                {order.transactionRef || order.id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-xs block">Батлагдсан огноо</span>
                              <span className="text-xs text-slate-500">{new Date(order.updatedAt || order.createdAt).toLocaleString("mn-MN")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery address (shared) */}
                {deliveryAddress && (
                  <div className="bg-blue-50 border-t px-5 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Хүргэлтийн хаяг: <strong>{deliveryAddress}</strong></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Нийт <span className="font-medium">{total}</span> илэрцээс{" "}
                <span className="font-medium">{(page - 1) * limit + 1}</span> -{" "}
                <span className="font-medium">{Math.min(page * limit, total || 0)}</span> харуулж байна.
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Link
                  href={`/admin/orders/archived/confirmed?page=${Math.max(page - 1, 1)}${q ? `&q=${q}` : ''}`}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <span className="sr-only">Өмнөх</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Link>
                <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0">
                  {page} / {totalPages}
                </div>
                <Link
                  href={`/admin/orders/archived/confirmed?page=${Math.min(page + 1, totalPages)}${q ? `&q=${q}` : ''}`}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <span className="sr-only">Дараах</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
