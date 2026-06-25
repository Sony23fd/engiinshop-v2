import { ReactNode } from "react"
import { MapPin, Clock, Truck, ShieldCheck, Mail, Phone, Instagram, Facebook, Search } from "lucide-react"
import { CartProvider } from "@/context/CartContext"
import { CartIcon } from "@/components/storefront/CartIcon"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"

import { AnimatedHeroBackground } from "@/components/storefront/home/AnimatedHeroBackground"
import { VisitorTracker } from "@/components/storefront/VisitorTracker"
import { MobileBottomNav } from "@/components/storefront/layout/MobileBottomNav"
import { ScrollHeaderManager } from "@/components/storefront/layout/ScrollHeaderManager"
import { SocialProofToast } from "@/components/storefront/SocialProofToast"
import { ChatbotWidget } from "@/components/storefront/ChatbotWidget"

export const dynamic = "force-dynamic"

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  let siteLogo = null;
  let isMaintenanceMode = false;
  let faqs = [];

  try {
    const settings = await db.shopSettings.findMany({
      where: { key: { in: ["site_logo", "maintenance_mode", "faq_data"] } }
    });

    siteLogo = settings.find(s => s.key === "site_logo")?.value;
    isMaintenanceMode = settings.find(s => s.key === "maintenance_mode")?.value === "true";
    const faqDataStr = settings.find(s => s.key === "faq_data")?.value;
    if (faqDataStr) {
      faqs = JSON.parse(faqDataStr);
    }
  } catch (error) {
    console.error("Failed to load settings in layout:", error)
  }

  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-indigo-100/50">
          <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <span className="text-4xl text-indigo-500 font-black">🛠️</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Түр засвартай байна</h1>
          <p className="text-slate-600 mb-8 text-sm md:text-base leading-relaxed">
            Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе. Манай сайт дээр одоогоор өгөгдлийн шинэчлэл хийгдэж байгаа тул түр хугацаанд хаагдлаа. Та хэсэг хугацааны дараа дахин хандана уу. Баярлалаа!
          </p>
          <div className="flex justify-center gap-3">
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#4e3dc7] hover:bg-[#4e3dc7] hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </div>
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#4e3dc7] hover:bg-[#4e3dc7] hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </div>
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-8">Anar Korea Shop © {new Date().getFullYear()}</p>
        </div>
      </div>
    )
  }

  return (
    <CartProvider>
      {/* Navigation / Top Header */}
      <ScrollHeaderManager />
      <header id="storefront-header" className="sticky top-0 z-40 border-b border-indigo-800/50 shadow-md relative overflow-hidden transition-transform duration-300">

        {/* Animated Background */}
        <AnimatedHeroBackground bgColor="#3c27c4" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            {siteLogo ? (
              <div className="relative flex items-center h-10 md:h-12 bg-white/95 backdrop-blur-md rounded-xl md:rounded-2xl px-2.5 py-1.5 shadow-sm border border-white/20 transition-all group-hover:bg-white">
                <img
                  src={siteLogo}
                  alt="AnarKorea Logo"
                  className="object-contain h-full w-auto drop-shadow-sm max-w-[140px] md:max-w-[180px]"
                />
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-sm border border-white/10 group-hover:bg-white/30 transition-colors">
                  A
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Anar<span className="text-indigo-300">Korea</span>
                </span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <Link 
              href="/track" 
              className="hidden md:flex bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm backdrop-blur-sm items-center gap-2 group-hover:bg-white/10"
            >
              <Search className="w-4 h-4" />
              Захиалга шалгах
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-[60vh] pb-10">
        {children}
      </main>

      {/* Global FAB Cart Icon */}
      <div className="hidden md:block">
        <CartIcon />
      </div>

      <MobileBottomNav />

      {/* Global Analytics & Social Proof */}
      <VisitorTracker />
      <SocialProofToast />
      <ChatbotWidget faqs={faqs} />

      {/* Modern Premium Footer */}
      <footer className="bg-[#1c1642] text-slate-300 pt-16 pb-24 md:pb-8 px-4 md:px-8 lg:px-16 mt-auto">
        <div className="max-w-6xl mx-auto">
          {/* Top border decor */}
          <div className="h-1 w-20 bg-gradient-to-r from-[#4e3dc7] to-indigo-400 rounded-full mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                {siteLogo ? (
                  <div className="relative flex items-center h-10">
                    <img
                      src={siteLogo}
                      alt="AnarKorea Logo"
                      className="object-contain h-full w-auto max-w-[200px]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-md bg-[#4e3dc7] flex items-center justify-center text-white font-bold text-xs">
                      A
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">AnarKorea</span>
                  </>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Солонгос улсаас чанарын баталгаат бараа бүтээгдэхүүнийг хамгийн хурднаар, найдвартай захиалж аваарай.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="https://www.instagram.com/anar_korea_shop" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white hover:scale-110 shadow-sm transition-transform" title="Instagram">
                  <Instagram className="w-5 h-5 drop-shadow-sm" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=100086582256535" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center text-white hover:scale-110 shadow-sm transition-transform" title="Facebook">
                  <Facebook className="w-5 h-5 fill-white drop-shadow-sm" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Холбоо барих</h3>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">БЗД, 26-р хороо Саруул хороолол<br />122-р байр, Үйлчилгээний хэсгийн 3 давхарт</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                <p>+976 8853 9667</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <p>info@anarkorea.mn</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Цагийн хуваарь</h3>
              <ul className="text-sm space-y-3">
                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Даваа - Бямба</span>
                  <span className="text-indigo-400 font-medium">10:00 - 19:00</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Ням</span>
                  <span className="text-rose-400 font-medium tracking-wide">Амарна</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Баталгаа</h3>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-8 h-8 text-green-400 shrink-0" />
                <div>
                  <h4 className="text-slate-200 font-medium text-sm mb-1">Найдвартай хүргэлт</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Захиалгын төлбөр баталгаажсанаас хойш шууд ачигдах бөгөөд албан ёсны каргогоор танд хүрнэ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 w-full">
            <div className="md:w-1/3 text-center md:text-left">
              <p>© {new Date().getFullYear()} <strong className="text-white font-medium">Anar Korea Shop</strong>.</p>
            </div>
            <div className="md:w-1/3 text-center">
              <p>Хөгжүүлсэн: <a href="https://www.facebook.com/engiineeer" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline underline-offset-4">Engiineer</a></p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end gap-6">
              <a href="#" className="hover:text-white transition-colors">Үйлчилгээний нөхцөл</a>
              <a href="#" className="hover:text-white transition-colors">Нууцлалын бодлого</a>
            </div>
          </div>
        </div>
      </footer>
    </CartProvider>
  )
}
