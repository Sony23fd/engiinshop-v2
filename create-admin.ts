import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const plainPassword = process.argv[3]
  const name = process.argv[4] || "Шинэ Админ"
  const isCargo = process.argv[5] === "cargo"
  const role = isCargo ? "CARGO_ADMIN" : "ADMIN"

  if (!email || !plainPassword) {
    console.log("Хэрэглэх заавар: npx tsx create-admin.ts <email> <password> [name] [cargo]")
    console.log("Жишээ нь (Үндсэн админ): npx tsx create-admin.ts bat@gmail.com pass123 'Бат'")
    console.log("Жишээ нь (Карго админ): npx tsx create-admin.ts cargo@gmail.com pass123 'Карго' cargo")
    process.exit(1)
  }

  console.log(`'${email}' ${role} хэрэглэгчийг бүртгэж байна...`)
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role
    },
    create: {
      email,
      password: hashedPassword,
      role,
      name,
    },
  })

  console.log(`✅ Амжилттай! Админ хэрэглэгч үүслээ (эсвэл шинэчлэгдлээ).`)
  console.log(`Имэйл: ${user.email}`)
  console.log(`Нэр: ${user.name}`)
  console.log("Одоо та энэ эрхээрээ сайтаараа нэвтэрч орж болно.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
