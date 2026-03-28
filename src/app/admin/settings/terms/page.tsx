import { getShopSettings } from "@/app/actions/settings-actions"
import { TermsSettingsForm } from "./TermsSettingsForm"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TermsSettingsPage() {
  const settings = await getShopSettings()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          Нөхцөлийн тохиргоо
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Захиалга хийх хуудсанд харагдах үйлчилгээний болон хүргэлтийн нөхцөлийг оруулна уу.
        </p>
      </div>
      <TermsSettingsForm settings={settings} />
    </div>
  )
}
