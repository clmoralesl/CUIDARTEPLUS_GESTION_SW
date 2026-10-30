import { EstadoProyecto, NivelTarea, Prisma, PrismaClient } from '@prisma/client';
import {
  calcularFinPlan,
  consolidarArbol,
  dateAFechaIso,
  fechaIsoADate,
  numerarArbol,
  type DatosConsolidables,
} from '@autofix/core';

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

async function sembrarTareas(proyectoId: number): Promise<void> {
  const conteo = await prisma.tarea.count({ where: { proyectoId } });
  if (conteo > 0) return;

  const etapa1 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '~1',
      orden: 1,
      nombre: 'Levantamiento y diseño',
      responsable: 'Jefe de Proyecto',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const act11 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: etapa1.id,
      nivel: NivelTarea.ACTIVIDAD,
      codigo: '~1.1',
      orden: 1,
      nombre: 'Levantamiento de procesos del taller',
      responsable: 'Jefe de Taller',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act11.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~1.1.1',
      orden: 1,
      nombre: 'Entrevistas con el jefe de taller',
      responsable: 'Jefe de Taller',
      duracionDias: 3,
      inicioPlan: fechaIsoADate('2026-11-02'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-02', 3)),
      inicioReal: fechaIsoADate('2026-11-02'),
      finReal: fechaIsoADate('2026-11-04'),
      porcentajeAvance: new Prisma.Decimal(100),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act11.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~1.1.2',
      orden: 2,
      nombre: 'Mapeo del flujo de órdenes de trabajo',
      responsable: 'Jefe de Taller',
      duracionDias: 4,
      inicioPlan: fechaIsoADate('2026-11-05'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-05', 4)),
      inicioReal: fechaIsoADate('2026-11-05'),
      finReal: null,
      porcentajeAvance: new Prisma.Decimal(50),
    },
  });

  const act12 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: etapa1.id,
      nivel: NivelTarea.ACTIVIDAD,
      codigo: '~1.2',
      orden: 2,
      nombre: 'Diseño de la solución',
      responsable: 'Jefe de Proyecto',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act12.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~1.2.1',
      orden: 1,
      nombre: 'Modelo de datos de vehículos y órdenes',
      responsable: 'Desarrollador',
      duracionDias: 5,
      inicioPlan: fechaIsoADate('2026-11-09'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-09', 5)),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act12.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~1.2.2',
      orden: 2,
      nombre: 'Prototipo de pantallas de recepción',
      responsable: 'Diseñador UI',
      duracionDias: 4,
      inicioPlan: fechaIsoADate('2026-11-12'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-12', 4)),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const etapa2 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '~2',
      orden: 2,
      nombre: 'Construcción',
      responsable: 'Jefe de Proyecto',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const act21 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: etapa2.id,
      nivel: NivelTarea.ACTIVIDAD,
      codigo: '~2.1',
      orden: 1,
      nombre: 'Módulo de órdenes de trabajo',
      responsable: 'Desarrollador Senior',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act21.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~2.1.1',
      orden: 1,
      nombre: 'Registro de vehículos y clientes',
      responsable: 'Desarrollador',
      duracionDias: 6,
      inicioPlan: fechaIsoADate('2026-11-16'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-16', 6)),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act21.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~2.1.2',
      orden: 2,
      nombre: 'Ingreso y seguimiento de órdenes',
      responsable: 'Desarrollador',
      duracionDias: 8,
      inicioPlan: fechaIsoADate('2026-11-22'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-22', 8)),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const act22 = await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: etapa2.id,
      nivel: NivelTarea.ACTIVIDAD,
      codigo: '~2.2',
      orden: 2,
      nombre: 'Módulo de agenda de mecánicos',
      responsable: 'Desarrollador',
      duracionDias: 1,
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act22.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~2.2.1',
      orden: 1,
      nombre: 'Calendario de turnos por mecánico',
      responsable: 'Desarrollador',
      duracionDias: 5,
      inicioPlan: fechaIsoADate('2026-11-30'),
      finPlan: fechaIsoADate(calcularFinPlan('2026-11-30', 5)),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const todas = await prisma.tarea.findMany({ where: { proyectoId } });
  const padresConHijas = new Set(
    todas.map((t) => t.padreId).filter((id): id is number => id !== null),
  );
  const numeracion = numerarArbol(todas);

  const datosConsolidar: DatosConsolidables[] = todas.map((t) => {
    const tieneHijas = padresConHijas.has(t.id);
    const inicioIso = t.inicioPlan ? dateAFechaIso(t.inicioPlan) : null;
    let finIso = t.finPlan ? dateAFechaIso(t.finPlan) : null;
    if (!tieneHijas && inicioIso) {
      finIso = calcularFinPlan(inicioIso, t.duracionDias);
    }
    return {
      id: t.id,
      padreId: t.padreId,
      duracionDias: t.duracionDias,
      inicioPlan: inicioIso,
      finPlan: finIso,
      inicioReal: t.inicioReal ? dateAFechaIso(t.inicioReal) : null,
      finReal: t.finReal ? dateAFechaIso(t.finReal) : null,
      porcentajeAvance: Number(t.porcentajeAvance),
    };
  });

  const consolidadas = consolidarArbol(datosConsolidar);
  const mapaConsolidadas = new Map(consolidadas.map((c) => [c.id, c]));

  for (const t of todas) {
    const num = numeracion.get(t.id);
    const cons = mapaConsolidadas.get(t.id);
    if (!num || !cons) continue;

    await prisma.tarea.update({
      where: { id: t.id },
      data: {
        codigo: num.codigo,
        orden: num.orden,
        duracionDias: cons.duracionDias,
        inicioPlan: cons.inicioPlan ? fechaIsoADate(cons.inicioPlan) : null,
        finPlan: cons.finPlan ? fechaIsoADate(cons.finPlan) : null,
        inicioReal: cons.inicioReal ? fechaIsoADate(cons.inicioReal) : null,
        finReal: cons.finReal ? fechaIsoADate(cons.finReal) : null,
        porcentajeAvance: new Prisma.Decimal(cons.porcentajeAvance),
      },
    });
  }
}

async function sembrar(): Promise<void> {
  let proyectoPrincipalId: number | null = null;

  for (const datos of PROYECTOS_SEMILLA) {
    const existente = await prisma.proyecto.findFirst({
      where: { nombre: datos.nombre },
      include: { calendario: true },
    });

    if (!existente) {
      const creado = await prisma.proyecto.create({
        data: {
          ...datos,
          calendario: { create: {} },
        },
      });
      if (creado.nombre === 'AutoFix · Implementación') {
        proyectoPrincipalId = creado.id;
      }
    } else {
      if (!existente.calendario) {
        await prisma.calendario.create({
          data: { proyectoId: existente.id },
        });
      }
      if (existente.nombre === 'AutoFix · Implementación') {
        proyectoPrincipalId = existente.id;
      }
    }
  }

  if (proyectoPrincipalId) {
    await sembrarTareas(proyectoPrincipalId);
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
