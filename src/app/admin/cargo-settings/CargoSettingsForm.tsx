"use client"

import { useState } from "react"
import { saveShopSetting } from "@/app/actions/settings-actions"
import { CheckCircle2, Loader2 } from "lucide-react"

const FIELDS = [
  { key: "cargo_bank_name", label: "Карго Банкны нэр", placeholder: "Хаан Банк" },
  { key: "cargo_bank_account", label: "Дансны дугаар", placeholder: "5011..." },
  { key: "cargo_bank_holder", label: "Данс эзэмшигч", placeholder: "Болд" },
  { key: "cargo_payment_instruction", label: "Гүйлгээний утгын заавар", placeholder: "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү." },
]

export function CargoSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function save(key: string) {
    setSaving(key)
    await saveShopSetting(key, values[key] ?? "")
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      <div className="space-y-5">
        <h3 className="font-semibold text-slate-800">Карго Банкны Мэдээлэл</h3>
        {FIELDS.map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{f.label}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
              />
              <button
                onClick={() => save(f.key)}
                disabled={saving === f.key}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {saving === f.key
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : saved === f.key
                    ? <CheckCircle2 className="w-4 h-4 text-green-200" />
                    : "Хадгалах"
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 text-xs text-slate-400">
        Энэхүү данс руу хэрэглэгч зөвхөн "Хүргэлтийн хураамж"-г шилжүүлж төлөх бөгөөд QPay ашиглагдахгүй.
      </div>
    </div>
  )
}
