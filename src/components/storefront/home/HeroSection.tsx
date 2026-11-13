import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { AnimatedHeroBackground } from "./AnimatedHeroBackground";
import { HeroCarousel } from "./HeroCarousel";
import { getShopSettings } from "@/app/actions/settings-actions";

export async function HeroSection() {
  const settings = await getShopSettings();

  const showText = settings.hero_text_visible !== "false";
  const bgColor = settings.hero_bg_color || "#5442cc";
  let carouselImages: string[] = [];

  if (settings.hero_carousel_images) {
    try {
      carouselImages = JSON.parse(settings.hero_carousel_images);
    } catch (e) {
      console.error("Failed to parse carousel images", e);
    }
  }

  const badgeText = settings.hero_badge_text || "Шууд захиалах боломжтой";
  const titleText = settings.hero_title || "Солонгосоос шууд таны гарт хүргэнэ";
  const subtitleText = settings.hero_subtitle || "Чанарын баталгаат, трэнд болж буй гоо сайхан, хувцас, ахуйн хэрэглээний барааг Солонгосоос хамгийн хурднаар, найдвартай захиалж аваарай.";

  return (
    <div className="relative overflow-hidden min-h-[550px] flex items-center justify-center">
      <AnimatedHeroBackground bgColor={bgColor} />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center gap-10">
        
        {/* Optional Text Content */}
        {showText && (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-14 lg:p-16 shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative overflow-hidden w-full max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-sm backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-200">{badgeText}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl relative z-10 whitespace-pre-line">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-100">
                {titleText}
              </span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-indigo-100/90 max-w-2xl leading-relaxed relative z-10">
              {subtitleText}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                href="/shop"
                className="px-6 py-3 rounded-2xl bg-white text-indigo-700 font-extrabold text-sm shadow-xl hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Дэлгүүр үзэх</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/track"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all"
              >
                Захиалга шалгах
              </Link>
            </div>
          </div>
        )}

        {/* Carousel Content */}
        {carouselImages.length > 0 && (
          <div className="w-full flex justify-center">
            <HeroCarousel images={carouselImages} />
          </div>
        )}

      </div>
    </div>
  )
}
