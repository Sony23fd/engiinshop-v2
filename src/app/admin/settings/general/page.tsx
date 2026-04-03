import { db } from "@/lib/db"
import { GeneralSettingsClient } from "./GeneralSettingsClient"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function GeneralSettingsPage() {
  const session = await getSession()
  
  const settings = await db.shopSettings.findMany()
  const config = settings.reduce((acc, current) => {
    acc[current.key] = current.value
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Ерөнхий тохиргоо</h1>
      </div>
      
      <p className="text-slate-500">
        Сайтын үндсэн лого болон бусад ерөнхий мэдээллийг эндээс тохируулна уу.
      </p>

      <GeneralSettingsClient initialSettings={config} userRole={session.role} />
    </div>
  )
}
