"use server"

import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function clearActivityLogs(daysOld: number) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Эрхгүй байна" }
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await (db as any).activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    // Log the action itself
    await (db as any).activityLog.create({
      data: {
        userId: admin.id,
        userName: admin.name || "Admin",
        userRole: admin.role,
        action: "DELETE_LOGS",
        target: `${daysOld} хоногоос өмнөх лог`,
        detail: `Нийт ${result.count} ширхэг хуучин логийг устгаж цэвэрлэлээ.`,
      }
    })

    revalidatePath("/admin/activity")
    return { success: true, count: result.count }
  } catch (error: any) {
    console.error("Failed to clear activity logs:", error)
    return { success: false, error: error.message || "Устгахад алдаа гарлаа" }
  }
}
