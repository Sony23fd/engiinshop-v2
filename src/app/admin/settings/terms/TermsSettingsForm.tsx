"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2, FileText, Shield, Truck, RotateCcw, Sparkles, Eye, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

const DEFAULT_TERMS = `1. Ерөнхий нөхцөл
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

const DEFAULT_PRIVACY = `1. Хувийн мэдээлэл цуглуулах
Бид хэрэглэгчийн захиалгыг хүргэх, төлбөрийг баталгаажуулах, захиалгын төлөвийн талаар мэдээлэл өгөх зорилгоор дараах мэдээллийг авна:
- Хэрэглэгчийн нэр, утасны дугаар
- Хүргэлтийн хаяг (дүүрэг, хороо, байр/тоот)
- Төлбөр шилжүүлсэн дансны дугаар

2. Мэдээллийн ашиглалт ба хамгаалалт
- Хэрэглэгчийн хувийн мэдээллийг гуравдагч этгээдэд задруулахгүй бөгөөд зөвхөн захиалга биелүүлэхэд ашиглана.
- Захиалгын мэдээлэл болон гүйлгээний нууцлалыг чандлан хадгална.

3. Хэрэглэгчийн эрх
- Хэрэглэгч өөрийн бүртгэлтэй мэдээллээ шалгах, захиалгын явцыг хянах эрхтэй.`

const DEFAULT_DELIVERY = `1. Хүргэлтийн хуваарь
Хүргэлт ажлын өдрүүдэд Улаанбаатар хот дотор хийгдэнэ.

2. Хүргэлтийн төлбөр
- Хүргэлтийн суурь үнэ захиалга бүрт тооцогдоно (Карго 0₮ тэмдэглэгээтэй бараанд каргоны хураамж тооцохгүй).
- Орон нутгийн унаанд тавих үйлчилгээ боломжтой.`

const DEFAULT_RETURN = `1. Бараа буцаах журам
- Барааны сав баглаа боодол задраагүй, хэрэглээгүй анхны хэвээрээ байгаа нөхцөлд солих боломжтой.
- Хэрэглэгчийн буруутай үйлдлээс шалтгаалж гэмтсэн барааг буцаахгүй.`

interface TabItem {
  id: string
  label: string
  icon: any
  key: string
  hint: string
  placeholder: string
  defaultText: string
  publicUrl?: string
}

const TABS: TabItem[] = [
  {
    id: "terms",
    label: "Үйлчилгээний нөхцөл",
    icon: FileText,
    key: "terms_of_service",
    hint: "Сайтын /terms хуудас болон захиалгын сагс (checkout) дээр харагдана.",
    placeholder: "Үйлчилгээний нөхцөлүүдийг энд бичнэ үү...",
    defaultText: DEFAULT_TERMS,
    publicUrl: "/terms"
  },
  {
    id: "privacy",
    label: "Нууцлалын бодлого",
    icon: Shield,
    key: "privacy_policy",
    hint: "Сайтын /privacy хуудас болон хөл (footer) дээр харагдана.",
    placeholder: "Нууцлалын бодлогын заалтуудыг энд бичнэ үү...",
    defaultText: DEFAULT_PRIVACY,
    publicUrl: "/privacy"
  },
  {
    id: "delivery",
    label: "Хүргэлтийн журам",
    icon: Truck,
    key: "delivery_terms",
    hint: "Хүргэлт сонгосон үед харагдах журам.",
    placeholder: "Хүргэлтийн нөхцөлүүдийг энд бичнэ үү...",
    defaultText: DEFAULT_DELIVERY,
  },
  {
    id: "return",
    label: "Буцаалтын журам",
    icon: RotateCcw,
    key: "return_policy",
    hint: "Бараа солих, буцаалт хийх тухай журам.",
    placeholder: "Буцаалтын нөхцөлүүдийг энд бичнэ үү...",
    defaultText: DEFAULT_RETURN,
  },
]

export function TermsSettingsForm({ settings }: { settings: Record<string, string> }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("terms")
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<boolean>(false)

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0]

  async function handleSave(key: string) {
    setSaving(key)
    try {
      const result = await saveShopSetting(key, values[key] ?? "")
      if (result.success) {
        // Also update timestamp
        await saveShopSetting("terms_updated_at", new Date().toISOString())
        toast({ 
          title: "Амжилттай хадгалагдлаа", 
          description: "Шинэчлэгдсэн нөхцөлүүд сайт дээр шууд харагдах болно." 
        })
      } else {
        toast({ variant: "destructive", title: "Алдаа", description: result.error })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Алдаа", description: e.message })
    } finally {
      setSaving(null)
    }
  }

  function handleLoadDefault(key: string, defaultText: string) {
    if (confirm("Үлгэр жишээ текстийг хуулж тавих уу? (Та өөрийн хүссэнээр өөрчлөх боломжтой)")) {
      setValues(prev => ({ ...prev, [key]: defaultText }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          const hasValue = !!(values[tab.key]?.trim())

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {hasValue && (
                <span className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Current Tab Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <currentTab.icon className="w-5 h-5 text-indigo-600" />
              <span>{currentTab.label}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentTab.hint}</p>
          </div>

          <div className="flex items-center gap-2">
            {currentTab.publicUrl && (
              <Link
                href={currentTab.publicUrl}
                target="_blank"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                <span>Хуудсыг үзэх</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? "Засах" : "Урьдчилан харах"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadDefault(currentTab.key, currentTab.defaultText)}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Бэлэн загвар текст оруулах"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Загвар оруулах</span>
            </button>
          </div>
        </div>

        {/* Editor or Preview */}
        {showPreview ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Хэрэглэгчид харагдах байдал:
            </p>
            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed font-sans text-sm">
              {values[currentTab.key] || (
                <span className="text-slate-400 italic">Одоогоор текст оруулаагүй байна...</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={14}
              value={values[currentTab.key] ?? ""}
              onChange={e => setValues(prev => ({ ...prev, [currentTab.key]: e.target.value }))}
              placeholder={currentTab.placeholder}
              className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 font-sans leading-relaxed resize-y transition-all bg-slate-50/50 focus:bg-white"
            />
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Параграф хооронд 1 мөр зай үлдээвэл бүтэцтэй харагдана.</span>
              <span>{(values[currentTab.key] || "").length} тэмдэгт</span>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Хадгалсан даруйд сайтад шууд шинэчлэгдэнэ.
          </p>
          <button
            type="button"
            onClick={() => handleSave(currentTab.key)}
            disabled={saving === currentTab.key}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-indigo-600/20 transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {saving === currentTab.key ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Хадгалж байна...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentTab.label} хадгалах</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
