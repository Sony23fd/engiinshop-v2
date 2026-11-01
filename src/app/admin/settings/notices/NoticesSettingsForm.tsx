"use client"

import { useState } from "react"
import { saveMultipleShopSettings } from "@/app/actions/settings-actions"
import { Truck, CheckCircle2, Loader2, Sparkles, AlertTriangle, Box, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

export function NoticesSettingsForm({ settings }: { settings: Record<string, string> }) {
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [delayActive, setDelayActive] = useState<boolean>(settings.delivery_delay_active === "true")
  const [saving, setSaving] = useState(false)

  function handleChange(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...values,
        delivery_delay_active: delayActive ? "true" : "false"
      }
      const res = await saveMultipleShopSettings(payload)
      if (res.success) {
        toast({
          title: "Амжилттай хадгалагдлаа",
          description: "Бүх тайлбар, мэдэгдлийн тохиргоонууд шинэчлэгдлээ."
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
      {/* 1. In-Transit Notice (Screenshot) */}
      <Card className="border-blue-200/80 shadow-sm">
        <CardHeader className="bg-blue-50/40 border-b border-blue-100/60">
          <div className="flex items-center gap-2 text-blue-700">
            <Truck className="w-5 h-5" />
            <CardTitle className="text-base font-bold">1. Солонгосоос хөдөлсөн үеийн тайлбар (In-Transit)</CardTitle>
          </div>
          <CardDescription>
            Захиалга хянах хуудас дээр барааны статус "Солонгосоос хөдөлсөн" үед харагдах мэдэгдэл.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800">Мэдэгдлийн гарчиг (Тодруулсан үг)</label>
              <Input
                value={values.notice_in_transit_title ?? "Ойролцоох хугацаа:"}
                onChange={e => handleChange("notice_in_transit_title", e.target.value)}
                placeholder="Ойролцоох хугацаа:"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Тайлбар текст</label>
              <Textarea
                rows={3}
                value={values.notice_in_transit_text ?? ""}
                onChange={e => handleChange("notice_in_transit_text", e.target.value)}
                placeholder="Бараа Солонгосоос хөдөлсөн бөгөөд хэвийн нөхцөлд 7-10 хоногийн дараа Улаанбаатарт ирдэг."
                className="mt-1.5 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Хэрэглэгчийн захиалга Солонгосоос гараад тээвэрлэлтийн шатанд яваа үед энэ тайлбар харагдана.
              </p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Хэрэглэгчид харагдах байдал (Live Preview)
            </span>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-lg">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>{values.notice_in_transit_title || "Ойролцоох хугацаа:"}</strong>{" "}
                {values.notice_in_transit_text || "Бараа Солонгосоос хөдөлсөн бөгөөд хэвийн нөхцөлд 7-10 хоногийн дараа Улаанбаатарт ирдэг."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Ready for Delivery Notice */}
      <Card className="border-emerald-200/80 shadow-sm">
        <CardHeader className="bg-emerald-50/40 border-b border-emerald-100/60">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <CardTitle className="text-base font-bold">2. Хүргэлтэд бэлэн болсон үеийн тайлбар (Arrival / Delivery)</CardTitle>
          </div>
          <CardDescription>
            Бараа Монголд ирсэн бөгөөд хүргэлт товлох үед хуваарийн доор гарах хугацааны санамж.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-800">Хүргэгдэх хугацааны санамж</label>
            <Input
              value={values.notice_ready_for_delivery_text ?? "Товлосон өдрөөс 24–72 цагийн дотор хүргэгдэнэ."}
              onChange={e => handleChange("notice_ready_for_delivery_text", e.target.value)}
              placeholder="Товлосон өдрөөс 24–72 цагийн дотор хүргэгдэнэ."
              className="mt-1.5"
            />
          </div>

          {/* Live Preview */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Хэрэглэгчид харагдах байдал (Live Preview)
            </span>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm max-w-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                <strong>Хүргэлт захиалах боломжтой.</strong> Хүргэлт Лхагва, Бямба гарагуудад гарна.{" "}
                <strong>{values.notice_ready_for_delivery_text || "Товлосон өдрөөс 24–72 цагийн дотор хүргэгдэнэ."}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Product & Pre-order Estimates */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Box className="w-5 h-5" />
            <CardTitle className="text-base font-bold">3. Бүтээгдэхүүний хуудасны тооцоолсон хугацаанууд</CardTitle>
          </div>
          <CardDescription>
            Барааны дэлгэрэнгүй хуудас болон нүүр хуудасны картууд дээр харагдах хугацааны бичвэрүүд.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800">Олон улсын карго хугацаа</label>
              <Input
                value={values.product_cargo_estimate_text ?? "Ойролцоогоор 7-14 хоног (Солонгосоос)"}
                onChange={e => handleChange("product_cargo_estimate_text", e.target.value)}
                placeholder="Ойролцоогоор 7-14 хоног (Солонгосоос)"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Бүтээгдэхүүний хуудасны карго бараан дээр харагдана.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Хот доторх хүргэлтийн хугацаа</label>
              <Input
                value={values.product_local_estimate_text ?? "Товлосон өдрөөс 24-72 цагийн дотор хүргэгдэнэ"}
                onChange={e => handleChange("product_local_estimate_text", e.target.value)}
                placeholder="Товлосон өдрөөс 24-72 цагийн дотор хүргэгдэнэ"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Бэлэн байгаа барааны доор харагдана.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Урьдчилсан захиалгын ирэх хугацаа</label>
              <Input
                value={values.preorder_estimate_text ?? "Захиалга хаагдсанаас хойш 7-14 хоногт ирнэ"}
                onChange={e => handleChange("preorder_estimate_text", e.target.value)}
                placeholder="Захиалга хаагдсанаас хойш 7-14 хоногт ирнэ"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Нүүр хуудасны Pre-order картуудын доор харагдана.</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800">Өөрөө ирж авах заавар</label>
              <Input
                value={values.pickup_guide_text ?? "Бэлэн болсон захиалгыг дээрх хаягаар өөрийн биеэр ирж авах боломжтой."}
                onChange={e => handleChange("pickup_guide_text", e.target.value)}
                placeholder="Бэлэн болсон захиалгыг өөрийн биеэр ирж авах боломжтой."
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Захиалга хянах хуудасны дэлгүүрийн хаягийн дэргэд харагдана.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Delivery Delay Banner */}
      <Card className="border-amber-200/90 shadow-sm">
        <CardHeader className="bg-amber-50/40 border-b border-amber-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base font-bold">4. Хүргэлтийн саатлын анхааруулга баннер</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {delayActive ? "Идэвхтэй" : "Идэвхгүй"}
              </span>
              <Switch checked={delayActive} onCheckedChange={setDelayActive} />
            </div>
          </div>
          <CardDescription>
            Хүргэлт ачаалалтай эсвэл түр саатах үед захиалга шалгах хуудасны хамгийн дээр тод баннер харуулна.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Анхааруулга мессеж</label>
            <Textarea
              rows={2}
              value={values.delivery_delay_message ?? ""}
              onChange={e => handleChange("delivery_delay_message", e.target.value)}
              placeholder="Хүргэлтийн захиалга хэт олон байгаагаас шалтгаалан таны захиалга бага зэрэг саатаж очих магадлалтайг анхаарна уу."
              className="mt-1.5 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-indigo-500" />
          Өөрчлөлтийг хадгалснаар хэрэглэгчийн сайт дээр шууд шинэчлэгдэнэ.
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

