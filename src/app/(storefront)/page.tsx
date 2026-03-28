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
      
      {/* 
        This is where the user's active, open batches will be shown.
        Since we don't have categories or 'ready stock' flags in this iteration per user request, 
        we'll just showcase what's returned as open batches.
      */}
      <ActiveBatchesList batches={success && products ? products : []} />
      
      <HowItWorks />
      
      <LiveTicker />
    </div>
  )
}

