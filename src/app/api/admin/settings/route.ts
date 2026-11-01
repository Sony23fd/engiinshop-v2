import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const settings = await db.shopSettings.findMany()
    const config = settings.reduce((acc, current) => {
      acc[current.key] = current.value
      return acc
    }, {} as Record<string, string>)
    
    return NextResponse.json({ success: true, settings: config })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Тохиргоо уншихад алдаа гарлаа" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Эрх хүрэхгүй байна" }, { status: 401 })
    }

    const body = await req.json()

    if (body.settings && typeof body.settings === "object") {
      const entries = Object.entries(body.settings)
      await Promise.all(
        entries.map(([k, v]) =>
          db.shopSettings.upsert({
            where: { key: k },
            update: { value: String(v ?? "") },
            create: { key: k, value: String(v ?? "") }
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: "Дутуу мэдээлэл байна" }, { status: 400 })
    }

    const updated = await db.shopSettings.upsert({
      where: { key },
      update: { value: String(value ?? "") },
      create: { key, value: String(value ?? "") }
    })

    return NextResponse.json({ success: true, setting: updated })
  } catch (error) {
    console.error("Failed to save setting:", error)
    return NextResponse.json({ error: "Тохиргоо хадгалахад алдаа гарлаа" }, { status: 500 })
  }
}
