import { getDailyOrderSummaryList, getDailyOrderDetails } from "@/app/actions/daily-order-actions"
import { DailyOrdersManager } from "@/components/admin/orders/DailyOrdersManager"

export const dynamic = "force-dynamic"

export default async function DailyOrdersPage({
  searchParams
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const p = searchParams ? await searchParams : {}
  const { days } = await getDailyOrderSummaryList(60)

  const activeDate = p.date || (days && days.length > 0 ? days[0].dateStr : "")
  let initialDetails = null

  if (activeDate) {
    initialDetails = await getDailyOrderDetails(activeDate)
  }

  return (
    <DailyOrdersManager
      initialDays={days || []}
      initialDateStr={activeDate}
      initialDetails={initialDetails}
    />
  )
}
