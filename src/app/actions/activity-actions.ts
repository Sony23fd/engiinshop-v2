"use server"

import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"

export interface ActivityFilterParams {
  page?: number
  limit?: number
  q?: string
  userId?: string
  type?: string
  dateRange?: string
}

export async function getActivityLogs(params: ActivityFilterParams = {}) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return { success: false, error: "Нэвтэрнэ үү", logs: [], total: 0, totalPages: 0 }
    }

    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(10, params.limit || 50))
    const skip = (page - 1) * limit

    const where: any = {}

    // 1. Text Search across userName, action, target, detail
    if (params.q && params.q.trim()) {
      const q = params.q.trim()
      where.OR = [
        { userName: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { target: { contains: q, mode: "insensitive" } },
        { detail: { contains: q, mode: "insensitive" } },
        { targetUrl: { contains: q, mode: "insensitive" } },
      ]
    }

    // 2. Filter by User
    if (params.userId && params.userId !== "all") {
      where.userId = params.userId
    }

    // 3. Filter by Type
    if (params.type && params.type !== "all") {
      where.type = params.type
    }

    // 4. Filter by Date range
    if (params.dateRange && params.dateRange !== "all") {
      const now = new Date()
      let startDate: Date | null = null

      if (params.dateRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (params.dateRange === "yesterday") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        where.createdAt = { gte: startDate, lt: endDate }
      } else if (params.dateRange === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (params.dateRange === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      if (startDate && params.dateRange !== "yesterday") {
        where.createdAt = { gte: startDate }
      }
    }

    const [logs, total] = await Promise.all([
      (db as any).activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      (db as any).activityLog.count({ where }),
    ])

    return {
      success: true,
      logs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error: any) {
    console.error("Failed to get activity logs:", error)
    return { success: false, error: error.message, logs: [], total: 0, totalPages: 0 }
  }
}

export async function getActivityStats() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return null

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayCount, orderChangesToday, userStats] = await Promise.all([
      (db as any).activityLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
      (db as any).activityLog.count({
        where: {
          createdAt: { gte: todayStart },
          type: "ORDER",
        },
      }),
      (db as any).activityLog.groupBy({
        by: ["userName"],
        where: { createdAt: { gte: todayStart } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }).catch(() => []),
    ])

    return {
      todayTotal: todayCount,
      orderChangesToday,
      topUserToday: userStats[0] ? { name: userStats[0].userName, count: userStats[0]._count.id } : null,
    }
  } catch {
    return null
  }
}

export async function getAdminUsersList() {
  try {
    const users = await (db.user as any).findMany({
      where: { role: { not: "CUSTOMER" } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    })
    return (users || []).map((u: any) => ({
      id: u.id,
      username: u.name || u.email || "Ажилтан",
      role: u.role,
    }))
  } catch {
    return []
  }
}

