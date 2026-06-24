import { getShopSettings } from "@/app/actions/settings-actions"
import { FaqAdminClient } from "./FaqAdminClient"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function FaqAdminPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== "ADMIN") {
    redirect("/admin/login")
  }

  const settings = await getShopSettings()
  const faqData = settings.faq_data || "[]"
  
  let faqs = []
  try {
    faqs = JSON.parse(faqData)
  } catch (e) {
    faqs = []
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Чатбот Заавар (FAQ)</h1>
          <p className="text-slate-500 mt-1">Хэрэглэгчдэд Чатботоор харагдах асуулт хариултуудыг энд удирдах боломжтой.</p>
        </div>
      </div>
      
      <FaqAdminClient initialFaqs={faqs} />
    </div>
  )
}
