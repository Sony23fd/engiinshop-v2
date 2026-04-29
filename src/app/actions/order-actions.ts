"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { emitNewOrder } from "@/lib/orderEvents"
import { getCurrentAdmin, logActivity } from "@/lib/auth"
import { isValidPhone } from "@/lib/customer-utils"
import { isPhoneVerified } from "@/lib/verify-mn"
import { getShopSettings } from "./settings-actions"

export async function validateCartStock(items: { batchId: string; qty: number }[]) {
  const batchIds = items.map(i => i.batchId)
  const batches = await db.batch.findMany({
    where: { id: { in: batchIds } },
    select: { id: true, remainingQuantity: true, isAvailableForSale: true }
  })

  const errors: string[] = []
  for (const item of items) {
    const batch = batches.find(b => b.id === item.batchId)
    if (!batch || !batch.isAvailableForSale) {
      errors.push(`Бараа (${item.batchId}) худалдаанд байхгүй байна`)
    } else if (batch.remainingQuantity < item.qty) {
      errors.push(`Бараа хүрэлцэхгүй байна (үлдэгдэл: ${batch.remainingQuantity})`)
    }
  }
  return errors.length > 0 ? { success: false, errors } : { success: true, errors: [] }
}

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

export async function getPickedUpOrders(days: number = 30) {
  try {
    const whereClause: any = {
      status: { isFinal: true, name: "Өөрөө ирж авсан" },
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
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch picked up orders:", error)
    return { success: false, error: "Failed to fetch picked up orders" }
  }
}

export async function getDeliveredOrders(days: number = 30, page: number = 1, limit: number = 50) {
  try {
    const whereClause: any = {
      status: {
        isFinal: true,
        isCancelled: false
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

    return { 
      success: true, 
      orders: JSON.parse(JSON.stringify(orders))
    }
  } catch (error) {
    console.error("Failed to fetch delivered orders:", error)
    return { success: false, error: "Failed to fetch delivered orders" }
  }
}

export async function getDeliveryOrders(date?: string) {
  try {
    const whereClause: any = {
      paymentStatus: "CONFIRMED", // Must be confirmed by Main Admin first
      wantsDelivery: true,
      deliveryAddress: { not: "" },
      status: { isFinal: false }
    }

    if (date) {
      // date is in YYYY-MM-DD
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.OR = [
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
    }

    const orders = await (db.order as any).findMany({
      where: whereClause,
      include: {
        batch: { include: { product: true, category: true } },
        status: true
      },
      orderBy: { updatedAt: "desc" }
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error: any) {
    return { success: false, error: error.message, orders: [] }
  }
}

export async function confirmDeliveryGroup(orderIds: string[]) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const deliveredStatus = await db.orderStatusType.findFirst({
      where: { name: "Хүргэлтээр авсан", isFinal: true }
    })
    if (!deliveredStatus) return { success: false, error: "Хүргэлтээр авсан төлөв олдсонгүй" }

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

    revalidatePath("/admin/orders/delivery")
    revalidatePath("/admin/orders/delivered")
    revalidatePath("/admin/orders")

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
    revalidatePath("/admin/orders")
    revalidatePath("/track")

    return { success: true }
  } catch (err: any) {
    console.error("markDeliveryAsPickedUp error:", err)
    return { success: false, error: err.message }
  }
}

export async function getRejectedOrders(days: number = 30) {
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
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
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

export async function getOrdersByAccount(accountNumber: string) {
  try {
    const orders = await db.order.findMany({
      where: {
        accountNumber
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

export async function getOrdersByQuery(query: string) {
  try {
    const cleanQuery = query.trim();
    const isPhone = cleanQuery.match(/^(9|8|7|6)\d{7}$/) !== null;
    let whereClause: any = {};

    if (isPhone) {
      const settings = await getShopSettings();
      if (settings.phone_verification_enabled !== "false" && !isPhoneVerified(cleanQuery)) {
        return { success: false, error: "Утасны дугаар баталгаажаагүй байна", needsVerification: true, phone: cleanQuery };
      }
      whereClause = { customerPhone: cleanQuery };
    } else if (cleanQuery.startsWith("ORD-") || cleanQuery.startsWith("ANR") || cleanQuery.length === 8) {
      whereClause = { 
        OR: [
          { transactionRef: cleanQuery },
          { orderNumber: !isNaN(Number(cleanQuery)) ? Number(cleanQuery) : undefined }
        ]
      };
    } else {
      whereClause = { accountNumber: cleanQuery };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
    });
    
    // If it was a transactionRef search but found nothing, fallback to account search
    if (orders.length === 0 && !isPhone) {
       const fallbackOrders = await db.order.findMany({
         where: { accountNumber: cleanQuery },
         include: { batch: { include: { product: true, category: true } }, status: true },
         orderBy: { createdAt: "desc" },
       });
       return { success: true, orders: JSON.parse(JSON.stringify(fallbackOrders)) };
    }

    return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
  } catch (error) {
    console.error("Failed to fetch orders by query:", error);
    return { success: false, error: "Failed to fetch orders" };
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
    // Server-side phone validation (prevent DevTools bypass)
    if (data.phoneNumber && !isValidPhone(data.phoneNumber)) {
      return { success: false, error: "Зөв утасны дугаар оруулна уу (жишээ: 99112233)" }
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Get batch current state
      const batch = await tx.batch.findUnique({
        where: { id: data.batchId }
      });

      if (!batch) {
        throw new Error("Batch not found");
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

      // 3. Decrement remaining quantity atomically to prevent race conditions
      if (batch.remainingQuantity < data.quantity) {
        throw new Error("Бараа хүрэлцэхгүй байна")
      }

      const updateData: any = {
        remainingQuantity: { decrement: data.quantity }
      }

      // Variant stock management
      if ((batch as any).variantStock && data.selectedOptions && typeof data.selectedOptions === 'object') {
        const variantStock = { ...((batch as any).variantStock as Record<string, number>) }
        const optionValues = Object.values(data.selectedOptions as Record<string, string>)
        const variantKey = optionValues.join('-')

        if (variantKey && variantStock[variantKey] !== undefined) {
          if (variantStock[variantKey] < data.quantity) {
            throw new Error("Сонгосон хувилбарын бараа хүрэлцэхгүй байна")
          }
          variantStock[variantKey] = variantStock[variantKey] - data.quantity
          updateData.variantStock = variantStock
        }
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
}) {
  try {
    // Validate phone number if provided
    if (data.customerPhone && !isValidPhone(data.customerPhone)) {
      return { success: false, error: "Зөв утасны дугаар оруулна уу (жишээ: 99112233)" }
    }

    const result = await db.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId }
      });
      if (!batch) throw new Error("Batch not found");

      const admin = await getCurrentAdmin();
      const adminName = admin ? (admin.name || "Сайтын админ") : "Админ";

      const defaultStatus = await tx.orderStatusType.findFirst({ where: { isDefault: true } });
      const statusId = data.statusId || defaultStatus?.id;

      // @ts-ignore
      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          ...(data.accountNumber && { accountNumber: data.accountNumber }),
          ...(data.deliveryAddress && { deliveryAddress: data.deliveryAddress }),
          wantsDelivery: !!data.deliveryAddress && data.deliveryAddress.trim() !== "",
          quantity: data.quantity,
          batchId: batchId,
          paymentStatus: "CONFIRMED", // Admin-added orders are automatically confirmed
          creationSource: "ADMIN",
          createdByAdmin: adminName,
          ...(statusId && { statusId: statusId }),
          ...(data.cargoFee !== undefined && { cargoFee: data.cargoFee }),
          ...(data.arrivalDate && { arrivalDate: new Date(data.arrivalDate) }),
          ...(data.deliveryDate && { deliveryDate: new Date(data.deliveryDate) }),
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

    // Check if query is a number for totalAmount range search
    const isNumericQuery = query && !isNaN(Number(query))
    const numericQuery = isNumericQuery ? Number(query) : undefined

    const searchConditions: any[] = [
      { accountNumber: { contains: query, mode: 'insensitive' } },
      { customerPhone: { contains: query, mode: 'insensitive' } },
      { customerName: { contains: query, mode: 'insensitive' } },
      { transactionRef: { contains: query, mode: 'insensitive' } },
      { batch: { product: { name: { contains: query, mode: 'insensitive' } } } },
    ]

    if (isNumericQuery) {
      searchConditions.push({ orderNumber: numericQuery })
    }

    // For numeric queries, search totalAmount using range (e.g., "5000" matches 5000-5999, "50" matches 50-59)
    if (numericQuery !== undefined) {
      const queryStr = query!
      const multiplier = Math.pow(10, Math.max(0, 6 - queryStr.length)) // Adjust range based on input length
      const rangeStart = numericQuery
      const rangeEnd = numericQuery + multiplier - 1

      searchConditions.push({
        totalAmount: {
          gte: rangeStart,
          lte: rangeEnd
        }
      })
    }

    const orders = await db.order.findMany({
      where: query ? {
        OR: searchConditions
      } : activeFilter,
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

    const result = await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({
        where: { id: orderId },
        include: { status: true, batch: true }
      })

      if (!order) throw new Error("Order not found")

      const newStatus = await tx.orderStatusType.findUnique({
        where: { id: statusId }
      })

      if (!newStatus) throw new Error("Status not found")

      const isToCancelled = newStatus.name === "Цуцлагдсан"
      const isFromCancelled = order.status?.name === "Цуцлагдсан" || order.paymentStatus === "REJECTED"

      const updateData: any = { statusId }

      // 1. Transition TO Cancelled
      if (isToCancelled && !isFromCancelled) {
        updateData.paymentStatus = "REJECTED"
        updateData.cancellationReason = reason || null
        // Increment batch remaining quantity + variant stock
        const batchUpdateData: any = { remainingQuantity: { increment: order.quantity } }

        if (order.batch.variantStock && order.selectedOptions && typeof order.selectedOptions === 'object') {
          const variantStock = { ...(order.batch.variantStock as Record<string, number>) }
          const variantKey = Object.values(order.selectedOptions as Record<string, string>).join('-')
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] += order.quantity
            batchUpdateData.variantStock = variantStock
          }
        }

        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: batchUpdateData
        })
      }
      // 2. Transition FROM Cancelled (Restore)
      else if (!isToCancelled && isFromCancelled) {
        // Must check if enough stock exists to restore
        if (order.batch.remainingQuantity < order.quantity) {
          throw new Error(`Нөөц хүрэлцээгүй байна (Үлдэгдэл: ${order.batch.remainingQuantity})`)
        }

        updateData.paymentStatus = "PENDING" // Reset to pending for admin to re-confirm if needed
        updateData.cancellationReason = null // Clear reason on restore
        // Decrement batch remaining quantity + variant stock
        const batchUpdateData: any = { remainingQuantity: { decrement: order.quantity } }

        if (order.batch.variantStock && order.selectedOptions && typeof order.selectedOptions === 'object') {
          const variantStock = { ...(order.batch.variantStock as Record<string, number>) }
          const variantKey = Object.values(order.selectedOptions as Record<string, string>).join('-')
          if (variantKey && variantStock[variantKey] !== undefined) {
            variantStock[variantKey] = Math.max(0, variantStock[variantKey] - order.quantity)
            batchUpdateData.variantStock = variantStock
          }
        }

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

    const oldOrder = await db.order.findUnique({ where: { id: orderId } })
    if (!oldOrder) return { success: false, error: "Захиалга олдсонгүй" }

    const result = await db.$transaction(async (tx) => {
      // If quantity changed, adjust batch inventory
      if (data.quantity !== undefined && data.quantity !== oldOrder.quantity) {
        const diff = data.quantity - oldOrder.quantity
        await (tx.batch as any).update({
          where: { id: oldOrder.batchId },
          data: { remainingQuantity: { decrement: diff } }
        })
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
          cargoFee: data.cargoFee
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

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }

    await db.$transaction(async (tx) => {
      // 1. Restore batch inventory
      await (tx.batch as any).update({
        where: { id: order.batchId },
        data: { remainingQuantity: { increment: order.quantity } }
      })

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
        include: { batch: true }
      })

      // Check stock for ALL orders in the group before proceeding
      for (const order of orders) {
        if (order.batch.remainingQuantity < order.quantity) {
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
        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: { remainingQuantity: { decrement: order.quantity } }
        })
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

export async function updateBatchOrderStatusesByIds(orderIds: string[], statusId: string, reason?: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: "Захиалга сонгогдоогүй байна" }
    }

    const targetStatus = await db.orderStatusType.findUnique({ where: { id: statusId } })
    if (!targetStatus) return { success: false, error: "Статус олдсонгүй" }

    const isToCancelled = targetStatus.name === "Цуцлагдсан"

    await db.$transaction(async (tx) => {
      // 1. Get orders to check their previous statuses and batches
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } },
        include: { status: true }
      })

      for (const order of orders) {
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

        await (tx.order as any).update({
          where: { id: order.id },
          data: updateData
        })
      }
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сайтын админ",
      userRole: adminMode.role,
      action: "Багц статус баталгаажуулав",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг захиалгыг '${targetStatus?.name || statusId}' төлөвт шилжүүллээ. ${isToCancelled ? `Шалтгаан: ${reason || "Тайлбаргүй"}` : ""}`,
    })

    // Revalidate widespread paths due to mass update
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/rejected")

    return { success: true, count: orderIds.length }
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
      include: { status: true }
    })
    if (!orders || orders.length === 0) return { success: false, error: "Захиалга олдсонгүй" }

    // Only target orders that are deliverable and haven't requested delivery yet
    const eligibleOrders = orders.filter((o: any) => !o.wantsDelivery && o.status?.isDeliverable)
    if (eligibleOrders.length === 0) return { success: false, error: "Хүргэлт захиалах боломжтой бараа олдсонгүй" }

    const eligibleIds = eligibleOrders.map((o: any) => o.id)

    const { getShopSettings } = await import("./settings-actions")
    const settings = await getShopSettings()
    const deliveryFee = Number(settings.delivery_fee || "6000")
    const qpayEnabled = settings.qpay_enabled === "true"

    if (deliveryFee <= 0) {
      // Free delivery: immediate confirm
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

    // Force Cargo Manual Bank Transfer for Delivery Fee, bypassing QPay entirely
    return {
      success: true,
      isManual: true,
      manualData: {
        fee: deliveryFee,
        bank_name: settings.cargo_bank_name || "",
        bank_account: settings.cargo_bank_account || "",
        bank_holder: settings.cargo_bank_holder || "",
        bank_note: settings.cargo_payment_instruction || "Гүйлгээний утга дээр утасны дугаараа бичнэ үү"
      }
    }
  } catch (err: any) {
    console.error("requestDelivery error:", err)
    return { success: false, error: err.message }
  }
}

export async function confirmManualDeliveryRequest(orderIds: string[], address: string, deliveryDate?: string) {
  try {
    // Fetch orders first to get customer info for notification
    const orders = await (db.order as any).findMany({
      where: { id: { in: orderIds } },
      select: { customerName: true, customerPhone: true }
    })

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: {
        wantsDelivery: true,
        deliveryFeePaid: false, // Pending manual verification by admin
        deliveryAddress: address.trim(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        deliveryRequestedAt: new Date()
      }
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
      const isNum = !isNaN(Number(search));
      const numQ = Number(search);
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        ...(isNum ? [
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
      const isNum = !isNaN(Number(search));
      const numQ = Number(search);
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        ...(isNum ? [
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

export async function getRefundOrders() {
  try {
    const orders = await (db.order as any).findMany({
      where: {
        OR: [
          { paymentStatus: "REJECTED" },
          { isRefunded: true }
        ]
      },
      include: {
        batch: { include: { product: true, category: true } },
        status: true
      },
      orderBy: { updatedAt: "desc" }
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
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
 * 24 цагаас дээш хугацаанд баталгаажаагүй "PENDING" захиалгуудыг автоматаар цуцална.
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

    // 2. 24 цагийн өмнөх хугацааг тооцоолох
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)

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
          // Цуцлахын өмнө захиалга PENDING хэвээр байгаа эсэхийг дахин шалгах (race condition-аас хамгаалах)
          const freshOrder = await (tx.order as any).findUnique({
            where: { id: order.id },
            select: { paymentStatus: true, confirmedAt: true }
          })

          if (!freshOrder || freshOrder.paymentStatus !== "PENDING" || freshOrder.confirmedAt !== null) {
            console.log(`[CRON] Order ${order.id} is no longer PENDING — skipping.`)
            results.push({ id: order.id, success: true, skipped: true })
            return
          }

          // Захиалгыг цуцлах
          await (tx.order as any).update({
            where: { id: order.id },
            data: {
              paymentStatus: "REJECTED",
              statusId: cancelledStatus.id,
              cancellationReason: "Системээс автоматаар цуцлав (24ц)"
            }
          })

          // Барааны үлдэгдлийг буцаан нэмэх + variant stock
          const batchUpdateData: any = { remainingQuantity: { increment: order.quantity } }

          if (order.selectedOptions && typeof order.selectedOptions === 'object') {
            const batch = await (tx.batch as any).findUnique({ where: { id: order.batchId } })
            if (batch?.variantStock) {
              const variantStock = { ...(batch.variantStock as Record<string, number>) }
              const variantKey = Object.values(order.selectedOptions as Record<string, string>).join('-')
              if (variantKey && variantStock[variantKey] !== undefined) {
                variantStock[variantKey] += order.quantity
                batchUpdateData.variantStock = variantStock
              }
            }
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
