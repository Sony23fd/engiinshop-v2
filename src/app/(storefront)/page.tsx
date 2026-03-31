import { getActiveProducts } from "@/app/actions/product-actions"
import { HeroSection } from "@/components/storefront/home/HeroSection"
import { HowItWorks } from "@/components/storefront/home/HowItWorks"
import { ActiveBatchesList } from "@/components/storefront/home/ActiveBatchesList"
import { LiveTicker } from "@/components/storefront/home/LiveTicker"

export const dynamic = "force-dynamic"

export default async function StorefrontHomePage() {
  const { products, success } = await getActiveProducts()

  return (
    <div className="bg-white min-h-screen">
      <HeroSection />
      {/* Active Ready Stock */}
      <ActiveBatchesList 
        batches={success && products ? products.filter((p: any) => !p.isPreOrder) : []} 
        title="Монголд бэлэн байгаа"
        subtitle="Яг одоо бэлэн байгаа барааг шууд авах боломжтой"
        badge="Онцлох бараа"
        theme="ready"
      />
      
      {/* Pre-Orders */}
      <ActiveBatchesList 
        batches={success && products ? products.filter((p: any) => p.isPreOrder) : []} 
        title="Урьдчилсан захиалга"
        subtitle="Урьдчилж захиалаад илүү хямдаар аваарай"
        badge="Тун удахгүй ирэх"
        theme="preorder"
      />
      
      <HowItWorks />
      
      <LiveTicker />
    </div>
  )
}

