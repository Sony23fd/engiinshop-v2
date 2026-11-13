import { getShopSettings } from "@/app/actions/settings-actions"
import { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck, Lock, Clock, ArrowLeft, Phone, Shield } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Нууцлалын бодлого | Anar Korea Shop",
  description: "Anar Korea Shop онлайн дэлгүүрийн хэрэглэгчийн хувийн мэдээлэл хамгаалах, нууцлалын бодлого.",
}

const FALLBACK_PRIVACY = `1. Хувийн мэдээлэл цуглуулах
Бид хэрэглэгчийн захиалгыг хүргэх, төлбөрийг баталгаажуулах, захиалгын төлөвийн талаар мэдээлэл өгөх зорилгоор дараах мэдээллийг авна:
- Хэрэглэгчийн нэр, утасны дугаар
- Хүргэлтийн хаяг (дүүрэг, хороо, байр/тоот)
- Төлбөр шилжүүлсэн дансны дугаар

2. Мэдээллийн ашиглалт ба хамгаалалт
- Хэрэглэгчийн хувийн мэдээллийг гуравдагч этгээдэд задруулахгүй бөгөөд зөвхөн захиалга биелүүлэхэд ашиглана.
- Захиалгын мэдээлэл болон гүйлгээний нууцлалыг чандлан хадгална.

3. Хэрэглэгчийн эрх
- Хэрэглэгч өөрийн бүртгэлтэй мэдээллээ шалгах, захиалгын явцыг хянах эрхтэй.`

export default async function PrivacyPage() {
  const settings = await getShopSettings()
  const content = settings.privacy_policy?.trim() || FALLBACK_PRIVACY
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
          <span className="text-indigo-600">Нууцлалын бодлого</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Нууцлалын бодлого
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

          {/* Privacy Security Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Мэдээллийн аюулгүй байдал</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Нууцлал бүрэн хамгаалагдсан</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Гуравдагч этгээдэд өгөхгүй</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Зөвхөн захиалгад ашиглана</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-500 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Баталгаат систем</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Төлбөрийн албан ёсны гарц</p>
              </div>
            </div>
          </div>

          {/* Main Privacy Body */}
          <div className="pt-4 space-y-6">
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line font-normal">
              {content}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-base font-bold text-emerald-950">Мэдээлэл хамгаалалттай холбоотой лавлагаа</h4>
            <p className="text-xs text-emerald-800/80 mt-1 max-w-md">
              Та өөрийн бүртгэгдсэн утас, хаяг болон захиалгын мэдээллээ шинэчлэх, арилгуулах хүсэлтэй бол бидэнтэй холбогдоно уу.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {settings.shop_phone && (
              <a
                href={`tel:${settings.shop_phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.shop_phone}</span>
              </a>
            )}
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              <span>Үйлчилгээний нөхцөл</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

