import { EstadoProyecto, NivelTarea, Prisma, PrismaClient, TipoDependencia } from '@prisma/client';
import {
  CALENDARIO_POR_DEFECTO,
  crearCalendarioLaboral,
  dateAFechaIso,
  fechaIsoADate,
  feriadosChileDesde,
  numerarArbol,
  planificarProyecto,
  type DependenciaCronograma,
  type TareaPlanificacion,
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
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  await prisma.tarea.create({
    data: {
      proyectoId,
      padreId: act22.id,
      nivel: NivelTarea.SUBACTIVIDAD,
      codigo: '~2.2.2',
      orden: 2,
      nombre: 'Configuración de impresoras de órdenes',
      responsable: 'Técnico de soporte',
      duracionDias: 2,
      fechaFija: fechaIsoADate('2026-11-23'),
      porcentajeAvance: new Prisma.Decimal(0),
    },
  });

  const todas = await prisma.tarea.findMany({ where: { proyectoId } });
  const numeracion = numerarArbol(todas);

  for (const t of todas) {
    const num = numeracion.get(t.id);
    if (!num) continue;
    await prisma.tarea.update({
      where: { id: t.id },
      data: {
        codigo: num.codigo,
        orden: num.orden,
      },
    });
  }
}

const DEPENDENCIAS_SEMILLA: {
  predecesora: string;
  sucesora: string;
  tipo: TipoDependencia;
  desfaseDias: number;
}[] = [
  { predecesora: '1.1.1', sucesora: '1.1.2', tipo: TipoDependencia.FS, desfaseDias: 0 },
  { predecesora: '1.1.2', sucesora: '1.2.1', tipo: TipoDependencia.SS, desfaseDias: 2 },
  { predecesora: '1.2.1', sucesora: '1.2.2', tipo: TipoDependencia.SS, desfaseDias: 3 },
  { predecesora: '1.1.2', sucesora: '1.2.2', tipo: TipoDependencia.FF, desfaseDias: 5 },
  { predecesora: '1.2.1', sucesora: '2.1.1', tipo: TipoDependencia.FS, desfaseDias: 0 },
  { predecesora: '2.1.1', sucesora: '2.1.2', tipo: TipoDependencia.FS, desfaseDias: 0 },
  { predecesora: '2.1.2', sucesora: '2.2.1', tipo: TipoDependencia.SS, desfaseDias: 7 },
];

async function sembrarDependencias(proyectoId: number): Promise<void> {
  const conteo = await prisma.dependencia.count({ where: { proyectoId } });
  if (conteo > 0) return;

  const todas = await prisma.tarea.findMany({ where: { proyectoId } });
  const mapaPorCodigo = new Map(todas.map((t) => [t.codigo, t]));

  const datos = DEPENDENCIAS_SEMILLA.map((dep) => {
    const predecesora = mapaPorCodigo.get(dep.predecesora);
    const sucesora = mapaPorCodigo.get(dep.sucesora);
    if (!predecesora || !sucesora) {
      throw new Error(`Tarea no encontrada para dependencia ${dep.predecesora} -> ${dep.sucesora}`);
    }
    return {
      proyectoId,
      predecesoraId: predecesora.id,
      sucesoraId: sucesora.id,
      tipo: dep.tipo,
      desfaseDias: dep.desfaseDias,
    };
  });

  await prisma.dependencia.createMany({
    data: datos,
    skipDuplicates: true,
  });
}

