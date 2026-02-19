import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Prova ad accedere alle proprietà
  console.log(
    Object.keys(prisma)
      .filter((k) => !k.startsWith("_"))
      .sort()
  );
}

main().finally(async () => {
  await prisma.$disconnect();
});
