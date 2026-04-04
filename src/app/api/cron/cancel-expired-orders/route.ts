import { NextRequest, NextResponse } from "next/server"
import { autoCancelExpiredOrders } from "@/app/actions/order-actions"

/**
 * АВТОМАТ ЦУЦЛАЛТЫН API (CRON)
 * Энэхүү API нь Ubuntu сервер дээрх crontab-аас дуудагдана.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    
    // Authorization header шалгах
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret) {
      console.error("[CRON] CRON_SECRET is not set in environment variables.")
      return NextResponse.json({ error: "Configuration error (CRON_SECRET missing)" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Unauthorized access attempt detected.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CRON] Automated cancellation triggered via API.")
    const result = await autoCancelExpiredOrders()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[CRON] API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
