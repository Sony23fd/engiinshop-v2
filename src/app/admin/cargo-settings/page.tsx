import { getShopSettings } from "@/app/actions/settings-actions"
import { CargoSettingsForm } from "./CargoSettingsForm"
import { Truck } from "lucide-react"


import { getCurrentAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CargoSettingsPage() {
  const admin = await getCurrentAdmin()
  if (admin?.role !== "CARGO_ADMIN") {
    redirect("/admin/home")
  }

  const settings = await getShopSettings()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-500" />
          Карго Төлбөрийн Тохиргоо
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Хэрэглэгч хүргэлтийн хураамж төлөх үед харуулах Карго админы банкны дансны мэдээлэл.
        </p>
      </div>
      <CargoSettingsForm settings={settings} />
    </div>
  )
}
