"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2, CheckCircle2, Save, X, Sparkles, HelpCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { saveShopSetting } from "@/app/actions/settings-actions"

export type FaqNode = {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

export const DEFAULT_FAQS: FaqNode[] = [
  {
    id: "faq_1",
    question: "Захиалга хэрхэн өгөх вэ?",
    answer: "Та сонирхсон бараагаа сонгон өнгө, хэмжээгээ сонгоод \"Сагсанд нэмэх\" эсвэл \"Захиалах\" товчийг дарна.\nҮүний дараа өөрийн нэр, утасны дугаараа оруулан захиалгаа үүсгэж, төлбөрөө төлснөөр таны захиалга шууд баталгаажна.",
    isActive: true,
    order: 0
  },
  {
    id: "faq_2",
    question: "Төлбөрөө яаж төлөх вэ?",
    answer: "Манай дэлгүүр 2 төрлийн төлбөрийн сонголттой:\n1. QPay: Бүх банкны апп-аар QR код уншуулан 1 секундийн дотор автоматаар баталгаажуулна.\n2. Дансаар шилжүүлэх: Заагдсан Хаан банкны данс руу шилжүүлнэ. Гүйлгээний утга дээр системийн өгсөн захиалгын кодоо (Ref) заавал бичнэ.",
    isActive: true,
    order: 1
  },
  {
    id: "faq_3",
    question: "Гүйлгээний утга яагаад чухал вэ?",
    answer: "Дансаар шилжүүлэхдээ гүйлгээний утга дээр зөвхөн захиалга өгөхөд гарч ирсэн Код (Transaction Ref)-ыг хуулж тавина.\n⚠️ Хэрэв өөр зүйл (нэр, утас г.м) бичвэл систем таны төлбөрийг танихгүй тул захиалга баталгаажихгүй саатах эрсдэлтэйг анхаарна уу!",
    isActive: true,
    order: 2
  },
  {
    id: "faq_4",
    question: "Бараа хэд хоногт ирэх вэ?",
    answer: "• Монголд бэлэн байгаа бараа: Хүргэлтийн хуваарийн дагуу 24-72 цагийн дотор хүргэгдэнэ.\n• Солонгосоос захиалах бараа: Захиалга баталгаажиж, Солонгосоос хөдөлснөөс хойш хэвийн нөхцөлд 7-14 хоногийн дотор Улаанбаатарт ирнэ.",
    isActive: true,
    order: 3
  },
  {
    id: "faq_5",
    question: "Захиалгаа хаанаас шалгах вэ?",
    answer: "Та манай сайтын цэсэнд байрлах \"Захиалга шалгах\" хуудас руу ороод бүртгүүлсэн утасны дугаараа оруулан хайхад таны захиалгын төлөв (Баталгаажсан, Солонгосоос гарсан, Улаанбаатарт ирсэн гэх мэт) бодит цагаар харагдана.",
    isActive: true,
    order: 4
  },
  {
    id: "faq_6",
    question: "Каргоны төлбөрийг яаж, ямар дансанд төлөх вэ?",
    answer: "Бараа Монголд ирсний дараа таны захиалгын жин, овор хэмжээгээр каргоны төлбөр бодогдоно.\n• Та \"Захиалга шалгах\" цэс рүү утасны дугаараараа ороход төлөх каргоны дүн болон Каргоны тусдаа дансны мэдээлэл харагдах болно.\n• Каргоны төлбөр нь барааны үндсэн төлбөрөөс тусдаа зориулалтын дансанд ордог тул зөвхөн системд заасан каргоны данс руу шилжүүлнэ үү.",
    isActive: true,
    order: 5
  },
  {
    id: "faq_7",
    question: "Хүргэлтийн хуваарь ямар байдаг вэ?",
    answer: "Манай хот доторх хүргэлт долоо хоног бүрийн Лхагва, Бямба гарагуудад бүсчилсэн хуваариар гардаг.\nХүргэлтийн суурь хураамж хот дотор 6,000₮ байдаг бөгөөд товлосон өдрөөс хойш 24–72 цагийн дотор таны гар дээр хүрнэ.",
    isActive: true,
    order: 6
  },
  {
    id: "faq_8",
    question: "Хүргэлтийн хаягаа яаж өгөх вэ?",
    answer: "Таны захиалсан бараа Улаанбаатарт ирж, хүргэлтэд бэлэн болмогц \"Захиалга шалгах\" хуудас дээр \"Хүргэлт захиалах\" товч идэвхжинэ.\nТэр товч дээр дарж хүргүүлэх дүүрэг, хороо, байрны дэлгэрэнгүй хаягаа оруулахад хангалттай.",
    isActive: true,
    order: 7
  },
  {
    id: "faq_9",
    question: "Өөрөө очиж авч болох уу? Хаана байдаг вэ?",
    answer: "Болно. Бараа ирсний дараа өөрийн биеэр хүрэлцэн ирж авах боломжтой.\n• Хаяг: БЗД, 26-р хороо Саруул хороолол 122-р байр, Үйлчилгээний төв 3 давхарт\n• Цагийн хуваарь: Даваа - Бямба: 10:00 - 19:00 (Нямд амарна)\nИрэхдээ утасны дугаар болон захиалгын дугаараа бэлдэж ирнэ үү.",
    isActive: true,
    order: 8
  },
  {
    id: "faq_10",
    question: "Захиалга цуцлах болон буцаах нөхцөл?",
    answer: "Солонгосоос захиалж буй бараанууд захиалга баталгаажсанаас хойш шууд худалдан авалт хийгддэг тул цуцлах боломжгүй.\nХэрэв бараа буруу ирсэн эсвэл үйлдвэрийн гэмтэлтэй тохиолдолд бараа хүлээн авснаас хойш 24 цагийн дотор админтай холбогдож асуудлыг шийдвэрлүүлнэ.",
    isActive: true,
    order: 9
  },
  {
    id: "faq_11",
    question: "Бараагаа авахгүй удвал яах вэ?",
    answer: "Монголд ирсэн барааг 14 хоног үнэгүй хадгална.\n14-өөс дээш хоног хадгалагдсан тохиолдолд хадгалалтын хураамж (хоног тутамд) тооцогдох тул бараагаа цаг тухайд нь хүлээн авна уу.",
    isActive: true,
    order: 10
  },
  {
    id: "faq_12",
    question: "Админтай хэрхэн холбогдох вэ?",
    answer: "Танд нэмэлт тодруулах зүйл байвал манай дараах сувгуудаар холбогдоно уу:\n• Лавлах утас: +976 8853 9667, +976 8853 9887\n• Facebook хуудас: Anar Korea Shop\n• Instagram: @anar_korea_shop\nБид ажлын цагаар шуурхай хариулах болно!",
    isActive: true,
    order: 11
  }
]

export function FaqAdminClient({ initialFaqs }: { initialFaqs: FaqNode[] }) {
  const [faqs, setFaqs] = useState<FaqNode[]>(initialFaqs.sort((a, b) => a.order - b.order))
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FaqNode>>({})

  async function handleSaveFaqs(newFaqs: FaqNode[]) {
    setIsSaving(true)
    const res = await saveShopSetting("faq_data", JSON.stringify(newFaqs))
    setIsSaving(false)
    if (res.success) {
      toast({ title: "Амжилттай хадгалагдлаа" })
      setFaqs(newFaqs)
    } else {
      toast({ title: "Алдаа гарлаа", description: res.error, variant: "destructive" })
    }
  }

  function handleAdd() {
    const newFaq: FaqNode = {
      id: Math.random().toString(36).substring(7),
      question: "Шинэ асуулт",
      answer: "Хариултаа энд бичнэ үү...",
      isActive: true,
      order: faqs.length
    }
    const updated = [...faqs, newFaq]
    setFaqs(updated)
    setEditingId(newFaq.id)
    setEditForm(newFaq)
  }

  function handleLoadDefaults() {
    if (faqs.length > 0) {
      if (!confirm("Та системийн бэлэн 12 FAQ зааврыг оруулахдаа итгэлтэй байна уу? (Одоо байгаа жагсаалт 12 стандарт заавраар шинэчлэгдэнэ)")) return
    }
    handleSaveFaqs(DEFAULT_FAQS)
  }

  function handleDelete(id: string) {
    if (!confirm("Устгахдаа итгэлтэй байна уу?")) return
    const updated = faqs.filter(f => f.id !== id).map((f, i) => ({ ...f, order: i }))
    handleSaveFaqs(updated)
  }

  function handleMove(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= faqs.length) return
    const updated = [...faqs]
    const temp = updated[index]
    updated[index] = updated[index + direction]
    updated[index + direction] = temp
    const reordered = updated.map((f, i) => ({ ...f, order: i }))
    handleSaveFaqs(reordered)
  }

  function toggleActive(id: string) {
    const updated = faqs.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f)
    handleSaveFaqs(updated)
  }

  function saveEdit() {
    if (!editForm.question || !editForm.answer) {
      toast({ title: "Мэдээллээ бүрэн оруулна уу", variant: "destructive" })
      return
    }
    const updated = faqs.map(f => f.id === editingId ? { ...f, question: editForm.question!, answer: editForm.answer! } : f)
    setEditingId(null)
    handleSaveFaqs(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <p className="text-sm text-slate-500 font-medium">
            Нийт <strong className="text-indigo-600">{faqs.length}</strong> асуулт хариулт байна
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Чатботод харагдах түгээмэл асуултууд болон дэлгэрэнгүй зааврууд
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDefaults}
            disabled={isSaving}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            12 бэлэн заавар оруулах
          </button>
          <button
            onClick={handleAdd}
            className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 hover:bg-[#4338ca] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Шинэ асуулт нэмэх
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${editingId === faq.id ? 'ring-2 ring-indigo-500 border-transparent' : ''} ${!faq.isActive ? 'opacity-60 grayscale' : ''}`}>
            {editingId === faq.id ? (
              <div className="p-5 space-y-4 bg-indigo-50/30">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Асуулт (Чатботын товчны нэр)</label>
                  <input 
                    type="text" 
                    value={editForm.question || ""} 
                    onChange={e => setEditForm({...editForm, question: e.target.value})}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium p-2.5 border"
                    placeholder="Ж: Захиалга хэрхэн өгөх вэ?"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Хариулт (Чатботын тайлбар)</label>
                  <textarea 
                    value={editForm.answer || ""} 
                    onChange={e => setEditForm({...editForm, answer: e.target.value})}
                    rows={5}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    placeholder="Хариултын текст бичнэ үү..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Цуцлах</button>
                  <button onClick={saveEdit} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Хадгалах
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 p-4">
                <div className="flex flex-col gap-1 mt-1 opacity-40 hover:opacity-100 transition-opacity">
                  <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30">
                    ▲
                  </button>
                  <button onClick={() => handleMove(index, 1)} disabled={index === faqs.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30">
                    ▼
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-indigo-500 w-5">#{index + 1}</span>
                    <h3 className="font-bold text-slate-900 text-base">{faq.question}</h3>
                    {!faq.isActive && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Идэвхгүй</span>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap pl-8">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(faq.id)} className={`p-2 rounded-lg transition-colors ${faq.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title={faq.isActive ? "Идэвхтэй байна (Дарж унтраах)" : "Идэвхгүй байна (Дарж асаах)"}>
                    {faq.isActive ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                  <button onClick={() => { setEditingId(faq.id); setEditForm(faq); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Засах">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Устгах">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="text-center py-12 px-4 bg-white border-2 border-dashed border-indigo-200 rounded-2xl max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-indigo-100">
              <HelpCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Одоогоор асуулт хариулт оруулаагүй байна</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Та дэлгүүрийн захиалга, төлбөр, каргоны тусдаа данс, хүргэлт, байршлын бэлэн 12 стандартыг 1 товшилтоор шууд оруулж болно.
              </p>
            </div>
            <button
              onClick={handleLoadDefaults}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> Бэлэн 12 FAQ зааврыг шууд оруулах
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
