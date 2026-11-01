import { getShopSettings } from "@/app/actions/settings-actions"
import { ContactSettingsForm } from "./ContactSettingsForm"
import { PhoneCall } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ContactSettingsPage() {
  const settings = await getShopSettings()

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <PhoneCall className="w-7 h-7 text-indigo-600" />
          Холбоо барих & Хаяг
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Дэлгүүрийн утасны дугаар, албан ёсны хаяг, ажиллах цагийн хуваарь болон сошиал хуудсуудын линкийг эндээс тохируулна уу.
        </p>
      </div>

      <ContactSettingsForm settings={settings} />
    </div>
  )
}

