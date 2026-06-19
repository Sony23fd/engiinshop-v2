import { getCategories } from "@/app/actions/category-actions"
import Link from "next/link"
import { FolderOpen, Archive } from "lucide-react"

export const dynamic = "force-dynamic"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"

export default async function AdminOrdersCategoriesPage({ searchParams }: { searchParams: Promise<{ days?: string, page?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const page = p.page ? parseInt(p.page, 10) : 1;
  const itemsPerPage = 50;
  const { categories, success } = await getCategories(days)
  
  const allCategories = categories || [];
  const totalPages = Math.ceil(allCategories.length / itemsPerPage);
  const paginatedCategories = allCategories.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
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
              <Link 
                key={category.id} 
                href={`/admin/orders/category/${category.id}`}
                className="group p-6 rounded-xl border border-slate-200 bg-white hover:border-[#4F46E5] hover:shadow-md transition-all flex items-center space-x-4 cursor-pointer"
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
