import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Имэйл болон нууц үгийг оруулна уу" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !user.password) {
      return NextResponse.json({ error: "Имэйл эсвэл нууц үг буруу байна" }, { status: 401 })
    }

    const allowedRoles = ["ADMIN", "CARGO_ADMIN", "DATAADMIN"]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Энэ хэрэглэгч нь adminы эрхгүй байна" }, { status: 403 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Имэйл эсвэл нууц үг буруу байна" }, { status: 401 })
    }

    await createSession({
      userId: user.id,
      email: user.email!,
      name: user.name || user.email!,
      role: user.role as "ADMIN" | "CARGO_ADMIN" | "DATAADMIN",
    }, rememberMe)

    return NextResponse.json({ success: true, role: user.role })
  } catch (e) {
    console.error("Login error:", e)
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 })
  }
}
