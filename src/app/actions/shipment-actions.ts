"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "@/lib/auth"
import { logAdminActivity } from "@/lib/activity-logger"

const DISPATCHED_STATUS_ID = "cmndey7um0004r0s79bya29yt" // Солонгосоос хөдөлсөн
const ARRIVED_STATUS_ID = "cmndey7uu0005r0s76u3csw7v"     // Улаанбаатарт ирсэн

/**
 * Generate a clean human-readable shipment code: SHP-YYYYMMDD-XXX
 */
function generateShipmentCode(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const rand = Math.floor(100 + Math.random() * 900)
  return `SHP-${yyyy}${mm}${dd}-${rand}`
}

export interface CreateShipmentManifestInput {
  name: string
  code?: string
  orderIds: string[]
  notes?: string
  carrierName?: string
  waybillNumber?: string
  boxCount?: number
  totalWeight?: number
  shippingCost?: number
  costCurrency?: string
  receiptImageUrl?: string
}

/**
 * Creates a cargo shipment manifest and sets included orders to "Солонгосоос хөдөлсөн".
 */
export async function createShipmentManifest(data: CreateShipmentManifestInput) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Зөвхөн админ хэрэглэгч ачилт үүсгэх эрхтэй." }
    }

    if (!data.orderIds || data.orderIds.length === 0) {
      return { success: false, error: "Ачилтанд оруулах дор хаяж 1 захиалга сонгоно уу." }
    }

    const trimmedName = (data.name || "").trim()
    if (!trimmedName) {
      return { success: false, error: "Илгээмжийн нэр оруулна уу (Жишээ: 11.18 Сөүл Карго #1)." }
    }

    // Resolve Dispatched status
    let dispatchedStatus = await db.orderStatusType.findFirst({
      where: { name: "Солонгосоос хөдөлсөн" }
    })
    const dispatchedStatusId = dispatchedStatus?.id || DISPATCHED_STATUS_ID

    // Find eligible orders
    const orders = await db.order.findMany({
      where: {
        id: { in: data.orderIds },
        isRefunded: false,
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        statusId: true,
      }
    })

    if (orders.length === 0) {
      return { success: false, error: "Сонгосон захиалгууд олдсонгүй эсвэл буцаагдсан байна." }
    }

    const shipmentCode = (data.code || "").trim() || generateShipmentCode()

    const result = await db.$transaction(async (tx) => {
      // Create shipment with carrier & audit info
      const shipment = await tx.shipment.create({
        data: {
          code: shipmentCode,
          name: trimmedName,
          status: "IN_TRANSIT",
          notes: data.notes?.trim() || null,
          carrierName: data.carrierName?.trim() || null,
          waybillNumber: data.waybillNumber?.trim() || null,
          boxCount: typeof data.boxCount === "number" && data.boxCount > 0 ? data.boxCount : 1,
          totalWeight: data.totalWeight ? Number(data.totalWeight) : null,
          shippingCost: data.shippingCost ? Number(data.shippingCost) : null,
          costCurrency: data.costCurrency || "KRW",
          receiptImageUrl: data.receiptImageUrl?.trim() || null,
          totalOrders: orders.length,
          arrivedOrders: 0,
          dispatchedAt: new Date(),
          createdBy: admin.name || admin.email || "Admin",
        }
      })

      // Link orders and update status to "Солонгосоос хөдөлсөн"
      await tx.order.updateMany({
        where: { id: { in: orders.map(o => o.id) } },
        data: {
          shipmentId: shipment.id,
          statusId: dispatchedStatusId,
        }
      })

      // Log activity
      await logAdminActivity({
        userId: admin.id,
        userName: admin.name || "Admin",
        userRole: admin.role,
        action: `Карго ачилт үүсгэлээ: ${shipment.name} (${shipment.code}) - ${data.carrierName ? `[${data.carrierName}] ` : ""}${orders.length} бараа "Солонгосоос хөдөлсөн" төлөвт шилжив`,
        type: "ORDER",
        target: shipment.id,
        targetUrl: `/admin/orders/shipments/${shipment.id}`,
        detail: `Захиалгууд: ${orders.map(o => `#${o.orderNumber}`).slice(0, 15).join(", ")}${orders.length > 15 ? "..." : ""}`
      })

      return shipment
    })

    revalidatePath("/admin/orders/shipments")
    revalidatePath("/admin/orders/daily")
    revalidatePath("/admin/orders")
    revalidatePath("/track")

    return { success: true, shipment: result }
  } catch (error: any) {
    console.error("Error creating shipment manifest:", error)
    return { success: false, error: error.message || "Илгээмж үүсгэхэд алдаа гарлаа." }
  }
}

