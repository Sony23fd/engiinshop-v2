"use server"

import fs from "fs"
import path from "path"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import type { AdminSessionData } from "@/lib/session"

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "anar-shop-secret-key-must-be-at-least-32-chars!!",
  cookieName: "anar-admin-session",
}

export async function getEnvFile() {
  try {
    const session = await getIronSession<AdminSessionData>(await cookies(), SESSION_OPTIONS)
    if (!session.isLoggedIn || session.role !== "DATAADMIN") {
      return { success: false, error: "Эрхгүй байна" }
    }

    const envPath = path.join(process.cwd(), ".env")
    if (!fs.existsSync(envPath)) {
      return { success: false, error: ".env файл олдсонгүй" }
    }

    const content = fs.readFileSync(envPath, "utf-8")
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveEnvFile(content: string) {
  try {
    const session = await getIronSession<AdminSessionData>(await cookies(), SESSION_OPTIONS)
    if (!session.isLoggedIn || session.role !== "DATAADMIN") {
      return { success: false, error: "Эрхгүй байна" }
    }

    const envPath = path.join(process.cwd(), ".env")
    fs.writeFileSync(envPath, content, "utf-8")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
