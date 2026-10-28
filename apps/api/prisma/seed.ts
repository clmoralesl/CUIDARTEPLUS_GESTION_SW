import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sembrar(): Promise<void> {
  const tablas = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT count(*) AS total FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
  `;
  console.log(`Seed: ${tablas[0]?.total ?? 0} tablas disponibles, sin datos de ejemplo todavía.`);
}

sembrar()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
