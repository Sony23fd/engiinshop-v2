"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

const DEFAULT_SETTINGS: Record<string, string> = {
  bank_name: "Хаан Банк",
  bank_account: "",
  bank_holder: "",
  bank_note: "Anar Korea Shop",
  terms_of_service: "Захиалгаа баталгаажуулсны дараа цуцлах боломжгүй. Бараа зургаас арай ялгаатай байж болно. Асуудал гарвал бидэнтэй холбогдоно уу.",
  delivery_terms: "Хүргэлт нь Улаанбаатар хот дотор үйлчилнэ. Буруу хаяг оруулсны улмаас хүргэлт хийгдээгүй тохиолдолд бид хариуцлага хүлээхгүй. Хүргэлтийн нэмэлт зардал нь захиалгын нийт үнэд тооцогдоно.",
  qpay_enabled: "true",
  delivery_fee: "6000",
  cargo_bank_name: "Хаан Банк",
  cargo_bank_account: "",
  cargo_bank_holder: "",
  cargo_payment_instruction: "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү.",
  delivery_delay_active: "false",
  delivery_delay_message: "Хүргэлтийн захиалга хэт олон байгаагаас шалтгаалан таны захиалга бага зэрэг саатаж очих магадлалтайг анхаарна уу.",
  delivery_schedule_days: "3,6",
  phone_verification_enabled: "true"
}

export async function getShopSettings(): Promise<Record<string, string>> {
  try {
    const rows = await (db as any).shopSettings.findMany()
    const map: Record<string, string> = { ...DEFAULT_SETTINGS }
    rows.forEach((r: any) => { map[r.key] = r.value })
    return map
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveShopSetting(key: string, value: string) {
  try {
    await (db as any).shopSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    revalidatePath("/admin/settings/payment")
    revalidatePath("/admin/settings/terms")
    revalidatePath("/admin/cargo-settings")
    revalidatePath("/cart")
    revalidatePath("/track")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPendingOrders() {
  try {
    const orders = await db.order.findMany({
      where: {
        OR: [
          { paymentStatus: "PENDING" },
          { 
             paymentStatus: "CONFIRMED", 
             status: { name: "Захиалга баталгаажсан /Вэбээр/" }
          }
        ]
      } as any,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        accountNumber: true,
        quantity: true,
        totalAmount: true,
        transactionRef: true,
        paymentProofUrl: true,
        paymentStatus: true,
        wantsDelivery: true,
        deliveryAddress: true,
        createdAt: true,
        batch: {
          select: {
            id: true,
            batchNumber: true,
            product: {
              select: {
                id: true,
                name: true
              }
            },
            category: {
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
      orderBy: { createdAt: "desc" }
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error: any) {
    return { success: false, error: error.message, orders: [] }
  }
}

export async function confirmOrderPayment(orderId: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    const confirmedStatus = await db.orderStatusType.findFirst({ where: { name: "Захиалга баталгаажсан" } }) 
      || await db.orderStatusType.findFirst({ where: { name: "Баталгаажсан" } }) 
      || await db.orderStatusType.findFirst({ where: { isDefault: false, isFinal: false } });

    await (db.order as any).update({
      where: { id: orderId },
      data: { 
        paymentStatus: "CONFIRMED",
        confirmedById: admin.id,
        confirmationMethod: "MANUAL",
        confirmedAt: new Date(),
        ...(confirmedStatus?.id && { statusId: confirmedStatus.id })
      }
    })
    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectOrderPayment(orderId: string, reason?: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    await db.$transaction(async (tx) => {
      const order = await (tx.order as any).findUnique({ where: { id: orderId } })
      if (!order) return

      const rejectedStatus = await tx.orderStatusType.findFirst({ where: { name: "Цуцлагдсан" } });

      await (tx.order as any).update({
        where: { id: orderId },
        data: { 
          paymentStatus: "REJECTED",
          cancellationReason: reason || null,
          ...(rejectedStatus?.id && { statusId: rejectedStatus.id })
        }
      })

      await (tx.batch as any).update({
        where: { id: order.batchId },
        data: { remainingQuantity: { increment: order.quantity } }
      })
    })

    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/** Confirm all orders in a customer's checkout group at once */
export async function confirmGroupPayment(orderIds: string[]) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    const confirmedStatus = await db.orderStatusType.findFirst({ where: { name: "Захиалга баталгаажсан" } }) 
      || await db.orderStatusType.findFirst({ where: { name: "Баталгаажсан" } }) 
      || await db.orderStatusType.findFirst({ where: { isDefault: false, isFinal: false } });

    await (db.order as any).updateMany({
      where: { id: { in: orderIds } },
      data: { 
        paymentStatus: "CONFIRMED",
        confirmedById: admin.id,
        confirmationMethod: "MANUAL",
        confirmedAt: new Date(),
        ...(confirmedStatus?.id && { statusId: confirmedStatus.id })
      }
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role || "ADMIN",
      action: "Төлбөр баталгаажуулав",
      target: "Захиалга(ууд)",
      detail: `${orderIds.length} ширхэг захиалгын төлбөрийг бөөнөөр баталлаа`,
    });

    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectGroupPayment(orderIds: string[], reason?: string) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Нэвтрэнэ үү" }

    await db.$transaction(async (tx) => {
      const orders = await (tx.order as any).findMany({
        where: { id: { in: orderIds } }
      })

      const rejectedStatus = await tx.orderStatusType.findFirst({ where: { name: "Цуцлагдсан" } });

      await (tx.order as any).updateMany({
        where: { id: { in: orderIds } },
        data: { 
          paymentStatus: "REJECTED",
          cancellationReason: reason || null,
          ...(rejectedStatus?.id && { statusId: rejectedStatus.id })
        }
      })

      for (const order of orders) {
        await (tx.batch as any).update({
          where: { id: order.batchId },
          data: { remainingQuantity: { increment: order.quantity } }
        })
      }
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role || "ADMIN",
      action: "Төлбөр цуцлав",
      target: "Захиалга(ууд)",
      detail: `${orderIds.length} ширхэг захиалга (төлбөр хийгээгүй) цуцлагдлаа`,
    });

    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrderForPayment(orderId: string) {
  try {
    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      include: {
        batch: { include: { product: true } }
      }
    })
    if (!order) return { success: false, error: "Order not found" }
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrdersByTransactionRef(transactionRef: string) {
  try {
    const orders = await (db.order as any).findMany({
      where: { transactionRef },
      include: { batch: { include: { product: true } } },
      orderBy: { createdAt: "asc" }
    })
    if (!orders?.length) return { success: false, error: "Orders not found" }
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
