import { getShopSettings } from "@/app/actions/settings-actions"
import { LockKeyhole } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PrivacyPage() {
  const settings = await getShopSettings()
  const privacyPolicy = settings["privacy_policy"] || "Нууцлалын бодлого одоогоор оруулаагүй байна."

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
            <LockKeyhole className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Нууцлалын бодлого</h1>
        </div>
        
        <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800">
          <div className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
            {privacyPolicy}
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-sm text-slate-500 text-center">
          Сүүлд шинэчлэгдсэн: {new Date().toLocaleDateString('mn-MN')}
        </div>
      </div>
    </div>
  )
}
