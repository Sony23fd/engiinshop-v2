import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    const maxSize = 2 * 1024 * 1024 // 2MB limit
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Зургийн хэмжээ 2MB-аас хэтрэхгүй байх ёстой" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to base64 to store directly in DB without needing file system access on Vercel
    const base64String = `data:${file.type};base64,${buffer.toString("base64")}`

    return NextResponse.json({ success: true, url: base64String })
  } catch (e) {
    console.error("Settings upload error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
