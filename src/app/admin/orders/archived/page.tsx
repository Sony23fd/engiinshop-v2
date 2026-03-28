import { getArchivedCategories, unarchiveCategory } from "@/app/actions/category-actions"
import Link from "next/link"
import { FolderOpen, ArchiveRestore, ArrowLeft, Archive } from "lucide-react"
import { ArchiveCategoryButton } from "../category/[categoryId]/ArchiveCategoryButton"
import { DateRangeFilter } from "@/components/admin/DateRangeFilter"

export const dynamic = "force-dynamic"

export default async function ArchivedCategoriesPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const { categories } = await getArchivedCategories(days)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-6 h-6 text-slate-500" />
              Архивласан ангиллууд
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Дууссан захиалгуудын түүх</p>
          </div>
        </div>
        <div className="flex items-center">
          <DateRangeFilter days={days} basePath="/admin/orders/archived" />
        </div>
      </div>

      {!categories?.length ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Архивласан ангилал байхгүй</p>
          <p className="text-slate-400 text-sm mt-1">Дууссан захиалгын ангиллуудыг архивлаарай</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category: any) => {
            const allOrders = category.batches?.flatMap((b: any) => b.orders ?? []) ?? []
            const totalOrders = allOrders.length
            const completedOrders = allOrders.filter((o: any) => o.status?.isFinal === true).length

            return (
              <div key={category.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Link
                  href={`/admin/orders/category/${category.id}`}
                  className="block p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-slate-100 rounded-full">
                      <FolderOpen className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{category.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Нийт {totalOrders} захиалга · Дууссан {completedOrders}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(category.updatedAt).toLocaleDateString("mn-MN")} архивласан
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="border-t px-4 py-2.5 flex justify-end bg-slate-50">
                  <ArchiveCategoryButton categoryId={category.id} isArchived={true} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
