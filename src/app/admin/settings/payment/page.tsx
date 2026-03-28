import { getShopSettings } from "@/app/actions/settings-actions"
import { PaymentSettingsForm } from "./PaymentSettingsForm"
import { CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PaymentSettingsPage() {
  const settings = await getShopSettings()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-500" />
          Төлбөрийн тохиргоо
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Хэрэглэгчид харуулах банкны дансны мэдээллийг оруулна уу.
        </p>
      </div>
      <PaymentSettingsForm settings={settings} />
    </div>
  )
}
