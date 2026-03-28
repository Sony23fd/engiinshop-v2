"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getOrderStatuses() {
  try {
    const statuses = await db.orderStatusType.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    })
    return { success: true, statuses }
  } catch (error) {
    console.error("Failed to fetch order statuses:", error)
    return { success: false, error: "Failed to fetch order statuses" }
  }
}

export async function createOrderStatus(data: { name: string, color?: string, isFinal: boolean, isDefault?: boolean, isDeliverable?: boolean }) {
  try {
    // If setting this as default, unset all others first
    if (data.isDefault) {
      await db.orderStatusType.updateMany({ data: { isDefault: false } })
    }
    const status = await db.orderStatusType.create({
      data: {
        name: data.name,
        color: data.color || "slate",
        isFinal: data.isFinal,
        isDefault: data.isDefault ?? false,
        isDeliverable: data.isDeliverable ?? false,
      }
    })
    revalidatePath("/admin/order-status")
    return { success: true, status }
  } catch (error) {
    console.error("Failed to create order status:", error)
    return { success: false, error: "Failed to create order status" }
  }
}

export async function updateOrderStatus(id: string, data: { name: string, color?: string, isFinal: boolean, isDefault?: boolean, isDeliverable?: boolean }) {
  try {
    // If setting this as default, unset all others first
    if (data.isDefault) {
      await db.orderStatusType.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false }
      })
    }
    const status = await db.orderStatusType.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color || "slate",
        isFinal: data.isFinal,
        isDefault: data.isDefault ?? false,
        isDeliverable: data.isDeliverable ?? false,
      }
    })
    revalidatePath("/admin/order-status")
    revalidatePath("/admin/orders/search")
    return { success: true, status }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

export async function deleteOrderStatus(id: string) {
  try {
    // Check if any orders are using this status
    const status = await db.orderStatusType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    })

    if (!status) {
      return { success: false, error: "Status not found" }
    }

    if (status._count.orders > 0) {
      return { success: false, error: "Энэ төлөв дээр захиалга бүртгэгдсэн тул устгах боломжгүй." }
    }

    await db.orderStatusType.delete({
      where: { id }
    })
    
    revalidatePath("/admin/order-status")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete order status:", error)
    return { success: false, error: "Failed to delete order status" }
  }
}
