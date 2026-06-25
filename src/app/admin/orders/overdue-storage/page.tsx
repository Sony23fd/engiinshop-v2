import { getOverdueStorageOrders } from "@/app/actions/order-actions"
import { AlertTriangle } from "lucide-react"
import { OverdueStorageList } from "./OverdueStorageList"

export const dynamic = "force-dynamic"

export default async function OverdueStoragePage() {
  const { orders } = await getOverdueStorageOrders()

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          Хугацаа хэтэрсэн бараа
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Монголд ирээд 30-аас дээш хоног агуулахад хадгалагдаж буй бараануудын жагсаалт. Хэрэглэгчтэй холбогдож арга хэмжээ авна уу.
        </p>
      </div>

      <OverdueStorageList orders={orders || []} />
    </div>
  )
}
