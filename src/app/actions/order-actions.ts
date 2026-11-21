"use server"
import { logAdminActivity } from "@/lib/activity-logger"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { emitNewOrder } from "@/lib/orderEvents"
import { getCurrentAdmin, logActivity } from "@/lib/auth"
import { getVariantKey, getVariantStockTotal } from "@/lib/variant-utils"

export async function getOrders() {
  try {
    const orders = await (db.order as any).findMany({
      where: {
        paymentStatus: { not: "REJECTED" },
        OR: [
          { statusId: null },
          { status: { isFinal: false } }
        ]
      },
      take: 1000,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        accountNumber: true,
        quantity: true,
        totalAmount: true,
        transactionRef: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        status: { select: { id: true, name: true, color: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch all orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function getPickedUpOrders(days: number = 30, page: number = 1, limit: number = 50, q: string = "") {
  try {
    const whereClause: any = {
      status: {
        isFinal: true,
        name: { in: ["Өөрөө ирж авсан", "Өөрөө авсан"] }
      },
      paymentStatus: { not: "REJECTED" }
    };

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.updatedAt = { gte: cutoffDate };
    }

    const orders = await (db.order as any).findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        accountNumber: true,
        quantity: true,
        totalAmount: true,
        transactionRef: true,
        paymentStatus: true,
        updatedAt: true,
        status: { select: { id: true, name: true, color: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    })

    let filteredOrders = orders || []
    if (q) {
      const ql = q.toLowerCase()
      filteredOrders = filteredOrders.filter((o: any) =>
        o.customerName?.toLowerCase().includes(ql) ||
        o.customerPhone?.includes(ql) ||
        o.accountNumber?.toLowerCase().includes(ql) ||
        o.batch?.product?.name?.toLowerCase().includes(ql) ||
        o.orderNumber?.toString().includes(ql) ||
        o.transactionRef?.toLowerCase().includes(ql)
      )
    }

    const grouped: Record<string, any[]> = {}
    for (const order of filteredOrders) {
      const key = order.transactionRef || order.customerPhone || order.id
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(order)
    }

    const allGroups = Object.values(grouped)
    const totalPages = Math.ceil(allGroups.length / limit);
    const paginatedGroups = allGroups.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      groups: JSON.parse(JSON.stringify(paginatedGroups)),
      totalItems: filteredOrders.length,
      totalGroups: allGroups.length,
      totalPages
    }
  } catch (error) {
    console.error("Failed to fetch picked up orders:", error)
    return { success: false, error: "Failed to fetch picked up orders" }
  }
}

export async function getDeliveredOrders(days: number = 30, page: number = 1, limit: number = 50, q: string = "") {
  try {
    const whereClause: any = {
      status: {
        isFinal: true,
        name: { in: ["Хүргэлтээр гарсан", "Хүргэлтээр авсан", "Хүргэгдсэн"] }
      },
      paymentStatus: { not: "REJECTED" }
    };

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.updatedAt = { gte: cutoffDate };
    }

    const orders = await (db.order as any).findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        accountNumber: true,
        quantity: true,
        totalAmount: true,
        transactionRef: true,
        paymentStatus: true,
        updatedAt: true,
        deliveryAddress: true,
        wantsDelivery: true,
        deliveryDate: true,
        status: { select: { id: true, name: true, color: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    })

    let filteredOrders = orders || []
    if (q) {
      const ql = q.toLowerCase()
      filteredOrders = filteredOrders.filter((o: any) =>
        o.customerName?.toLowerCase().includes(ql) ||
        o.customerPhone?.includes(ql) ||
        o.accountNumber?.toLowerCase().includes(ql) ||
        o.batch?.product?.name?.toLowerCase().includes(ql) ||
        o.deliveryAddress?.toLowerCase().includes(ql) ||
        o.orderNumber?.toString().includes(ql) ||
        o.transactionRef?.toLowerCase().includes(ql)
      )
    }

    const grouped: Record<string, any[]> = {}
    for (const order of filteredOrders) {
      const key = order.transactionRef || order.customerPhone || order.id
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(order)
    }

    const rawGroups = Object.values(grouped)
    const allGroups = rawGroups.filter((groupOrders: any[]) => {
      const wantsDelivery = groupOrders.some((o: any) => o.wantsDelivery)
      const hasValidAddress = groupOrders.some((o: any) => {
        const addr = o.deliveryAddress?.trim() || "";
        return addr && addr !== "Өөрөө ирж авна" && addr !== "Өөрөө авна" && addr !== "Дэлгүүрээс авна";
      });
      const isAllPickedUpStatus = groupOrders.every((o: any) => o.status?.name === "Өөрөө ирж авсан");

      if (isAllPickedUpStatus && !wantsDelivery && !hasValidAddress) return false;
      return wantsDelivery || hasValidAddress || !isAllPickedUpStatus;
    });

    const totalPages = Math.ceil(allGroups.length / limit);
    const paginatedGroups = allGroups.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      groups: JSON.parse(JSON.stringify(paginatedGroups)),
      totalItems: filteredOrders.length,
      totalGroups: allGroups.length,
      totalPages
    }
  } catch (error) {
    console.error("Failed to fetch delivered orders:", error)
    return { success: false, error: "Failed to fetch delivered orders" }
  }
}

export async function getDeliveryOrders(date?: string, tab: string = "ready") {
  try {
    const whereConditions: any[] = [
      { paymentStatus: "CONFIRMED" },
      { status: { isFinal: false } },
      {
        OR: [
          {
            wantsDelivery: true,
            status: {
              OR: [
                { isDeliverable: true },
                { name: { in: ["Улаанбаатарт ирсэн", "Хүргэлтийн ажилтанд өгсөн", "Хүргэлтэд гарсан"] } }
              ]
            }
          },
          {
            status: {
              name: { in: ["Хүргэлтийн ажилтанд өгсөн", "Хүргэлтэд гарсан"] }
            }
          }
        ]
      }
    ]

    if (date) {
      // date is in YYYY-MM-DD
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereConditions.push({
        OR: [
          {
            deliveryRequestedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          {
            deliveryRequestedAt: null,
            updatedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        ]
      })
    }

    const allOrders = await (db.order as any).findMany({
      where: {
        AND: whereConditions
      },
      include: {
        batch: { include: { product: true, category: true } },
        status: true
      },
      orderBy: { updatedAt: "desc" }
    })

    const isMissingAddress = (o: any) => {
      const addr = (o.deliveryAddress || "").trim()
      return !addr || addr === "Хаяг тодруулах шаардлагатай" || addr === "Өөрөө ирж авна" || addr === "Өөрөө авна"
    }

    const isCourierTransit = (o: any) => {
      const s = o.status?.name?.toLowerCase() || ""
      return s.includes("ажилтанд өгсөн") || s.includes("хүргэлтэд гарсан")
    }

    // Missing address orders across all deliverable states
    const missingOrders = allOrders.filter(isMissingAddress)

    // Ready to prepare for delivery (not yet handed to courier)
    const readyOrders = allOrders.filter((o: any) => !isCourierTransit(o))

    // In transit with couriers
    const inTransitOrders = allOrders.filter(isCourierTransit)

    let filteredOrders = readyOrders
    if (tab === "in_transit") {
      filteredOrders = inTransitOrders
    } else if (tab === "missing_address") {
      filteredOrders = missingOrders
    } else {
      filteredOrders = readyOrders
    }

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(filteredOrders)),
      readyCount: readyOrders.length,
      inTransitCount: inTransitOrders.length,
      missingCount: missingOrders.length
    }
  } catch (error: any) {
    return { success: false, error: error.message, orders: [], readyCount: 0, inTransitCount: 0, missingCount: 0 }
  }
}

export async function markDeliveryFeePaid(orderIds: string[], isPaid: boolean = true) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: { deliveryFeePaid: isPaid }
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
      action: isPaid ? "Хүргэлтийн төлбөр батлав" : "Хүргэлтийн төлбөр цуцлав",
      target: "Хүргэлт",
      detail: `${orderIds.length} ширхэг захиалгын карго/хүргэлтийн төлбөрийг ${isPaid ? "төлөгдсөнөөр" : "төлөгдөөгүйгээр"} тэмдэглэлээ.`
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function handoverOrdersToCourier(orderIds: string[], autoConfirmFee: boolean = false) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const courierStatus = await db.orderStatusType.findFirst({
      where: {
        name: { in: ["Хүргэлтийн ажилтанд өгсөн", "Хүргэлтэд гарсан"] }
      }
    })
    if (!courierStatus) return { success: false, error: "'Хүргэлтийн ажилтанд өгсөн' статус олдсонгүй" }

    const updateData: any = { statusId: courierStatus.id, wantsDelivery: true }
    if (autoConfirmFee) {
      updateData.deliveryFeePaid = true
    }

    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: updateData as any
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Карго Админ",
      userRole: adminMode.role,
      action: "Хүргэлтийн ажилтанд өгөв",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг ачааг хүргэлтийн ажилтанд хүлээлгэн өгөв.`,
    })

    await logAdminActivity({
      action: "ХҮРГЭЛТЭД_ГАРГАСАН",
      type: "ORDER",
      target: `${orderIds.length} захиалга`,
      targetUrl: "/admin/orders/delivery?tab=in_transit",
      detail: `${orderIds.length} ширхэг захиалгыг хүргэлтийн ажилтанд хүлээлгэн өгөв. Төлөв: '${courierStatus.name}'`,
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    console.error("handoverOrdersToCourier error:", err)
    return { success: false, error: err.message }
  }
}

export async function revertCourierHandover(orderIds: string[]) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const ubStatus = await db.orderStatusType.findFirst({
      where: {
        name: { in: ["Улаанбаатарт ирсэн"] }
      }
    })
    if (!ubStatus) return { success: false, error: "'Улаанбаатарт ирсэн' статус олдсонгүй" }

    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { statusId: ubStatus.id } as any
    })

    await logAdminActivity({
      action: "ХҮРГЭЛТЭЭС_БУЦААСАН",
      type: "ORDER",
      target: `${orderIds.length} захиалга`,
      targetUrl: "/admin/orders/delivery",
      detail: `${orderIds.length} ширхэг захиалгыг хүргэлтээс буцааж 'Улаанбаатарт ирсэн' төлөвт шилжүүлэв.`,
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    console.error("revertCourierHandover error:", err)
    return { success: false, error: err.message }
  }
}

export async function confirmDeliveryGroup(orderIds: string[]) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

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
    if (!deliveredStatus) return { success: false, error: "Хүргэлтийн төлөв олдсонгүй" }

    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { statusId: deliveredStatus.id } as any
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Карго Админ",
      userRole: adminMode.role,
      action: "Хүргэлт баталгаажуулав",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг захиалгыг хүргэгдсэн гэж хүлээн авлаа`,
    })

    await logAdminActivity({
      action: "ХҮРГЭГДСЭН_БАГЦ",
      type: "ORDER",
      target: `${orderIds.length} захиалга`,
      targetUrl: "/admin/orders/delivered",
      detail: `${orderIds.length} ширхэг захиалга хэрэглэгчийн гар дээр хүргэгдсэнийг батлав.`,
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/delivered")
    revalidatePath("/admin/orders/picked-up")
    revalidatePath("/admin/orders")
    revalidatePath("/track")

    return { success: true }
  } catch (err: any) {
    console.error("confirmDeliveryGroup error:", err)
    return { success: false, error: err.message }
  }
}

