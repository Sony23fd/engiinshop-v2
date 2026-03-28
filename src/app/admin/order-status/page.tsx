import { getOrderStatuses } from "@/app/actions/order-status-actions"
import OrderStatusClient from "./OrderStatusClient"

export default async function OrderStatusConfigPage() {
  const { statuses } = await getOrderStatuses()

  return (
    <OrderStatusClient initialStatuses={statuses || []} />
  )
}
