"use server"

import { db } from "@/lib/db"

const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

export interface DailySummaryItem {
  dateStr: string // "YYYY-MM-DD"
  displayDate: string // "2026.09.06"
  dayOfWeek: string // "Ням"
  orderCount: number
  totalItemCount: number
  totalAmount: number
  confirmedCount: number
  pendingCount: number
}

export interface PurchasingItemCustomer {
  orderId: string
  orderNumber: number
  customerName: string
  customerPhone: string
  quantity: number
  paymentStatus: string
  adminNotes: string | null
  deliveryAddress: string | null
}

export interface PurchasingItem {
  key: string
  productName: string
  imageUrl: string | null
  variantDesc: string
  unitPrice: number
  totalQuantity: number
  totalEstimatedAmount: number
  customers: PurchasingItemCustomer[]
}

export interface DailyOrderDetailsResult {
  success: boolean
  dateStr: string
  displayDate: string
  summary: {
    totalOrders: number
    totalItems: number
    totalAmount: number
    uniqueProductsCount: number
    confirmedCount: number
    pendingCount: number
  }
  purchasingList: PurchasingItem[]
  orders: any[]
  error?: string
}

/**
 * Helper to get UB (UTC+8) day boundaries in UTC
 */
function getUBAbsoluteDateRange(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 8 * 3600 * 1000)
  const endUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 8 * 3600 * 1000)
  return { startUTC, endUTC }
}

/**
 * Returns summary of all dates with orders in the last N days
 */
export async function getDailyOrderSummaryList(limitDays: number = 60): Promise<{
  success: boolean
  days: DailySummaryItem[]
  error?: string
}> {
  try {
    const cutoffDate = new Date(Date.now() - limitDays * 24 * 3600 * 1000)

    const rawOrders = await db.order.findMany({
      where: {
        createdAt: { gte: cutoffDate }
      },
      select: {
        id: true,
        quantity: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    const dayMap = new Map<string, DailySummaryItem>()

    for (const o of rawOrders) {
      const ubDate = new Date(o.createdAt.getTime() + 8 * 3600 * 1000)
      const dateStr = ubDate.toISOString().split("T")[0] // "YYYY-MM-DD"

      if (!dayMap.has(dateStr)) {
        const dObj = new Date(dateStr + "T00:00:00")
        const dayOfWeek = DAY_NAMES[dObj.getDay()] || ""
        dayMap.set(dateStr, {
          dateStr,
          displayDate: dateStr.replace(/-/g, "."),
          dayOfWeek,
          orderCount: 0,
          totalItemCount: 0,
          totalAmount: 0,
          confirmedCount: 0,
          pendingCount: 0
        })
      }

      const item = dayMap.get(dateStr)!
      item.orderCount += 1
      item.totalItemCount += Number(o.quantity || 1)
      item.totalAmount += Number(o.totalAmount || 0)
      if (o.paymentStatus === "CONFIRMED" || o.paymentStatus === "PAID") {
        item.confirmedCount += 1
      } else {
        item.pendingCount += 1
      }
    }

    const days = Array.from(dayMap.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr))

    return { success: true, days }
  } catch (error: any) {
    console.error("Failed to fetch daily order summary list:", error)
    return { success: false, days: [], error: error.message || "Өдрийн жагсаалт авахад алдаа гарлаа" }
  }
}

/**
 * Returns full details and aggregated shopping/purchasing list for a specific date
 */
export async function getDailyOrderDetails(dateStr: string): Promise<DailyOrderDetailsResult> {
  try {
    const { startUTC, endUTC } = getUBAbsoluteDateRange(dateStr)

    const rawOrders = await db.order.findMany({
      where: {
        createdAt: { gte: startUTC, lte: endUTC }
      },
      include: {
        batch: {
          include: {
            product: true,
            category: true
          }
        },
        status: true
      },
      orderBy: { createdAt: "desc" }
    })

    const orders = JSON.parse(JSON.stringify(rawOrders))

    // Purchasing aggregation map
    const purchasingMap = new Map<string, PurchasingItem>()

    let totalItems = 0
    let totalAmount = 0
    let confirmedCount = 0
    let pendingCount = 0

    for (const o of orders) {
      const qty = Number(o.quantity || 1)
      const amt = Number(o.totalAmount || 0)
      totalItems += qty
      totalAmount += amt

      if (o.paymentStatus === "CONFIRMED" || o.paymentStatus === "PAID") {
        confirmedCount += 1
      } else {
        pendingCount += 1
      }

      // Determine product name and variants
      let prodName = o.batch?.product?.name || "Тодорхойгүй бараа"
      const imageUrl = o.batch?.product?.imageUrl || null
      const unitPrice = qty > 0 ? Math.round(amt / qty) : Number(o.batch?.price || o.batch?.product?.price || 0)

      let variantDesc = ""
      if (o.selectedOptions && typeof o.selectedOptions === "object") {
        variantDesc = Object.entries(o.selectedOptions)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      }

      // If this was a legacy date batch ("8/25nii gutal huwtsas"), surface the item hint from customerName
      const isLegacyDateBatch = prodName.includes("nii") || prodName.includes("ны") || prodName.includes("ний") || prodName.includes("gutal") || prodName.includes("zahialga")
      if (isLegacyDateBatch && o.customerName) {
        prodName = `[Шууд захиалга] ${o.customerName}`
      }

      const key = `${prodName}___${variantDesc}`
      if (!purchasingMap.has(key)) {
        purchasingMap.set(key, {
          key,
          productName: prodName,
          imageUrl,
          variantDesc,
          unitPrice,
          totalQuantity: 0,
          totalEstimatedAmount: 0,
          customers: []
        })
      }

      const pItem = purchasingMap.get(key)!
      pItem.totalQuantity += qty
      pItem.totalEstimatedAmount += amt
      pItem.customers.push({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        quantity: qty,
        paymentStatus: o.paymentStatus,
        adminNotes: o.adminNotes || null,
        deliveryAddress: o.deliveryAddress || null
      })
    }

    const purchasingList = Array.from(purchasingMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity)

    const dObj = new Date(dateStr + "T00:00:00")
    const dayOfWeek = DAY_NAMES[dObj.getDay()] || ""
    const displayDate = `${dateStr.replace(/-/g, ".")} (${dayOfWeek})`

    return {
      success: true,
      dateStr,
      displayDate,
      summary: {
        totalOrders: orders.length,
        totalItems,
        totalAmount,
        uniqueProductsCount: purchasingList.length,
        confirmedCount,
        pendingCount
      },
      purchasingList,
      orders
    }
  } catch (error: any) {
    console.error("Failed to fetch daily order details:", error)
    return {
      success: false,
      dateStr,
      displayDate: dateStr,
      summary: {
        totalOrders: 0,
        totalItems: 0,
        totalAmount: 0,
        uniqueProductsCount: 0,
        confirmedCount: 0,
        pendingCount: 0
      },
      purchasingList: [],
      orders: [],
      error: error.message || "Өдрийн захиалга татахад алдаа гарлаа"
    }
  }
}