export async function markDeliveryAsPickedUp(orderIds: string[]) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const pickedUpStatus = await db.orderStatusType.findFirst({
      where: { name: "Өөрөө ирж авсан", isFinal: true }
    })
    if (!pickedUpStatus) return { success: false, error: "\"Өөрөө ирж авсан\" статус олдсонгүй" }

    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        statusId: pickedUpStatus.id,
        wantsDelivery: false
      } as any
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Хүргэлтээс → Өөрөө авсан руу шилжүүлэв",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг захиалга хүргэлтийн жагсаалтаас хасагдав (хэрэглэгч өөрөө ирж авсан)`,
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/picked-up")
    revalidatePath("/admin/orders/overdue-storage")
    revalidatePath("/admin/orders")
    revalidatePath("/track")

    return { success: true }
  } catch (err: any) {
    console.error("markDeliveryAsPickedUp error:", err)
    return { success: false, error: err.message }
  }
}

export async function moveOverdueOrderToDelivery(orderId: string, address: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }
    if (!address || !address.trim()) return { success: false, error: "Хүргэлтийн хаяг оруулна уу" }

    await (db.order as any).update({
      where: { id: orderId },
      data: {
        wantsDelivery: true,
        deliveryAddress: address.trim(),
        deliveryRequestedAt: new Date()
      }
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Хадгалалтаас → Хүргэлтэд шилжүүлэв",
      target: "Захиалга",
      detail: `#${orderId} захиалгыг агуулахаас хүргэлтийн дараалал руу шилжүүлэв (${address.trim()})`,
    })

    revalidatePath("/admin/orders/overdue-storage")
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getRejectedOrders(days: number = 30, page: number = 1, limit: number = 50, q: string = "") {
  try {
    const whereClause: any = {
      paymentStatus: "REJECTED"
    };

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.updatedAt = { gte: cutoffDate };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { updatedAt: "desc" },
    })
    let filteredOrders = orders || []
    if (q) {
      const ql = q.toLowerCase()
      filteredOrders = filteredOrders.filter((o: any) =>
        o.customerName?.toLowerCase().includes(ql) ||
        o.customerPhone?.includes(ql) ||
        o.accountNumber?.toLowerCase().includes(ql) ||
        o.batch?.product?.name?.toLowerCase().includes(ql) ||
        o.deliveryAddress?.toLowerCase().includes(ql) ||
        o.orderNumber?.toString().includes(ql) ||
        o.transactionRef?.toLowerCase().includes(ql)
      )
    }

    const grouped: Record<string, any[]> = {}
    for (const order of filteredOrders) {
      const key = order.transactionRef || order.customerPhone || order.id
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(order)
    }
    const allGroups = Object.values(grouped)
    const totalPages = Math.ceil(allGroups.length / limit)
    const paginatedGroups = allGroups.slice((page - 1) * limit, page * limit)

    return {
      success: true,
      groups: JSON.parse(JSON.stringify(paginatedGroups)),
      totalItems: filteredOrders.length,
      totalGroups: allGroups.length,
      totalPages
    }
  } catch (error) {
    console.error("Failed to fetch rejected orders:", error)
    return { success: false, error: "Failed to fetch rejected orders" }
  }
}

export async function getOrderStatuses() {
  try {
    const statuses = await db.orderStatusType.findMany({
      orderBy: { createdAt: "asc" },
    })
    return { success: true, statuses }
  } catch (error) {
    console.error("Failed to fetch order statuses:", error)
    return { success: false, error: "Failed to fetch order statuses" }
  }
}

