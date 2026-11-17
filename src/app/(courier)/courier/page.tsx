import { getCourierDeliveries } from "@/app/actions/courier-actions"
import { CourierClient } from "./CourierClient"
import { CourierPinModal } from "./CourierPinModal"

export const dynamic = "force-dynamic"

export default async function CourierPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>
}) {
  const resolvedParams = await searchParams
  const pin = resolvedParams.pin

  const result = await getCourierDeliveries(pin)

  if (result.unauthorized) {
    return <CourierPinModal initialError={pin ? "Оруулсан PIN код хүчингүй байна." : undefined} />
  }

  return (
    <CourierClient
      activeGroups={result.activeGroups || []}
      deliveredGroups={result.deliveredGroups || []}
      activeCount={result.activeCount || 0}
      deliveredCount={result.deliveredCount || 0}
      pin={pin}
    />
  )
}
