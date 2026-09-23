"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Box, 
  Layers, 
  FolderTree, 
  Activity, 
  Truck, 
  Search, 
  FileSpreadsheet, 
  Settings, 
  KeyRound, 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Bot,
  ExternalLink,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideModule {
  id: string;
  number: string;
  title: string;
  badge?: string;
  icon: any;
  desc: string;
  keywords: string[];
}

const GUIDE_MODULES: GuideModule[] = [
  {
    id: "general",
    number: "01",
    title: "Ерөнхий & Эрхийн түвшин",
    icon: KeyRound,
    desc: "Админ эрхийн ялгаа (Admin, Cargo, DataAdmin), аюулгүй байдал.",
    keywords: ["нэвтрэх", "эрх", "нууц үг", "админ", "cargo", "үүрэг", "роль"]
  },
  {
    id: "products_batches",
    number: "02",
    title: "Бараа ба Багцын бүтэц",
    icon: Box,
    desc: "Бараа ба Багцын хамаарал, зорилтот ба үлдэгдэл тоо, нүүрт гаргах.",
    keywords: ["бараа", "багц", "batch", "зорилтот тоо", "үлдэгдэл", "preorder", "хаах"]
  },
  {
    id: "variants",
    number: "03",
    title: "Сонголт & Зураг солигдох",
    badge: "Шинэ",
    icon: Camera,
    desc: "Өнгө/хэмжээ үүсгэх, сонголт бүрт зураг оноох, WebP шахалт.",
    keywords: ["сонголт", "variant", "зураг", "хэмжээ", "өнгө", "матриц", "webp", "sharp"]
  },
  {
    id: "merge_tool",
    number: "04",
    title: "Бараа нэгтгэх хэрэгсэл",
    badge: "Шинэ",
    icon: Layers,
    desc: "Өмнөх салангид бараануудыг нэгтгэх, архивлах, дата хамгаалах.",
    keywords: ["нэгтгэх", "merge", "салангид", "архив", "цэвэрлэх", "сонголт болгох"]
  },
  {
    id: "categories",
    number: "05",
    title: "Ангилал & Зөөх үйлдэл",
    badge: "Шинэ",
    icon: FolderTree,
    desc: "Сарын ангилал үүсгэх, барааг ангилал хооронд шилжүүлэх.",
    keywords: ["ангилал", "категори", "зөөх", "шилжүүлэх", "тээврийн үнэ", "архив"]
  },
  {
    id: "orders_payment",
    number: "06",
    title: "Захиалга & Төлбөр (QPay)",
    icon: Activity,
    desc: "QPay автомат баталгаажуулалт, автомат цуцлалт, дансны хуулга.",
    keywords: ["захиалга", "qpay", "төлбөр", "данс", "баталгаажуулах", "цуцлах", "cron"]
  },
  {
    id: "cargo_delivery",
    number: "07",
    title: "Карго Төлөв & Түгээлт",
    icon: Truck,
    desc: "Тээврийн шат дамжлага, олноор статус солих, хүргэлтийн хуудас.",
    keywords: ["карго", "хүргэлт", "төлөв", "статус", "ирсэн", "жолооч", "түгээлт"]
  },
  {
    id: "search_profile",
    number: "08",
    title: "Лавлагаа Хайлт & Профайл",
    icon: Search,
    desc: "Утас, данс, нэрээр хайх, үйлчлүүлэгчийн худалдан авалтын түүх.",
    keywords: ["хайх", "лавлагаа", "утас", "данс", "профайл", "хэрэглэгчийн карт"]
  },
  {
    id: "excel",
    number: "09",
    title: "Excel Экспорт & Импорт",
    icon: FileSpreadsheet,
    desc: "Захиалгуудыг Excel татах, загвараар бөөнөөр бүртгэх.",
    keywords: ["excel", "экспорт", "импорт", "файл", "татаж авах", "бөөнөөр"]
  },
  {
    id: "settings_telegram",
    number: "10",
    title: "Тохиргоо & Telegram Bot",
    badge: "Шинэ",
    icon: Bot,
    desc: "Данс, үйлчилгээний нөхцөл, Telegram шуурхай мэдэгдлийн тохиргоо.",
    keywords: ["тохиргоо", "telegram", "bot", "мэдэгдэл", "нөхцөл", "данс"]
  },
];

