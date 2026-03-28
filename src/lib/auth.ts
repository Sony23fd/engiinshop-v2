import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

/**
 * Returns the current logged-in admin from the session.
 * Returns null if not logged in or not an admin.
 */
export async function getCurrentAdmin() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) return null
  if (session.role !== "ADMIN" && session.role !== "CARGO_ADMIN" && session.role !== "DATAADMIN") return null
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  }
}

/**
 * Write an activity log entry to the database.
 */
export async function logActivity({
  userId,
  userName,
  userRole,
  action,
  target,
  targetUrl,
  detail,
}: {
  userId: string
  userName: string
  userRole: string
  action: string
  target?: string
  targetUrl?: string
  detail?: string
}) {
  try {
    await (db as any).activityLog.create({
      data: { userId, userName, userRole, action, target, targetUrl, detail }
    })
  } catch (e) {
    // Don't break the main action if logging fails
    console.error("Activity log error:", e)
  }
}

/**
 * CARGO_ADMIN allowed routes (prefix match)
 */
export const CARGO_ADMIN_ALLOWED_ROUTES = [
  "/admin/orders/batch",
  "/admin/orders/search",
  "/admin/orders/category",
  "/admin/cargo-settings",
]

export const DATAADMIN_ALLOWED_ROUTES = [
  "/admin/home",
  "/admin/data-center",
  "/admin/activity",
  "/admin/users",
  "/admin/settings",
]

export function isRouteAllowedForRole(pathname: string, role: string): boolean {
  if (role === "ADMIN") return true
  if (role === "CARGO_ADMIN") {
    return CARGO_ADMIN_ALLOWED_ROUTES.some(r => pathname.startsWith(r))
  }
  if (role === "DATAADMIN") {
    return DATAADMIN_ALLOWED_ROUTES.some(r => pathname.startsWith(r))
  }
  return false
}
