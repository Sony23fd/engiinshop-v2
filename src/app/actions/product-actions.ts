"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { BatchStatus } from "@prisma/client"
import { cache } from "react"
import { getVariantStockTotal } from "@/lib/variant-utils"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

export async function getProducts({ search, page = 1, limit = 20 }: { search?: string, page?: number, limit?: number } = {}) {
  try {
    const whereClause: any = {}
    if (search && search.trim()) {
      whereClause.product = {
        name: { contains: search.trim(), mode: 'insensitive' }
      }
    }

    const [batches, totalCount] = await Promise.all([
      db.batch.findMany({
        where: whereClause,
        include: {
          product: true,
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.batch.count({ where: whereClause })
    ])

    // Let the database quickly sum quantities for valid orders grouped by batch
    const batchIds = batches.map(b => b.id)
    const validOrderAggregations = await db.order.groupBy({
      by: ['batchId'],
      where: {
        batchId: { in: batchIds },
        paymentStatus: 'CONFIRMED',
        status: {
          name: { not: 'Цуцлагдсан' }
        }
      },
      _sum: {
        quantity: true
      }
    })

    const quantityMap = new Map();
    validOrderAggregations.forEach(agg => {
      quantityMap.set(agg.batchId, agg._sum.quantity || 0);
    });

    const enrichedBatches = batches.map(batch => ({
      ...batch,
      _calculatedOrderedSum: quantityMap.get(batch.id) || 0
    }));

    return { 
      success: true, 
      products: JSON.parse(JSON.stringify(enrichedBatches)),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Failed to fetch batches:", error)
    return { success: false, error: "Failed to fetch batches", totalCount: 0, totalPages: 0, currentPage: 1 }
  }
}

export const getActiveProducts = cache(async () => {
  try {
    const batches = await db.batch.findMany({
      where: { 
        isAvailableForSale: true,
        category: {
          isArchived: false,
          name: { not: { contains: "Сарын захиалга" } }
        }
      },
      include: { product: true, category: true },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, products: JSON.parse(JSON.stringify(batches)) }
  } catch (error) {
    console.error("Failed to fetch active batches:", error)
    return { success: false, error: "Failed to fetch active batches" }
  }
})

export async function toggleBatchForSale(batchId: string, isAvailableForSale: boolean) {
  try {
    // Fetch category's deliveryFee to auto-inherit when enabling
    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: { category: true }
    })
    const categoryFee = (batch?.category as any)?.deliveryFee
    await db.batch.update({
      where: { id: batchId },
      data: {
        isAvailableForSale,
        // Inherit category delivery fee on enable if not already set
        ...(isAvailableForSale && categoryFee !== undefined && { deliveryFee: categoryFee })
      } as any
    })
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle batch for sale:", error)
    return { success: false, error: "Failed to toggle" }
  }
}

export async function toggleBatchPreOrder(batchId: string, isPreOrder: boolean) {
  try {
    await db.batch.update({
      where: { id: batchId },
      data: { isPreOrder } as any
    })
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle pre-order:", error)
    return { success: false, error: "Failed to toggle pre-order" }
  }
}

export async function updateBatchDeliveryFee(batchId: string, deliveryFee: number) {
  try {
    await db.batch.update({
      where: { id: batchId },
      data: { deliveryFee } as any
    })
    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to update delivery fee:", error)
    return { success: false, error: "Failed to update delivery fee" }
  }
}

export async function updateBatchRemainingQty(batchId: string, remainingQuantity: number) {
  try {
    await db.batch.update({
      where: { id: batchId },
      data: { remainingQuantity }
    })
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update remaining quantity:", error)
    return { success: false, error: "Failed to update remaining quantity" }
  }
}

export async function updateBatchClosingDate(batchId: string, closingDate: Date | null) {
  try {
    await db.batch.update({
      where: { id: batchId },
      data: { closingDate } as any
    })
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update closing date:", error)
    return { success: false, error: "Failed to update closing date" }
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  targetQuantity: number
  remainingQuantity: number
  price: number
  weight?: number
  sourceLink?: string
  categoryId?: string
  options?: any[]
  variantStock?: Record<string, number>
}) {
  try {
    const hasVariants = data.variantStock && typeof data.variantStock === 'object' && Object.keys(data.variantStock).length > 0
    let finalRemainingQty = hasVariants
      ? getVariantStockTotal(data.variantStock)
      : data.remainingQuantity

    if (!hasVariants && finalRemainingQty <= 0 && data.targetQuantity > 0) {
      finalRemainingQty = data.targetQuantity
    }

    let status: BatchStatus = BatchStatus.OPEN
    if (finalRemainingQty <= 0) {
      status = BatchStatus.CLOSED
    }

    // Since UI is simplified, we create Product and Batch together.
    // In a real expanded app, we might select an existing product.
    // For now we assume a Default Category if none specified.
    let categoryId = data.categoryId
    if (!categoryId) {
      let defaultCategory = await db.category.findFirst()
      if (!defaultCategory) {
        defaultCategory = await db.category.create({ data: { name: "Ерөнхий ангилал" } })
      }
      categoryId = defaultCategory.id
    }

    const batch = await db.batch.create({
      data: {
        targetQuantity: data.targetQuantity,
        remainingQuantity: finalRemainingQty,
        status: status,
        price: data.price,
        description: data.description,
        ...(data.variantStock && { variantStock: data.variantStock }),
        category: { connect: { id: categoryId } },
        product: {
          create: {
            name: data.name,
            price: data.price,
            ...(data.weight !== undefined && { weight: data.weight }),
            ...(data.sourceLink !== undefined && { sourceLink: data.sourceLink }),
            ...(data.options !== undefined && { options: data.options }),
          }
        }
      },
      include: { product: true }
    })
    
    return { success: true, product: JSON.parse(JSON.stringify(batch)) }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false, error: "Failed to create product" }
  }
}

export async function updateProduct(data: {
  productId: string
  batchId: string
  name: string
  description?: string
  targetQuantity: number
  remainingQuantity: number
  price: number
  weight?: number
  sourceLink?: string
  categoryId?: string
  options?: any[]
  variantStock?: Record<string, number> | null
}) {
  try {
    // 1. Update the Product entity
    await db.product.update({
      where: { id: data.productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        weight: data.weight,
        sourceLink: data.sourceLink,
        options: data.options || []
      }
    })

    // 2. Update the Batch entity
    const hasVariants = data.variantStock && typeof data.variantStock === 'object' && Object.keys(data.variantStock).length > 0
    const finalRemainingQty = hasVariants
      ? getVariantStockTotal(data.variantStock)
      : data.remainingQuantity

    let status: BatchStatus = BatchStatus.OPEN
    if (finalRemainingQty <= 0) {
      status = BatchStatus.CLOSED
    } else {
      status = BatchStatus.OPEN
    }

    const batchUpdateData: any = {
      price: data.price,
      description: data.description,
      targetQuantity: data.targetQuantity,
      remainingQuantity: finalRemainingQty,
      status: status,
    }
    if (data.categoryId) {
      batchUpdateData.categoryId = data.categoryId
    }
    if (data.variantStock !== undefined) {
      batchUpdateData.variantStock = data.variantStock
    }

    await db.batch.update({
      where: { id: data.batchId },
      data: batchUpdateData
    })

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}

export async function mergeProducts(data: {
  primaryBatchId: string
  secondaryBatchIds: string[]
  newProductName: string
  optionName: string
  variants: { value: string; stock: number; imageUrl?: string }[]
  archiveCategoryId?: string
  disableSecondarySales?: boolean
}) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const primaryBatch = await db.batch.findUnique({
      where: { id: data.primaryBatchId },
      include: { product: true }
    })
    if (!primaryBatch) return { success: false, error: "Үндсэн багц олдсонгүй" }

    // Build the option definition
    const optionValues = data.variants.map(v => v.value.trim()).filter(Boolean)
    const images: Record<string, string> = {}
    const variantStock: Record<string, number> = {}

    for (const v of data.variants) {
      const val = v.value.trim()
      if (!val) continue
      variantStock[val] = Math.max(0, Number(v.stock) || 0)
      if (v.imageUrl) {
        images[val] = v.imageUrl
      }
    }

    const options = [
      {
        name: data.optionName.trim() || "Сонголт",
        values: optionValues,
        ...(Object.keys(images).length > 0 && { images })
      }
    ]

    const totalStock = Object.values(variantStock).reduce((sum, s) => sum + s, 0)

    // Execute in transaction
    await db.$transaction(async (tx) => {
      // 1. Update primary product name & options
      await tx.product.update({
        where: { id: primaryBatch.productId },
        data: {
          name: data.newProductName.trim(),
          options: options
        }
      })

      // 2. Update primary batch inventory & options
      await tx.batch.update({
        where: { id: data.primaryBatchId },
        data: {
          variantStock: variantStock,
          remainingQuantity: totalStock,
          targetQuantity: Math.max(primaryBatch.targetQuantity, totalStock),
          isAvailableForSale: true
        } as any
      })

      // 3. Deactivate & optionally move secondary batches to archive category
      if (data.secondaryBatchIds.length > 0) {
        let targetCatId = data.archiveCategoryId
        if (targetCatId === "__NEW_ARCHIVE__") {
          let archiveCat = await tx.category.findFirst({
            where: { name: "📦 Нэгтгэсэн хуучин багцууд (Архив)" }
          })
          if (!archiveCat) {
            archiveCat = await tx.category.create({
              data: {
                name: "📦 Нэгтгэсэн хуучин багцууд (Архив)",
                deliveryFee: 0,
                isArchived: false
              }
            })
          }
          targetCatId = archiveCat.id
        }

        const secondaryUpdateData: any = {}
        if (data.disableSecondarySales !== false) {
          secondaryUpdateData.isAvailableForSale = false
        }
        if (targetCatId) {
          secondaryUpdateData.categoryId = targetCatId
        }

        if (Object.keys(secondaryUpdateData).length > 0) {
          await tx.batch.updateMany({
            where: { id: { in: data.secondaryBatchIds } },
            data: secondaryUpdateData
          })
        }
      }
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Бараа нэгтгэв",
      target: "Бараа",
      detail: `${data.secondaryBatchIds.length + 1} барааг '#${primaryBatch.batchNumber} - ${data.newProductName}' болгон нэгтгэлээ`,
    })

    revalidatePath("/admin/products")
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to merge products:", error)
    return { success: false, error: error.message || "Бараа нэгтгэхэд алдаа гарлаа" }
  }
}

export async function syncBatchVariantStock(batchId: string) {
  try {
    const batch = await db.batch.findUnique({
      where: { id: batchId }
    })
    if (!batch) return { success: false, error: "Багц олдсонгүй" }

    if (batch.variantStock && typeof batch.variantStock === 'object') {
      const total = getVariantStockTotal(batch.variantStock as Record<string, number>)
      await db.batch.update({
        where: { id: batchId },
        data: {
          remainingQuantity: total,
          status: total <= 0 ? BatchStatus.CLOSED : BatchStatus.OPEN
        }
      })
      revalidatePath("/admin/products")
      revalidatePath("/")
      return { success: true, newRemaining: total }
    }
    return { success: false, error: "Variant тохируулаагүй байна" }
  } catch (error: any) {
    console.error("Failed to sync variant stock:", error)
    return { success: false, error: error.message }
  }
}

export async function reconcileAllBatchStocks() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return { success: false, error: "Хандах эрхгүй" }

    const batches = await db.batch.findMany({
      include: {
        product: true,
        orders: {
          select: {
            quantity: true,
            paymentStatus: true,
            status: { select: { name: true } }
          }
        }
      }
    })

    let updatedCount = 0

    for (const b of batches) {
      const validOrders = b.orders.filter(
        o => o.paymentStatus === 'CONFIRMED' && (!o.status || o.status.name !== 'Цуцлагдсан')
      )
      const validQty = validOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)

      let newRemaining = b.remainingQuantity
      let newStatus = b.status

      if (b.variantStock && typeof b.variantStock === 'object' && Object.keys(b.variantStock).length > 0) {
        newRemaining = getVariantStockTotal(b.variantStock as Record<string, number>)
      } else {
        newRemaining = Math.max(0, b.targetQuantity - validQty)
      }

      if (newRemaining > 0 && b.status === BatchStatus.CLOSED && b.targetQuantity > validQty) {
        newStatus = BatchStatus.OPEN
      } else if (newRemaining <= 0 && b.status === BatchStatus.OPEN) {
        newStatus = BatchStatus.CLOSED
      }

      if (newRemaining !== b.remainingQuantity || newStatus !== b.status) {
        await db.batch.update({
          where: { id: b.id },
          data: {
            remainingQuantity: newRemaining,
            status: newStatus
          }
        })
        updatedCount++
      }
    }

    await logActivity({
      userId: admin.id,
      userName: admin.name || "Админ",
      userRole: admin.role,
      action: "Үлдэгдэл тэнцвэржүүлэв",
      target: "Бүх багцууд",
      detail: `Нийт ${updatedCount} багцын үлдэгдэл болон төлөвийг захиалгын түүхээр тэнцвэржүүллээ.`,
    })

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true, updatedCount }
  } catch (error: any) {
    console.error("Failed to reconcile batch stocks:", error)
    return { success: false, error: error.message }
  }
}

