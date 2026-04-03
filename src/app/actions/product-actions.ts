"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { BatchStatus } from "@prisma/client"

export async function getProducts() {
  try {
    // Fetch only the batch data without the heavy orders array
    const batches = await db.batch.findMany({
      include: {
        product: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Let the database quickly sum quantities for valid orders grouped by batch
    const validOrderAggregations = await db.order.groupBy({
      by: ['batchId'],
      where: {
        paymentStatus: { not: 'REJECTED' },
        status: {
          name: { not: 'Цуцлагдсан' }
        }
      },
      _sum: {
        quantity: true
      }
    });

    const quantityMap = new Map();
    validOrderAggregations.forEach(agg => {
      quantityMap.set(agg.batchId, agg._sum.quantity || 0);
    });

    const enrichedBatches = batches.map(batch => ({
      ...batch,
      _calculatedOrderedSum: quantityMap.get(batch.id) || 0
    }));

    return { success: true, products: JSON.parse(JSON.stringify(enrichedBatches)) };
  } catch (error) {
    console.error("Failed to fetch batches:", error)
    return { success: false, error: "Failed to fetch batches" }
  }
}

export async function getActiveProducts() {
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
}

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
}) {
  try {
    let status: BatchStatus = BatchStatus.OPEN
    if (data.remainingQuantity <= 0) {
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
        remainingQuantity: data.remainingQuantity,
        status: status,
        price: data.price,
        description: data.description,
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
  options?: any[]
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
    let status: BatchStatus = BatchStatus.OPEN
    if (data.remainingQuantity <= 0) {
      status = BatchStatus.CLOSED
    } else {
      status = BatchStatus.OPEN
    }

    await db.batch.update({
      where: { id: data.batchId },
      data: {
        price: data.price,
        description: data.description,
        targetQuantity: data.targetQuantity,
        remainingQuantity: data.remainingQuantity,
        status: status
      }
    })

    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update product:", error)
    return { success: false, error: "Failed to update product" }
  }
}
