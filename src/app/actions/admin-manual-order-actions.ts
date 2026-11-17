"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "@/lib/auth"
import { logAdminActivity } from "@/lib/activity-logger"
import { getVariantKey, normalizeOptions } from "@/lib/variant-utils"

export interface AdminBatchSearchResult {
  id: string
  batchNumber: number
  status: string
  price: number
  isFreeCargo: boolean
  isPreOrder: boolean
  remainingQuantity: number
  targetQuantity: number
  variantStock: Record<string, number> | null
  category: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    imageUrl: string | null
    price: number
    weight: number
    isFreeCargo: boolean
    options: any
  }
}

/**
 * Searches batches and products for admin order entry combobox.
 * Fast, indexed, and handles Cyrillic / English case-insensitivity.
 */
export async function searchBatchesForAdmin(query?: string): Promise<{
  success: boolean
  batches: AdminBatchSearchResult[]
  error?: string
}> {
  try {
    const trimmed = (query || "").trim()

    let whereClause: any = {}
    if (trimmed) {
      const isNum = !isNaN(Number(trimmed))
      whereClause = {
        OR: [
          { product: { name: { contains: trimmed, mode: "insensitive" } } },
          { category: { name: { contains: trimmed, mode: "insensitive" } } },
          ...(isNum ? [{ batchNumber: Number(trimmed) }] : [])
        ]
      }
    } else {
      // Default to OPEN or recent batches when combobox opens
      whereClause = {
        status: "OPEN"
      }
    }

    const rawBatches = await db.batch.findMany({
      where: whereClause,
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            weight: true,
            isFreeCargo: true,
            options: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const batches: AdminBatchSearchResult[] = rawBatches.map(b => {
      const batchPrice = Number(b.price ?? 0)
      const prodPrice = Number(b.product?.price ?? 0)
      const effectivePrice = batchPrice > 0 ? batchPrice : prodPrice

      let vStock: Record<string, number> | null = null
      if (b.variantStock && typeof b.variantStock === "object") {
        vStock = b.variantStock as Record<string, number>
      }

      return {
        id: b.id,
        batchNumber: b.batchNumber,
        status: b.status,
        price: effectivePrice,
        isFreeCargo: Boolean(b.isFreeCargo || b.product?.isFreeCargo),
        isPreOrder: Boolean(b.isPreOrder),
        remainingQuantity: b.remainingQuantity,
        targetQuantity: b.targetQuantity,
        variantStock: vStock,
        category: {
          id: b.category?.id || "",
          name: b.category?.name || "Ангилалгүй"
        },
        product: {
          id: b.product?.id || "",
          name: b.product?.name || "Барааны нэргүй",
          imageUrl: b.product?.imageUrl || null,
          price: prodPrice,
          weight: Number(b.product?.weight ?? 0),
          isFreeCargo: Boolean(b.product?.isFreeCargo),
          options: b.product?.options || null
        }
      }
    })

    return { success: true, batches }
  } catch (error: any) {
    console.error("Failed to search batches for admin:", error)
    return { success: false, batches: [], error: error.message || "Бараа хайхад алдаа гарлаа" }
  }
}

export interface ManualOrderItemInput {
  batchId?: string
  isCustom?: boolean
  customName?: string
  customLink?: string
  customPrice?: number
  quantity: number
  unitPrice: number
  selectedOptions?: Record<string, string>
}

export interface CreateAdminManualOrderInput {
  customerName: string
  customerPhone: string
  accountNumber?: string
  deliveryAddress?: string
  adminNotes?: string
  paymentStatus?: "CONFIRMED" | "PENDING"
  items: ManualOrderItemInput[]
}

/**
 * Creates one or more manual orders for a customer with atomic stock deduction,
 * transactionRef assignment, and complete activity logging.
 */
export async function createAdminManualOrder(input: CreateAdminManualOrderInput) {
  try {
    const admin = await getCurrentAdmin()
    const adminName = admin ? (admin.name || "Сайтын админ") : "Админ"

    // 1. Validate Customer Name
    const cleanName = (input.customerName || "").trim()
    if (!cleanName) {
      return { success: false, error: "Захиалагчийн нэрийг заавал оруулна уу." }
    }

    // 2. Validate Customer Phone (Strict 8-digit mobile: 6, 7, 8, 9)
    const rawPhone = (input.customerPhone || "").replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
    const isEightDigitMobile = /^[6-9]\d{7}$/.test(rawPhone)
    if (!isEightDigitMobile) {
      return {
        success: false,
        error: "Утасны дугаар 8 оронтой, 6, 7, 8, 9-өөр эхэлсэн зөв гар утасны дугаар байх ёстой. (Жишээ нь: 99112233)"
      }
    }

    // 3. Validate Items
    if (!Array.isArray(input.items) || input.items.length === 0) {
      return { success: false, error: "Захиалгад хамгийн багадаа 1 бараа сонгоно уу." }
    }

    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i]
      if (!it.quantity || it.quantity < 1) {
        return { success: false, error: `${i + 1}-р барааны тоо ширхэг 1-ээс багагүй байх ёстой.` }
      }
      if (it.isCustom) {
        if (!it.customName || !it.customName.trim()) {
          return { success: false, error: `${i + 1}-р захиалгат барааны нэрийг оруулна уу.` }
        }
        if (!it.customPrice || it.customPrice <= 0) {
          return { success: false, error: `${i + 1}-р захиалгат барааны үнийг оруулна уу.` }
        }
      } else {
        if (!it.batchId) {
          return { success: false, error: `${i + 1}-р барааг каталогоос сонгоно уу.` }
        }
      }
    }

    // 4. Generate shared transactionRef
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const timestampStr = Date.now().toString(36).toUpperCase()
    const transactionRef = `MANUAL-${timestampStr}-${randomSuffix}`

    const hasDelivery = Boolean(input.deliveryAddress && input.deliveryAddress.trim().length > 0)
    const paymentStatus = input.paymentStatus || "CONFIRMED"

    // Execute within database transaction
    const result = await db.$transaction(async (tx) => {
      // Find default status
      const defaultStatus = await tx.orderStatusType.findFirst({
        where: { isDefault: true }
      }) || await tx.orderStatusType.findFirst()

      let grandTotal = 0
      const createdOrders = []

      // Cache for custom category/product if needed
      let customCategory: any = null

      for (const item of input.items) {
        let targetBatchId = item.batchId
        let unitPrice = item.unitPrice
        let selectedOptions = item.selectedOptions || null
        let itemNotes = input.adminNotes ? input.adminNotes.trim() : ""

        if (item.isCustom) {
          // Find or create dedicated custom category
          if (!customCategory) {
            customCategory = await tx.category.findFirst({
              where: { name: { contains: "Тусгай захиалга", mode: "insensitive" } }
            })
            if (!customCategory) {
              customCategory = await tx.category.create({
                data: {
                  name: "Тусгай захиалгат бараанууд"
                }
              })
            }
          }

          // Create custom Product & Batch for transparent tracking
          const customProd = await tx.product.create({
            data: {
              name: item.customName!.trim(),
              price: item.customPrice!,
              sourceLink: item.customLink?.trim() || null,
              isActive: false // custom order product, not for public showcase
            }
          })

          const customBatch = await tx.batch.create({
            data: {
              productId: customProd.id,
              categoryId: customCategory.id,
              price: item.customPrice!,
              status: "OPEN",
              isAvailableForSale: false,
              targetQuantity: item.quantity,
              remainingQuantity: 0
            }
          })

          targetBatchId = customBatch.id
          unitPrice = item.customPrice!
          if (item.customLink) {
            itemNotes = itemNotes ? `${itemNotes} | Холбоос: ${item.customLink.trim()}` : `Холбоос: ${item.customLink.trim()}`
          }
        } else {
          // Standard catalog batch
          const batch = await tx.batch.findUnique({
            where: { id: targetBatchId },
            include: { product: true }
          })
          if (!batch) {
            throw new Error(`Барааны багц олдсонгүй: ${targetBatchId}`)
          }

          if (unitPrice <= 0) {
            const bp = Number(batch.price ?? 0)
            const pp = Number(batch.product?.price ?? 0)
            unitPrice = bp > 0 ? bp : pp
          }

          // Deduct batch remainingQuantity
          const newRemaining = Math.max(0, batch.remainingQuantity - item.quantity)
          let newVariantStock = batch.variantStock

          if (batch.variantStock && typeof batch.variantStock === "object" && selectedOptions) {
            const variantKey = getVariantKey(batch.product?.options, selectedOptions)
            if (variantKey) {
              const vStock = { ...(batch.variantStock as Record<string, number>) }
              if (vStock[variantKey] !== undefined) {
                vStock[variantKey] = Math.max(0, vStock[variantKey] - item.quantity)
                newVariantStock = vStock
              }
            }
          }

          await tx.batch.update({
            where: { id: batch.id },
            data: {
              remainingQuantity: newRemaining,
              ...(newVariantStock && { variantStock: newVariantStock })
            } as any
          })
        }

        const lineTotal = unitPrice * item.quantity
        grandTotal += lineTotal

        // Create Order
        const order = await tx.order.create({
          data: {
            batchId: targetBatchId!,
            customerName: cleanName,
            customerPhone: rawPhone,
            accountNumber: input.accountNumber?.trim() || null,
            quantity: item.quantity,
            totalAmount: lineTotal,
            paymentStatus: paymentStatus,
            creationSource: "ADMIN",
            createdByAdmin: adminName,
            statusId: defaultStatus?.id || null,
            selectedOptions: selectedOptions,
            deliveryAddress: input.deliveryAddress?.trim() || null,
            wantsDelivery: hasDelivery,
            transactionRef: transactionRef,
            adminNotes: itemNotes || null
          } as any
        })

        createdOrders.push(order)
      }

      // Log Activity
      await logAdminActivity({
        userId: admin?.id || "system",
        userName: adminName,
        userRole: admin?.role || "ADMIN",
        action: "CREATE_MANUAL_ORDER",
        type: "ORDER",
        target: transactionRef,
        detail: `Админ ${adminName} нь ${cleanName} (${rawPhone}) харилцагчид ${input.items.length} бараа (Нийт: ₮${grandTotal.toLocaleString()}) гараар бүртгэлээ. Ref: ${transactionRef}`
      })

      return {
        count: createdOrders.length,
        transactionRef,
        grandTotal,
        firstOrderId: createdOrders[0]?.id
      }
    })

    // Revalidate paths
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/pending")
    revalidatePath("/admin/orders/search")

    return {
      success: true,
      count: result.count,
      transactionRef: result.transactionRef,
      grandTotal: result.grandTotal,
      firstOrderId: result.firstOrderId
    }
  } catch (error: any) {
    console.error("Failed to create admin manual order:", error)
    return {
      success: false,
      error: error.message || "Гараар захиалга үүсгэхэд алдаа гарлаа."
    }
  }
}
