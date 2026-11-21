"use client"

import { useState } from "react"
import { saveMultipleShopSettings, saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2, AlertTriangle, Bell, Truck, CreditCard, Sparkles, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const BANK_FIELDS = [
  { key: "cargo_bank_name", label: "Карго Хүлээн авагч Банк", placeholder: "Төрийн Банк", desc: "Карго төлбөр орох банк" },
  { key: "cargo_bank_account", label: "Карго Дансны дугаар", placeholder: "MN660034171700066647", desc: "Тусдаа каргоны дансны дугаар" },
  { key: "cargo_bank_holder", label: "Карго Данс эзэмшигч", placeholder: "Мөнхбат Буяннэмэх", desc: "Данс эзэмшигчийн нэр" },
  { key: "cargo_payment_instruction", label: "Гүйлгээний утгын заавар", placeholder: "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү.", desc: "Шилжүүлэг хийх үед хэрэглэгчид өгөх заавар" },
  { key: "delivery_fee", label: "Хүргэлтийн суурь төлбөр (₮)", placeholder: "8000", desc: "Хот доторх хүргэлтийн үндсэн дүн" },
]

export function CargoSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleBulkSave() {
    setSaving(true)
    const res = await saveMultipleShopSettings(values)
    setSaving(false)
    if (res.success) {
      toast({ title: "Амжилттай хадгалагдлаа", description: "Каргоны данс болон төлбөрийн тохиргоо шинэчлэгдлээ." })
    } else {
      toast({ title: "Алдаа гарлаа", description: res.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Bank Information */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 tracking-tight">Карго Төлбөрийн Тусдаа Данс</h3>
                <p className="text-xs text-slate-400">Барааны үнээс тусдаа каргоны мөнгө төвлөрөх дансны мэдээлэл</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-5">
            {BANK_FIELDS.map(f => (
              <div key={f.key} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">{f.label}</label>
                  <span className="text-[11px] text-slate-400">{f.desc}</span>
                </div>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all bg-slate-50/50"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? "Хадгалж байна..." : "Каргоны Данс & Дүнг Хадгалах"}
            </button>
          </div>
        </div>

        {/* Live Preview of Cargo Payment Modal */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Хэрэглэгчид харагдах байдал (Live Preview)
          </span>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2.5 max-w-md">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium text-xs">Төлөх дүн:</span>
              <span className="font-bold text-base text-indigo-600">
                {Number(values.delivery_fee || 8000).toLocaleString()} ₮
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Банк:</span>
              <span className="font-bold text-slate-800">{values.cargo_bank_name || "Хаан Банк"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Данс:</span>
              <span className="font-bold text-slate-800 font-mono">{values.cargo_bank_account || "Данс оруулаагүй"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Дансны нэр:</span>
              <span className="font-bold text-slate-800">{values.cargo_bank_holder || "—"}</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-2 text-[11px] text-red-800 mt-2">
              <strong>Гүйлгээний утга:</strong> {values.cargo_payment_instruction || "Утасны дугаараа бичнэ үү"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Alert / Delivery Delay */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 tracking-tight">Системийн Анхааруулга (Хүргэлтийн саатал)</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${values.delivery_delay_active === "true" ? "text-orange-600" : "text-slate-400"}`}>
                {values.delivery_delay_active === "true" ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
              <button
                onClick={() => {
                  const newValue = values.delivery_delay_active === "true" ? "false" : "true"
                  setValues(v => ({ ...v, delivery_delay_active: newValue }))
                  saveShopSetting("delivery_delay_active", newValue)
                }}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-200 shadow-inner ${
                  values.delivery_delay_active === "true" ? "bg-orange-500" : "bg-slate-200"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  values.delivery_delay_active === "true" ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                Хүргэлтийн саатал анхааруулга
                {values.delivery_delay_active === "true" && (
                  <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                )}
              </label>
              <textarea
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all bg-orange-50/10 min-h-[80px] leading-relaxed italic"
                placeholder="Сааталтай холбоотой анхааруулга текстийг энд бичнэ үү..."
                value={values.delivery_delay_message ?? ""}
                onChange={e => setValues(v => ({ ...v, delivery_delay_message: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => saveShopSetting("delivery_delay_message", values.delivery_delay_message ?? "")}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                Саатлын мессежийг хадгалах
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
