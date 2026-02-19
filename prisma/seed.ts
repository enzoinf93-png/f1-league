import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1) Crea o trova l'utente admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@f1league.it' },
    update: {},
    create: {
      email: 'admin@f1league.it',
      password: passwordHash,
      name: 'Admin',
      isAdmin: true,
    },
  });

  // 2) Crea o trova la league
  const league = await prisma.league.upsert({
    where: { slug: 'f1-amici' },
    update: {},
    create: {
      name: 'Lega F1 tra amici',
      slug: 'f1-amici',
      adminId: adminUser.id,
    },
  });

  // 3) Associa l'admin alla league tramite LeagueMember
  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: league.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      leagueId: league.id,
      userId: adminUser.id,
    },
  });

  console.log(
    '✅ Seed completato. Admin:',
    adminUser.email,
    'pass: admin123'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
