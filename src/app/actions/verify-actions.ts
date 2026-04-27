"use server"

import { createVerifySession, isPhoneVerified } from "@/lib/verify-mn"

/**
 * Server action: Start phone verification via verify.mn
 * Called from CartClient when user clicks "Утас баталгаажуулах"
 */
export async function startPhoneVerification(phone: string): Promise<{
  success: boolean
  sessionId?: string
  smsUri?: string
  displayInstruction?: string
  expiresAt?: string
  error?: string
}> {
  // Normalize phone
  const digits = phone.replace(/\D/g, "")
  if (digits.length !== 8) {
    return { success: false, error: "Утасны дугаар 8 оронтой байх ёстой" }
  }

  // Check if already verified
  if (isPhoneVerified(digits)) {
    return { success: true, sessionId: "already-verified" }
  }

  // Check if API key is configured
  if (!process.env.VERIFY_MN_API_KEY) {
    // If no API key, skip verification (dev mode / not configured)
    console.warn("VERIFY_MN_API_KEY not configured — skipping phone verification")
    return { success: true, sessionId: "skipped" }
  }

  const result = await createVerifySession(digits)

  if (!result.success || !result.session) {
    return { success: false, error: result.error || "Баталгаажуулалт эхлүүлэхэд алдаа гарлаа" }
  }

  return {
    success: true,
    sessionId: result.session.sessionId,
    smsUri: result.session.smsUri,
    displayInstruction: result.session.displayInstruction,
    expiresAt: result.session.expiresAt,
  }
}

/**
 * Server action: Check if a phone has been verified
 */
export async function checkPhoneVerified(phone: string): Promise<boolean> {
  // If no API key configured, always return true (dev mode)
  if (!process.env.VERIFY_MN_API_KEY) return true

  const digits = phone.replace(/\D/g, "")
  return isPhoneVerified(digits)
}

/**
 * Server action: Force verify a session (Dev Mode Only)
 */
export async function mockVerifyPhoneAction(sessionId: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false;
  
  const { getStoredSession, markPhoneVerified } = await import("@/lib/verify-mn");
  const session = getStoredSession(sessionId);
  if (session) {
    session.status = "VERIFIED";
    markPhoneVerified(session.phone);
    return true;
  }
  return false;
}
