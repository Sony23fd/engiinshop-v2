import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "DATAADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Fetch all necessary data
    const categories = await db.category.findMany()
    const products = await db.product.findMany()
    const batches = await db.batch.findMany()
    const orders = await db.order.findMany()
    const users = await db.user.findMany()
    const shopSettings = await db.shopSettings.findMany()
    const orderStatusTypes = await db.orderStatusType.findMany()
    const activityLogs = await (db as any).activityLog?.findMany().catch(() => [])

    const backupData = {
      timestamp: new Date().toISOString(),
      metadata: {
        version: "1.0.0",
        triggeredBy: admin.email
      },
      data: {
        categories,
        products,
        batches,
        orders,
        users,
        shopSettings,
        orderStatusTypes,
        activityLogs,
      }
    }

    // Log action
    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Өгөгдөл татаж авав (Backup)",
      target: "Database",
      detail: `Бүтэн өгөгдлийн санг JSON хэлбэрээр татлаа`,
    })

    const filename = `anar-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
