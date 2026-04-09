"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { BatchStatus } from "@prisma/client"
import { getCurrentAdmin } from "@/lib/auth"

export async function getBatches() {
  try {
    const batches = await db.batch.findMany({
      include: {
        product: true,
        category: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, batches: JSON.parse(JSON.stringify(batches)) }
  } catch (error) {
    console.error("Failed to fetch batches:", error)
    return { success: false, error: "Failed to fetch batches" }
  }
}

export async function getBatchesByCategory(categoryId: string) {
  try {
    if (!categoryId) return { success: false, error: "Category ID is required" }

    const batches = await db.batch.findMany({
      where: { categoryId },
      include: {
        product: true,
        category: true,
        orders: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, batches: JSON.parse(JSON.stringify(batches)) }
  } catch (error) {
    console.error("Failed to fetch batches by category:", error)
    return { success: false, error: "Failed to fetch batches by category" }
  }
}

export async function getBatchById(id: string) {
  try {
    if (!id) return { success: false, error: "Batch ID is required" }
    
    const batch = await db.batch.findUnique({
      where: { id: String(id) },
      include: {
        product: true,
        category: true,
        orders: {
          include: { status: true }
        }
      }
    })
    return { success: true, batch: JSON.parse(JSON.stringify(batch)) }
  } catch (error) {
    console.error("Failed to fetch batch:", error)
    return { success: false, error: "Failed to fetch batch" }
  }
}

export async function createBatch(data: {
  categoryId: string
  name: string
  description?: string
  targetQuantity: number
  remainingQuantity: number
  price: number
  weight?: number
  cargoFeeStatus?: string
}) {
  try {
    let status: BatchStatus = BatchStatus.OPEN
    if (data.remainingQuantity <= 0) {
      status = BatchStatus.CLOSED
    }

    const batch = await db.batch.create({
      data: {
        targetQuantity: data.targetQuantity,
        remainingQuantity: data.remainingQuantity,
        status: status,
        price: data.price,
        description: data.description,
        cargoFeeStatus: data.cargoFeeStatus,
        category: {
          connect: { id: data.categoryId }
        },
        product: {
          create: {
            name: data.name,
            price: data.price,
            weight: data.weight,
          }
        }
      },
      include: { product: true }
    })
    
    revalidatePath("/admin/orders")
    revalidatePath("/")
    return { success: true, batch: JSON.parse(JSON.stringify(batch)) }
  } catch (error) {
    console.error("Failed to create batch:", error)
    return { success: false, error: "Failed to create batch" }
  }
}

export async function updateBatch(id: string, data: {
  categoryId?: string
  name?: string
  description?: string
  targetQuantity?: number
  remainingQuantity?: number
  price?: number
  weight?: number
  cargoFeeStatus?: string
}) {
  try {
    const admin = await getCurrentAdmin()

    // CARGO_ADMIN cannot change targetQuantity
    if (admin?.role === "CARGO_ADMIN" && data.targetQuantity !== undefined) {
      return { success: false, error: "Cargo admin cannot change target quantity" }
    }

    const batch = await db.batch.findUnique({ where: { id }, include: { product: true } })
    if (!batch) throw new Error("Batch not found")

    let status: BatchStatus = batch.status;
    if (data.remainingQuantity !== undefined) {
       status = data.remainingQuantity <= 0 ? BatchStatus.CLOSED : BatchStatus.OPEN
    }

    const updateData: any = {
      ...(data.targetQuantity !== undefined && { targetQuantity: data.targetQuantity }),
      ...(data.remainingQuantity !== undefined && { remainingQuantity: data.remainingQuantity, status }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.cargoFeeStatus !== undefined && { cargoFeeStatus: data.cargoFeeStatus }),
      product: {
        update: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.weight !== undefined && { weight: data.weight }),
        }
      }
    };

    if (data.categoryId) {
      updateData.category = { connect: { id: data.categoryId } };
    }

    const updatedBatch = await db.batch.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/", "layout")
    return { success: true, batch: JSON.parse(JSON.stringify(updatedBatch)) }
  } catch (error) {
    console.error("Failed to update batch:", error)
    return { success: false, error: "Failed to update batch" }
  }
}

export async function deleteBatch(id: string) {
  try {
    // Prevent deletion if there are orders
    const batch = await db.batch.findUnique({
      where: { id },
      include: { orders: true }
    })

    if (!batch) return { success: false, error: "Batch not found" }
    
    if (batch.orders.length > 0) {
      return { success: false, error: "Cannot delete batch with existing orders" }
    }

    // Since product is functionally a 1:1 tied object in this case, we also delete the product
    await db.batch.delete({ where: { id } })
    await db.product.delete({ where: { id: batch.productId } })
    
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete batch:", error)
    return { success: false, error: "Failed to delete batch" }
  }
}
export async function bulkUpdateBatchStatus(ids: string[], data: { 
  status?: BatchStatus, 
  cargoFeeStatus?: string,
  isAvailableForSale?: boolean
}) {
  try {
    if (!ids || ids.length === 0) return { success: false, error: "No batches selected" }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.cargoFeeStatus !== undefined) updateData.cargoFeeStatus = data.cargoFeeStatus;
    if (data.isAvailableForSale !== undefined) updateData.isAvailableForSale = data.isAvailableForSale;

    await db.batch.updateMany({
      where: { id: { in: ids } },
      data: updateData
    })

    revalidatePath("/admin/orders")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update batches:", error)
    return { success: false, error: "Failed to bulk update batches" }
  }
}
