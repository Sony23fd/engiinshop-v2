"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Box, Activity, Truck, Settings, Users, KeyRound, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GUIDE_MODULES = [
  {
    id: "general",
    title: "Ерөнхий заавар & Нэвтрэх",
    icon: KeyRound,
    desc: "Системийн тухай болон админ эрхийн ялгааны тухай.",
  },
  {
    id: "products",
    title: "Бараа & Ангилал удирдах",
    icon: Box,
    desc: "Хэрхэн шинээр бараа нэмэх, ангилал үүсгэх, архивлах тухай.",
  },
  {
    id: "orders",
    title: "Захиалга удирдах (Чухал)",
    icon: Activity,
    desc: "Сайтаас орж ирсэн болон гараар бүртгэсэн захиалгын мэдээлэл.",
  },
  {
    id: "delivery",
    title: "Хүргэлт & Өөрөө авах",
    icon: Truck,
    desc: "Хүргэлтийн хаяг шалгах, QPay төлбөр, каргонд шилжүүлэх.",
  },
  {
    id: "settings",
    title: "Тохиргоо & QPay",
    icon: Settings,
    desc: "Сайтын утас, дансны мэдээлэл, үйлчилгээний нөхцөл солих.",
  },
];

export default function AdminGuidePage() {
  const [activeModule, setActiveModule] = useState(GUIDE_MODULES[0].id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-[#4e3dc7] text-white p-2.5 rounded-lg shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Админ Гарын Авлага</h1>
          <p className="text-slate-500 text-sm mt-1">
            Шинэ админуудад зориулсан сайтын хэрэглээний гарын авлага.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="col-span-1 border rounded-lg bg-white p-2 shadow-sm flex flex-col gap-1">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Гарын авлагын бүлгүүд
          </div>
          {GUIDE_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={cn(
                "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                activeModule === mod.id
                  ? "bg-indigo-50 text-[#4e3dc7]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <mod.icon className={cn("w-5 h-5", activeModule === mod.id ? "text-[#4e3dc7]" : "text-slate-400")} />
              {mod.title}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3">
          <Card className="shadow-sm border-slate-200 min-h-[500px]">
            {activeModule === "general" && <GeneralContent />}
            {activeModule === "products" && <ProductsContent />}
            {activeModule === "orders" && <OrdersContent />}
            {activeModule === "delivery" && <DeliveryContent />}
            {activeModule === "settings" && <SettingsContent />}
          </Card>
        </div>
      </div>
    </div>
  );
}

// 1. General Info
function GeneralContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
          <KeyRound className="w-5 h-5 text-[#4e3dc7]" /> 1. Ерөнхий заавар & Нэвтрэх
        </CardTitle>
        <CardDescription>
          Системд хэрхэн нэвтрэх болон админ эрхийн тухай ойлголт
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Админ эрхийн ялгаа</h3>
          <p>
            AnarKoreaShop-д одоогоор хоёр төрлийн админ хэрэглэгч ажиллаж байна.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Үндсэн Админ (ADMIN):</strong> Бүх эрхтэй. Бараа үүсгэх, ангилал засах, тохиргоо өөрчлөх, хэрэглэгч нэмэх бүрэн боломжтой.</li>
            <li><strong>Карго Админ (CARGO_ADMIN):</strong> Зөвхөн захиалга ба хүргэлттэй холбоотойг харна. Бараа шинээр нэмэх, үнэ солих, тохиргоо руу орох боломжгүй бөгөөд зөвхөн хуваарилагдсан захиалгуудаа шалгана.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Нууц үг болон Хэрэглэгчид удирдах</h3>
          <p>
             Хэрвээ шинэ хүн ажилд авч түүнд админ эрх өгөх бол Үндсэн Админ нь <strong>СИСТЕМ & ТОХИРГОО → Хэрэглэгчид</strong> хэсэг рүү орж шинээр хэрэглэгчийн мэйл болон нууц үг үүсгээд, эрхийн түвшинг (Карго эсвэл Үндсэн) зааж өгөх боломжтой. Тухайн админ мөн нууц үгээ мартвал энэ хэсгээс засч (Edit) өөрчилж болно.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// 2. Products
function ProductsContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
          <Box className="w-5 h-5 text-[#4e3dc7]" /> 2. Бараа & Ангилал удирдах
        </CardTitle>
        <CardDescription>
          Барааны мэдээлэл болон ангилал нэмж олон нийтэд харуулах
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Ангилал (Category)</h3>
          <p>
            Та сайтад бараа тавихаас өмнө түүнийг агуулах <strong>Ангилал</strong>-ыг заавал үүсгэх хэрэгтэй. (Жишээ нь: "Улирлын багц", "Хоол хүнс"). 
            Ангиллын жагсаалтад оруулсан зураг нь нүүр хуудсанд гарна. 
            Ангиллыг <strong>Архивлах</strong> үед тухайн ангилал болон түүний доторх бараанууд сайт дээр харагдахаа болино.
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Бараа болон Багц (Product & Batch)</h3>
          <p>
            Манай систем Бараа ба Багц гэсэн 2 хэсгээс бүрддэг:
          </p>
          <ul className="list-disc list-inside space-y-3 ml-2">
            <li><strong>Бараа үүсгэх:</strong> Тухайн барааны үндсэн нэр, зураг, жин, тайлбар зэрэг тогтмол мэдээллүүд орно. (Цэс: <i>Барааны жагсаалт</i>)</li>
            <li><strong>Багц (Batch) үүсгэх:</strong> Үүсгэсэн "Бараа"-гаа зарахаар нээж буй үйлдэл. Багц үүсгэхдээ <i>үнийг тогтоох</i> болон <i>Зорилтот ширхэг (Target quantity)</i>-ийг зааж өгдөг. <br/>
            Зорилтот тоо нь 100 байлаа гэж үзэхэд хүмүүс худалдаж авсаар 100 хүрэх үед автоматаар "Материал дууссан" гэж хаагдана.</li>
            <li><strong>Багц хаах:</strong> Зорилтот тоондоо хүрэхээс өмнө зарахаа зогсоох бол багцын мөрөнд байрлах нүд (Hide) эсвэл төлөвийн товчлуур дээр дарж Хаагдана. Ингэснээр хүмүүс нэмж захиалах боломжгүй болно.</li>
          </ul>
        </div>
      </CardContent>
    </>
  );
}

// 3. Orders
function OrdersContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
          <Activity className="w-5 h-5 text-[#4e3dc7]" /> 3. Захиалга удирдах
        </CardTitle>
        <CardDescription>
          Ирсэн захиалгуудыг баталгаажуулах, төлөв солих
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mb-2">
          <strong>Санамж:</strong> Систем дэх бүх захиалга үндсэн 2 чухал статустай. Эхнийх нь "Төлбөрийн төлөв", удаах нь "Карго төлөв" юм.
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Сайтаар орж ирсэн захиалга</h3>
          <p>
            Хэрэглэгч QPay-р уншуулах үед төлбөр <strong>Автоматаар баталгаажин</strong> захиалга бодитоор системд бүртгэгдэнэ. Энэ үед "Шинэ & Хүлээгдэж буй" гэсэн хэсэгт орж ирэх болно.
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Гараар захиалга бүртгэх</h3>
          <p>
            Хэрэв хүн бэлнээр эсвэл дансаар (QPay ашиглалгүйгээр) гүйлгээ хийсэн бол админ үүнийг <strong>Гараар</strong> оруулна.
          </p>
          <ul className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Ангилал & Төрөл</strong> руу орно. Холбогдох багц/барааны дотор талын хуудас руу нэвтэрнэ.</li>
            <li><b>Шинэ захиалга нэмэх (+)</b> товчийг дарж хэрэглэгчийн нэр, утас, хэдэн ширхэг гэдгийг бичиж оруулахад шууд <i>Баталгаажсан</i> төлөвтэй орно.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Төлөв өөрчлөх (Статус солих)</h3>
          <p>
            Багц бүрийн захиалгууд дотор "Солонгосын каргод очсон", "Монголд ирсэн" гэх мэт төлөвүүд бий. 
            Тэдгээрийг та хэд хэдээр нь "чагталж (checkbox)" байгаад нэг дор төлөвийг нь шилжүүлэх боломжтой. Ингэснээр хэрэглэгч өөрийн бүртгэлийн утасны дугаараар захиалгаа шалгах үед <i>"Аан миний бараа одоо Монголд ирчихсэн байна"</i> гэж харах юм.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// 4. Delivery
function DeliveryContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
          <Truck className="w-5 h-5 text-[#4e3dc7]" /> 4. Хүргэлт & Өөрөө авах
        </CardTitle>
        <CardDescription>
          Бараа ирсний дараа түгээлт хийх үйл явц
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Хүргэлт шаардлагатай захиалгууд</h3>
          <p>
            Хэрэглэгч нь захиалгаа хүргүүлж авахыг хүсвэл тусдаа "Хүргэлтийн хураамж"-ийг QPay-ээр эсвэл дансаар төлсөн байна. Хүргүүлэхээр тохируулж, төлбөрөө хийсэн хүмүүсийн мэдээлэл болон хаяг нь <strong>Хүргэлтийн захиалга</strong> хэсэгт гараад ирдэг.
          </p>
          <p>
             Мөн Карго админ тухайн хүргэлтийн хаягуудыг харж ялган хүргэлтэнд гарсны дараа тухайн мөрийг нь чагталж байгаад <strong>"Хүргэгдсэн болгох"</strong> товч дарснаар захиалга "Архив / Түүх" цэсийн "Хүргэгдсэн захиалга" руу шилжинэ.
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Өөрөө ирээд авах нь</h3>
          <p>
            Дэлгүүрт/Цэгт ирээд бараагаа авч буй хэрэглэгчийн утасны дугаарыг эсвэл Дансны дугаарыг нь ашиглан <strong>Хайх</strong> цэсээр олж болно.
          </p>
          <p>
             Олсны дараа тухайн хүний захиалгын мэдээлэл дээр "Өөрөө ирж авсан төлөвт шилжүүлэх" (эсвэл status update) хийхэд захиалга бүрэн дуусгавар болж хаагдана.
          </p>
        </div>
      </CardContent>
    </>
  );
}

// 5. Settings
function SettingsContent() {
  return (
    <>
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
          <Settings className="w-5 h-5 text-[#4e3dc7]" /> 5. Системийн Тохиргоо & QPay
        </CardTitle>
        <CardDescription>
          Дэлгүүрийн харилцах утас, дансны банк засах
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-slate-700 leading-relaxed text-sm">
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900">Ерөнхий тохиргоо</h3>
          <p>
            <strong>СИСТЕМ & ТОХИРГОО → Ерөнхий тохиргоо</strong> цэс рүү ороход Дэлгүүрийн нэр, Холбогдох утас, Мэйл, Хаяг байршил зэрэг сайтын нийтэд харагдах мэдээллүүдийг засах боломжтой.
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Данс болон Төлбөр (QPay)</h3>
          <p>
            <strong>Төлбөрийн тохиргоо</strong> хэсгээс танай байгууллагын Дансны дугаар, Банкны нэр, Хүлээн авагчийн нэрийг зоож өгнө. Энэ нь QPay хийхгүйгээр гараар шилжүүлэх сонголт хийсэн хэрэглэгчид харагдана.
          </p>
          <p>
            Бас "Хүргэлтийн үнэ" болон "QPay төлбөрийн систем идэвхжүүлэх" товчнууд бий. Хэрвээ QPay системд алдаа гарвал та түр унтраах үед хэрэглэгчдэд дансаар шилжүүлэх заавар нь харагддаг системтэй.
          </p>
        </div>
        
         <div className="space-y-3 border-t pt-4">
          <h3 className="font-bold text-base text-slate-900">Нөхцөлийн тохиргоо</h3>
          <p>
            Үйлчлүүлэгч бүрийн уншиж танилцах "Үйлчилгээний нөхцөл" болон "Эргэн төлөлтийн журам"-ыг эндээс монголоор засаж хадгална. Сайтыг анх ашиглаж буй хүн болгон захиалахын өмнө уг нөхцөлүүдийг зөвшөөрсөн байхыг систем шаарддаг.
          </p>
        </div>
      </CardContent>
    </>
  );
}
