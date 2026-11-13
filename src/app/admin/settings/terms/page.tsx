import { getShopSettings } from "@/app/actions/settings-actions"
import { TermsSettingsForm } from "./TermsSettingsForm"
import { FileText, Shield } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TermsSettingsPage() {
  const settings = await getShopSettings()

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-indigo-600" />
          Үйлчилгээний нөхцөл & Нууцлалын бодлого
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Дэлгүүрийн үйлчилгээний ерөнхий нөхцөл, хувийн мэдээллийн нууцлалын бодлого, хүргэлт болон буцаалтын журмыг эндээс тохируулна.
        </p>
      </div>

      <TermsSettingsForm settings={settings} />
    </div>
  )
}
