import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Эрх хүрэхгүй байна" }, { status: 401 })
    }

    const { id } = await params;
    const { name, role, password } = await req.json()

    const updateData: any = { name, role }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Хэрэглэгчийг шинэчлэхэд алдаа гарлаа" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Эрх хүрэхгүй байна" }, { status: 401 })
    }

    const { id } = await params;

    // Prevent deleting the currently logged-in admin
    if (session.userId === id) {
      return NextResponse.json({ error: "Өөрийн хаягийг устгах боломжгүй" }, { status: 400 })
    }

    await db.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Хэрэглэгчийг устгахад алдаа гарлаа" }, { status: 500 })
  }
}
