import { EstadoProyecto, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROYECTOS_SEMILLA = [
  {
    nombre: 'AutoFix · Implementación',
    descripcion: 'Implementación del sistema de gestión de órdenes de trabajo del taller.',
    responsable: 'Jefe de Proyecto',
    presupuesto: 45000000,
    fechaInicio: new Date('2026-11-02T00:00:00.000Z'),
    fechaFin: new Date('2027-03-31T00:00:00.000Z'),
    estado: EstadoProyecto.EN_CURSO,
  },
  {
    nombre: 'Piloto de agenda · 2026',
    descripcion: 'Piloto inicial del módulo de agenda de mecánicos.',
    responsable: 'Jefe de Proyecto',
    presupuesto: 8000000,
    fechaInicio: new Date('2026-03-02T00:00:00.000Z'),
    fechaFin: new Date('2026-06-30T00:00:00.000Z'),
    estado: EstadoProyecto.CERRADO,
  },
];

async function sembrar(): Promise<void> {
  for (const datos of PROYECTOS_SEMILLA) {
    const existente = await prisma.proyecto.findFirst({
      where: { nombre: datos.nombre },
      include: { calendario: true },
    });

    if (!existente) {
      await prisma.proyecto.create({
        data: {
          ...datos,
          calendario: { create: {} },
        },
      });
    } else if (!existente.calendario) {
      await prisma.calendario.create({
        data: { proyectoId: existente.id },
      });
    }
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
