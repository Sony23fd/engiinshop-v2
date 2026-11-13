import { db } from "@/lib/db"
import { getCurrentAdmin } from "@/lib/auth"

export type ActivityType = 
  | "ORDER" 
  | "PRODUCT" 
  | "SETTINGS" 
  | "USER" 
  | "PAYMENT" 
  | "AUTH" 
  | "GENERAL"

export interface LogActivityParams {
  action: string
  type?: ActivityType
  target?: string
  targetUrl?: string
  detail?: string
  userId?: string
  userName?: string
  userRole?: string
}

/**
 * Universal safe activity logger for all admin & system actions.
 * Automatically resolves the logged-in admin from cookies if not provided.
 */
export async function logAdminActivity({
  action,
  type = "GENERAL",
  target,
  targetUrl,
  detail,
  userId,
  userName,
  userRole,
}: LogActivityParams) {
  try {
    let resolvedUserId = userId
    let resolvedUserName = userName
    let resolvedUserRole = userRole

    // If user info is not explicitly provided, get from current admin session
    if (!resolvedUserId) {
      const admin = await getCurrentAdmin().catch(() => null)
      if (admin) {
        resolvedUserId = admin.id
        resolvedUserName = admin.name || admin.email || "Админ"
        resolvedUserRole = admin.role
      } else {
        resolvedUserId = "system"
        resolvedUserName = "Систем"
        resolvedUserRole = "SYSTEM"
      }
    }

    await (db as any).activityLog.create({
      data: {
        userId: resolvedUserId,
        userName: resolvedUserName || "Тодорхойгүй",
        userRole: resolvedUserRole || "STAFF",
        action,
        type,
        target,
        targetUrl,
        detail,
      },
    })
  } catch (error) {
    // Logging failure should never crash the main operation
    console.error("Activity logging error:", error)
  }
}

