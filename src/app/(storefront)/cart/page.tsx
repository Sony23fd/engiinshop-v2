import { getShopSettings } from "@/app/actions/settings-actions"
import { CartClient } from "./CartClient"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const settings = await getShopSettings()
  return (
    <CartClient
      termsOfService={settings.terms_of_service}
      deliveryTerms={settings.delivery_terms}
      qpayEnabled={settings.qpay_enabled === "true"}
    />
  )
}
