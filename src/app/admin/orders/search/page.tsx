import { getOrderStatuses } from "@/app/actions/order-status-actions"
import SearchClient from "./SearchClient"

export const dynamic = "force-dynamic"

export default async function OrdersSearchPage() {
  const { statuses } = await getOrderStatuses()

  const serializedStatuses = statuses ? JSON.parse(JSON.stringify(statuses)) : []

  return (
    <SearchClient statuses={serializedStatuses} />
  )
}
