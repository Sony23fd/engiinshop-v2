import { getCategories } from "@/app/actions/category-actions"
import { getOrderStatuses } from "@/app/actions/order-actions"
import Link from "next/link"
import { FolderOpen, Archive, Search } from "lucide-react"
import { ReadyStockToggle } from "./ReadyStockToggle"

export const dynamic = "force-dynamic"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"

export default async function AdminOrdersCategoriesPage({ searchParams }: { searchParams: Promise<{ days?: string, page?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const page = p.page ? parseInt(p.page, 10) : 1;
  const itemsPerPage = 50;
  const [{ categories, success }, statusResult] = await Promise.all([
    getCategories(days),
    getOrderStatuses()
  ])
  const orderStatuses = (statusResult.success && statusResult.statuses) ? statusResult.statuses : []
  
  const allCategories = categories || [];
  const totalPages = Math.ceil(allCategories.length / itemsPerPage);
  const paginatedCategories = allCategories.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm w-full border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Глобал Хайлт</h2>
          <p className="text-sm text-slate-500 mb-4">
            Бүх ангилал дундаас захиалгыг утас, данс, захиалгын дугаар болон барааны нэрээр хайх боломжтой.
          </p>
          <form action="/admin/orders/search" className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="Захиалга хайх... (Ж: 99112233, ORD-123, Цамц)"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
            >
              Хайх
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm w-full border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Идэвхтэй Ангиллууд</h1>
          <div className="flex items-center gap-3">
            <DateRangeFilter days={days} />
            <Link href="/admin/orders/archived"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
              <Archive className="w-4 h-4" />
              Архив
            </Link>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 mb-6">
          Та аль сарын захиалгыг үзэхээ доорх жагсаалтаас сонгоно уу.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {success && allCategories.length > 0 ? (
            paginatedCategories.map((category: any) => {
              // Flatten all orders from all batches in this category
              const allOrders = category.batches?.flatMap((b: any) => b.orders ?? []) ?? []
              const totalOrders = allOrders.length
              const completedOrders = allOrders.filter((o: any) => o.status?.isFinal === true).length
              const activeOrders = totalOrders - completedOrders

              // A category is "Completed" only when it has at least 1 order and ALL are final
              const isCompleted = totalOrders > 0 && completedOrders === totalOrders
              const hasOrders = totalOrders > 0

              return (
              <div 
                key={category.id} 
                className="group rounded-xl border border-slate-200 bg-white hover:border-[#4F46E5] hover:shadow-md transition-all cursor-pointer"
              >
                <Link 
                  href={`/admin/orders/category/${category.id}`}
                  className="p-6 pb-2 flex items-center space-x-4"
                >
                  <div className={`p-4 rounded-full transition-colors ${isCompleted ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-indigo-50 text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white'}`}>
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-800">{category.name}</h3>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Completed
                        </span>
                      ) : hasOrders ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Идэвхтэй
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Үүсгэсэн: {new Date(category.createdAt).toLocaleDateString()}</p>
                    {hasOrders && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isCompleted 
                          ? `Бүх ${totalOrders} захиалга дууссан` 
                          : `Идэвхтэй: ${activeOrders} · Дууссан: ${completedOrders}`}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="px-6 pb-4 pt-0">
                  <ReadyStockToggle
                    categoryId={category.id}
                    initialReadyStock={!!category.isReadyStock}
                    initialStatusId={category.readyStockStatusId || null}
                    statuses={orderStatuses.map((s: any) => ({ id: s.id, name: s.name, color: s.color }))}
                  />
                </div>
              </div>
              )
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
               Одоогоор захиалгын ангилал үүсээгүй байна. "Захиалгын ангилал" цэсээр орж сар үүсгэнэ үү.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <a href={`?days=${days}&page=${page > 1 ? page - 1 : 1}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page <= 1 ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
              Өмнөх
            </a>
            <span className="text-sm font-medium text-slate-600 px-4">
              Хуудас {page} / {totalPages}
            </span>
            <a href={`?days=${days}&page=${page < totalPages ? page + 1 : totalPages}`}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${page >= totalPages ? "opacity-50 pointer-events-none bg-slate-50" : "hover:bg-slate-50 bg-white"}`}>
              Дараах
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
