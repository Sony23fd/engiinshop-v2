import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "dataadmin@anarshop.mn"
  const password = "SuperSecretData!2026"

  // Check if exists
  const existing = await prisma.user.findUnique({ where: { email } })
  
  if (existing) {
    console.log(`Дата Админ (${email}) хэдийнэ үүсгэгдсэн байна.`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: "Data Admin",
      role: "DATAADMIN",
    }
  })

  console.log("======================================")
  console.log("✅ Шинэ Дата Админ амжилттай үүслээ!")
  console.log(`Имэйл: ${email}`)
  console.log(`Нууц үг: ${password}`)
  console.log("Та систем рүү /admin/login хуудсаар нэвтэрч орно уу.")
  console.log("======================================")
}

main()
  .catch((e) => {
    console.error("Алдаа гарлаа:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
