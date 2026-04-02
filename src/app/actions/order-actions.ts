"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { emitNewOrder } from "@/lib/orderEvents"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

export async function getOrders() {
  try {
    const orders = await db.order.findMany({
      where: {
        paymentStatus: { not: "REJECTED" },
        OR: [
          { statusId: null },
          { status: { isFinal: false } }
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
    console.error("Failed to fetch picked up orders:", error)
    return { success: false, error: "Failed to fetch picked up orders" }
  }
}

export async function getDeliveredOrders(days: number = 30) {
  try {
    const whereClause: any = {
      status: { isFinal: true, name: "Хүргэлтээр авсан" },
      paymentStatus: { not: "REJECTED" }
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
  } catch(err: any) {
    console.error("confirmDeliveryGroup error:", err)
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
export async function createOrder(data: {
  customerName: string
  phoneNumber: string
  accountNumber: string
  deliveryAddress?: string
  deliveryInstructions?: string
  quantity: number
  totalAmount: number
  batchId: string
  wantsDelivery?: boolean
  transactionRef?: string  // shared ref for multi-item cart checkout
}) {
  try {
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
          quantity: data.quantity,
          batchId: data.batchId,
          wantsDelivery: data.wantsDelivery ?? false,
          paymentStatus: "PENDING",
          totalAmount: data.totalAmount,
          transactionRef,
          creationSource: "WEB",
          ...(defaultStatus?.id && { statusId: defaultStatus.id })
        } as any
      });

      // 3. Decrement remaining quantity (clamp to 0, don't auto-close)
      const newQty = Math.max(0, batch.remainingQuantity - data.quantity)
      await tx.batch.update({
        where: { id: data.batchId },
        data: { remainingQuantity: newQty } as any
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
    const result = await db.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId }
      });
      if (!batch) throw new Error("Batch not found");

      const admin = await getCurrentAdmin();
      const adminName = admin ? (admin.name || "Сайтын админ") : "Админ";

      const defaultStatus = await tx.orderStatusType.findFirst();
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
    const orders = await db.order.findMany({
      where: query ? {
        AND: [
          activeFilter,
          {
            OR: [
              { accountNumber: { contains: query, mode: 'insensitive' } },
              { customerPhone: { contains: query, mode: 'insensitive' } },
              { customerName: { contains: query, mode: 'insensitive' } },
              { batch: { product: { name: { contains: query, mode: 'insensitive' } } } },
            ]
          }
        ]
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

export async function updateOrderStatus(orderId: string, statusId: string) {
  try {
    const order = await db.order.update({
      where: { id: orderId },
      data: { statusId }
    })
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders")
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function updateBatchOrderStatusesByIds(orderIds: string[], statusId: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: "Захиалга сонгогдоогүй байна" }
    }

    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { statusId }
    })

    const status = await db.orderStatusType.findUnique({ where: { id: statusId } })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сайтын админ",
      userRole: adminMode.role,
      action: "Багц статус баталгаажуулав",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг захиалгыг мөрийг нь түүвэрлэн '${status?.name || statusId}' төлөвт шилжүүллээ`,
    })

    // Revalidate widespread paths due to mass update
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders/batch/[batchId]", "page")
    revalidatePath("/admin/orders")

    return { success: true, count: orderIds.length }
  } catch (error: any) {
    console.error("Failed to update bulk order statuses by IDs:", error)
    return { success: false, error: "Failed to update bulk statuses" }
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
export async function requestDelivery(orderIds: string[], deliveryAddress: string) {
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

export async function confirmManualDeliveryRequest(orderIds: string[], address: string) {
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
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function restoreGroupOrder(orderIds: string[]) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const activeStatus = await db.orderStatusType.findFirst({
      where: { isDefault: true }
    })

    if (!activeStatus) {
      return { success: false, error: "Үндсэн идэвхтэй төлөв олдсонгүй" }
    }

    await db.$transaction(async (tx) => {
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } }
      });

      for (const order of orders) {
        const updateData: any = { statusId: activeStatus.id };

        if (order.paymentStatus === 'REJECTED') {
          updateData.paymentStatus = 'PENDING';
          await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { decrement: order.quantity } }
          });
        }

        await (tx.order as any).update({
          where: { id: order.id },
          data: updateData
        });
      }
    });

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сэргээгч Админ",
      userRole: adminMode.role,
      action: "Бөөнөөр сэргээлээ",
      target: "Захиалгууд",
      detail: `${orderIds.length} ширхэг хуучин захиалгыг буцааж идэвхтэй төлөвт шилжүүллээ`,
    })

    revalidatePath("/admin/orders/rejected")
    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/products")
    revalidatePath("/")
    
    return { success: true }
  } catch(err: any) {
    console.error("restoreGroupOrder error:", err)
    return { success: false, error: err.message }
  }
}

export async function restoreCompletedOrder(orderId: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const activeStatus = await db.orderStatusType.findFirst({
      where: { isDefault: true }
    })

    if (!activeStatus) {
      return { success: false, error: "Үндсэн идэвхтэй төлөв олдсонгүй" }
    }

    await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Захиалга олдсонгүй");

      const updateData: any = { statusId: activeStatus.id };

      // If it was cancelled/rejected, we need to revert the paymentStatus and reserve quantity again
      if (order.paymentStatus === 'REJECTED') {
        updateData.paymentStatus = 'PENDING';
        
        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: { remainingQuantity: { decrement: order.quantity } }
        });
      }

      await (tx.order as any).update({
        where: { id: orderId },
        data: updateData
      });
    });

    // Log the action
    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сэргээгч Админ",
      userRole: adminMode.role,
      action: "Сэргээлээ",
      target: "Захиалга",
      detail: `Захиалга #${orderId} -г буцааж идэвхтэй төлөвт шилжүүллээ`,
      targetUrl: `/admin/orders/${orderId}`
    })

    revalidatePath("/admin/orders/completed")
    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/products")
    revalidatePath("/")
    
    return { success: true }
  } catch(err: any) {
    console.error("restoreCompletedOrder error:", err)
    return { success: false, error: err.message }
  }
}

export async function updateOrderDetails(orderId: string, data: {
  customerName: string
  customerPhone: string
  accountNumber: string
  quantity: number
  deliveryAddress: string
}) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const result = await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Захиалга олдсонгүй");

      const diffQty = data.quantity - (order.quantity || 0);
      if (diffQty !== 0) {
         await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { decrement: diffQty } }
         });
      }

      await (tx.order as any).update({
        where: { id: orderId },
        data: {
           customerName: data.customerName,
           customerPhone: data.customerPhone,
           accountNumber: data.accountNumber,
           quantity: data.quantity,
           deliveryAddress: data.deliveryAddress
        }
      });
    });

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
      action: "Захиалга засав",
      target: "Захиалга",
      detail: `Захиалга #${orderId} мэдээллийг өөрчиллөө`,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders/batch/[batchId]", "page")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode || adminMode.role !== "ADMIN") return { success: false, error: "Устгах эрхгүй байна" }

    const result = await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({ where: { id: orderId } });
      if (!order) throw new Error("Захиалга олдсонгүй");

      // Revert quantity if order was not rejected
      if (order.paymentStatus !== "REJECTED" && order.quantity > 0) {
         await (tx.batch as any).update({
            where: { id: order.batchId },
            data: { remainingQuantity: { increment: order.quantity } }
         });
      }

      await (tx.order as any).delete({ where: { id: orderId } });
    });

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
      action: "Захиалга устгав",
      target: "Захиалга",
      detail: `Захиалга #${orderId} бүрмөсөн устгагдлаа`,
    })

    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/search")
    revalidatePath("/admin/orders/batch/[batchId]", "page")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRefundOrders() {
  try {
    const orders = await (db.order as any).findMany({
      where: {
        status: { name: { contains: "Буцаагдсан" } }
      },
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
    console.error("Failed to fetch refund orders:", error)
    return { success: false, error: "Буцаалтууд татахад алдаа гарлаа" }
  }
}

export async function toggleOrderRefund(orderId: string, isRefunded: boolean) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    await (db.order as any).update({
      where: { id: orderId },
      data: { isRefunded }
    })

    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Админ",
      userRole: adminMode.role,
      action: isRefunded ? "Мөнгө буцаагдсан" : "Мөнгө буцаахыг цуцалсан",
      target: "Захиалга",
      detail: `Захиалга #${orderId} -ийн төлбөрийг ${isRefunded ? 'буцааж шилжүүлэв' : 'буцаалт хийгээгүй төлөвт шилжүүлэв'}.`,
    })

    revalidatePath("/admin/orders/refunds")
    revalidatePath("/admin/home")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to toggle order refund:", error)
    return { success: false, error: error.message }
  }
}

export async function getArchivedConfirmedOrders(page: number = 1, limit: number = 20, q: string = "") {
  try {
    const { db } = await import("@/lib/db");
    const where: any = {
      paymentStatus: "CONFIRMED"
    };

    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { accountNumber: { contains: q } },
        { transactionRef: { contains: q } }
      ]
    }

    const total = await db.order.count({ where });
    const orders = await db.order.findMany({
       where,
       include: {
         batch: { include: { product: true } },
         status: true
       },
       orderBy: { updatedAt: "desc" },
       skip: (Math.max(1, page) - 1) * limit,
       take: limit
    });
    
    return { success: true, orders: JSON.parse(JSON.stringify(orders)), total };
  } catch(error: any) {
    return { success: false, error: error.message, orders: [], total: 0 };
  }
}
