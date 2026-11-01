"use client"

import { useState } from "react"
import { saveMultipleShopSettings } from "@/app/actions/settings-actions"
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, MessageCircle, CheckCircle2, Loader2, Sparkles, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function ContactSettingsForm({ settings }: { settings: Record<string, string> }) {
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [saving, setSaving] = useState(false)

  function handleChange(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await saveMultipleShopSettings(values)
      if (res.success) {
        toast({
          title: "Амжилттай хадгалагдлаа",
          description: "Холбоо барих мэдээллүүд дэлгүүрийн сайт дээр шинэчлэгдлээ."
        })
      } else {
        throw new Error(res.error || "Алдаа гарлаа")
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: err.message
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Phone & Email */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Phone className="w-5 h-5" />
            <CardTitle className="text-base font-bold">1. Утас ба Имэйл хаяг</CardTitle>
          </div>
          <CardDescription>
            Хэрэглэгчдэд харагдах лавлах утас, хөл хэсэг болон захиалгын хуудсанд харагдах мэдээлэл.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-500" /> Үндсэн утасны дугаар
              </label>
              <Input
                value={values.shop_phone ?? "+976 8853 9667"}
                onChange={e => handleChange("shop_phone", e.target.value)}
                placeholder="+976 8853 9667"
                className="mt-1.5 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Footer болон захиалгын бүх лавлах хэсэгт ашиглагдана.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-500" /> Нэмэлт / Каргоны утас
              </label>
              <Input
                value={values.shop_secondary_phone ?? ""}
                onChange={e => handleChange("shop_secondary_phone", e.target.value)}
                placeholder="+976 8853 9887"
                className="mt-1.5 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1">Захиалга шалгах эсвэл карго хүргэлтийн үед нэмэлт холбогдох дугаар.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" /> Албан ёсны имэйл хаяг
              </label>
              <Input
                value={values.shop_email ?? "info@anarkorea.mn"}
                onChange={e => handleChange("shop_email", e.target.value)}
                placeholder="info@anarkorea.mn"
                className="mt-1.5 font-medium max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Address & Hours */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <MapPin className="w-5 h-5" />
            <CardTitle className="text-base font-bold">2. Байршил & Ажиллах цагийн хуваарь</CardTitle>
          </div>
          <CardDescription>
            Дэлгүүр, салбар эсвэл карго олгох төвийн хаяг, ажиллах өдрүүд.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> Албан ёсны хаяг
            </label>
            <Textarea
              rows={2}
              value={values.shop_address ?? ""}
              onChange={e => handleChange("shop_address", e.target.value)}
              placeholder="БЗД, 26-р хороо Саруул хороолол 122-р байр, Үйлчилгээний хэсгийн 3 давхарт"
              className="mt-1.5 resize-none font-medium"
            />
            <p className="text-xs text-slate-400 mt-1">Хөл хэсэг болон өөрөө очиж авах заавар дээр энэ хаяг харагдана.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" /> Даваа - Бямба цагийн хуваарь
              </label>
              <Input
                value={values.shop_hours_weekdays ?? "10:00 - 19:00"}
                onChange={e => handleChange("shop_hours_weekdays", e.target.value)}
                placeholder="10:00 - 19:00"
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" /> Ням гарагийн цагийн хуваарь
              </label>
              <Input
                value={values.shop_hours_weekend ?? "Амарна"}
                onChange={e => handleChange("shop_hours_weekend", e.target.value)}
                placeholder="Ням: Амарна эсвэл 11:00 - 17:00"
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Social Media Links */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Facebook className="w-5 h-5" />
            <CardTitle className="text-base font-bold">3. Сошиал хуудсууд & Чат холбоос</CardTitle>
          </div>
          <CardDescription>
            Хэрэглэгчид шууд хандах боломжтой сошиал сувгуудын бүтэн холбоос (URL).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Facebook className="w-4 h-4 text-blue-600" /> Facebook хуудасны линк
              </label>
              <Input
                value={values.social_facebook ?? ""}
                onChange={e => handleChange("social_facebook", e.target.value)}
                placeholder="https://www.facebook.com/..."
                className="mt-1.5 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-pink-600" /> Instagram хаягийн линк
              </label>
              <Input
                value={values.social_instagram ?? ""}
                onChange={e => handleChange("social_instagram", e.target.value)}
                placeholder="https://www.instagram.com/..."
                className="mt-1.5 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-indigo-600" /> Шууд тусламжийн чат линк (Сонголтоор)
              </label>
              <Input
                value={values.support_chat_url ?? ""}
                onChange={e => handleChange("support_chat_url", e.target.value)}
                placeholder="https://m.me/... эсвэл https://t.me/..."
                className="mt-1.5 font-mono text-xs"
              />
              <p className="text-xs text-slate-400 mt-1">Оруулсан тохиолдолд захиалга шалгах болон тусламжийн товчлуур дээр холбогдоно.</p>
            </div>
          </div>

          {/* Live Preview of Footer Contact */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Хөл хэсэгт (Footer) харагдах байдал (Live Preview)
            </span>
            <div className="bg-[#1c1642] text-slate-300 p-5 rounded-xl border border-indigo-900/40 max-w-lg space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Холбоо барих</p>
              <div className="flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{values.shop_address || "Хаяг оруулаагүй байна"}</p>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <p className="font-semibold text-white">{values.shop_phone || "Утас байхгүй"}</p>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <p>{values.shop_email || "Имэйл байхгүй"}</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Даваа - Бямба: {values.shop_hours_weekdays || "10:00 - 19:00"}</span>
                <span className="text-rose-400 font-medium">{values.shop_hours_weekend || "Ням: Амарна"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-indigo-500" />
          Хадгалах товч дарсны дараа сайтын бүх хуудсанд шинэчлэгдэнэ.
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Хадгалж байна...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Хадгалах
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

