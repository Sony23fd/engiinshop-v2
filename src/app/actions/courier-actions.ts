"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getShopSettings } from "./settings-actions"
import { logAdminActivity } from "@/lib/activity-logger"

const COOKIE_NAME = "courier_auth_session"

export async function verifyCourierAccess(pin: string) {
  try {
    const settings = await getShopSettings()
    const validPin = settings.courier_pin_code || "2026"

    if (pin.trim() !== validPin.trim()) {
      return { success: false, error: "Буруу PIN код байна. Дахин оролдоно уу." }
    }

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, "authorized", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function checkCourierAuth(providedPin?: string): Promise<boolean> {
  const settings = await getShopSettings()
  const validPin = settings.courier_pin_code || "2026"

  if (providedPin && providedPin.trim() === validPin.trim()) {
    return true
  }

  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)?.value
  return session === "authorized"
}

export async function getCourierDeliveries(providedPin?: string) {
  try {
    const isAuth = await checkCourierAuth(providedPin)
    if (!isAuth) {
      return { success: false, unauthorized: true }
    }

    const orders = await (db.order as any).findMany({
      where: {
        paymentStatus: "CONFIRMED",
        wantsDelivery: true,
        deliveryAddress: { not: "" },
        status: {
          name: {
            in: [
              "Хүргэлтийн ажилтанд өгсөн",
              "Хүргэлтэд гарсан",
              "Хүргэгдсэн",
              "Хүргэлтээр авсан",
              "Хүргэлтээр гарсан"
            ]
          }
        }
      },
      include: {
        batch: {
          include: { product: true }
        },
        status: true
      },
      orderBy: { updatedAt: "desc" }
    })

    const isDeliveredStatus = (name: string = "") => {
      const lower = name.toLowerCase()
      return lower.includes("хүргэгдсэн") || lower.includes("хүргэлтээр авсан")
    }

    // Split orders into active (in-transit with courier) and finished today
    const activeOrders = orders.filter((o: any) => !isDeliveredStatus(o.status?.name))
    const todayDeliveredOrders = orders.filter((o: any) => {
      if (!isDeliveredStatus(o.status?.name)) return false
      // Only show orders delivered within the last 24 hours to prevent clutter
      const diff = Date.now() - new Date(o.updatedAt).getTime()
      return diff < 24 * 60 * 60 * 1000
    })

    // Group active orders by customerPhone
    const activeGrouped: Record<string, any[]> = {}
    for (const order of activeOrders) {
      const key = order.customerPhone || order.id
      if (!activeGrouped[key]) activeGrouped[key] = []
      activeGrouped[key].push(order)
    }

    // Group delivered orders
    const deliveredGrouped: Record<string, any[]> = {}
    for (const order of todayDeliveredOrders) {
      const key = order.customerPhone || order.id
      if (!deliveredGrouped[key]) deliveredGrouped[key] = []
      deliveredGrouped[key].push(order)
    }

    return {
      success: true,
      activeGroups: Object.values(activeGrouped),
      deliveredGroups: Object.values(deliveredGrouped),
      activeCount: activeOrders.length,
      deliveredCount: todayDeliveredOrders.length
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function courierConfirmDelivered(orderIds: string[], providedPin?: string) {
  try {
    const isAuth = await checkCourierAuth(providedPin)
    if (!isAuth) {
      return { success: false, error: "Хандах эрхгүй эсвэл PIN код хүчингүй." }
    }

    const deliveredStatus = await db.orderStatusType.findFirst({
      where: {
        name: { in: ["Хүргэгдсэн", "Хүргэлтээр гарсан", "Хүргэлтээр авсан"] },
        isFinal: true
      }
    }) || await db.orderStatusType.findFirst({
      where: {
        name: { in: ["Хүргэгдсэн", "Хүргэлтээр гарсан", "Хүргэлтээр авсан"] }
      }
    })

    if (!deliveredStatus) {
      return { success: false, error: "'Хүргэгдсэн' статус олдсонгүй" }
    }

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: {
        statusId: deliveredStatus.id,
        deliveryFeePaid: true // Delivery completed means payment confirmed
      }
    })

    await logAdminActivity({
      action: "ЖОЛООЧ_ХҮРГЭВ",
      type: "ORDER",
      target: `${orderIds.length} захиалга`,
      targetUrl: "/admin/orders/delivered",
      detail: `Хүргэлтийн ажилтан мобайл хуудаснаас ${orderIds.length} ширхэг ачааг хүргэж өгсөнөөр тэмдэглэлээ.`,
      userName: "Хүргэлтийн ажилтан",
      userRole: "COURIER"
    })

    revalidatePath("/courier")
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/delivered")
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function courierReportIssue(orderIds: string[], note: string, providedPin?: string) {
  try {
    const isAuth = await checkCourierAuth(providedPin)
    if (!isAuth) {
      return { success: false, error: "Хандах эрхгүй." }
    }
    if (!note || !note.trim()) {
      return { success: false, error: "Шалтгаанаа бичнэ үү." }
    }

    for (const id of orderIds) {
      const order = await (db.order as any).findUnique({ where: { id }, select: { adminNotes: true } })
      const prev = order?.adminNotes ? `${order.adminNotes}\n` : ""
      const newNote = `${prev}[Жолоочийн тэмдэглэл ${new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}]: ${note.trim()}`
      await (db.order as any).update({
        where: { id },
        data: { adminNotes: newNote }
      })
    }

    revalidatePath("/courier")
    revalidatePath("/admin/orders/delivery")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
