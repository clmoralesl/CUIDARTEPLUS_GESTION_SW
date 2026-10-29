import { EstadoProyecto, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sembrar(): Promise<void> {
  const nombreProyecto = 'AutoFix · Implementación';
  const existente = await prisma.proyecto.findFirst({
    where: { nombre: nombreProyecto },
  });

  if (!existente) {
    await prisma.proyecto.create({
      data: {
        nombre: nombreProyecto,
        responsable: 'Jefe de Proyecto',
        fechaInicio: new Date('2026-11-02'),
        estado: EstadoProyecto.EN_CURSO,
      },
    });
  }

  const tablas = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT count(*) AS total FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
  `;
  console.log(`Seed completado: ${tablas[0]?.total ?? 0} tablas disponibles.`);
}

sembrar()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
