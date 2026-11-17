import { Metadata } from "next"
import { getShipmentsList } from "@/app/actions/shipment-actions"
import { ShipmentsListClient } from "./ShipmentsListClient"

export const metadata: Metadata = {
  title: "Карго илгээмжүүд (Ачилт & Хүлээн авах) | Anar Shop Admin",
}

export const dynamic = "force-dynamic"

export default async function ShipmentsPage() {
  const res = await getShipmentsList()
  const shipments = res.success ? res.shipments : []

  return <ShipmentsListClient initialShipments={shipments} />
}
