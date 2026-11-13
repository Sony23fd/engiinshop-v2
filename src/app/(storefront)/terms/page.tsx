import { getShopSettings } from "@/app/actions/settings-actions"
import { Metadata } from "next"
import Link from "next/link"
import { FileText, ShieldCheck, Clock, ArrowLeft, Mail, Phone } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл | Anar Korea Shop",
  description: "Anar Korea Shop онлайн дэлгүүрийн үйлчилгээний нөхцөл, захиалга баталгаажуулалт, төлбөр, тээвэрлэлтийн журам.",
}

const FALLBACK_TERMS = `1. Ерөнхий нөхцөл
Манай онлайн дэлгүүрээр үйлчлүүлж буй хэрэглэгч та энэхүү үйлчилгээний нөхцөлийг бүрэн уншиж танилцан, хүлээн зөвшөөрсний үндсэн дээр захиалга хийнэ.

2. Захиалга батлах ба төлбөр
- Захиалгын төлбөр 100% шилжиж, системд баталгаажсанаар захиалга албан ёсоор хүчин төгөлдөр болно.
- Гүйлгээний утга дээр захиалгын утасны дугаар эсвэл заасан кодыг үнэн зөв бичих шаардлагатай.

3. Тээвэрлэлт ба хүргэлт
- Солонгосоос илгээгдэх урьдчилсан захиалгын бараа хэвийн нөхцөлд 7-14 хоногийн дотор Улаанбаатарт ирнэ.
- Монголд бэлэн байгаа бараа захиалга баталгаажсанаас хойш 24-48 цагийн дотор хүргэгдэнэ.

4. Захиалга цуцлах ба буцаалт
- Солонгосоос хөдөлсөн эсвэл тусгайлан захиалсан барааг цуцлах боломжгүй.
- Барааны гэмтэл, дутагдалтай холбоотой гомдлыг хүлээн авснаас хойш 24 цагийн дотор мэдэгдэнэ.`

export default async function TermsPage() {
  const settings = await getShopSettings()
  const content = settings.terms_of_service?.trim() || FALLBACK_TERMS
  const updatedAt = settings.terms_updated_at 
    ? new Date(settings.terms_updated_at).toLocaleDateString("mn-MN") 
    : "2026 оны шинэчилсэн найруулга"

  return (
    <div className="bg-slate-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Нүүр</Link>
          <span>/</span>
          <span className="text-indigo-600">Үйлчилгээний нөхцөл</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Үйлчилгээний нөхцөл
                </h1>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Сүүлд шинэчлэгдсэн: {updatedAt}</span>
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors border border-slate-200 self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Дэлгүүр рүү буцах</span>
            </Link>
          </div>

          {/* Main Terms Body */}
          <div className="pt-8 space-y-6">
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line font-normal">
              {content}
            </div>

            {/* Delivery Terms addition if available */}
            {settings.delivery_terms && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🚚 Хүргэлтийн нөхцөл</span>
                </h3>
                <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                  {settings.delivery_terms}
                </div>
              </div>
            )}

            {/* Return Policy addition if available */}
            {settings.return_policy && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🔄 Буцаалтын журам</span>
                </h3>
                <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                  {settings.return_policy}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Footer Card */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-base font-bold text-indigo-950">Асуух зүйл байна уу?</h4>
            <p className="text-xs text-indigo-700/80 mt-1 max-w-md">
              Үйлчилгээний нөхцөлтэй холбоотой тодруулах зүйл байвал манай холбоо барих сувгуудаар шууд хандана уу.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {settings.shop_phone && (
              <a
                href={`tel:${settings.shop_phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.shop_phone}</span>
              </a>
            )}
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Нууцлалын бодлого</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

