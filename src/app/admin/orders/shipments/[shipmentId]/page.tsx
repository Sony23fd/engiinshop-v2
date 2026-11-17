import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShipmentDetails } from "@/app/actions/shipment-actions"
import { ShipmentReconcileClient } from "./ShipmentReconcileClient"

interface PageProps {
  params: Promise<{
    shipmentId: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shipmentId } = await params
  const res = await getShipmentDetails(shipmentId)
  if (!res.success || !res.shipment) {
    return { title: "Илгээмж олдсонгүй | Anar Shop" }
  }
  return {
    title: `${res.shipment.name} (${res.shipment.code}) | Хүлээн авах | Anar Shop`,
  }
}

export default async function ShipmentDetailPage({ params }: PageProps) {
  const { shipmentId } = await params
  const res = await getShipmentDetails(shipmentId)

  if (!res.success || !res.shipment) {
    notFound()
  }

  return (
    <ShipmentReconcileClient
      initialShipment={res.shipment}
      arrivedStatusId={res.arrivedStatusId || "cmndey7uu0005r0s76u3csw7v"}
    />
  )
}
