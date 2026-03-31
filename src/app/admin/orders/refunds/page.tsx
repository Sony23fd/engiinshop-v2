import { getRefundOrders, toggleOrderRefund } from "@/app/actions/order-actions"
import { RefundList } from "./RefundList"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminRefundsPage() {
  const { orders, success } = await getRefundOrders()

  if (!success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="text-sm">Буцаалт хүлээгдэж буй мэдээллийг татахад асуудал гарлаа.</p>
      </div>
    )
  }

  const pendingRefunds = orders?.filter((o: any) => !o.isRefunded) || []
  const completedRefunds = orders?.filter((o: any) => o.isRefunded) || []

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
            <span className="text-xl font-bold">{pendingRefunds.length}</span>
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
            <span className="text-xl font-bold">{completedRefunds.length}</span>
          </div>
          <div>
            <h3 className="font-semibold text-green-900 text-lg">Хийгдсэн буцаалт</h3>
            <p className="text-green-700 text-sm mt-1 leading-snug">
               Хэрэглэгчид мөнгийг нь амжилттай буцааж өгсөн баталгаажсан жагсаалт. Хэрэв санамсаргүй дарсан бол буцаах боломжтой.
            </p>
          </div>
        </div>
      </div>

      <RefundList pending={pendingRefunds} completed={completedRefunds} />
    </div>
  )
}
