import { getShopSettings } from "@/app/actions/settings-actions"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TermsPage() {
  const settings = await getShopSettings()
  const termsOfService = settings["terms_of_service"] || "Үйлчилгээний нөхцөл одоогоор оруулаагүй байна."
  const deliveryTerms = settings["delivery_terms"]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b">
          <ShieldAlert className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Үйлчилгээний нөхцөл</h1>
        </div>
        
        <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800">
          <h2 className="text-xl font-bold mb-4 mt-8">1. Ерөнхий нөхцөл</h2>
          <div className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
            {termsOfService}
          </div>

          {deliveryTerms && (
            <>
              <h2 className="text-xl font-bold mb-4 mt-12">2. Хүргэлтийн нөхцөл</h2>
              <div className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                {deliveryTerms}
              </div>
            </>
          )}
        </div>
        
        <div className="mt-12 pt-8 border-t text-sm text-slate-500 text-center">
          Сүүлд шинэчлэгдсэн: {new Date().toLocaleDateString('mn-MN')}
        </div>
      </div>
    </div>
  )
}
