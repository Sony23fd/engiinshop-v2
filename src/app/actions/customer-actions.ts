"use server"

import { db } from "@/lib/db"

export async function getCustomerProfile(phone: string) {
  try {
    const orders = await (db.order as any).findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          include: {
            product: true
          }
        },
        status: true
      }
    });

    if (!orders || orders.length === 0) {
      return { success: false, error: "Хэрэглэгч олдсонгүй" }
    }

    const totalOrders = orders.length;
    let totalSpent = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;

    orders.forEach((o: any) => {
      if (o.status?.name === "Цуцлагдсан" || o.paymentStatus === "REJECTED") {
        cancelledOrders++;
      } else {
        totalSpent += Number(o.totalAmount || 0);
        if (o.status?.isFinal) {
          completedOrders++;
        }
      }
    });

    const stats = {
      totalOrders,
      totalSpent,
      completedOrders,
      cancelledOrders,
      cancellationRate: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0,
      customerName: orders[0]?.customerName || "Тодорхойгүй"
    }

    return { success: true, orders: JSON.parse(JSON.stringify(orders)), stats }
  } catch (error: any) {
    console.error("getCustomerProfile error:", error);
    return { success: false, error: error.message }
  }
}
