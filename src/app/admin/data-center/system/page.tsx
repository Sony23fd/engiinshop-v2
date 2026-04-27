import { getCurrentAdmin } from "@/lib/auth"
import { notFound } from "next/navigation"
import { Terminal } from "lucide-react"
import { SystemSetupClient } from "./SystemSetupClient"
import { getEnvFile } from "@/app/actions/env-actions"

export const dynamic = "force-dynamic"

export default async function SystemPage() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "DATAADMIN") {
    notFound()
  }

  const envResult = await getEnvFile()
  const initialEnv: string = envResult.success ? (envResult.content ?? "") : ""

  return (
    <div className="max-w-4xl mx-auto mt-4 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-6 h-6 text-slate-800" />
          Системийн шинэчлэл & Тохиргоо
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Зөвхөн DATAADMIN хандах боломжтой системийн түвшний удирдлага. Сервер дээрх .env файлыг өөрчлөх болон GitHub-аас шинэ код татаж системийг шинэчлэх боломжтой.
        </p>
      </div>

      <SystemSetupClient initialEnv={initialEnv} />
    </div>
  )
}
