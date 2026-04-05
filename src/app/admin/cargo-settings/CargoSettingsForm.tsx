"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2, AlertTriangle, Bell } from "lucide-react"

const BANK_FIELDS = [
  { key: "cargo_bank_name", label: "Карго Банкны нэр", placeholder: "Хаан Банк" },
  { key: "cargo_bank_account", label: "Дансны дугаар", placeholder: "5011..." },
  { key: "cargo_bank_holder", label: "Данс эзэмшигч", placeholder: "Болд" },
  { key: "cargo_payment_instruction", label: "Гүйлгээний утгын заавар", placeholder: "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү." },
]

export function CargoSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function save(key: string, value: string) {
    setSaving(key)
    await saveShopSetting(key, value)
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Bank Information */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 tracking-tight">Карго Банкны Мэдээлэл</h3>
          </div>
          
          <div className="grid gap-5">
            {BANK_FIELDS.map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">{f.label}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all bg-slate-50/50"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                  <button
                    onClick={() => save(f.key, values[f.key] ?? "")}
                    disabled={saving === f.key}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap min-w-[100px]"
                  >
                    {saving === f.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved === f.key ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : "Хадгалах"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
          <div className="bg-white p-1.5 rounded-md border shadow-sm shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Энэхүү данс руу хэрэглэгч зөвхөн "Хүргэлтийн хураамж"-г шилжүүлж төлөх бөгөөд QPay ашиглагдахгүйг анхаарна уу.
          </p>
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
              <h3 className="font-bold text-slate-800 tracking-tight">Системийн Анхааруулга</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${values.delivery_delay_active === "true" ? "text-orange-600" : "text-slate-400"}`}>
                {values.delivery_delay_active === "true" ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
              <button
                onClick={() => {
                  const newValue = values.delivery_delay_active === "true" ? "false" : "true"
                  setValues(v => ({ ...v, delivery_delay_active: newValue }))
                  save("delivery_delay_active", newValue)
                }}
                disabled={saving === "delivery_delay_active"}
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
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all bg-orange-50/10 min-h-[100px] leading-relaxed italic"
                placeholder="Сааталтай холбоотой анхааруулга текстийг энд бичнэ үү..."
                value={values.delivery_delay_message ?? ""}
                onChange={e => setValues(v => ({ ...v, delivery_delay_message: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => save("delivery_delay_message", values.delivery_delay_message ?? "")}
                disabled={saving === "delivery_delay_message"}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200 transition-all flex items-center gap-2"
              >
                {saving === "delivery_delay_message" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved === "delivery_delay_message" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : "Мессежийг шинэчлэх"}
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium bg-slate-50 p-3 rounded-lg border border-dashed text-center">
              💡 Энэхүү текстийг идэвхжүүлсэн тохиолдолд <strong>/track [Хайлт]</strong> хуудасны хамгийн дээд хэсэгт шар баннер дотор харагдах болно.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
