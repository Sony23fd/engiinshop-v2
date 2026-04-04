import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@anarshop.mn' },
    update: {},
    create: {
      email: 'admin@anarshop.mn',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Anar Admin',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // 1b. Create Default Cargo Admin User
  const cargoPassword = await bcrypt.hash('cargo123', 10)
  const cargoAdmin = await prisma.user.upsert({
    where: { email: 'cargo@anarshop.mn' },
    update: {},
    create: {
      email: 'cargo@anarshop.mn',
      password: cargoPassword,
      role: 'CARGO_ADMIN',
      name: 'Cargo Admin',
    },
  })
  console.log(`Created cargo admin user: ${cargoAdmin.email}`)

  // 1c. Create Default Data Admin User
  const dataPassword = await bcrypt.hash('data123', 10)
  const dataAdmin = await prisma.user.upsert({
    where: { email: 'data@anarshop.mn' },
    update: {},
    create: {
      email: 'data@anarshop.mn',
      password: dataPassword,
      role: 'DATAADMIN',
      name: 'Data Admin',
    },
  })
  console.log(`Created data admin user: ${dataAdmin.email}`)

  // 2. Create Order Status Types
  const statuses = [
    { name: 'Төлбөр хүлээгдэж байна', isFinal: false, isDefault: true, color: 'amber' },
    { name: 'Захиалга баталгаажсан', isFinal: false, isDefault: false, color: 'blue' },
    { name: 'Цуцлагдсан', isFinal: true, isDefault: false, color: 'red' },
    { name: 'Солонгосоос хөдөлсөн', isFinal: false, isDefault: false, color: 'purple' },
    { name: 'Улаанбаатарт ирсэн', isFinal: false, isDefault: false, color: 'indigo' },
    { name: 'Өөрөө ирж авсан', isFinal: true, isDefault: false, color: 'emerald' },
    { name: 'Хүргэлтээр авсан', isFinal: true, isDefault: false, color: 'emerald' },
  ]

  for (const s of statuses) {
    await prisma.orderStatusType.upsert({
      where: { name: s.name },
      update: { 
        isDefault: s.isDefault,
        isFinal: s.isFinal,
        color: s.color 
      },
      create: s,
    })
  }
  console.log(`Created ${statuses.length} order statuses`)

  // 3. Create Categories
  const categories = [
    { name: 'Бэлэн Монголд байгаа бараа' },
    { name: '2026.03 сар' }
  ]

  for (const c of categories) {
    const existing = await prisma.category.findFirst({ where: { name: c.name } })
    if (!existing) {
      await prisma.category.create({ data: c })
    }
  }
  console.log(`Created ${categories.length} categories`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
