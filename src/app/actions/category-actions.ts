"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getCategories(days: number = 30) {
  try {
    const whereClause: any = { isArchived: false };
    
    // We shouldn't filter category by updatedAt because categories are like folders
    // that could be created months ago but still have active orders today.
    // If we want to filter, we should filter at the batch/order level instead,
    // but for now, we will return all unarchived categories regardless of days.

    const categories = await db.category.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        batches: {
          include: {
            orders: { include: { status: true } }
          }
        }
      }
    })
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) }
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await db.category.findUnique({
      where: { id }
    })
    return { success: true, category }
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return { success: false, error: "Failed to fetch category" }
  }
}

export async function createCategory(name: string, deliveryFee: number = 0) {
  try {
    const category = await (db.category as any).create({
      data: { name, deliveryFee },
    })
    revalidatePath("/admin/categories")
    return { success: true, category }
  } catch (error) {
    console.error("Failed to create category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, name: string, deliveryFee?: number) {
  try {
    const category = await (db.category as any).update({
      where: { id },
      data: { 
        name,
        ...(deliveryFee !== undefined && { deliveryFee })
      },
    })
    if (deliveryFee !== undefined) {
      await (db.batch as any).updateMany({
        where: { categoryId: id },
        data: { deliveryFee }
      })
    }
    revalidatePath("/admin/categories")
    return { success: true, category }
  } catch (error) {
    console.error("Failed to update category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category has any batches first
    const category = await db.category.findUnique({
      where: { id },
      include: { batches: true }
    });

    if (category && category.batches.length > 0) {
      return { success: false, error: "Cannot delete category with associated batches" }
    }

    await db.category.delete({
      where: { id },
    })
    revalidatePath("/admin/categories")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

export async function updateCategoryDeliveryFee(categoryId: string, deliveryFee: number) {
  try {
    await (db.category as any).update({
      where: { id: categoryId },
      data: { deliveryFee }
    })
    // Propagate to all batches in this category so existing batches inherit the fee
    await (db.batch as any).updateMany({
      where: { categoryId },
      data: { deliveryFee }
    })
    revalidatePath("/admin/orders/category/" + categoryId)
    revalidatePath("/admin/products")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update category delivery fee:", error)
    return { success: false, error: error.message }
  }
}

export async function archiveCategory(categoryId: string) {
  try {
    await (db.category as any).update({
      where: { id: categoryId },
      data: { isArchived: true }
    })
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/archived")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function unarchiveCategory(categoryId: string) {
  try {
    await (db.category as any).update({
      where: { id: categoryId },
      data: { isArchived: false }
    })
    revalidatePath("/admin/orders")
    revalidatePath("/admin/orders/archived")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getArchivedCategories(days: number = 30) {
  try {
    const whereClause: any = { isArchived: true };
    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.updatedAt = { gte: cutoffDate };
    }

    const categories = await (db.category as any).findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        batches: {
          include: {
            orders: { include: { status: true } }
          }
        }
      }
    })
    return { success: true, categories: JSON.parse(JSON.stringify(categories)) }
  } catch (error: any) {
    return { success: false, error: "Failed to fetch archived categories", categories: [] }
  }
}

export async function toggleCategoryReadyStock(
  categoryId: string, 
  isReadyStock: boolean, 
  readyStockStatusId?: string | null
) {
  try {
    await (db.category as any).update({
      where: { id: categoryId },
      data: { 
        isReadyStock,
        readyStockStatusId: isReadyStock ? (readyStockStatusId || null) : null
      }
    })
    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to toggle ready stock:", error)
    return { success: false, error: error.message }
  }
}
