"use server"

import { db } from "@/lib/db"
import { headers } from "next/headers"
import { createHash } from "crypto"

export async function logVisit(path: string, referrer?: string) {
  try {
    const h = await headers()
    const ip = h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown"
    const userAgent = h.get("user-agent") || "unknown"
    
    // Hash IP for uniqueness tracking without storing PPI
    const ipHash = createHash("md5").update(ip).digest("hex")

    // Ignore admin paths for public analytics
    if (path.startsWith("/admin") || path.startsWith("/api")) return

    await (db as any).visitorLog.create({
      data: {
        ipHash,
        path,
        userAgent,
        referrer,
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error("Failed to log visit:", error)
    return { success: false }
  }
}

export async function getAnalyticsSummary(days: number = 30) {
  try {
    const now = new Date()
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    // 1. Total Page Views
    const totalViews = await (db as any).visitorLog.count({
      where: { createdAt: { gte: cutoff } }
    })

    // 2. Unique Visitors (IP-based)
    const uniqueResult = await db.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT "ipHash") as count FROM "VisitorLog" WHERE "createdAt" >= $1`,
      cutoff
    )
    const uniqueVisitors = Number(uniqueResult[0]?.count || 0)

    // 3. Active Users (last 30m)
    const activeResult = await db.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT "ipHash") as count FROM "VisitorLog" WHERE "createdAt" >= $1`,
      thirtyMinutesAgo
    )
    const activeUsers = Number(activeResult[0]?.count || 0)

    // 4. Top Pages
    const topPages = await db.$queryRawUnsafe<any[]>(
      `SELECT "path", COUNT(*) as count FROM "VisitorLog" WHERE "createdAt" >= $1 GROUP BY "path" ORDER BY count DESC LIMIT 10`,
      cutoff
    )

    // 5. Views over time (last 7 days by default for chart)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const viewsOverTimeRaw = await db.$queryRawUnsafe<any[]>(
      `SELECT DATE("createdAt") as date, COUNT(*) as count FROM "VisitorLog" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date ASC`,
      sevenDaysAgo
    )
    
    const viewsOverTime = viewsOverTimeRaw.map((v: any) => ({
      date: new Date(v.date).toISOString().split('T')[0].substring(5), // MM-DD
      count: Number(v.count)
    }))

    // 6. Orders by Category (for Pie Chart)
    const categoryStats = await db.$queryRawUnsafe<any[]>(
      `SELECT c.name, COUNT(o.id) as count 
       FROM "Order" o
       JOIN "Batch" b ON o."batchId" = b.id
       JOIN "Category" c ON b."categoryId" = c.id
       WHERE o."createdAt" >= $1 AND o."paymentStatus" != 'REJECTED'
       GROUP BY c.name
       ORDER BY count DESC`,
      cutoff
    )

    return { 
      success: true, 
      stats: {
        totalViews,
        uniqueVisitors,
        activeUsers,
        topPages,
        viewsOverTime,
        categoryStats: categoryStats.map(c => ({ name: c.name, value: Number(c.count) }))
      }
    }
  } catch (error) {
    console.error("Failed to fetch analytics summary:", error)
    return { success: false, stats: null }
  }
}
export async function getActiveViewersCount() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const activeResult = await db.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT "ipHash") as count FROM "VisitorLog" WHERE "createdAt" >= $1`,
      thirtyMinutesAgo
    )
    const count = Number(activeResult[0]?.count || 0)
    // Add some random "life" if count is very low to keep it interesting
    const realisticCount = count < 3 ? Math.floor(Math.random() * 5) + 3 : count
    return { success: true, count: realisticCount }
  } catch (error) {
    console.error("Failed to fetch active viewers:", error)
    return { success: false, count: 5 }
  }
}
