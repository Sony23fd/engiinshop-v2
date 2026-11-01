import { getShopSettings } from "@/app/actions/settings-actions"
import { NoticesSettingsForm } from "./NoticesSettingsForm"
import { Truck } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NoticesSettingsPage() {
  const settings = await getShopSettings()

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Truck className="w-7 h-7 text-indigo-600" />
          Хүргэлт & Хугацааны тайлбар
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Захиалга хянах хуудас болон бүтээгдэхүүний дэлгэрэнгүй дээр харагдах тээвэрлэлтийн тайлбар, тооцоолсон хугацааг эндээс тохируулна уу.
        </p>
      </div>

      <NoticesSettingsForm settings={settings} />
    </div>
  )
}