export async function getOrdersByAccount(searchQuery: string) {
  try {
    const cleanQuery = searchQuery?.trim();
    if (!cleanQuery) return { success: true, orders: [] };

    // Security guard: Reject dummy queries, all zeroes, or short invalid strings
    const digitsOnly = cleanQuery.replace(/\D/g, "");
    const isAllZeros = /^0+$/.test(cleanQuery) || (digitsOnly.length > 0 && /^0+$/.test(digitsOnly));
    const isDummyPhone = cleanQuery === "00000000" || digitsOnly === "00000000";
    const isTooShort = cleanQuery.length < 4 && !cleanQuery.startsWith("#");

    if (isAllZeros || isDummyPhone || isTooShort || cleanQuery === "0") {
      return { success: true, orders: [] };
    }

    // Normalize phone number (strip +976, spaces, dashes)
    const normalizedPhone = cleanQuery.replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim();

    // Check if query is a numeric order number safely within PostgreSQL INT4 (max 2147483647)
    const cleanOrderStr = cleanQuery.replace(/^#/, "");
    const numericOrderNumber = parseInt(cleanOrderStr, 10);
    const isSafeInt4 = !isNaN(numericOrderNumber) && numericOrderNumber > 0 && numericOrderNumber <= 2147483647;
    // An orderNumber should only match if explicitly prefixed with '#' OR if it's within realistic order ID limits (< 1,000,000)
    const isOrderNumber = isSafeInt4 && (cleanQuery.startsWith("#") || (numericOrderNumber < 1000000 && cleanOrderStr.length <= 6));

    const orConditions: any[] = [
      { accountNumber: cleanQuery },
      { accountNumber: { contains: cleanQuery, mode: "insensitive" } },
      { transactionRef: cleanQuery },
      { transactionRef: { contains: cleanQuery, mode: "insensitive" } }
    ];

    // If query contains digits (like account or phone with spaces or symbols), also match digits
    if (digitsOnly.length >= 6 && digitsOnly !== cleanQuery) {
      orConditions.push({ accountNumber: { contains: digitsOnly, mode: "insensitive" } });
    }

    if (cleanQuery !== "00000000" && !/^0+$/.test(cleanQuery)) {
      orConditions.push({ customerPhone: cleanQuery });
    }

    if (normalizedPhone && normalizedPhone !== cleanQuery && !/^0+$/.test(normalizedPhone)) {
      orConditions.push({ customerPhone: normalizedPhone });
      if (normalizedPhone.length >= 8) {
        orConditions.push({ customerPhone: { contains: normalizedPhone } });
      }
    }

    if (isOrderNumber) {
      orConditions.push({ orderNumber: numericOrderNumber });
    }

    const orders = await db.order.findMany({
      where: {
        AND: [
          { OR: orConditions },
          { customerPhone: { notIn: ["00000000", "0"] } }
        ]
      },
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch orders by account:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function createOrder(data: {
  customerName: string
  phoneNumber: string
  accountNumber: string
  deliveryAddress?: string
  deliveryInstructions?: string
  deliveryDate?: string
  quantity: number
  totalAmount: number
  batchId: string
  wantsDelivery?: boolean
  transactionRef?: string  // shared ref for multi-item cart checkout
  selectedOptions?: any
}) {
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Get batch current state
      const batch = await tx.batch.findUnique({
        where: { id: data.batchId },
        include: { product: true }
      });

      if (!batch) {
        throw new Error("Багц олдсонгүй");
      }

      // Check 1: Batch status must not be closed, shipped, or arrived
      if (batch.status === 'CLOSED' || batch.status === 'SHIPPED' || batch.status === 'ARRIVED') {
        throw new Error(`'${batch.product?.name || "Энэ бараа"}' захиалга хаагдсан тул нэмж захиалга авах боломжгүй байна.`);
      }

      // Check 2: Batch must be available for sale
      if (!batch.isAvailableForSale) {
        throw new Error(`'${batch.product?.name || "Энэ бараа"}' худалдаанаас хаагдсан байна.`);
      }

      // Check 3: Check closing date for pre-orders or scheduled batches
      if (batch.closingDate && new Date() > new Date(batch.closingDate)) {
        throw new Error(`'${batch.product?.name || "Энэ бараа"}'-ны захиалгын хугацаа дууссан байна.`);
      }

      // Check 4: Stock check for ready stock items (not pre-orders)
      if (!batch.isPreOrder) {
        if (batch.variantStock && typeof batch.variantStock === 'object') {
          const variantStock = batch.variantStock as Record<string, number>;
          const variantKey = getVariantKey((batch.product as any)?.options, data.selectedOptions);
          if (variantKey && variantStock[variantKey] !== undefined) {
            if (variantStock[variantKey] < data.quantity) {
              throw new Error(`'${batch.product?.name || "Бараа"}' сонгосон хувилбарын үлдэгдэл хүрэлцэхгүй байна (${variantStock[variantKey]} ш үлдсэн).`);
            }
          } else if (batch.remainingQuantity < data.quantity) {
            throw new Error(`'${batch.product?.name || "Бараа"}' үлдэгдэл хүрэлцэхгүй байна (${batch.remainingQuantity} ш үлдсэн).`);
          }
        } else {
          if (batch.remainingQuantity < data.quantity) {
            throw new Error(`'${batch.product?.name || "Бараа"}' үлдэгдэл хүрэлцэхгүй байна (${batch.remainingQuantity} ш үлдсэн).`);
          }
        }
      }

      // 2. Create the order
      const defaultStatus = await tx.orderStatusType.findFirst({ where: { isDefault: true } as any });
      const transactionRef = data.transactionRef
        ?? `ANR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.phoneNumber,
          accountNumber: data.accountNumber,
          deliveryAddress: data.deliveryAddress,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
          quantity: data.quantity,
          batchId: data.batchId,
          wantsDelivery: data.wantsDelivery ?? false,
          paymentStatus: "PENDING",
          totalAmount: data.totalAmount,
          transactionRef,
          creationSource: "WEB",
          selectedOptions: data.selectedOptions,
          ...(defaultStatus?.id && { statusId: defaultStatus.id })
        } as any
      });

      // 3. Decrement remaining quantity AND variant stock if applicable
      const updateData: any = {}
      let newRemaining = batch.remainingQuantity;

      // Variant stock management
      if ((batch as any).variantStock && typeof (batch as any).variantStock === 'object') {
        const variantStock = { ...((batch as any).variantStock as Record<string, number>) }
        const variantKey = getVariantKey((batch.product as any)?.options, data.selectedOptions)

        if (variantKey && variantStock[variantKey] !== undefined) {
          const newVariantQty = Math.max(0, variantStock[variantKey] - data.quantity)
          variantStock[variantKey] = newVariantQty
          updateData.variantStock = variantStock
        }
        // Always sync remainingQuantity with variant stock total
        newRemaining = getVariantStockTotal(variantStock)
        updateData.remainingQuantity = newRemaining
      } else {
        newRemaining = Math.max(0, batch.remainingQuantity - data.quantity)
        updateData.remainingQuantity = newRemaining
      }

      // Auto-close batch if remaining stock reaches 0
      if (!batch.isPreOrder && newRemaining <= 0) {
        updateData.status = 'CLOSED';
      }

      await tx.batch.update({
        where: { id: data.batchId },
        data: updateData
      });

      return order;
    });

    revalidatePath("/admin/products")
    revalidatePath("/admin/orders")
    revalidatePath("/")

    // Emit grouped notification (800ms server-side debounce by transactionRef)
    try {
      const order = result as any
      const batch = await db.batch.findUnique({ where: { id: data.batchId }, include: { product: true } })
      emitNewOrder({
        transactionRef: (result as any).transactionRef || (result as any).id,
        customerName: data.customerName,
        customerPhone: data.phoneNumber,
        wantsDelivery: data.wantsDelivery ?? false,
        createdAt: new Date().toISOString(),
        totalAmount: data.totalAmount,
        item: {
          orderId: order.id,
          productName: batch?.product?.name ?? "Бараа",
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          batchId: data.batchId,
          selectedOptions: data.selectedOptions,
        }
      })
    } catch { /* non-critical */ }

    return { success: true, order: JSON.parse(JSON.stringify(result)) }
  } catch (error: any) {
    console.error("Failed to create order:", error)
    return { success: false, error: error.message || "Failed to create order" }
  }
}

export async function addOrderToBatch(batchId: string, data: {
  customerName: string
  customerPhone: string
  accountNumber?: string
  quantity: number
  arrivalDate?: string
  deliveryDate?: string
  deliveryAddress?: string
  statusId?: string
  cargoFee?: number
  selectedOptions?: any
}) {
  try {
    const cleanPhone = (data.customerPhone || "").replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim();
    if (!cleanPhone) {
      return { success: false, error: "Утасны дугаар заавал оруулна уу." };
    }
    if (!data.quantity || data.quantity < 1) {
      return { success: false, error: "Барааны тоо ширхэг хамгийн багадаа 1 байна." };
    }

    const result = await db.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        include: { product: true }
      });
      if (!batch) throw new Error("Batch not found");

      const admin = await getCurrentAdmin();
      const adminName = admin ? (admin.name || "Сайтын админ") : "Админ";

      const defaultStatus = await tx.orderStatusType.findFirst();
      const statusId = data.statusId || defaultStatus?.id;
      const unitPrice = Number(batch.price || 0);
      const totalAmount = unitPrice * Number(data.quantity || 1);

      // @ts-ignore
      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: cleanPhone,
          ...(data.accountNumber && { accountNumber: data.accountNumber }),
          ...(data.deliveryAddress && { deliveryAddress: data.deliveryAddress }),
          wantsDelivery: !!data.deliveryAddress && data.deliveryAddress.trim() !== "",
          quantity: data.quantity,
          totalAmount: totalAmount,
          batchId: batchId,
          paymentStatus: "CONFIRMED", // Admin-added orders are automatically confirmed
          creationSource: "ADMIN",
          createdByAdmin: adminName,
          ...(statusId && { statusId: statusId }),
          ...(data.cargoFee !== undefined && { cargoFee: data.cargoFee }),
          ...(data.arrivalDate && { arrivalDate: new Date(data.arrivalDate) }),
          ...(data.deliveryDate && { deliveryDate: new Date(data.deliveryDate) }),
          ...(data.selectedOptions && { selectedOptions: data.selectedOptions }),
        } as any
      });

      // Update remaining quantity in batch
      const newRemaining = Math.max(0, batch.remainingQuantity - data.quantity);
      let newVariantStock = batch.variantStock;

      if (batch.variantStock && typeof batch.variantStock === "object" && data.selectedOptions) {
        const variantKey = getVariantKey(batch.product?.options, data.selectedOptions);
        if (variantKey) {
          const vStock = { ...(batch.variantStock as Record<string, number>) };
          if (vStock[variantKey] !== undefined) {
            vStock[variantKey] = Math.max(0, vStock[variantKey] - data.quantity);
            newVariantStock = vStock;
          }
        }
      }

      await tx.batch.update({
        where: { id: batchId },
        data: {
          remainingQuantity: newRemaining,
          ...(newVariantStock && { variantStock: newVariantStock })
        } as any
      });

      return { order, categoryId: batch.categoryId };
    });

    revalidatePath(`/admin/orders/batch/${batchId}`)
    revalidatePath(`/admin/orders/category/${result.categoryId}`)
    revalidatePath("/admin/orders")
    return { success: true, order: JSON.parse(JSON.stringify(result.order)) }
  } catch (error: any) {
    console.error("Failed to add order to batch:", error)
    return { success: false, error: error.message || "Failed to add order to batch" }
  }
}

export async function searchOrders(query?: string) {
  try {
    const activeFilter = {
      paymentStatus: { not: "REJECTED" },
      OR: [
        { statusId: null },
        { status: { isFinal: false } }
      ]
    }
    const trimmed = query ? query.trim() : ""

    // If empty or single char, return latest 100 active orders quickly without heavy ILIKE scan
    if (!trimmed || trimmed.length < 2) {
      const orders = await db.order.findMany({
        where: activeFilter,
        include: {
          batch: {
            include: { product: true, category: true }
          },
          status: true
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
    }

    const orders = await db.order.findMany({
      where: {
        AND: [
          activeFilter,
          {
            OR: [
              { accountNumber: { contains: trimmed, mode: 'insensitive' } },
              { customerPhone: { contains: trimmed, mode: 'insensitive' } },
              { customerName: { contains: trimmed, mode: 'insensitive' } },
              { batch: { product: { name: { contains: trimmed, mode: 'insensitive' } } } },
            ]
          }
        ]
      },
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to search orders:", error)
    return { success: false, error: "Failed to search orders" }
  }
}

export async function updateBatchOrderStatuses(batchId: string, statusId: string) {
  try {
    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: {
        orders: {
          include: { status: true }
        }
      }
    })

    if (!batch) return { success: false, error: "Batch not found" }

    const orderIdsToUpdate = batch.orders
      .filter((o: any) => o.paymentStatus === 'CONFIRMED' && !o.status?.isFinal)
      .map((o: any) => o.id)

    if (orderIdsToUpdate.length > 0) {
      await db.order.updateMany({
        where: { id: { in: orderIdsToUpdate } },
        data: { statusId }
      })
    }

    revalidatePath(`/admin/orders/batch/${batchId}`)
    revalidatePath("/admin/orders")

    return { success: true, count: orderIdsToUpdate.length }
  } catch (error: any) {
    console.error("Failed to update batch order statuses:", error)
    return { success: false, error: "Failed to update statuses" }
  }
}

export async function updateOrderStatus(orderId: string, statusId: string, reason?: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    let oldStatusName = "Тодорхойгүй"
    let newStatusName = ""

    const result = await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({
        where: { id: orderId },
        include: { status: true, batch: { include: { product: true } } }
      })

      if (!order) throw new Error("Order not found")
      oldStatusName = order.status?.name || "Тодорхойгүй"

      const newStatus = await tx.orderStatusType.findUnique({
        where: { id: statusId }
      })

      if (!newStatus) throw new Error("Status not found")
      newStatusName = newStatus.name

      const isToCancelled = newStatus.name === "Цуцлагдсан"
      const isFromCancelled = order.status?.name === "Цуцлагдсан" || order.paymentStatus === "REJECTED"

      const updateData: any = { statusId }

      // 1. Transition TO Cancelled
      if (isToCancelled && !isFromCancelled) {
        updateData.paymentStatus = "REJECTED"
        updateData.cancellationReason = reason || null
        const batchUpdateData: any = {}

        if (order.batch?.variantStock && typeof order.batch.variantStock === 'object') {
          const variantStock = { ...(order.batch.variantStock as Record<string, number>) }
          const variantKey = getVariantKey(order.batch.product?.options, order.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] += order.quantity
            batchUpdateData.variantStock = variantStock
          }
          batchUpdateData.remainingQuantity = getVariantStockTotal(variantStock)
        } else {
          batchUpdateData.remainingQuantity = { increment: order.quantity }
        }

        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: batchUpdateData
        })
      }
      // 2. Transition FROM Cancelled (Restore)
      else if (!isToCancelled && isFromCancelled) {
        const batchUpdateData: any = {}

        if (order.batch?.variantStock && typeof order.batch.variantStock === 'object') {
          const variantStock = { ...(order.batch.variantStock as Record<string, number>) }
          const variantKey = getVariantKey(order.batch.product?.options, order.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            if (variantStock[variantKey] < order.quantity) {
              throw new Error(`Энэ сонголтын нөөц хүрэлцээгүй байна (Үлдэгдэл: ${variantStock[variantKey]})`)
            }
            variantStock[variantKey] = Math.max(0, variantStock[variantKey] - order.quantity)
            batchUpdateData.variantStock = variantStock
          }
          batchUpdateData.remainingQuantity = getVariantStockTotal(variantStock)
        } else {
          if (order.batch.remainingQuantity < order.quantity) {
            throw new Error(`Нөөц хүрэлцээгүй байна (Үлдэгдэл: ${order.batch.remainingQuantity})`)
          }
          batchUpdateData.remainingQuantity = { decrement: order.quantity }
        }

        updateData.paymentStatus = "PENDING" // Reset to pending for admin to re-confirm if needed
        updateData.cancellationReason = null // Clear reason on restore

        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: batchUpdateData
        })
      }

      // 3. If transitioning to a "self-pickup" final status, reset wantsDelivery
      //    so the order is removed from the delivery queue
      if (newStatus.isFinal && newStatus.name === "Өөрөө ирж авсан" && order.wantsDelivery) {
        updateData.wantsDelivery = false
      }

      // 4. If transitioning to delivery status, ensure wantsDelivery=true and address placeholder if empty
      const isDeliveryStatus = ["Хүргэлтийн ажилтанд өгсөн", "Хүргэлтэд гарсан"].includes(newStatus.name)
      if (isDeliveryStatus) {
        updateData.wantsDelivery = true
        const currentAddr = (order.deliveryAddress || "").trim()
        if (!currentAddr || currentAddr === "Өөрөө ирж авна" || currentAddr === "Өөрөө авна") {
          updateData.deliveryAddress = "Хаяг тодруулах шаардлагатай"
        }
        if (!order.deliveryRequestedAt) {
          updateData.deliveryRequestedAt = new Date()
        }
      }

      return await (tx.order as any).update({
        where: { id: orderId },
        data: updateData
      })
    })

    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/rejected")
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/picked-up")
    await logAdminActivity({
      action: "ТӨЛӨВ_ӨӨРЧИЛСӨН",
      type: "ORDER",
      target: `Захиалга #${result.orderNumber}`,
      targetUrl: `/admin/orders/search?q=${result.orderNumber}`,
      detail: `Төлөв: '${oldStatusName}' -> '${newStatusName}'${reason ? ` (Шалтгаан: ${reason})` : ""}`,
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
    })
    return { success: true, order: JSON.parse(JSON.stringify(result)) }
  } catch (error: any) {
    console.error("Failed to update order status:", error)
    return { success: false, error: error.message || "Failed to update status" }
  }
}

export async function updateOrderDetails(orderId: string, data: any) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    if (data.quantity !== undefined) {
      const q = Number(data.quantity)
      if (isNaN(q) || q < 1) {
        return { success: false, error: "Барааны тоо ширхэг 1-ээс бага байж болохгүй." }
      }
      data.quantity = q
    }

    if (data.customerPhone !== undefined) {
      data.customerPhone = String(data.customerPhone).replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
    }

    const oldOrder = await db.order.findUnique({ where: { id: orderId } })
    if (!oldOrder) return { success: false, error: "Захиалга олдсонгүй" }

    const result = await db.$transaction(async (tx) => {
      // If quantity changed, adjust batch inventory
      if (data.quantity !== undefined && data.quantity !== oldOrder.quantity) {
        const diff = data.quantity - oldOrder.quantity
        const batch = await (tx.batch as any).findUnique({
          where: { id: oldOrder.batchId },
          include: { product: true }
        })
        if (batch?.variantStock && typeof batch.variantStock === 'object') {
          const variantStock = { ...(batch.variantStock as Record<string, number>) }
          const variantKey = getVariantKey(batch.product?.options, oldOrder.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] = Math.max(0, variantStock[variantKey] - diff)
          }
          await (tx.batch as any).update({
            where: { id: oldOrder.batchId },
            data: {
              variantStock,
              remainingQuantity: getVariantStockTotal(variantStock)
            }
          })
        } else {
          await (tx.batch as any).update({
            where: { id: oldOrder.batchId },
            data: { remainingQuantity: { decrement: diff } }
          })
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          accountNumber: data.accountNumber,
          cargoFee: data.cargoFee,
          ...(data.selectedOptions !== undefined && { selectedOptions: data.selectedOptions })
        } as any
      })
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Захиалга засварлав",
      target: "Захиалга",
      detail: `#${result.orderNumber} дугаартай захиалгын мэдээллийг шинэчлэв`,
    })

    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      include: { batch: { include: { product: true } }, status: true }
    })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }

    await db.$transaction(async (tx) => {
      // 1. Restore batch inventory ONLY if order was not cancelled/rejected
      const isCancelled = order.status?.name === "Цуцлагдсан" || order.paymentStatus === "REJECTED"
      if (!isCancelled && order.batch) {
        if (order.batch.variantStock && typeof order.batch.variantStock === 'object') {
          const variantStock = { ...(order.batch.variantStock as Record<string, number>) }
          const variantKey = getVariantKey(order.batch.product?.options, order.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] += order.quantity
          }
          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: {
              variantStock,
              remainingQuantity: getVariantStockTotal(variantStock)
            }
          })
        } else {
          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { increment: order.quantity } }
          })
        }
      }

      // 2. Delete order
      await tx.order.delete({ where: { id: orderId } })
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Захиалга устгав",
      target: "Захиалга",
      detail: `#${order.orderNumber} захиалгыг устгалаа`,
    })

    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function restoreGroupOrder(orderIds: string[]) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const defaultStatus = await db.orderStatusType.findFirst({
      where: { isDefault: true } as any
    })

    const result = await db.$transaction(async (tx) => {
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } },
        include: { batch: { include: { product: true } } }
      })

      // Check stock for ALL orders in the group before proceeding
      for (const order of orders) {
        if (order.batch?.variantStock && typeof order.batch.variantStock === 'object') {
          const variantStock = order.batch.variantStock as Record<string, number>
          const variantKey = getVariantKey(order.batch.product?.options, order.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            if (variantStock[variantKey] < order.quantity) {
              throw new Error(`'${order.batch.product?.name || "Бараа"}' сонголтын нөөц хүрэлцээгүй байна`)
            }
          }
        } else if (order.batch.remainingQuantity < order.quantity) {
          throw new Error(`'${order.batch.product?.name || "Бараа"}' нөөц хүрэлцээгүй байна (Үлдэгдэл: ${order.batch.remainingQuantity})`)
        }
      }

      // Update orders
      await (tx.order as any).updateMany({
        where: { id: { in: orderIds } },
        data: {
          statusId: defaultStatus?.id || null,
          paymentStatus: "PENDING",
          cancellationReason: null // Clear reason on restore
        } as any
      })

      // Decrement stock for each
      for (const order of orders) {
        if (order.batch?.variantStock && typeof order.batch.variantStock === 'object') {
          const currentBatch = await (tx.batch as any).findUnique({
            where: { id: order.batchId },
            include: { product: true }
          })
          const variantStock = { ...(currentBatch?.variantStock as Record<string, number> || {}) }
          const variantKey = getVariantKey(currentBatch?.product?.options, order.selectedOptions)
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] = Math.max(0, variantStock[variantKey] - order.quantity)
          }
          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: {
              variantStock,
              remainingQuantity: getVariantStockTotal(variantStock)
            }
          })
        } else {
          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { decrement: order.quantity } }
          })
        }
      }

      return true
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Захиалга сэргээв",
      target: "Захиалгууд",
    })

    revalidatePath("/admin/orders")
    revalidatePath("/track")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Moves multiple orders from their current batches to a target batch.
 * Correctly updates inventory (remainingQuantity) for all involved batches.
 */
