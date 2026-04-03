"use server"

import { db } from "@/lib/db"

export async function getRecentOrdersForSocialProof() {
  try {
    const orders = await (db.order as any).findMany({
      where: {
        paymentStatus: "CONFIRMED",
      },
      include: {
        batch: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    })

    const maskedOrders = orders.map((order: any) => {
      const name = order.customerName || "Хэрэглэгч"
      const maskedName = name.length > 2 
        ? name.substring(0, 2) + "***" 
        : name + "***"
      
      return {
        id: order.id,
        customerName: maskedName,
        productName: order.batch?.product?.name || "Бараа",
        productImage: order.batch?.product?.imageUrl,
        createdAt: order.createdAt
      }
    })

    return { success: true, orders: JSON.parse(JSON.stringify(maskedOrders)) }
  } catch (error) {
    console.error("Social proof fetch error:", error)
    return { success: false, orders: [] }
  }
}
