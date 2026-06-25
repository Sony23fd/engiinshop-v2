import { getRefundOrders, toggleOrderRefund } from "@/app/actions/order-actions"
import { RefundList } from "./RefundList"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminRefundsPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string, page?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const tab = resolvedParams.tab || "pending"
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1
  const limit = 50

  const { orders, pendingCount, completedCount, totalPages } = await getRefundOrders({ tab, page, limit })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Буцаалтын жагсаалт</h1>
        <p className="text-sm text-slate-500 mt-1">
          Солонгос талд дууссан эсвэл цуцалсан захиалгуудийн төлбөрийг буцаан шилжүүлэх удирдлага.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">{pendingCount || 0}</span>
          </div>
          <div>
            <h3 className="font-semibold text-red-900 text-lg">Хүлээгдэж буй буцаалтууд</h3>
            <p className="text-red-700 text-sm mt-1 leading-snug">
              Хэрэглэгч рүү мөнгийг нь дансаар буцааж шилжүүлэх шаардлагатай захиалгууд энэ хэсэгт байна. Мөнгийг шилжүүлсний дараа баталгаажуулна уу.
            </p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">{completedCount || 0}</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900 text-lg">Хийгдсэн буцаалт</h3>
            <p className="text-green-700 text-sm mt-1 leading-snug">
               Хэрэглэгчид мөнгийг нь амжилттай буцааж өгсөн баталгаажсан жагсаалт. Хэрэв санамсаргүй дарсан бол буцаах боломжтой.
            </p>
          </div>
        </div>
      </div>

      <RefundList 
        data={orders || []} 
        currentTab={tab}
        pendingCount={pendingCount || 0}
        completedCount={completedCount || 0}
        currentPage={page}
        totalPages={totalPages || 1}
      />
    </div>
  )
}
