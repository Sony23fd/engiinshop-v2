import { NextResponse } from "next/server"
import { getStoredSession, markPhoneVerified } from "@/lib/verify-mn"

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }

  const session = getStoredSession(sessionId)
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // Force verify
  session.status = "VERIFIED"
  markPhoneVerified(session.phone)

  return NextResponse.json({ success: true, message: "Mock verification successful" })
}