export async function moveOrdersToBatch(orderIds: string[], targetBatchId: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    await db.$transaction(async (tx) => {
      // 1. Get the target batch
      const targetBatch = await (tx.batch as any).findUnique({ where: { id: targetBatchId } })
      if (!targetBatch) throw new Error("Target batch not found")

      // 2. Get the orders to move
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } }
      })

      for (const order of orders) {
        if (order.batchId === targetBatchId) continue

        // 3. Increment source batch inventory
        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: { remainingQuantity: { increment: order.quantity } }
        })

        // 4. Decrement target batch inventory
        await (tx.batch as any).update({
          where: { id: targetBatchId },
          data: { remainingQuantity: { decrement: order.quantity } }
        })

        // 5. Update order batch reference
        await (tx.order as any).update({
          where: { id: order.id },
          data: { batchId: targetBatchId }
        })
      }
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Захиалга шилжүүлэв",
      target: "Багц",
      detail: `${orderIds.length} ширхэг захиалгыг #${targetBatchId} багц руу шилжүүллээ`,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/search")
    return { success: true }
  } catch (error: any) {
    console.error("moveOrdersToBatch error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateBatchOrderStatusesByIds(
  orderIds: string[],
  statusId: string,
  reason?: string,
  options?: { allowOverrideFinal?: boolean }
) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: "Захиалга сонгогдоогүй байна" }
    }

    const targetStatus = await db.orderStatusType.findUnique({ where: { id: statusId } })
    if (!targetStatus) return { success: false, error: "Статус олдсонгүй" }

    const isToCancelled = targetStatus.name === "Цуцлагдсан"

    let updatedCount = 0
    let skippedFinalCount = 0

    await db.$transaction(async (tx) => {
      // 1. Get orders to check their previous statuses and batches
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } },
        include: { status: true }
      })

      for (const order of orders) {
        // Protect completed/final orders from being reverted to active/in-transit statuses during bulk actions
        if (!targetStatus.isFinal && order.status?.isFinal && !options?.allowOverrideFinal) {
          skippedFinalCount++
          continue
        }

        const isFromCancelled = order.status?.name === "Цуцлагдсан"
        const updateData: any = { statusId }

        // Logic for transitioning TO Cancelled
        if (isToCancelled && !isFromCancelled) {
          updateData.paymentStatus = "REJECTED"
          updateData.cancellationReason = reason || null

          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { increment: order.quantity } }
          })
        }
        // Logic for transitioning FROM Cancelled
        else if (!isToCancelled && isFromCancelled) {
          // Check stock
          const batch = await (tx.batch as any).findUnique({ where: { id: order.batchId } })
          if (batch.remainingQuantity < order.quantity) {
            throw new Error(`'${order.orderNumber}' захиалгын барааны нөөц хүрэлцээгүй (Үлдэгдэл: ${batch.remainingQuantity})`)
          }

          updateData.paymentStatus = "PENDING"
          updateData.cancellationReason = null

          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { decrement: order.quantity } }
          })
        }

        // Logic for transitioning TO Delivery status
        const isDeliveryStatus = ["Хүргэлтийн ажилтанд өгсөн", "Хүргэлтэд гарсан"].includes(targetStatus.name)
        if (isDeliveryStatus) {
          updateData.wantsDelivery = true
          const currentAddr = (order.deliveryAddress || "").trim()
          if (!currentAddr || currentAddr === "Өөрөө ирж авна" || currentAddr === "Өөрөө авна") {
            updateData.deliveryAddress = "Хаяг тодруулах шаардлагатай"
          }
          if (!order.deliveryRequestedAt) {
            updateData.deliveryRequestedAt = new Date()
          }
        } else if (targetStatus.isFinal && targetStatus.name === "Өөрөө ирж авсан" && order.wantsDelivery) {
          updateData.wantsDelivery = false
        }

        await (tx.order as any).update({
          where: { id: order.id },
          data: updateData
        })
        updatedCount++
      }
    })

    const skippedDetail = skippedFinalCount > 0 ? ` (${skippedFinalCount} дууссан захиалга алгасагдсан)` : ""
    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сайтын админ",
      userRole: adminMode.role,
      action: "Багц статус баталгаажуулав",
      target: "Захиалгууд",
      detail: `${updatedCount} ширхэг захиалгыг '${targetStatus?.name || statusId}' төлөвт шилжүүллээ.${skippedDetail} ${isToCancelled ? `Шалтгаан: ${reason || "Тайлбаргүй"}` : ""}`,
    })

    // Revalidate widespread paths due to mass update
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/rejected")
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/delivered")
    revalidatePath("/admin/orders/picked-up")
    revalidatePath("/track")
    await logAdminActivity({
      action: "ОЛНООР_ТӨЛӨВ_СОЛЬСОН",
      type: "ORDER",
      target: `${updatedCount} захиалга`,
      targetUrl: `/admin/orders/search`,
      detail: `Шинэ төлөв: '${targetStatus.name}'. Амжилттай: ${updatedCount}, Алгассан: ${skippedFinalCount}${reason ? ` (Шалтгаан: ${reason})` : ""}`,
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
    })

    return { success: true, count: updatedCount, skippedFinalCount }
  } catch (error: any) {
    console.error("Failed to update bulk order statuses by IDs:", error)
    return { success: false, error: error.message || "Failed to update bulk statuses" }
  }
}

