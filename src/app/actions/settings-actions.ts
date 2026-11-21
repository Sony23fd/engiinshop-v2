"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin, logActivity } from "@/lib/auth"
import { logAdminActivity } from "@/lib/activity-logger"
import { cache } from "react"
import { getVariantKey, getVariantStockTotal } from "@/lib/variant-utils"

const DEFAULT_SETTINGS: Record<string, string> = {
  bank_name: "Хаан Банк",
  bank_account: "",
  bank_holder: "",
  bank_note: "Anar Korea Shop",
  terms_of_service: "Захиалгаа баталгаажуулсны дараа цуцлах боломжгүй. Бараа зургаас арай ялгаатай байж болно. Асуудал гарвал бидэнтэй холбогдоно уу.",
  delivery_terms: "Хүргэлт нь Улаанбаатар хот дотор үйлчилнэ. Буруу хаяг оруулсны улмаас хүргэлт хийгдээгүй тохиолдолд бид хариуцлага хүлээхгүй. Хүргэлтийн нэмэлт зардал нь захиалгын нийт үнэд тооцогдоно.",
  qpay_enabled: "true",
  delivery_fee: "8000",
  cargo_bank_name: "Төрийн Банк",
  cargo_bank_account: "MN660034171700066647",
  cargo_bank_holder: "Мөнхбат Буяннэмэх",
  cargo_payment_instruction: "Гүйлгээний утга дээр утасныхаа дугаарыг заавал бичнэ үү.",
  delivery_delay_active: "false",
  delivery_delay_message: "Хүргэлтийн захиалга хэт олон байгаагаас шалтгаалан таны захиалга бага зэрэг саатаж очих магадлалтайг анхаарна уу.",
  delivery_schedule_days: "3,6",
  courier_pin_code: "2026",
  shop_phone: "+976 8853 9667",
  shop_secondary_phone: "+976 8853 9887",
  shop_email: "info@anarkorea.mn",
  shop_address: "БЗД, 26-р хороо Саруул хороолол 122-р байр, Үйлчилгээний хэсгийн 3 давхарт",
  shop_hours_weekdays: "10:00 - 19:00",
  shop_hours_weekend: "Ням: Амарна",
  social_facebook: "https://www.facebook.com/profile.php?id=100086582256535",
  social_instagram: "https://www.instagram.com/anar_korea_shop",
  support_chat_url: "",
  notice_in_transit_title: "Ойролцоох хугацаа:",
  notice_in_transit_text: "Бараа Солонгосоос хөдөлсөн бөгөөд хэвийн нөхцөлд 7-10 хоногийн дараа Улаанбаатарт ирдэг.",
  notice_ready_for_delivery_text: "Товлосон өдрөөс 24–72 цагийн дотор хүргэгдэнэ.",
  product_cargo_estimate_text: "Ойролцоогоор 7-14 хоног (Солонгосоос)",
  product_local_estimate_text: "Товлосон өдрөөс 24-72 цагийн дотор хүргэгдэнэ",
  preorder_estimate_text: "Захиалга хаагдсанаас хойш 7-14 хоногт ирнэ",
  pickup_guide_text: "Бэлэн болсон захиалгыг дээрх хаягаар өөрийн биеэр ирж авах боломжтой.",
  hero_badge_text: "Шууд захиалах боломжтой",
  hero_title: "Солонгосоос шууд таны гарт хүргэнэ",
  hero_subtitle: "Чанарын баталгаат, трэнд болж буй гоо сайхан, хувцас, ахуйн хэрэглээний барааг Солонгосоос хамгийн хурднаар, найдвартай захиалж аваарай.",
  footer_slogan: "Солонгос улсаас чанарын баталгаат бараа бүтээгдэхүүнийг хамгийн хурднаар, найдвартай захиалж аваарай.",
  footer_guarantee_title: "Найдвартай хүргэлт",
  footer_guarantee_text: "Захиалгын төлбөр баталгаажсанаас хойш шууд ачигдах бөгөөд албан ёсны каргогоор танд хүрнэ.",
  maintenance_title: "Түр засвартай байна",
  maintenance_message: "Эрхэм харилцагч танд энэ өдрийн мэнд хүргэе. Манай сайт дээр одоогоор өгөгдлийн шинэчлэл хийгдэж байгаа тул түр хугацаанд хаагдлаа. Та хэсэг хугацааны дараа дахин хандана уу. Баярлалаа!"
}

export const getShopSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const rows = await (db as any).shopSettings.findMany()
    const map: Record<string, string> = { ...DEFAULT_SETTINGS }
    rows.forEach((r: any) => { map[r.key] = r.value })
    if (!map.store_address && map.shop_address) map.store_address = map.shop_address
    if (!map.store_phone && map.shop_phone) map.store_phone = map.shop_phone
    if (!map.store_hours && map.shop_hours_weekdays) {
      map.store_hours = `Даваа - Бямба: ${map.shop_hours_weekdays}, ${map.shop_hours_weekend || "Ням: Амарна"}`
    }
    if (!map.facebook_link && map.social_facebook) map.facebook_link = map.social_facebook
    return map
  } catch {
    return DEFAULT_SETTINGS
  }
})

export async function saveShopSetting(key: string, value: string) {
  try {
    await (db as any).shopSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    revalidatePath("/admin/settings/general")
    revalidatePath("/admin/settings/contact")
    revalidatePath("/admin/settings/notices")
    revalidatePath("/admin/settings/payment")
    revalidatePath("/admin/settings/terms")
    revalidatePath("/admin/cargo-settings")
    revalidatePath("/admin/faqs")
    revalidatePath("/cart")
    revalidatePath("/track")
    revalidatePath("/product", "layout")
    revalidatePath("/", "layout")
    await logAdminActivity({
      action: "ТОХИРГОО_ШИНЭЧИЛСЭН",
      type: "SETTINGS",
      target: key,
      detail: `Тохиргоо шинэчлэгдсэн: ${String(value).slice(0, 100)}`,
      targetUrl: "/admin/settings/general",
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveMultipleShopSettings(settings: Record<string, string>) {
  try {
    const entries = Object.entries(settings)
    await Promise.all(
      entries.map(([key, value]) =>
        (db as any).shopSettings.upsert({
          where: { key },
          update: { value: String(value ?? "") },
          create: { key, value: String(value ?? "") }
        })
      )
    )
    revalidatePath("/admin/settings/general")
    revalidatePath("/admin/settings/contact")
    revalidatePath("/admin/settings/notices")
    revalidatePath("/admin/settings/payment")
    revalidatePath("/admin/settings/terms")
    revalidatePath("/admin/cargo-settings")
    revalidatePath("/admin/faqs")
    revalidatePath("/cart")
    revalidatePath("/track")
    revalidatePath("/product", "layout")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPendingOrders() {
  try {
    const orders = await db.order.findMany({
      where: {
        paymentStatus: "PENDING"
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
      const order = await (tx.order as any).findUnique({
        where: { id: orderId },
        include: { batch: { include: { product: true } } }
      })
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

      // Restore inventory properly including variantStock
      if (order.batch) {
        if (order.batch.variantStock && typeof order.batch.variantStock === "object") {
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
        where: { id: { in: orderIds } },
        include: { batch: { include: { product: true } } }
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
        if (!order.batch) continue
        if (order.batch.variantStock && typeof order.batch.variantStock === "object") {
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
