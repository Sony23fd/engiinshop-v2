"use client"

import { useState } from "react"
import { Plus, GripVertical, Trash2, Edit2, CheckCircle2, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { saveShopSetting } from "@/app/actions/settings-actions"

export type FaqNode = {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

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
    // Fix orders
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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <p className="text-sm text-slate-500 font-medium">Нийт <strong className="text-indigo-600">{faqs.length}</strong> асуулт байна</p>
        <button onClick={handleAdd} className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-[#4338ca] transition-colors">
          <Plus className="w-4 h-4" /> Шинэ асуулт нэмэх
        </button>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={faq.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${editingId === faq.id ? 'ring-2 ring-indigo-500 border-transparent' : ''} ${!faq.isActive ? 'opacity-60 grayscale' : ''}`}>
            {editingId === faq.id ? (
              <div className="p-5 space-y-4 bg-indigo-50/30">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Асуулт (Товчны нэр)</label>
                  <input 
                    type="text" 
                    value={editForm.question || ""} 
                    onChange={e => setEditForm({...editForm, question: e.target.value})}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium p-2.5 border"
                    placeholder="Ж: Захиалга хэрхэн өгөх вэ?"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Хариулт (Чатбот хариу)</label>
                  <textarea 
                    value={editForm.answer || ""} 
                    onChange={e => setEditForm({...editForm, answer: e.target.value})}
                    rows={5}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border"
                    placeholder="HTML эсвэл энгийн текст байж болно. Мөр шилжих нь хадгалагдана."
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
                    <h3 className="font-bold text-slate-900 text-base">{faq.question}</h3>
                    {!faq.isActive && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Идэвхгүй</span>}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(faq.id)} className={`p-2 rounded-lg transition-colors ${faq.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`} title={faq.isActive ? "Идэвхтэй байна (Дарж унтраах)" : "Идэвхгүй байна (Дарж асаах)"}>
                    {faq.isActive ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                  <button onClick={() => { setEditingId(faq.id); setEditForm(faq); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl">
            <p className="text-slate-500 font-medium">Одоогоор ямар ч заавар бүртгэгдээгүй байна.</p>
          </div>
        )}
      </div>
    </div>
  )
}
