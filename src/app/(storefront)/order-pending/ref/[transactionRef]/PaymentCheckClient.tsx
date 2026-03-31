"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { checkOrderPayment } from "@/app/actions/order-actions"
import { useToast } from "@/components/ui/use-toast"

export function PaymentCheckClient({ transactionRef }: { transactionRef: string }) {
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleCheck() {
    setIsChecking(true)
    try {
      const result = await checkOrderPayment(transactionRef)
      if (result.success) {
        if (result.paid) {
          toast({ title: "Төлбөр баталгаажлаа", description: "Таны захиалга амжилттай баталгаажлаа!" })
          router.refresh()
        } else {
          toast({ title: "Төлбөр хүлээгдэж байна", description: "Таны төлбөр хараахан ороогүй байна.", variant: "destructive" })
        }
      } else {
        toast({ title: "Алдаа гарлаа", description: result.error || "Шалгах үед алдаа гарлаа", variant: "destructive" })
      }
    } catch {
      toast({ title: "Алдаа", description: "Сервертэй холбогдож чадсангүй", variant: "destructive" })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <button
      onClick={handleCheck}
      disabled={isChecking}
      className="mt-4 w-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
    >
      <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
      {isChecking ? "Шалгаж байна..." : "Төлбөр шалгах"}
    </button>
  )
}