async function planificarSemilla(proyectoId: number): Promise<void> {
  const calFila = await prisma.calendario.findUnique({
    where: { proyectoId },
    include: { feriados: { select: { fecha: true } } },
  });
  const calendario = calFila
    ? crearCalendarioLaboral({
        diasLaborables: calFila.diasLaborables,
        feriados: calFila.feriados.map((f) => dateAFechaIso(f.fecha)),
      })
    : CALENDARIO_POR_DEFECTO;

  const proyecto = await prisma.proyecto.findUniqueOrThrow({
    where: { id: proyectoId },
    select: { fechaInicio: true },
  });

  const todas = await prisma.tarea.findMany({ where: { proyectoId } });
  const deps = await prisma.dependencia.findMany({ where: { proyectoId } });

  const tareasPlan: TareaPlanificacion[] = todas.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    padreId: t.padreId,
    duracionDias: t.duracionDias,
    fechaFija: t.fechaFija ? dateAFechaIso(t.fechaFija) : null,
    inicioReal: t.inicioReal ? dateAFechaIso(t.inicioReal) : null,
    finReal: t.finReal ? dateAFechaIso(t.finReal) : null,
    porcentajeAvance: Number(t.porcentajeAvance),
  }));

  const dependenciasPlan: DependenciaCronograma[] = deps.map((d) => ({
    predecesoraId: d.predecesoraId,
    sucesoraId: d.sucesoraId,
    tipo: d.tipo,
    desfaseDias: d.desfaseDias,
  }));

  const plan = planificarProyecto(
    tareasPlan,
    dependenciasPlan,
    calendario,
    dateAFechaIso(proyecto.fechaInicio),
  );

  for (const calc of plan.tareas) {
    await prisma.tarea.update({
      where: { id: calc.id },
      data: {
        duracionDias: calc.duracionDias,
        inicioPlan: fechaIsoADate(calc.inicioPlan),
        finPlan: fechaIsoADate(calc.finPlan),
        inicioTardio: fechaIsoADate(calc.inicioTardio),
        finTardio: fechaIsoADate(calc.finTardio),
        holguraDias: calc.holguraDias,
        esCritica: calc.esCritica,
        inicioReal: calc.inicioReal ? fechaIsoADate(calc.inicioReal) : null,
        finReal: calc.finReal ? fechaIsoADate(calc.finReal) : null,
        porcentajeAvance: new Prisma.Decimal(calc.porcentajeAvance),
      },
    });
  }

  if (plan.finProyecto !== '2026-12-10') {
    throw new Error(
      `Fin de proyecto inesperado en seed: ${plan.finProyecto} (esperado: 2026-12-10)`,
    );
  }

  const tarea122 = plan.tareas.find((t) => t.codigo === '1.2.2');
  if (!tarea122 || tarea122.holguraDias !== 16) {
    throw new Error(
      `Holgura inesperada para 1.2.2 en seed: ${tarea122?.holguraDias} (esperado: 16)`,
    );
  }

  const tarea222 = plan.tareas.find((t) => t.codigo === '2.2.2');
  if (
    !tarea222 ||
    tarea222.inicioPlan !== '2026-11-23' ||
    tarea222.finPlan !== '2026-11-24' ||
    tarea222.holguraDias !== 11
  ) {
    throw new Error(
      `Fechas u holgura inesperadas para 2.2.2 en seed: ${tarea222?.inicioPlan}..${tarea222?.finPlan}, holgura ${tarea222?.holguraDias} (esperado: 2026-11-23..2026-11-24, holgura 11)`,
    );
  }

  const padresConHijas = new Set(
    plan.tareas.map((t) => t.padreId).filter((id): id is number => id !== null),
  );
  const hojasCriticas = plan.tareas
    .filter((t) => t.esCritica && !padresConHijas.has(t.id))
    .map((t) => t.codigo)
    .sort();
  const hojasCriticasEsperadas = ['1.1.1', '1.1.2', '1.2.1', '2.1.1', '2.1.2', '2.2.1'].sort();

  if (JSON.stringify(hojasCriticas) !== JSON.stringify(hojasCriticasEsperadas)) {
    throw new Error(
      `Hojas críticas inesperadas en seed: ${hojasCriticas.join(', ')} (esperadas: ${hojasCriticasEsperadas.join(', ')})`,
    );
  }
}

async function sembrar(): Promise<void> {
  let proyectoPrincipalId: number | null = null;

  for (const datos of PROYECTOS_SEMILLA) {
    const existente = await prisma.proyecto.findFirst({
      where: { nombre: datos.nombre },
      include: { calendario: true },
    });

    let calendarioId: number;

    if (!existente) {
      const creado = await prisma.proyecto.create({
        data: {
          ...datos,
          calendario: { create: {} },
        },
        include: { calendario: true },
      });
      calendarioId = creado.calendario!.id;
      if (creado.nombre === 'AutoFix · Implementación') {
        proyectoPrincipalId = creado.id;
      }
    } else {
      if (!existente.calendario) {
        const cal = await prisma.calendario.create({
          data: { proyectoId: existente.id },
        });
        calendarioId = cal.id;
      } else {
        calendarioId = existente.calendario.id;
      }
      if (existente.nombre === 'AutoFix · Implementación') {
        proyectoPrincipalId = existente.id;
      }
    }

    await prisma.feriado.createMany({
      data: feriadosChileDesde(dateAFechaIso(datos.fechaInicio)).map((f) => ({
        calendarioId,
        fecha: fechaIsoADate(f.fecha),
        descripcion: f.descripcion,
      })),
      skipDuplicates: true,
    });
  }

  if (proyectoPrincipalId) {
    await sembrarTareas(proyectoPrincipalId);
    await sembrarDependencias(proyectoPrincipalId);
    await planificarSemilla(proyectoPrincipalId);
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
