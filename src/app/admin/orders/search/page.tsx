import { getOrderStatuses } from "@/app/actions/order-status-actions"
import SearchClient from "./SearchClient"

export const dynamic = "force-dynamic"

export default async function OrdersSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { statuses } = await getOrderStatuses()
  const { q } = await searchParams

  const serializedStatuses = statuses ? JSON.parse(JSON.stringify(statuses)) : []

  return (
    <SearchClient statuses={serializedStatuses} initialQuery={q} />
  )
}
