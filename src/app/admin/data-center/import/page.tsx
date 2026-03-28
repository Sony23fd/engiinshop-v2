import { getCurrentAdmin } from "@/lib/auth"
import { notFound } from "next/navigation"
import { ImportWizard } from "./ImportWizard"
import { getStatusesForMapping } from "@/app/actions/import-actions"
import Link from "next/link"
import { ArrowLeft, Database } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DataCenterImportPage() {
  const admin = await getCurrentAdmin();
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "DATAADMIN")) {
    notFound()
  }

  const { success, statuses } = await getStatusesForMapping();

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/data-center" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-500" />
              Ухаалаг Импорт & Цэвэрлэгээ
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Хуучин датаг шинэ системийн бүтцэд нийцүүлж оруулах</p>
          </div>
        </div>
      </div>

      <ImportWizard existingStatuses={statuses || []} />
    </div>
  )
}