/**
 * Returns the list of all cargo shipments.
 */
export async function getShipmentsList(params?: {
  status?: string
  search?: string
}) {
  try {
    const where: any = {}

    if (params?.status && params.status !== "ALL") {
      where.status = params.status
    }

    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase()
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ]
    }

    const shipments = await db.shipment.findMany({
      where,
      orderBy: { dispatchedAt: "desc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    })

    return { success: true, shipments }
  } catch (error: any) {
    console.error("Error fetching shipments list:", error)
    return { success: false, shipments: [], error: error.message }
  }
}

/**
 * Returns detailed info of a shipment including its orders, products, and statuses.
 */
export async function getShipmentDetails(shipmentId: string) {
  try {
    const shipment = await db.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        orders: {
          include: {
            batch: {
              include: {
                product: true,
                category: true,
              }
            },
            status: true,
          },
          orderBy: { orderNumber: "asc" }
        }
      }
    })

    if (!shipment) {
      return { success: false, error: "Илгээмж олдсонгүй." }
    }

    // Resolve Arrived status
    let arrivedStatus = await db.orderStatusType.findFirst({
      where: { name: "Улаанбаатарт ирсэн" }
    })
    const arrivedStatusId = arrivedStatus?.id || ARRIVED_STATUS_ID

    // Calculate live counts
    const arrivedCount = shipment.orders.filter(o => o.statusId === arrivedStatusId).length

    return {
      success: true,
      shipment: {
        ...shipment,
        arrivedOrders: arrivedCount,
        totalOrders: shipment.orders.length,
      },
      arrivedStatusId,
    }
  } catch (error: any) {
    console.error("Error fetching shipment details:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Updates carrier and logistic audit info for an existing shipment.
 */
export async function updateShipmentCarrierInfo(data: {
  shipmentId: string
  carrierName?: string
  waybillNumber?: string
  boxCount?: number
  totalWeight?: number
  shippingCost?: number
  costCurrency?: string
  receiptImageUrl?: string
  notes?: string
}) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Зөвхөн админ хэрэглэгч ачилтын мэдээлэл шинэчлэх эрхтэй." }
    }

    const updated = await db.shipment.update({
      where: { id: data.shipmentId },
      data: {
        ...(data.carrierName !== undefined ? { carrierName: data.carrierName.trim() || null } : {}),
        ...(data.waybillNumber !== undefined ? { waybillNumber: data.waybillNumber.trim() || null } : {}),
        ...(data.boxCount !== undefined ? { boxCount: Math.max(1, Number(data.boxCount) || 1) } : {}),
        ...(data.totalWeight !== undefined ? { totalWeight: data.totalWeight ? Number(data.totalWeight) : null } : {}),
        ...(data.shippingCost !== undefined ? { shippingCost: data.shippingCost ? Number(data.shippingCost) : null } : {}),
        ...(data.costCurrency !== undefined ? { costCurrency: data.costCurrency } : {}),
        ...(data.receiptImageUrl !== undefined ? { receiptImageUrl: data.receiptImageUrl.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes.trim() || null } : {}),
      }
    })

    revalidatePath("/admin/orders/shipments")
    revalidatePath(`/admin/orders/shipments/${data.shipmentId}`)

    return { success: true, shipment: updated }
  } catch (error: any) {
    console.error("Error updating shipment carrier info:", error)
    return { success: false, error: error.message || "Ачилтын мэдээлэл шинэчлэхэд алдаа гарлаа." }
  }
}

/**
 * Bulk marks orders in a shipment as "Улаанбаатарт ирсэн".
 * Supports:
 * 1. receiveAll: true (One-click receive entire shipment)
 * 2. orderIds: string[] (Partial catch or barcode scan check-off)
 */
