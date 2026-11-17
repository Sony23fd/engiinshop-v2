"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import {
  Sparkles,
  Tag,
  Truck,
  Smartphone,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ExternalLink
} from "lucide-react"

export function WhatsNewDrawer() {
  const [open, setOpen] = useState(false)

  const updates = [
    {
      icon: Tag,
      color: "text-purple-600 bg-purple-100",
      title: "1. Сонголт & Size-ийн шинжилгээ, шүүлтүүр",
      badge: "Багцын хуудас",
      desc: "Барааны багцын хуудас дээр Size (хэмжээ) тус бүрээр шүүх товчнууд болон нийт захиалгад эзлэх хувийг харуулсан шинэ самбар нэмэгдсэн.",
      link: "/admin/orders",
      linkText: "Захиалгууд руу очих"
    },
    {
      icon: Truck,
      color: "text-blue-600 bg-blue-100",
      title: "2. Хүргэлтийн 2 шатлалт удирдлага & Бөөнөөр батлах",
      badge: "Хүргэлт",
      desc: "Бэлтгэсэн ачааг жолоочид бөөнөөр хүлээлгэн өгөх товч болон орой нь хүргэгдсэн хаягуудыг 1 товшилтоор бөөнөөр хаах шийдэл нэвтэрсэн.",
      link: "/admin/orders/delivery",
      linkText: "Хүргэлтийн хуудас"
    },
    {
      icon: Smartphone,
      color: "text-emerald-600 bg-emerald-100",
      title: "3. Жолоочийн мобайл хуудас (/courier)",
      badge: "Мобайл",
      desc: "Хүргэлтийн ажилтанд зориулсан 4 оронтой ПИН код бүхий тусгай мобайл хуудас. 1 товшилтоор залгах, хүргэсэн гэж батлах, асуудал тэмдэглэх боломжтой.",
      link: "/courier?pin=2026",
      linkText: "Жолоочийн хуудас үзэх",
      external: true
    },
    {
      icon: CreditCard,
      color: "text-amber-600 bg-amber-100",
      title: "4. Урьдчилсан төлбөрийн дүрэм (Жолооч мөнгө авахгүй)",
      badge: "Чухал дүрэм",
      desc: "Карго болон хүргэлтийн төлбөр нь бараа гарахаас өмнө бүрэн төлөгдсөн байх дүрэмтэй. Хүргэлтийн карт болон пайзан дээр 'ТӨЛБӨР ТӨЛӨГДСӨН' гэж автоматаар хэвлэгдэнэ.",
      link: "/admin/guide",
      linkText: "Журам унших"
    },
    {
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-100",
      title: "5. Агуулахын удсан барааг цэгцлэх",
      badge: "Агуулах",
      desc: "Салбараас авах 60, 90 хоногоос хэтэрсэн ачаануудыг нэг дор хялбар 'Өөрөө ирж авсан' болгох тусгай удирдлагын хуудас нэмэгдсэн.",
      link: "/admin/orders/overdue-storage",
      linkText: "Удсан барааны хуудас"
    },
    {
      icon: ClipboardList,
      color: "text-indigo-600 bg-indigo-100",
      title: "6. Гараар захиалга оруулах шинэ шаардлага",
      badge: "Захиалга",
      desc: "Утасны дугаарыг заавал 8 оронтойгоор авах, Size-ийн нөөцөөс автоматаар хасагдах, карго болон нийт дүн автоматаар бодогдох боломж нэмэгдсэн.",
      link: "/admin/guide",
      linkText: "Гарын авлага үзэх"
    },
    {
      icon: FileSpreadsheet,
      color: "text-teal-600 bg-teal-100",
      title: "7. Excel экспорт & Ухаалаг хайлт",
      badge: "Өгөгдөл",
      desc: "Excel татахад каргоны үнэ зөв тусдаг болсон. /track дээр зай, зураастай утас болон захиалгын дугаараар чөлөөтэй хайх боломжтой болсон.",
      link: "/track",
      linkText: "/track шалгах",
      external: true
    }
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/80 transition-all shadow-xs cursor-pointer"
        title="Системийн сүүлийн шинэ боломжуудтай танилцах"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
        <span>Шинэ боломжууд (v2.4)</span>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto w-full sm:max-w-lg p-6">
        <SheetHeader className="text-left space-y-1 pb-4 border-b">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md w-max">
            <Sparkles className="w-3 h-3" /> Шинэчлэлт v2.4 (2026.11)
          </div>
          <SheetTitle className="text-xl font-extrabold text-slate-900">
            Системийн Сүүлийн Үеийн Шинэчлэлтүүд
          </SheetTitle>
          <p className="text-xs text-slate-500">
            Захиалга, хүргэлт, барааны удирдлагад нэвтэрсэн гол өөрчлөлтүүдийн хураангуй
          </p>
        </SheetHeader>

        {/* Feature Cards List */}
        <div className="space-y-3 mt-4">
          {updates.map((item, idx) => {
            const Icon = item.icon
            return (
              <div 
                key={idx}
                className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                  {item.desc}
                </p>

                <div className="pl-9 pt-1 flex items-center gap-2">
                  <Link
                    href={item.link}
                    onClick={() => !item.external && setOpen(false)}
                    target={item.external ? "_blank" : undefined}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>{item.linkText}</span>
                    {item.external ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Banner to Full Guide */}
        <div className="mt-6 p-4 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl text-white space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>Дэлгэрэнгүй Гарын Авлага</span>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Бүх 12 бүлэг зааварчилгаа, дэлгэцийн тайлбар, түгээмэл асуултуудыг Гарын авлагын хуудаснаас уншина уу.
          </p>
          <Link
            href="/admin/guide"
            className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs h-9 inline-flex items-center justify-center rounded-md transition-colors"
            onClick={() => setOpen(false)}
          >
            Гарын авлага нээх
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