export async function getQPayInvoiceForOrder(transactionRef: string) {
  try {
    const orders = await (db.order as any).findMany({
      where: { transactionRef }
    })

    if (!orders || orders.length === 0) return { success: false, error: "N/A" }

    // If already generated, return existing
    if (orders[0].qpayInvoiceId && orders[0].qpayQrText) {
      return {
        success: true,
        qpayQrText: orders[0].qpayQrText,
        qpayUrls: orders[0].qpayUrls
      }
    }

    // Otherwise generate new invoice
    const { createQPayInvoice } = await import("@/lib/qpay")
    const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0)

    if (totalAmount <= 0) return { success: false, error: "Amount is 0" }

    const invoiceRes = await createQPayInvoice({
      transactionRef,
      amount: totalAmount,
      description: `AnarKoreaShop - Order ${transactionRef}`
    })

    if (!invoiceRes.success || !invoiceRes.data) {
      return { success: false, error: invoiceRes.error }
    }

    const { invoice_id, qr_text, urls } = invoiceRes.data

    // Save to DB
    await (db.order as any).updateMany({
      where: { transactionRef },
      data: {
        qpayInvoiceId: invoice_id,
        qpayQrText: qr_text,
        qpayUrls: urls
      }
    })

    return { success: true, qpayQrText: qr_text, qpayUrls: urls }
  } catch (err: any) {
    console.error("Failed to generate QPay invoice:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Customer requests home delivery from the track page.
 * Generates a QPay invoice for the delivery fee.
 */
export async function requestDelivery(orderIds: string[], deliveryAddress: string, deliveryDate?: string) {
  try {
    const orders = await (db.order as any).findMany({
      where: { id: { in: orderIds } },
      include: {
        status: true,
        batch: {
          include: {
            product: true
          }
        }
      }
    })
    if (!orders || orders.length === 0) return { success: false, error: "Захиалга олдсонгүй" }

    // Security check: Must have a valid phone number (at least 8 digits, not all zeros, not dummy placeholder)
    const invalidPhoneOrders = orders.filter((o: any) => {
      const p = (o.customerPhone || "").replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim();
      return !p || p === "00000000" || /^0+$/.test(p) || p.length < 8;
    });

    if (invalidPhoneOrders.length > 0) {
      return {
        success: false,
        error: "Утасны дугаар дутуу эсвэл баталгаажаагүй захиалгыг хүргэлтэд өгөх боломжгүй. Та салбараас өөрийн биеэр авах эсвэл дэлгүүрийн админтай холбогдож утасны дугаараа баталгаажуулна уу."
      };
    }

    // Only target orders that are deliverable and haven't requested delivery yet
    const eligibleOrders = orders.filter((o: any) => !o.wantsDelivery && o.status?.isDeliverable)
    if (eligibleOrders.length === 0) return { success: false, error: "Хүргэлт захиалах боломжтой бараа олдсонгүй" }

    const eligibleIds = eligibleOrders.map((o: any) => o.id)

    const { getShopSettings } = await import("./settings-actions")
    const settings = await getShopSettings()
    const deliveryFee = Number(settings.delivery_fee || "8000")

    // Calculate total cargo fee for eligible orders
    let totalCargoFee = 0
    for (const o of eligibleOrders) {
      if (o.batch?.product?.isFreeCargo || o.batch?.isFreeCargo) {
        continue // Free cargo item
      }
      const unitCargoFee = Number(o.batch?.cargoFeeStatus || 0) * Number(o.batch?.product?.weight || 0)
      const customCargoFee = Number(o.cargoFee || 0)
      const orderFee = customCargoFee > 0 ? customCargoFee * Number(o.quantity || 1) : unitCargoFee * Number(o.quantity || 1)
      totalCargoFee += orderFee
    }

    const totalPayableFee = totalCargoFee + deliveryFee

    if (totalPayableFee <= 0) {
      // Free delivery & cargo: immediate confirm
      await (db.order as any).updateMany({
        where: { id: { in: eligibleIds } },
        data: {
          wantsDelivery: true,
          deliveryFeePaid: true,
          deliveryAddress: deliveryAddress.trim(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          deliveryRequestedAt: new Date()
        }
      })

      // Emit notification for admin
      const { emitDeliveryRequest } = await import("@/lib/orderEvents")
      emitDeliveryRequest({
        customerName: eligibleOrders[0]?.customerName || "Хэрэглэгч",
        customerPhone: eligibleOrders[0]?.customerPhone || "",
        address: deliveryAddress.trim(),
        orderCount: eligibleIds.length,
        createdAt: new Date().toISOString()
      })

      revalidatePath("/track")
      return { success: true, directlyConfirmed: true }
    }

    // Notice: We DO NOT mutate wantsDelivery in DB yet.
    // The delivery request will only be recorded once the customer confirms their bank transfer via confirmManualDeliveryRequest.
    const rawPhone = eligibleOrders[0]?.customerPhone || ""
    const cleanPhone = rawPhone.replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
    const bankNote = `${cleanPhone} хүргэлт`
    const instruction = settings.cargo_payment_instruction || "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү."

    return {
      success: true,
      isManual: true,
      manualData: {
        fee: totalPayableFee,
        cargoFee: totalCargoFee,
        deliveryFee: deliveryFee,
        bank_name: settings.cargo_bank_name || "Төрийн Банк",
        bank_account: settings.cargo_bank_account || "MN660034171700066647",
        bank_holder: settings.cargo_bank_holder || "Мөнхбат Буяннэмэх",
        bank_note: bankNote,
        instruction: instruction
      }
    }
  } catch (err: any) {
    console.error("requestDelivery error:", err)
    return { success: false, error: err.message }
  }
}

export async function confirmManualDeliveryRequest(orderIds: string[], address: string, deliveryDate?: string, senderAccount?: string) {
  try {
    // Fetch orders first to get customer info for notification and verification
    const orders = await (db.order as any).findMany({
      where: { id: { in: orderIds } },
      select: { id: true, customerName: true, customerPhone: true, accountNumber: true }
    })
    if (!orders || orders.length === 0) return { success: false, error: "Захиалга олдсонгүй" }

    // Security check: Must have a valid phone number
    const invalidPhoneOrders = orders.filter((o: any) => {
      const p = (o.customerPhone || "").replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim();
      return !p || p === "00000000" || /^0+$/.test(p) || p.length < 8;
    });

    if (invalidPhoneOrders.length > 0) {
      return {
        success: false,
        error: "Утасны дугаар дутуу эсвэл баталгаажаагүй захиалгыг хүргэлтэд өгөх боломжгүй. Та салбараас өөрийн биеэр авах эсвэл дэлгүүрийн админтай холбогдож утасны дугаараа баталгаажуулна уу."
      };
    }

    const updateData: any = {
      wantsDelivery: true,
      deliveryFeePaid: false, // Pending manual verification by admin
      deliveryAddress: address.trim(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      deliveryRequestedAt: new Date()
    }
    if (senderAccount && senderAccount.trim()) {
      updateData.accountNumber = senderAccount.trim()
    }

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: updateData
    })

    // Emit notification for admin
    const { emitDeliveryRequest } = await import("@/lib/orderEvents")
    emitDeliveryRequest({
      customerName: orders[0]?.customerName || "Хэрэглэгч",
      customerPhone: orders[0]?.customerPhone || "",
      address: address.trim(),
      orderCount: orderIds.length,
      createdAt: new Date().toISOString()
    })

    revalidatePath("/track")
    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function checkDeliveryPayment(orderIds: string[], invoiceId: string) {
  try {
    const { getShopSettings } = await import("@/app/actions/settings-actions")
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      return { success: false, error: "QPay одоогоор идэвхгүй байна" }
    }

    const orders = await (db.order as any).findMany({
      where: { id: { in: orderIds } },
      select: { customerPhone: true }
    });
    const invalidPhoneOrders = orders.filter((o: any) => {
      const p = (o.customerPhone || "").replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim();
      return !p || p === "00000000" || /^0+$/.test(p) || p.length < 8;
    });
    if (invalidPhoneOrders.length > 0) {
      return {
        success: false,
        error: "Утасны дугаар дутуу тул хүргэлтийн төлбөр шалгах боломжгүй."
      };
    }

    const { checkQPayPayment } = await import("@/lib/qpay")
    const checkRes = await checkQPayPayment(invoiceId)

    if (checkRes.success && checkRes.data && checkRes.data.paid_amount > 0) {
      await (db.order as any).updateMany({
        where: { id: { in: orderIds } },
        data: {
          wantsDelivery: true,
          deliveryFeePaid: true
        }
      })
      revalidatePath("/track")
      revalidatePath("/admin/orders")
      return { success: true, paid: true }
    }

    return { success: true, paid: false }
  } catch (err: any) {
    console.error("checkDeliveryPayment error:", err)
    return { success: false, error: err.message }
  }
}

export async function checkOrderPayment(transactionRef: string) {
  try {
    const { getShopSettings } = await import("@/app/actions/settings-actions")
    const settings = await getShopSettings()
    if (settings.qpay_enabled !== "true") {
      return { success: false, error: "QPay одоогоор идэвхгүй байна" }
    }

    const orders = await (db.order as any).findMany({
      where: { transactionRef }
    })

    if (!orders || orders.length === 0) return { success: false, error: "Захиалга олдсонгүй" }
    if (orders[0].paymentStatus === "CONFIRMED") return { success: true, paid: true }

    const invoiceId = orders[0].qpayInvoiceId
    if (!invoiceId) return { success: false, error: "QPay нэхэмжлэх үүсээгүй байна" }

    const { checkQPayPayment } = await import("@/lib/qpay")
    const checkRes = await checkQPayPayment(invoiceId)

    if (checkRes.success && checkRes.data.count > 0) {
      const paidRow = checkRes.data.rows?.find((r: any) => r.payment_status === "PAID")
      if (paidRow) {
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
        const res = await fetch(`${baseUrl}/api/qpay/callback?ref=${transactionRef}&payment_id=${paidRow.payment_id}`, { method: 'POST', cache: 'no-store' });
        if (res.ok) {
          revalidatePath(`/order-pending/ref/${transactionRef}`);
          revalidatePath("/");
          return { success: true, paid: true };
        } else {
          return { success: false, error: "Төлбөр шалгахад алдаа гарлаа (API)" }
        }
      }
    }
    return { success: true, paid: false }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


export async function forceAddDeliveryAddress(orderIds: string[], address: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: {
        wantsDelivery: true,
        deliveryFeePaid: true,
        deliveryAddress: address.trim(),
        deliveryRequestedAt: new Date()
      }
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
      action: "Хүргэлт нэмэв",
      target: "Захиалга багц",
      detail: `${orderIds.length} ширхэг захиалга дээр хаяг бүртгэж хүргэлтэнд гаргав.`,
    })

    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders/batch/[batchId]", "page")
    revalidatePath("/admin/orders/delivery")

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getOrdersArchive(page: number = 1, limit: number = 20, search: string = "") {
  try {
    const where: any = {
      paymentStatus: "CONFIRMED",
      statusId: { not: null },
      status: { isFinal: true }
    };

    if (search) {
      const numQ = Number(search);
      const isSafeInt = !isNaN(numQ) && Number.isInteger(numQ) && numQ > 0 && numQ <= 2147483647;
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        ...(isSafeInt ? [
          { orderNumber: numQ },
          { batch: { batchNumber: numQ } }
        ] : [])
      ]
    }

    const total = await db.order.count({ where });
    const orders = await (db.order as any).findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        accountNumber: true,
        quantity: true,
        totalAmount: true,
        transactionRef: true,
        paymentStatus: true,
        wantsDelivery: true,
        deliveryAddress: true,
        createdAt: true,
        updatedAt: true,
        batchId: true,
        confirmedById: true,
        confirmationMethod: true,
        confirmedAt: true,
        confirmedBy: {
          select: {
            id: true,
            name: true
          }
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        status: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip: (Math.max(1, page) - 1) * limit,
      take: limit
    });

    return { success: true, orders: JSON.parse(JSON.stringify(orders)), total };
  } catch (error: any) {
    return { success: false, error: error.message, orders: [], total: 0 };
  }
}

export async function getArchivedConfirmedOrders(page: number = 1, limit: number = 20, search: string = "") {
  try {
    const where: any = {
      paymentStatus: "CONFIRMED",
      statusId: { not: null }
    };

    if (search) {
      const numQ = Number(search);
      const isSafeInt = !isNaN(numQ) && Number.isInteger(numQ) && numQ > 0 && numQ <= 2147483647;
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        ...(isSafeInt ? [
          { orderNumber: numQ },
          { batch: { batchNumber: numQ } }
        ] : [])
      ]
    }

    const total = await db.order.count({ where });
    const orders = await (db.order as any).findMany({
      where,
      include: {
        batch: { include: { product: true, category: true } },
        status: true,
        confirmedBy: { select: { name: true } }
      },
      orderBy: { updatedAt: "desc" },
      skip: (Math.max(1, page) - 1) * limit,
      take: limit
    });

    return { success: true, orders: JSON.parse(JSON.stringify(orders)), total };
  } catch (error: any) {
    return { success: false, error: error.message, orders: [], total: 0 };
  }
}

export async function getRefundOrders({ tab = "pending", page = 1, limit = 50 }: { tab?: string, page?: number, limit?: number } = {}) {
  try {
    const isRefunded = tab === "completed";

    // Зөвхөн бодитоор төлбөр төлөгдсөн бөгөөд "Буцаагдсан" эсвэл цуцлагдсан бодит буцаалтуудыг шүүнэ.
    // Төлбөр төлөөгүй, автоматаар хугацаа хэтэрч цуцлагдсан сагснуудыг хасна.
    const refundTargetCondition = {
      OR: [
        { status: { name: { contains: "Буцаагдсан" } } },
        {
          status: { name: "Цуцлагдсан" },
          paymentStatus: "CONFIRMED"
        }
      ]
    };

    const whereCondition = isRefunded
      ? { isRefunded: true, ...refundTargetCondition }
      : { isRefunded: false, ...refundTargetCondition };

    const [orders, totalCount, pendingCount, completedCount] = await Promise.all([
      (db.order as any).findMany({
        where: whereCondition,
        include: {
          batch: { include: { product: true, category: true } },
          status: true
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      (db.order as any).count({ where: whereCondition }),
      (db.order as any).count({ where: { isRefunded: false, ...refundTargetCondition } }),
      (db.order as any).count({ where: { isRefunded: true, ...refundTargetCondition } })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
      totalCount,
      totalPages,
      pendingCount,
      completedCount,
      page
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleOrderRefund(orderId: string, isRefunded?: boolean) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }

    const targetState = isRefunded !== undefined ? isRefunded : !order.isRefunded

    await db.order.update({
      where: { id: orderId },
      data: { isRefunded: targetState } as any
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Буцаалт төлөв өөрчлөв",
      target: "Захиалга",
      detail: `#${order.orderNumber} захиалгын буцаалтын төлөвийг өөрчиллөө`,
    })

    revalidatePath("/admin/orders/refunds")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * АВТОМАТ ЦУЦЛАЛТЫН ЛОГИК (CRON)
 * 48 цагаас дээш хугацаанд баталгаажаагүй "PENDING" захиалгуудыг автоматаар цуцална.
 */
export async function autoCancelExpiredOrders() {
  try {
    // 1. "Цуцлагдсан" статусын ID-г олж авах (Уян хатан хайлт)
    const cancelledStatus = await db.orderStatusType.findFirst({
      where: {
        OR: [
          { name: "Цуцлагдсан" },
          { name: "Rejected" },
          { name: { contains: "Цуцл" } },
          { name: { contains: "цуцл" } }
        ]
      }
    })

    if (!cancelledStatus) {
      // Хэрэв олдохгүй бол системийн бүх статусыг консол дээр хэвлэж харуулна (Оношилгоонд зориулж)
      const allStatuses = await db.orderStatusType.findMany({ select: { name: true } });
      const statusNames = allStatuses.map(s => s.name).join(", ");
      throw new Error(`Цуцлах статус олдсонгүй. Боломжит статусууд: ${statusNames}`);
    }

    // 2. 48 цагийн өмнөх хугацааг тооцоолох
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 48)

    // 3. Хугацаа нь хэтэрсэн захиалгуудыг шүүх
    const expiredOrders = await (db.order as any).findMany({
      where: {
        paymentStatus: "PENDING",
        createdAt: { lt: cutoffDate },
        // Зөвхөн админ баталгаажуулаагүй (ConfirmedAt null) захиалгуудыг цуцална
        confirmedAt: null,
        // Зөвхөн вэб захиалгуудыг цуцална — админ оруулсан захиалгыг хэзээ ч цуцлахгүй
        OR: [
          { creationSource: null },
          { creationSource: { not: "ADMIN" } }
        ]
      }
    })

    if (expiredOrders.length === 0) {
      return { success: true, count: 0, message: "Цуцлах захиалга олдсонгүй" }
    }

    console.log(`[CRON] ${expiredOrders.length} expired orders found. Starting auto-cancellation...`)

    const results = []

    // 4. Захиалга бүрийг тус бүрд нь Transaction-оор цуцлах (нөөц буцаах)
    for (const order of expiredOrders) {
      try {
        await db.$transaction(async (tx) => {
          // Захиалгыг цуцлах
          await (tx.order as any).update({
            where: { id: order.id },
            data: {
              paymentStatus: "REJECTED",
              statusId: cancelledStatus.id,
              cancellationReason: "Системээс автоматаар цуцлав (48ц)"
            }
          })

          // Барааны үлдэгдлийг буцаан нэмэх + variant stock
          const batchUpdateData: any = {}

          if (order.selectedOptions && typeof order.selectedOptions === 'object') {
            const batch = await (tx.batch as any).findUnique({
              where: { id: order.batchId },
              include: { product: true }
            })
            if (batch?.variantStock && typeof batch.variantStock === 'object') {
              const variantStock = { ...(batch.variantStock as Record<string, number>) }
              const variantKey = getVariantKey(batch.product?.options, order.selectedOptions)
              if (variantKey && variantStock[variantKey] !== undefined) {
                variantStock[variantKey] += order.quantity
                batchUpdateData.variantStock = variantStock
              }
              batchUpdateData.remainingQuantity = getVariantStockTotal(variantStock)
            } else {
              batchUpdateData.remainingQuantity = { increment: order.quantity }
            }
          } else {
            batchUpdateData.remainingQuantity = { increment: order.quantity }
          }

          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: batchUpdateData
          })
        })
        results.push({ id: order.id, success: true })
      } catch (err: any) {
        console.error(`[CRON] Failed to cancel order ${order.id}:`, err)
        results.push({ id: order.id, success: false, error: err.message })
      }
    }

    // 5. Кэшийг шинэчлэх
    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders/rejected")
    revalidatePath("/admin/orders/search")
    revalidatePath("/track")

    const successCount = results.filter(r => r.success).length
    console.log(`[CRON] Successfully cancelled ${successCount}/${expiredOrders.length} orders.`)

    return {
      success: true,
      count: successCount,
      total: expiredOrders.length
    }
  } catch (error: any) {
    console.error("[CRON] Fatal error in autoCancelExpiredOrders:", error)
    return { success: false, error: error.message }
  }
}

export async function getOverdueStorageOrders() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await (db.order as any).findMany({
      where: {
        paymentStatus: "CONFIRMED",
        status: {
          isDeliverable: true,
          isFinal: false
        },
        updatedAt: {
          lt: thirtyDaysAgo
        }
      },
      include: {
        batch: { include: { product: true } },
        status: true
      },
      orderBy: { updatedAt: "asc" }
    });

    return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrderAdminNotes(orderId: string, notes: string) {
  try {
    await (db.order as any).update({
      where: { id: orderId },
      data: { adminNotes: notes }
    });
    revalidatePath("/admin/orders/overdue-storage");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getRecentOrderNotifications() {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, data: [] }

    const recentOrders = await (db.order as any).findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        batch: { include: { product: true } }
      }
    })

    const grouped: any = {}

    for (const o of recentOrders) {
      const ref = o.transactionRef || o.id
      if (!grouped[ref]) {
        grouped[ref] = {
          type: "new-order",
          transactionRef: o.transactionRef,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          totalAmount: 0,
          wantsDelivery: o.wantsDelivery,
          createdAt: o.createdAt.toISOString(),
          items: []
        }
      }
      grouped[ref].totalAmount += Number(o.totalAmount || 0)
      grouped[ref].items.push({
        orderId: o.id,
        productName: o.batch?.product?.name || "Бараа",
        quantity: o.quantity,
        totalAmount: Number(o.totalAmount || 0),
        batchId: o.batchId,
        selectedOptions: o.selectedOptions
      })
    }

    const sortedNotifications = Object.values(grouped)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return { success: true, data: sortedNotifications }
  } catch (error) {
    return { success: false, data: [] }
  }
}

export async function updateDeliveryAddressForOrders(orderIds: string[], newAddress: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    if (!orderIds || orderIds.length === 0) return { success: false, error: "Захиалга сонгогдоогүй" }
    const trimmedAddress = (newAddress || "").trim()
    if (!trimmedAddress) return { success: false, error: "Хаяг хоосон байна" }

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: {
        deliveryAddress: trimmedAddress,
        wantsDelivery: true
      }
    })

    await logAdminActivity({
      action: "ХҮРГЭЛТИЙН_ХАЯГ_ӨӨРЧИЛСӨН",
      type: "ORDER",
      target: `${orderIds.length} захиалга`,
      targetUrl: "/admin/orders/delivery",
      detail: `${orderIds.length} захиалгын хүргэлтийн хаягийг '${trimmedAddress}' болгож шинэчлэв.`,
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
    })

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/search")
    revalidatePath("/courier")
    revalidatePath("/track")

    return { success: true }
  } catch (err: any) {
    console.error("updateDeliveryAddressForOrders error:", err)
    return { success: false, error: err.message }
  }
}