export async function receiveShipmentItems(data: {
  shipmentId: string
  orderIds?: string[]
  receiveAll?: boolean
}) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Зөвхөн админ хэрэглэгч бараа хүлээн авах эрхтэй." }
    }

    const shipment = await db.shipment.findUnique({
      where: { id: data.shipmentId },
      include: { orders: { select: { id: true, orderNumber: true, statusId: true } } }
    })

    if (!shipment) {
      return { success: false, error: "Илгээмж олдсонгүй." }
    }

    // Resolve Arrived status
    let arrivedStatus = await db.orderStatusType.findFirst({
      where: { name: "Улаанбаатарт ирсэн" }
    })
    const arrivedStatusId = arrivedStatus?.id || ARRIVED_STATUS_ID

    // Determine target order IDs
    let targetOrderIds: string[] = []
    if (data.receiveAll) {
      targetOrderIds = shipment.orders
        .filter(o => o.statusId !== arrivedStatusId)
        .map(o => o.id)
    } else if (data.orderIds && data.orderIds.length > 0) {
      const allowedSet = new Set(shipment.orders.map(o => o.id))
      targetOrderIds = data.orderIds.filter(id => allowedSet.has(id))
    }

    if (targetOrderIds.length === 0 && !data.receiveAll) {
      return { success: false, error: "Хүлээн авах захиалга сонгогдоогүй байна." }
    }

    const result = await db.$transaction(async (tx) => {
      const now = new Date()

      if (targetOrderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: targetOrderIds } },
          data: {
            statusId: arrivedStatusId,
            arrivalDate: now,
          }
        })
      }

      // Live recalculate shipment status
      const totalCount = await tx.order.count({ where: { shipmentId: data.shipmentId } })
      const arrivedCount = await tx.order.count({
        where: { shipmentId: data.shipmentId, statusId: arrivedStatusId }
      })

      const isAllArrived = arrivedCount >= totalCount && totalCount > 0
      const newStatus = isAllArrived ? "ARRIVED" : arrivedCount > 0 ? "PARTIAL" : "IN_TRANSIT"

      const updatedShipment = await tx.shipment.update({
        where: { id: data.shipmentId },
        data: {
          totalOrders: totalCount,
          arrivedOrders: arrivedCount,
          status: newStatus,
          arrivedAt: isAllArrived ? now : null,
        }
      })

      // Log activity
      await logAdminActivity({
        userId: admin.id,
        userName: admin.name || "Admin",
        userRole: admin.role,
        action: `Карго илгээмж хүлээн авлаа: ${shipment.name} (${targetOrderIds.length} бараа "Улаанбаатарт ирсэн" болгов)`,
        type: "ORDER",
        target: shipment.id,
        targetUrl: `/admin/orders/shipments/${shipment.id}`,
        detail: `Ирсэн тоо: ${arrivedCount}/${totalCount}. Төлөв: ${newStatus}`
      })

      return {
        shipment: updatedShipment,
        updatedCount: targetOrderIds.length,
        arrivedOrders: arrivedCount,
        totalOrders: totalCount,
      }
    })

    revalidatePath("/admin/orders/shipments")
    revalidatePath(`/admin/orders/shipments/${data.shipmentId}`)
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/daily")
    revalidatePath("/admin/orders")
    revalidatePath("/track")

    return {
      success: true,
      message: `${result.updatedCount} бараа "Улаанбаатарт ирсэн" төлөвт шилжлээ. Нийт: ${result.arrivedOrders}/${result.totalOrders}`,
      shipment: result.shipment,
      arrivedOrders: result.arrivedOrders,
      totalOrders: result.totalOrders,
    }
  } catch (error: any) {
    console.error("Error receiving shipment items:", error)
    return { success: false, error: error.message || "Илгээмж хүлээн авахад алдаа гарлаа." }
  }
}

/**
 * Searches eligible confirmed orders to add to a shipment.
 */