export default function AdminGuidePage() {
  const [activeModule, setActiveModule] = useState(GUIDE_MODULES[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return GUIDE_MODULES;
    const q = searchQuery.toLowerCase().trim();
    return GUIDE_MODULES.filter(m => 
      m.title.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.keywords.some(k => k.includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-700/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> 2026 Оны Шинэчилсэн Хувилбар
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Админ Системийн Иж Бүрэн Гарын Авлага</h1>
          <p className="text-indigo-200 text-sm max-w-2xl">
            Anar Korea Shop цахим худалдааны системийн өдөр тутмын ажиллагаа, захиалга, карго түгээлт, барааны удирдлагын албан ёсны зааварчилгаа.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer backdrop-blur"
            title="Энэ хуудсыг хэвлэх"
          >
            <Printer className="w-4 h-4" /> Хэвлэх
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Гарын авлагаас хайх (Жишээ нь: сонголтын зураг, нэгтгэх, qpay, telegram, карго статус...)"
          className="pl-12 h-12 bg-white text-sm rounded-xl border-slate-200 shadow-sm focus-visible:ring-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar Chapter List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Бүлгүүд ({filteredModules.length})</span>
            {searchQuery && <span className="text-indigo-600 font-semibold">Хайлтын үр дүн</span>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1">
            {filteredModules.length > 0 ? (
              filteredModules.map((mod) => {
                const isActive = activeModule === mod.id;
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={cn(
                      "flex items-start gap-3 w-full text-left p-3 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-md shrink-0 transition-colors mt-0.5",
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn("font-bold text-xs", isActive ? "text-indigo-100" : "text-slate-400 font-mono")}>
                          {mod.number}
                        </span>
                        {mod.badge && (
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                            isActive ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-700"
                          )}>
                            {mod.badge}
                          </span>
                        )}
                      </div>
                      <p className={cn("font-bold text-xs truncate", isActive ? "text-white" : "text-slate-900")}>
                        {mod.title}
                      </p>
                      <p className={cn("text-[11px] line-clamp-1 mt-0.5", isActive ? "text-indigo-100" : "text-slate-500")}>
                        {mod.desc}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                "{searchQuery}" хайлтад тохирох бүлэг олдсонгүй
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm border-slate-200 min-h-[600px] overflow-hidden">
            {activeModule === "general" && <GeneralContent />}
            {activeModule === "products_batches" && <ProductsBatchesContent />}
            {activeModule === "variants" && <VariantsContent />}
            {activeModule === "merge_tool" && <MergeToolContent />}
            {activeModule === "categories" && <CategoriesContent />}
            {activeModule === "orders_payment" && <OrdersPaymentContent />}
            {activeModule === "cargo_delivery" && <CargoDeliveryContent />}
            {activeModule === "search_profile" && <SearchProfileContent />}
            {activeModule === "excel" && <ExcelContent />}
            {activeModule === "settings_telegram" && <SettingsTelegramContent />}
          </Card>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 1. General & Roles Content
// =============================================================================
function GeneralContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 01
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <KeyRound className="w-5 h-5 text-indigo-600" /> Ерөнхий Заавар & Админ Эрхийн Түвшин
        </CardTitle>
        <CardDescription>
          Системд хэрхэн зөв нэвтрэх, ажлын үүрэг хуваарилалт ба аюулгүй байдлын дүрэм
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
            Админ эрхийн 3 түвшин
          </h3>
          <p>
            Манай системд хэрэглэгчдийн хандалтыг аюулгүй байлгах үүднээс эрхийг чандлан ялгасан байдаг:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-600 text-white">
                ADMIN (Үндсэн)
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Бүх эрхтэй менежер. Бараа үүсгэх, үнэ солих, тохиргоо, админ хэрэглэгч нэмэх бүрэн боломжтой.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white">
                CARGO_ADMIN (Хүргэлт)
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Зөвхөн захиалга харах, карго төлөв солих, жолоочийн хүргэлтийн хуудас бэлтгэх эрхтэй. Санхүү, барааны үнэ харахгүй.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                DATAADMIN (Дата)
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Өгөгдлийн сангийн нөөцлөлт (Backup) татах, лог үзэх, системийн өгөгдлийг архивлахад хэрэглэгдэнэ.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-5 space-y-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
            Шинэ ажилтанд админ эрх нээх & Нууц үг солих
          </h3>
          <ol className="list-decimal list-inside space-y-2 ml-1 text-slate-600">
            <li>Зүүн цэснээс <strong>СИСТЕМ & ТОХИРГОО ➡️ Хэрэглэгчид</strong> цэс рүү орно.</li>
            <li><strong>"Хэрэглэгч нэмэх"</strong> товч дээр дарж шинэ ажилтны нэр, и-мэйл, нууц үгийг оруулна.</li>
            <li>Ажилтны үүрэгт тааруулан <code>ADMIN</code> эсвэл <code>CARGO_ADMIN</code> эрх сонгоод хадгална.</li>
            <li>Ажилтан нууц үгээ мартвал уг жагсаалтаас засах (Edit) товч дарж шинэ нууц үг олгоно.</li>
          </ol>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-800">Аюулгүй байдлын санамж:</span>
            <p className="text-slate-600">
              Админ сесс нь 8 цагийн турш идэвхтэй байх бөгөөд 8 цаг өнгөрсний дараа автоматаар гарна. Нийтийн эсвэл түр компьютерт нэвтэрсэн бол ажлаа дуусгаад заавал <strong>"Гарах (Logout)"</strong> товч дарж байгаарай.
            </p>
          </div>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 2. Products & Batches Content
// =============================================================================
function ProductsBatchesContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 02
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Box className="w-5 h-5 text-indigo-600" /> Бараа ба Багцын Бүтэц (Product vs Batch)
        </CardTitle>
        <CardDescription>
          Барааны суурь мэдээлэл болон борлуулалтын ээлжийг хэрхэн удирдах тухай
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase">1. Бараа (Product)</span>
            <h4 className="font-bold text-slate-900">Суурь тогтмол мэдээлэл</h4>
            <p className="text-xs text-slate-600">
              Барааны нэр, тайлбар, үндсэн зураг, видео, жин (кг), Солонгосын эх дэлгүүрийн холбоос зэрэг тогтмол мэдээллүүд энд хадгалагдана. Нэг бараа олон удаагийн борлуулалтын багцтай байж болно.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase">2. Багц (Batch)</span>
            <h4 className="font-bold text-slate-900">Борлуулалтын аян / ээлж</h4>
            <p className="text-xs text-slate-600">
              Багц бүр <strong>#124</strong> гэсэн дугаартай байх ба үнэ, зорилтот тоо, үлдэгдэл тоо, харьяалагдах сарын ангиллыг зааж өгдөг. Захиалга бүр яг аль багцад хамаарахаа зааж холбогддог.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Зорилтот тоо ба Үлдэгдэл тооны механизм</h3>
          <ul className="list-disc list-inside space-y-2 ml-1 text-slate-600">
            <li><strong>Зорилтот тоо (Target):</strong> Энэ удаад нийт зарахыг хүсэж буй хэмжээ (Ж: 100ш).</li>
            <li><strong>Үлдэгдэл тоо (Remaining):</strong> Хүмүүс сайтаас захиалах бүрт автоматаар хасагдана.</li>
            <li><strong>Автомат хаалт:</strong> Үлдэгдэл тоо 0 болмогц систем багцыг "CLOSED" төлөвт оруулж, нэмж захиалга авахгүй цоожилно.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Борлуулах Свич (Toggle For Sale)</h3>
          <p>
            Барааны жагсаалт дээр байрлах свич товчоор удирдана:
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <strong>Ногоон (Асаалттай):</strong> Дэлгүүрийн нүүр хуудсанд харагдаж, хэрэглэгчид шууд сагслах боломжтой.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <strong>Саарал (Унтраалттай):</strong> Дэлгүүрээс нуугдана. Хэрэглэгчид сайт дээрээс олж харахгүй.
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 3. Variants & Images Content (NEW)
// =============================================================================
function VariantsContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 03 · Шинэ боломж
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Camera className="w-5 h-5 text-indigo-600" /> Барааны Сонголт (Variants) & Сонголтын Зураг
        </CardTitle>
        <CardDescription>
          Өнгө, хэмжээ, төрөл бүрт үлдэгдэл оноох, зураг холбох ба хэрэглэгчийн дэлгэц дээр зураг шууд солигдох шийдэл
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
            Нэг сонголттой горим (Single Variant - 90% хэрэглээ)
          </h3>
          <p>
            Пүүз, хувцас, гутал зэрэг зөвхөн хэмжээгээр эсвэл зөвхөн өнгөөр ялгардаг бараанд тохиромжтой:
          </p>
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 text-xs">
            <p className="font-bold text-indigo-900">Алхамууд:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Бараа нэмэх/засах цонхонд <strong>"Сонголт нэмэх" ➡️ "Нэг төрлийн сонголт"</strong> дарна.</li>
              <li>Сонголтын нэрийг сонгоно (Ж: <i>Хэмжээ</i>).</li>
              <li>Утгуудаа оруулна: <code>39</code> (10ш), <code>40</code> (15ш), <code>41</code> (5ш), <code>42</code> (0ш).</li>
              <li>Үлдэгдлүүдийн нийлбэрийг систем автоматаар нэмж, багцын нийт үлдэгдэлтэй тэнцүүлнэ.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
            Олон сонголттой горим (Multi-Option Matrix)
          </h3>
          <p>
            Өнгө (Хар, Цагаан) + Хэмжээ (M, L, XL) гэсэн 2 ба түүнээс дээш сонголттой үед ашиглана:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-1 text-slate-600 text-xs">
            <li><strong>Хослолууд:</strong> Систем бүх боломжит матрицыг (Хар-M, Хар-L, Цагаан-M...) автоматаар гаргана.</li>
            <li><strong>`✕` (Хасах товч):</strong> Хэрэв "Цагаан XL" байхгүй бол тухайн мөрийн улаан <code>✕</code> товч дарж матрицын тооцооноос хасна.</li>
            <li><strong>Бүгдэд ижил тоо бөглөх (Bulk fill):</strong> Дээд талд "10" гэж бичээд "Бүгдэд бөглөх" дармагц бүх хослол 10ш болж цаг хэмнэнэ.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
            📸 Сонголт бүрт Зураг оноох (Зураг солигдох систем)
          </h3>
          <p>
            Сонголт бүрийн ард байрлах <strong>Камерын дүрс бүхий 28x28 товч</strong> дээр дарж тухайн өнгө/төрлийн зургийг байршуулна.
          </p>

          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
            <span className="font-bold text-indigo-400">Хэрэглэгчийн дэлгэц дээр хэрхэн харагдах вэ?</span>
            <ul className="space-y-1.5 text-slate-300">
              <li>• Хэрэглэгч "Шар" өнгийн товч дээр дармагц үндсэн галерей дээр Шар барааны зураг зөөлөн хөдөлгөөнтэйгээр (cross-fade) тодорч солигдоно.</li>
              <li>• Сонголтын товчлуур дээр тухайн өнгийн 24x24 хэмжээтэй thumbnail зураг харагдана.</li>
              <li>• Сагс руу хийхэд сонгосон хувилбарын зураг хамт хадгалагдаж захиалгад орно.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">4</span>
            Sharp WebP Автомат Шахалт
          </h3>
          <p className="text-xs text-slate-600">
            Та утсаараа авсан 5-10MB өндөр нягтралтай зургийг шууд оруулж болно. Сервер дээр <strong>Sharp</strong> сан автоматаар зургийн хэмжээг 1600px дээд хязгаарт барьж, <strong>WebP (quality 82)</strong> формат руу шахан <strong>~80-150KB</strong> болгож хадгалдаг тул дэлгүүрийн хуудас утсан дээр секундын дотор нээгдэнэ.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 4. Merge Tool Content (NEW)
// =============================================================================
function MergeToolContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 04 · Шинэ хэрэгсэл
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Layers className="w-5 h-5 text-indigo-600" /> Салангид Бараануудыг Нэгтгэх Хэрэгсэл (Merge Tool)
        </CardTitle>
        <CardDescription>
          Өмнө нь тус тусад нь өөр өөр дугаартай оруулсан бараануудыг сонголттой 1 бараа болгож цэгцлэх заавар
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-2">
          <h3 className="font-bold text-base text-slate-900">Ямар үед ашиглах вэ?</h3>
          <p className="text-slate-600 text-xs">
            Жишээ нь өмнө нь <i>"Calvin Klein Cotton M"</i>, <i>"Calvin Klein Cotton L"</i>, <i>"Calvin Klein Cotton XL"</i> гэж 3 тусдаа бараа оруулчихсан байсныг нэг барааны хэмжээний сонголт болгон нэгтгэхэд ашиглана.
          </p>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Алхамчилсан дараалал:</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">1.</span>
              <span><strong>/admin/products</strong> хүснэгт рүү орж, нэгтгэх 2 ба түүнээс дээш бараануудын урд талын Checkbox-ийг чагтална.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">2.</span>
              <span>Дээд талд гарч ирэх цэнхэр <strong>`🪄 Бараануудыг нэгтгэх`</strong> товчийг дарна.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">3.</span>
              <span><strong>Нэгдсэн нэр:</strong> Систем нэрний төгсгөлийн размерын үсгийг цэвэрлэж <i>"Calvin Klein Cotton"</i> гэж санал болгоно. Хүсвэл өөрөө засаж болно.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">4.</span>
              <span><strong>Үндсэн багц:</strong> Дэлгүүрийн нүүрэнд идэвхтэй зарах 1 багцаа сонгоно.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">5.</span>
              <span><strong>Сонголтын төрөл:</strong> <code>Хэмжээ</code> эсвэл <code>Өнгө</code> гэж бичнэ. Утгууд (M, L) болон үлдэгдлийг шалгана.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border">
              <span className="font-bold text-indigo-600 font-mono">6.</span>
              <span><strong>Архивлах:</strong> <code>✨ Шинэ: "📦 Нэгтгэсэн хуучин багцууд (Архив)" үүсгэж тийш зөөх</code> сонголтыг сонгоод "Бараануудыг нэгтгэх" дарна.</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Дата ба хуучин захиалгын аюулгүй байдал:
          </div>
          <p className="text-xs text-emerald-800">
            Систем <strong>НЭГ Ч БАРАА, ЗАХИАЛГЫГ УСТГАХГҮЙ</strong> (`DELETE` хийгдэхгүй). Хуучин багцуудын "Борлуулах"-ыг дэлгүүрээс нууж, архив ангилалд шилжүүлдэг тул өмнөх худалдан авалтын түүх, санхүүгийн тооцоо, карго дугаарууд 100% найдвартай бүрэн бүтэн үлдэнэ.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 5. Categories Content (NEW)
// =============================================================================
function CategoriesContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 05 · Шинэчилсэн
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <FolderTree className="w-5 h-5 text-indigo-600" /> Ангилал Удирдах & Бараа Зөөх
        </CardTitle>
        <CardDescription>
          Сарын ангилал нээх, хүргэлтийн үнэ тохируулах, барааг ангилал хооронд шилжүүлэх
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Ангилал (Category) гэж юу вэ?</h3>
          <p>
            Манай сайтад бараанууд нь сар сараар эсвэл төрлөөр ангилагдан харагддаг (Ж нь: <i>"2026.10 сар"</i>, <i>"1001 Урьдчилсан захиалга"</i>). Ангилал бүрт "Хүргэлтийн хураамж" (Delivery fee)-ийг зааж өгөх боломжтой.
          </p>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">★</span>
            Барааг өөр ангилал руу зөөх (Шинэ функц)
          </h3>
          <p className="text-xs text-slate-600">
            Хэрэв бараа буруу ангилалд орсон эсвэл дараа сарын захиалга руу шилжүүлэх шаардлагатай бол:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 ml-1 text-xs text-slate-700">
            <li>Барааны жагсаалтаас тухайн барааны мөрөнд байрлах <strong>Харандаа (Edit)</strong> товч дээр дарна.</li>
            <li><strong>"Ангилал (Категори)"</strong> гэсэн drop-down цэснээс шилжүүлэхийг хүссэн шинэ ангиллаа сонгоно.</li>
            <li><strong>"Өөрчлөлтийг хадгалах"</strong> дармагц тухайн бараа болон түүний багц шинэ ангилал руугаа шууд шилжинэ.</li>
          </ol>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Ангилал архивлах</h3>
          <p className="text-xs text-slate-600">
            Борлуулалт нь бүрэн дуусч, хүргэлт нь хаагдсан хуучин саруудыг "Архивлах" товч дарж далд хийнэ. Архивлагдсан ангиллыг "Архив" цэснээс хэзээд буцаан харж болно.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 6. Orders & Payment Content
// =============================================================================
function OrdersPaymentContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 06
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Activity className="w-5 h-5 text-indigo-600" /> Захиалга & Төлбөрийн Механизм
        </CardTitle>
        <CardDescription>
          QPay автомат баталгаажуулалт, автомат цуцлалт (Cron), гараар баталгаажуулах
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase">QPay Автомат Төлөлт</span>
            <p className="text-xs text-slate-700">
              Хэрэглэгч QR уншуулж төлбөрөө хиймэгц систем автоматаар <strong>"Захиалга баталгаажсан /Вэбээр/"</strong> болгож, И-баримт үүсгэн, үлдэгдлийг хасаж, админы дэлгэц болон Telegram руу дуут мэдэгдэл илгээнэ. Гар ажиллагаа шаардлагагүй.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <span className="text-xs font-bold text-amber-700 uppercase">Дансаар Шилжүүлсэн Төлөлт</span>
            <p className="text-xs text-slate-700">
              Хэрэглэгч данс руу гараар шилжүүлсэн үед захиалга <strong>"Хүлээгдэж буй"</strong> төлөвт орно. Админ банкны хуулгаа тулган шалгаж, ногоон "Баталгаажуулах" товч дарж баталгаажуулна.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">⏱️</span>
            Автомат Цуцлалт (Auto-Cancel Cron)
          </h3>
          <p className="text-xs text-slate-600">
            Хэрэглэгч захиалга үүсгээд <strong>20 минутын дотор</strong> төлбөрөө хийгээгүй тохиолдолд систем уг захиалгыг автоматаар цуцалж, хадгалсан нөөц (stock)-ийг дэлгүүрийн үлдэгдэл рүү буцаан нэмдэг. Энэ нь үлдэгдэл зохиомлоор гацахаас сэргийлдэг найдвартай хамгаалалт юм.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 7. Cargo & Delivery Content
// =============================================================================
function CargoDeliveryContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 07
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Truck className="w-5 h-5 text-indigo-600" /> Карго Төлөвүүд & Түгээлтийн Удирдлага
        </CardTitle>
        <CardDescription>
          Каргоны шат дамжлагууд, захиалгын статус олноор шилжүүлэх, хүргэлтийн хуудас
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Карго төлөвийн шат дамжлага</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold border">1. Шинэ захиалга</span>
            <span className="text-slate-400">➡️</span>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">2. Солонгосын каргод очсон</span>
            <span className="text-slate-400">➡️</span>
            <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">3. Монгол руу ачигдсан</span>
            <span className="text-slate-400">➡️</span>
            <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-semibold border border-purple-200">4. Улаанбаатарт ирсэн</span>
            <span className="text-slate-400">➡️</span>
            <span className="px-2.5 py-1 rounded bg-green-100 text-green-800 font-semibold border border-green-200">5. Хүргэгдсэн</span>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Олноор (Group) карго төлөв солих</h3>
          <p className="text-xs text-slate-600">
            Багц дотор 100 хүнд нэг бүрчлэн төлөв солих шаардлагагүй:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
            <li>Багцын хуудас руу орж, хүснэгтийн зүүн дээд талын <strong>"Бүгдийг сонгох"</strong> нүдийг чагтална.</li>
            <li>Дээд талын удирдлагын цэснээс шинэ статусаа (Ж нь: <i>Улаанбаатарт ирсэн</i>) сонгоно.</li>
            <li><strong>"Шилжүүлэх"</strong> товч дармагц бүх сонгосон захиалгууд нэгэн зэрэг шинэ төлөвт орно.</li>
            <li>Хэрэглэгч өөрийн утсаараа дэлгүүрийн сайт дээрээс шалгахад шинэ төлөв шууд харагдана.</li>
          </ol>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Хүргэлтийн Захиалга & Түгээлт</h3>
          <p className="text-xs text-slate-600">
            Хүргэлтийн хураамж төлсөн бүх захиалгууд <strong>Захиалгууд ➡️ Хүргэлт</strong> цэсэнд автоматаар цуглана. Эндээс хаяг, утсыг шүүн жолоочийн гар дээр өгөх бөгөөд жолооч хүргэж өгсний дараа "Хүргэгдсэн" товч дарж захиалгыг хаана.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 8. Search & Customer Profile Content
// =============================================================================
function SearchProfileContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 08
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Search className="w-5 h-5 text-indigo-600" /> Лавлагаа Хайлт & Хэрэглэгчийн Хувийн Карт
        </CardTitle>
        <CardDescription>
          Утас, дансны дугаар, гүйлгээний утгаар хэдхэн секундэд захиалга олох болон хэрэглэгчийн түүх харах
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Хайлт хийх боломжтой талбарууд (/admin/orders/search)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border text-center font-medium">Утасны дугаар</div>
            <div className="p-3 bg-slate-50 rounded-lg border text-center font-medium">Дансны дугаар</div>
            <div className="p-3 bg-slate-50 rounded-lg border text-center font-medium">Үйлчлүүлэгчийн нэр</div>
            <div className="p-3 bg-slate-50 rounded-lg border text-center font-medium">Захиалгын дугаар (#)</div>
          </div>
          <p className="text-xs text-slate-500">
            Хэрэглэгч утсаар ярихад дурын нэг мэдээллийг нь хайхад тухайн хүний бүх захиалга ил гарна.
          </p>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Хэрэглэгчийн Хувийн Карт (Customer Profile Modal)</h3>
          <p className="text-xs text-slate-600">
            Захиалгын жагсаалт дээр хэрэглэгчийн утасны хажууд байх дүрс дээр дарахад уг үйлчлүүлэгчийн:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 ml-1">
            <li>Нийт хичнээн бараа худалдан авсан тоо</li>
            <li>Дэлгүүрт нийт зарцуулсан мөнгөн дүн</li>
            <li>Өмнөх болон идэвхтэй байгаа бүх захиалгуудын жагсаалт нэг дор цэвэрхэн харагдана.</li>
          </ul>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 9. Excel Content
// =============================================================================
function ExcelContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 09
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Excel Экспорт & Импорт
        </CardTitle>
        <CardDescription>
          Захиалгын жагсаалтыг Excel-ээр татах болон гаднаас бөөнөөр бүртгэх
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Excel Экспорт (Татах)</h3>
          <p className="text-xs text-slate-600">
            Багц бүрийн дээд талд байрлах <strong>"Excel татах"</strong> товчийг дарахад тухайн багцын бүх баталгаажсан захиалгууд (Нэр, Утас, Данс, Тоо, Карго үнэ, Хаяг, Статус) бүхий Excel файл шууд татагдана. Гааль болон хүргэлтийн жолоочид өгөхөд бэлэн форматтай.
          </p>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Excel Импорт (Бөөнөөр бүртгэх)</h3>
          <ol className="list-decimal list-inside space-y-1.5 ml-1 text-xs text-slate-700">
            <li><strong>Өгөгдлийн төв ➡️ Захиалга импортлох</strong> хуудас руу орно.</li>
            <li>Загвар Excel файлыг татаж авна.</li>
            <li>Загварын дагуу Нэр, Утас, Тоо ширхэгийг хуулж бөглөнө.</li>
            <li>Оруулах багцаа сонгоод файлаа байршуулахад систем алдаагүй шалган хэдэн зуун захиалгыг секундын дотор системд оруулна.</li>
          </ol>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// 10. Settings & Telegram Content (NEW)
// =============================================================================
function SettingsTelegramContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Бүлэг 10 · Шинэ боломж
        </div>
        <CardTitle className="text-xl flex items-center gap-2 font-extrabold text-slate-900">
          <Bot className="w-5 h-5 text-indigo-600" /> Системийн Тохиргоо & Telegram Bot Холболт
        </CardTitle>
        <CardDescription>
          Дансны дугаар, хүргэлтийн төлбөр тохируулах болон Telegram-аар шуурхай мэдэгдэл авах заавар
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 text-sm leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Тохиргооны цэсүүд</h3>
          <ul className="list-disc list-inside space-y-1.5 ml-1 text-xs text-slate-600">
            <li><strong>Ерөнхий тохиргоо:</strong> Дэлгүүрийн холбогдох утас, хаяг, лого солих.</li>
            <li><strong>Төлбөрийн тохиргоо:</strong> Хүлээн авагч банк, дансны дугаар, хүргэлтийн суурь үнэ.</li>
            <li><strong>Нөхцөлийн тохиргоо:</strong> Үйлчилгээний нөхцөл болон бараа буцаах журам.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">🤖</span>
            Telegram Bot Мэдэгдэл Тохируулах
          </h3>
          <p className="text-xs text-slate-600">
            Системд шинэ захиалга орж ирэх, төлбөр баталгаажих, хүргэлтийн хүсэлт ирэх үед админы утсанд Telegram-аар шууд мэдэгдэл очих тохиргоо:
          </p>

          <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-indigo-400">Тохируулах алхам:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Telegram дээр <code>@BotFather</code> хаяг руу <code>/newbot</code> илгээж өөрийн ботыг үүсгээд <strong>API Token</strong> авна.</li>
              <li>Ботыг админуудын групптээ нэмээд уг чатны <strong>Chat ID</strong>-г авна.</li>
              <li>Серверийн <code>.env</code> файлд тохируулна:</li>
            </ol>
            <pre className="bg-black/50 p-2.5 rounded font-mono text-[11px] text-green-400">
              TELEGRAM_BOT_TOKEN="таны_бот_токен"<br/>
              TELEGRAM_CHAT_ID="таны_чат_эсвэл_групп_id"
            </pre>
            <p className="text-[11px] text-slate-400">
              * Тохируулмагц бүх шинэ захиалга дэлгэрэнгүй барааны жагсаалттайгаа таны утсанд секундын дотор ирнэ.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-bold text-base text-slate-900">Түгээмэл асуулт & Алдаа шийдвэрлэх</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="font-bold text-slate-800">Асуулт: Хэрэглэгч төлсөн гэх боловч захиалга нь хүлээгдэж байна?</p>
              <p className="text-slate-600 mt-1">
                Хариулт: Хэрэглэгч QPay биш хувийн данс руу гараар шилжүүлсэн байна. Банкны хуулгаа тулгаад "Хүлээгдэж буй" цэснээс ногоон товчоор баталгаажуулна.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border">
              <p className="font-bold text-slate-800">Асуулт: Бараа дэлгүүрийн нүүрэн дээр гарахгүй байна?</p>
              <p className="text-slate-600 mt-1">
                Хариулт: Барааны баруун талын "Борлуулах" свич унтарсан, эсвэл үлдэгдэл тоо 0 болсон, эсвэл харьяалагдах ангилал нь архивлагдсан эсэхийг шалгана уу.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}
