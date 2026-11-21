"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Upload, ImageIcon, Sparkles, Send, Bot } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { testTelegramConnection } from "@/app/actions/settings-actions"

import { SystemUpdateCard } from "@/components/admin/SystemUpdateCard"
import { Role } from "@prisma/client"

interface Props {
  initialSettings: Record<string, string>
  userRole?: Role
}

export function GeneralSettingsClient({ initialSettings, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [logoUrl, setLogoUrl] = useState(initialSettings["site_logo"] || "")
  const [showHeroText, setShowHeroText] = useState(initialSettings["hero_text_visible"] !== "false")
  const [heroBadgeText, setHeroBadgeText] = useState(initialSettings["hero_badge_text"] || "Шууд захиалах боломжтой")
  const [heroTitle, setHeroTitle] = useState(initialSettings["hero_title"] || "Солонгосоос шууд таны гарт хүргэнэ")
  const [heroSubtitle, setHeroSubtitle] = useState(initialSettings["hero_subtitle"] || "Чанарын баталгаат, трэнд болж буй гоо сайхан, хувцас, ахуйн хэрэглээний барааг Солонгосоос хамгийн хурднаар, найдвартай захиалж аваарай.")

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(initialSettings["maintenance_mode"] === "true")
  const [maintenanceTitle, setMaintenanceTitle] = useState(initialSettings["maintenance_title"] || "Түр засвартай байна")
  const [maintenanceMessage, setMaintenanceMessage] = useState(initialSettings["maintenance_message"] || "Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе. Манай сайт дээр одоогоор өгөгдлийн шинэчлэл хийгдэж байгаа тул түр хугацаанд хаагдлаа. Та хэсэг хугацааны дараа дахин хандана уу. Баярлалаа!")
  
  const [heroBgColor, setHeroBgColor] = useState(initialSettings["hero_bg_color"] || "#5442cc")
  
  // Delivery schedule days
  const [deliveryScheduleDays, setDeliveryScheduleDays] = useState<number[]>(() => {
    const str = initialSettings["delivery_schedule_days"] || "3,6"
    return str.split(",").map(Number).filter(n => !isNaN(n))
  })

  const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

  const initialCarouselStr = initialSettings["hero_carousel_images"]
  const [carouselImages, setCarouselImages] = useState<string[]>(
    initialCarouselStr ? JSON.parse(initialCarouselStr) : []
  )

  const [telegramBotToken, setTelegramBotToken] = useState(initialSettings["telegram_bot_token"] || "")
  const [telegramChatId, setTelegramChatId] = useState(initialSettings["telegram_chat_id"] || "")
  const [isTestingTelegram, setIsTestingTelegram] = useState(false)

  async function handleTestTelegram() {
    if (!telegramBotToken.trim() || !telegramChatId.trim()) {
      toast({
        variant: "destructive",
        title: "Тохиргоо дутуу байна",
        description: "Bot Token болон Chat ID-г оруулсны дараа шалгана уу."
      })
      return
    }
    setIsTestingTelegram(true)
    try {
      const res = await testTelegramConnection(telegramBotToken.trim(), telegramChatId.trim())
      if (res.success) {
        toast({
          title: "Холболт амжилттай! 🎉",
          description: "Telegram чат/групп руу тань туршилтын мессеж амжилттай очлоо."
        })
      } else {
        toast({
          variant: "destructive",
          title: "Telegram алдаа",
          description: res.error || "Мессеж илгээж чадсангүй."
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: err.message
      })
    } finally {
      setIsTestingTelegram(false)
    }
  }

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Унших үед алдаа гарлаа")

      setLogoUrl(data.url)
      toast({
        title: "Зураг хуулагдлаа",
        description: "Одоо 'Хадгалах' товчийг дарна уу.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: error.message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const settingsPayload: Record<string, string> = {
        site_logo: logoUrl,
        hero_text_visible: showHeroText ? "true" : "false",
        hero_badge_text: heroBadgeText,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        maintenance_mode: isMaintenanceMode ? "true" : "false",
        maintenance_title: maintenanceTitle,
        maintenance_message: maintenanceMessage,
        hero_bg_color: heroBgColor,
        delivery_schedule_days: deliveryScheduleDays.join(","),
        hero_carousel_images: JSON.stringify(carouselImages),
        telegram_bot_token: telegramBotToken.trim(),
        telegram_chat_id: telegramChatId.trim(),
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsPayload }),
      })
      if (!res.ok) throw new Error("Тохиргоо хадгалахад алдаа гарлаа")

      toast({
        title: "Амжилттай",
        description: "Тохиргоонууд хадгалагдлаа",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Сайтын Лого</CardTitle>
          <CardDescription>
            Сайтын зүүн дээд буланд байрлах үндсэн лого. (Хэмжээ нь 16:9 эсвэл 1:1 харьцаатай байвал тохиромжтой)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-32 h-32 shrink-0 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden group">
              {logoUrl ? (
                <>
                  <Image src={logoUrl} alt="Лого" fill className="object-contain p-2" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white opacity-80" />
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-500">Лого байхгүй</span>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Шинэ лого оруулах</h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Зурган дээр дарж шинэ зураг оруулна уу. Лого хуулагдсаны дараа Хадгалах товчийг дарж баталгаажуулна. PNG, JPG өргөтгэлтэй, дээд тал нь 5MB зураг оруулна уу.
              </p>
              {isUploading && (
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Хуулж байна...
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 space-y-5 flex flex-col items-start">
            {/* Hero Text Toggle & Inputs */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-base font-semibold text-slate-800">Нүүр хуудасны уриа текст</label>
                  <p className="text-sm text-slate-500">
                    Сайтын хамгийн эхэнд байрлах том текстийг (уриа үг) нуух эсвэл харуулах
                  </p>
                </div>
                <Switch 
                  checked={showHeroText} 
                  onCheckedChange={setShowHeroText} 
                />
              </div>

              {showHeroText && (
                <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Тэмдэглэгээ (Badge) текст</label>
                    <Input
                      value={heroBadgeText}
                      onChange={e => setHeroBadgeText(e.target.value)}
                      placeholder="Шууд захиалах боломжтой"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Үндсэн том гарчиг</label>
                    <Input
                      value={heroTitle}
                      onChange={e => setHeroTitle(e.target.value)}
                      placeholder="Солонгосоос шууд таны гарт хүргэнэ"
                      className="mt-1 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Уриа дэд тайлбар</label>
                    <Textarea
                      rows={2}
                      value={heroSubtitle}
                      onChange={e => setHeroSubtitle(e.target.value)}
                      placeholder="Чанарын баталгаат, трэнд болж буй гоо сайхан, хувцас, ахуйн хэрэглээний барааг Солонгосоос хамгийн хурднаар, найдвартай захиалж аваарай."
                      className="mt-1 bg-white resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance Mode Toggle & Message */}
            <div className="w-full pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-base font-semibold text-slate-800">Сайтыг түр хаах (Засвартай горим)</label>
                  <p className="text-sm text-slate-500">
                    Идэвхжүүлсэн үед хэрэглэгчдэд "Түр засвартай" гэсэн хуудас харагдах ба худалдан авалт хийх боломжгүй болно.
                  </p>
                </div>
                <Switch 
                  checked={isMaintenanceMode} 
                  onCheckedChange={setIsMaintenanceMode} 
                />
              </div>

              {isMaintenanceMode && (
                <div className="w-full bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-amber-900">Засварын хуудасны гарчиг</label>
                    <Input
                      value={maintenanceTitle}
                      onChange={e => setMaintenanceTitle(e.target.value)}
                      placeholder="Түр засвартай байна"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-900">Засварын дэлгэрэнгүй тайлбар</label>
                    <Textarea
                      rows={3}
                      value={maintenanceMessage}
                      onChange={e => setMaintenanceMessage(e.target.value)}
                      placeholder="Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе..."
                      className="mt-1 bg-white resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Background Color */}
            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Арын өнгө (Background Color)</label>
                <p className="text-sm text-slate-500">
                  Нүүр хуудасны хөдөлгөөнтэй арын фон өнгийг сонгох
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                  style={{ backgroundColor: heroBgColor }}
                />
                <input 
                  type="color" 
                  value={heroBgColor}
                  onChange={(e) => setHeroBgColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer rounded overflow-hidden" 
                />
              </div>
            </div>

            {/* Delivery Schedule Days */}
            <div className="w-full pt-4 border-t border-slate-100 space-y-3">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">🚚 Хүргэлтийн Хуваарь</label>
                <p className="text-sm text-slate-500">
                  Хүргэлт ямар гарагуудад гарахыг сонгоно уу. Хэрэглэгчдэд энэ мэдээлэл автоматаар харагдана.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, idx) => {
                  const isActive = deliveryScheduleDays.includes(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDeliveryScheduleDays(prev =>
                          isActive ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                        )
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              {deliveryScheduleDays.length === 0 && (
                <p className="text-xs text-amber-600 font-medium">⚠️ Хүргэлтийн өдөр сонгогдоогүй байна!</p>
              )}
            </div>

            {/* Carousel Images */}
            <div className="w-full pt-4 border-t border-slate-100 space-y-4">
              <div className="space-y-0.5">
                <label className="text-base font-semibold text-slate-800">Carousel зургууд (Слайд)</label>
                <p className="text-sm text-slate-500">
                  Нүүр хуудсанд текстийн оронд буюу нийтдээ харагдах слайд зургуудыг энд оруулна.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {carouselImages.map((img, idx) => (
                  <div key={idx} className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <Image src={img} alt={`Slide ${idx}`} fill className="object-cover" />
                    <button 
                      onClick={() => setCarouselImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-sm z-10 text-xs font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <div className="relative w-32 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setIsUploading(true)
                      const formData = new FormData()
                      formData.append("file", file)
                      try {
                        const res = await fetch("/api/admin/settings/upload", { method: "POST", body: formData })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setCarouselImages(prev => [...prev, data.url])
                      } catch (error: any) {
                        toast({ variant: "destructive", title: "Алдаа", description: error.message })
                      } finally {
                        setIsUploading(false)
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <div className="text-center text-slate-400">
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Оруулах</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isUploading || isSaving}
            className="bg-[#4e3dc7] hover:bg-indigo-700 text-white shadow-sm font-medium px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Хадгалах
          </Button>
        </CardFooter>
      </Card>

      {/* Telegram Bot Notification Settings Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <CardTitle>Telegram Bot Мэдэгдлийн Тохиргоо</CardTitle>
          </div>
          <CardDescription>
            Шинэ захиалга, төлбөр баталгаажилт болон хүргэлтийн хүсэлт ирэх үед таны Telegram групп эсвэл чат руу (сонгосон өнгө, размерийн хамт) шуурхай мессеж очих тохиргоо.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Telegram Bot Token
              </label>
              <Input
                placeholder="Ж: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={telegramBotToken}
                onChange={e => setTelegramBotToken(e.target.value)}
                className="bg-white font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Telegram дээр <strong>@BotFather</strong>-аас авсан HTTP API Token.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Telegram Chat ID / Group ID
              </label>
              <Input
                placeholder="Ж: -1001234567890 эсвэл 123456789"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                className="bg-white font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Мэдэгдэл хүлээн авах суваг, групп эсвэл админы хувийн чат ID.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-indigo-900">Холболтыг шалгах</p>
              <p className="text-[11px] text-indigo-700">
                Дээр оруулсан Bot болон Chat ID руу туршилтын мессеж илгээж шалгана.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram || !telegramBotToken.trim() || !telegramChatId.trim()}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 bg-white font-bold text-xs h-9 shrink-0 shadow-2xs"
            >
              {isTestingTelegram ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Туршилтын мессеж илгээх
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isUploading || isSaving}
            className="bg-[#4e3dc7] hover:bg-indigo-700 text-white shadow-sm font-medium px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Хадгалах
          </Button>
        </CardFooter>
      </Card>

      {userRole === "DATAADMIN" && <SystemUpdateCard />}
    </div>
  )
}