export async function getEligibleOrdersForShipment(params?: {
  search?: string
  dateStr?: string
}) {
  try {
    const where: any = {
      isRefunded: false,
      shipmentId: null, // Not yet in any shipment
      paymentStatus: { notIn: ["REJECTED"] },
      status: {
        isFinal: false,
        name: { notIn: ["Цуцлагдсан", "Буцаагдсан", "Улаанбаатарт ирсэн", "Хүргэгдсэн", "Өөрөө ирж авсан"] }
      }
    }

    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase()
      const isNum = !isNaN(Number(q))
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
        { batch: { product: { name: { contains: q, mode: "insensitive" } } } },
        ...(isNum ? [{ orderNumber: Number(q) }] : []),
      ]
    }

    const orders = await db.order.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          include: {
            product: true
          }
        },
        status: true
      }
    })

    return {
      success: true,
      orders: orders.map(o => {
        const createdUB = new Date(o.createdAt.getTime() + 8 * 3600 * 1000)
        const dateStr = createdUB.toISOString().split("T")[0]
        const [y, m, d] = dateStr.split("-")
        const displayDate = `${y}.${m}.${d}`

        let variantDesc = ""
        if (o.selectedOptions && typeof o.selectedOptions === "object") {
          variantDesc = Object.values(o.selectedOptions).join(", ")
        }

        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          productName: o.batch?.product?.name || "Бараа",
          imageUrl: o.batch?.product?.imageUrl || null,
          variantDesc: variantDesc || undefined,
          quantity: o.quantity,
          totalAmount: Number(o.totalAmount || 0),
          statusName: o.status?.name || "Хүлээгдэж буй",
          statusColor: o.status?.color || "slate",
          selectedOptions: o.selectedOptions,
          dateStr,
          displayDate,
          createdAt: o.createdAt.toISOString(),
        }
      })
    }
  } catch (error: any) {
    console.error("Error fetching eligible orders:", error)
    return { success: false, orders: [], error: error.message }
  }
}

/**
 * Appends additional orders to an already existing shipment.
 */
export async function addOrdersToShipment(data: {
  shipmentId: string
  orderIds: string[]
}) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Зөвхөн админ хэрэглэгч ачилтанд бараа нэмэх эрхтэй." }
    }

    if (!data.orderIds || data.orderIds.length === 0) {
      return { success: false, error: "Нэмэх захиалга сонгогдоогүй байна." }
    }

    const shipment = await db.shipment.findUnique({
      where: { id: data.shipmentId }
    })
    if (!shipment) {
      return { success: false, error: "Илгээмж олдсонгүй." }
    }

    // Resolve Dispatched status
    let dispatchedStatus = await db.orderStatusType.findFirst({
      where: { name: "Солонгосоос хөдөлсөн" }
    })
    const dispatchedStatusId = dispatchedStatus?.id || DISPATCHED_STATUS_ID

    const result = await db.$transaction(async (tx) => {
      // Update orders
      await tx.order.updateMany({
        where: { id: { in: data.orderIds } },
        data: {
          shipmentId: shipment.id,
          statusId: dispatchedStatusId,
        }
      })

      // Recalculate shipment totals
      const totalCount = await tx.order.count({ where: { shipmentId: shipment.id } })
      const arrivedCount = await tx.order.count({
        where: { shipmentId: shipment.id, statusId: ARRIVED_STATUS_ID }
      })

      const isComplete = arrivedCount >= totalCount && totalCount > 0
      const newStatus = isComplete ? "ARRIVED" : arrivedCount > 0 ? "PARTIAL" : "IN_TRANSIT"

      const updatedShipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          totalOrders: totalCount,
          arrivedOrders: arrivedCount,
          status: newStatus,
        }
      })

      // Log activity
      await logAdminActivity({
        userId: admin.id,
        userName: admin.name || "Admin",
        userRole: admin.role,
        action: `Карго илгээмжинд ${data.orderIds.length} бараа нэмлээ: ${shipment.name} (${shipment.code})`,
        type: "ORDER",
        target: shipment.id,
        targetUrl: `/admin/orders/shipments/${shipment.id}`,
      })

      return updatedShipment
    })

    revalidatePath("/admin/orders/shipments")
    revalidatePath(`/admin/orders/shipments/${data.shipmentId}`)
    revalidatePath("/admin/orders/daily")
    revalidatePath("/track")

    return { success: true, shipment: result }
  } catch (error: any) {
    console.error("Error adding orders to shipment:", error)
    return { success: false, error: error.message || "Илгээмжинд бараа нэмэхэд алдаа гарлаа." }
  }
}
