import { getCurrentAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getActivityLogs, getActivityStats, getAdminUsersList } from "@/app/actions/activity-actions"
import { ActivityClient } from "./ActivityClient"

export const dynamic = "force-dynamic"

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== "ADMIN") redirect("/admin/orders/search")

  const resolved = await searchParams
  const q = typeof resolved.q === "string" ? resolved.q : undefined
  const userId = typeof resolved.userId === "string" ? resolved.userId : undefined
  const type = typeof resolved.type === "string" ? resolved.type : undefined
  const dateRange = typeof resolved.dateRange === "string" ? resolved.dateRange : undefined
  const page = typeof resolved.page === "string" ? Number(resolved.page) : 1

  const [activityData, stats, adminUsers] = await Promise.all([
    getActivityLogs({ page, limit: 50, q, userId, type, dateRange }),
    getActivityStats(),
    getAdminUsersList(),
  ])

  return (
    <ActivityClient
      initialLogs={activityData.logs || []}
      initialTotal={activityData.total || 0}
      initialTotalPages={activityData.totalPages || 0}
      initialCurrentPage={activityData.currentPage || 1}
      adminUsers={adminUsers || []}
      stats={stats}
    />
  )
}
