import { NextRequest, NextResponse } from "next/server"
import { getSessionStatus, getStoredSession, markPhoneVerified } from "@/lib/verify-mn"

/**
 * GET /api/verify-mn/status/[sessionId]
 * 
 * Client polls this endpoint every ~3s to check if the user has sent the SMS.
 * We forward the request to verify.mn's GET /sessions/{sessionId} and return the result.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // Check if session exists in our store
    const stored = getStoredSession(sessionId)
    if (!stored) {
      return NextResponse.json({ error: "Session олдсонгүй" }, { status: 404 })
    }

    // Check if already expired locally
    if (Date.now() > new Date(stored.expiresAt).getTime()) {
      return NextResponse.json({
        sessionId,
        status: "EXPIRED",
        message: "Хугацаа дууссан. Дахин оролдоно уу."
      })
    }

    // If already verified locally, skip API call
    if (stored.status === "VERIFIED") {
      return NextResponse.json({
        sessionId,
        status: "VERIFIED",
      })
    }

    // Check with verify.mn API
    const result = await getSessionStatus(sessionId)

    if (!result.success) {
      return NextResponse.json({
        sessionId,
        status: stored.status, // Return last known status
        error: result.error,
      })
    }

    // Mark in persistent cache when verified
    if (result.status === "VERIFIED" && stored.phone) {
      markPhoneVerified(stored.phone)
    }

    return NextResponse.json({
      sessionId,
      status: result.status,
      verifiedAt: result.verifiedAt,
    })
  } catch (error: any) {
    console.error("verify-mn status check error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
