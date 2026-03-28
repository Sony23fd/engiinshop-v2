import { ReactNode } from "react"
import { MapPin, Clock, Truck, ShieldCheck, Mail, Phone, Instagram, Facebook } from "lucide-react"
import { CartProvider } from "@/context/CartContext"
import { CartIcon } from "@/components/storefront/CartIcon"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"

import { AnimatedHeroBackground } from "@/components/storefront/home/AnimatedHeroBackground"

export const dynamic = "force-dynamic"

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  let siteLogo = null;
  try {
    const logoSetting = await db.shopSettings.findUnique({ where: { key: "site_logo" } })
    siteLogo = logoSetting?.value
  } catch (error) {
    console.error("Failed to load site logo:", error)
  }
  return (
    <CartProvider>
      {/* Navigation / Top Header */}
      <header className="sticky top-0 z-40 border-b border-indigo-800/50 shadow-md relative overflow-hidden">
        
        {/* Animated Background */}
        <AnimatedHeroBackground bgColor="#3c27c4" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            {siteLogo ? (
              <div className="relative h-10 w-auto min-w-[120px] flex items-center">
                <Image 
                  src={siteLogo} 
                  alt="AnarKorea Logo" 
                  width={150} 
                  height={40} 
                  className="object-contain max-h-12 w-auto drop-shadow-sm"
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
          
          <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
            <form action="/track" className="flex relative group w-full md:w-auto shadow-lg hover:shadow-xl transition-shadow rounded-full font-sans">
              <input
                type="text"
                name="account"
                required
                placeholder="Захиалгаа шалгах (данс: 500..)"
                className="w-full md:w-80 lg:w-96 bg-white border-2 border-transparent text-slate-800 px-6 py-3.5 rounded-full focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-300/30 transition-all placeholder:text-slate-400 font-medium"
              />
              <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-indigo-600 to-[#3c27c4] text-white px-7 rounded-full text-sm font-bold hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all">
                Шалгах
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-[60vh] pb-10">
        {children}
      </main>

      {/* Global FAB Cart Icon */}
      <CartIcon />

      {/* Modern Premium Footer */}
      <footer className="bg-[#1c1642] text-slate-300 pt-16 pb-8 px-4 md:px-8 lg:px-16 mt-auto">
        <div className="max-w-6xl mx-auto">
          {/* Top border decor */}
          <div className="h-1 w-20 bg-gradient-to-r from-[#4e3dc7] to-indigo-400 rounded-full mb-12"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                {siteLogo ? (
                  <div className="relative h-8 w-auto min-w-[100px] flex items-center opacity-90 group-hover:opacity-100 transition-opacity brightness-0 invert">
                    <Image 
                      src={siteLogo} 
                      alt="AnarKorea Logo" 
                      width={120} 
                      height={32} 
                      className="object-contain max-h-8 w-auto"
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
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#4e3dc7] hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#4e3dc7] hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Холбоо барих</h3>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">БЗД, 26-р хороо Саруул хороолол<br/>122-р байр 3 давхарт</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                <p>+976 8853 9887</p>
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
                  <span className="text-slate-400">Мягмар - Бямба</span>
                  <span className="text-indigo-400 font-medium">11:00 - 19:00</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Даваа & Ням</span>
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
