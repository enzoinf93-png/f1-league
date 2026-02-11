import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const league = await prisma.league.upsert({
    where: { slug: 'f1-amici' },
    update: {},
    create: {
      name: 'Lega F1 tra amici',
      slug: 'f1-amici',
      adminId: '', // lo mettiamo dopo
      users: {
        create: {
          email: 'admin@f1league.it',
          password: passwordHash,
          name: 'Admin',
          isAdmin: true,
        },
      },
    },
    include: { users: true },
  })

  const adminUser = league.users[0]

  await prisma.league.update({
    where: { id: league.id },
    data: { adminId: adminUser.id },
  })

  console.log('✅ Seed completato. Admin:', adminUser.email, 'pass: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
