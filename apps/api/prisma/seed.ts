import { EstadoProyecto, NivelTarea, Prisma, PrismaClient, TipoDependencia } from '@prisma/client';
import {
  CALENDARIO_POR_DEFECTO,
  calcularCronograma,
  calcularFinPlan,
  calcularInicioPlan,
  consolidarArbol,
  crearCalendarioLaboral,
  dateAFechaIso,
  fechaIsoADate,
  feriadosChileDesde,
  numerarArbol,
  type DatosConsolidables,
  type DependenciaCronograma,
  type TareaCronograma,
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
      finPlan: null,
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
      finPlan: null,
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
      finPlan: null,
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
      finPlan: null,
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
      finPlan: null,
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
      inicioPlan: fechaIsoADate('2026-11-24'),
      finPlan: null,
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
      inicioPlan: fechaIsoADate('2026-12-03'),
      finPlan: null,
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
    const inicioGuardado = t.inicioPlan ? dateAFechaIso(t.inicioPlan) : null;
    const inicioIso =
      !tieneHijas && inicioGuardado
        ? calcularInicioPlan(inicioGuardado, calendario)
        : inicioGuardado;
    let finIso = t.finPlan ? dateAFechaIso(t.finPlan) : null;
    if (!tieneHijas && inicioIso) {
      finIso = calcularFinPlan(inicioIso, t.duracionDias, calendario);
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

  const consolidadas = consolidarArbol(datosConsolidar, calendario);
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

  const tareasCronograma: TareaCronograma[] = todas.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    padreId: t.padreId,
    duracionDias: t.duracionDias,
    fechaFija: t.fechaFija ? dateAFechaIso(t.fechaFija) : null,
    inicioReal: t.inicioReal ? dateAFechaIso(t.inicioReal) : null,
    finReal: t.finReal ? dateAFechaIso(t.finReal) : null,
  }));

  const dependenciasCronograma: DependenciaCronograma[] = datos.map((d) => ({
    predecesoraId: d.predecesoraId,
    sucesoraId: d.sucesoraId,
    tipo: d.tipo,
    desfaseDias: d.desfaseDias,
  }));

  const resultado = calcularCronograma(
    tareasCronograma,
    dependenciasCronograma,
    calendario,
    dateAFechaIso(proyecto.fechaInicio),
  );

  const mapaResultado = new Map(resultado.tareas.map((r) => [r.id, r]));
  for (const t of todas) {
    if (t.padreId === null || todas.some((h) => h.padreId === t.id)) continue;
    const calc = mapaResultado.get(t.id);
    const finPlanEsperado = t.finPlan ? dateAFechaIso(t.finPlan) : null;
    if (!calc || calc.finTemprano !== finPlanEsperado) {
      throw new Error(
        `Inconsistencia en seed: tarea ${t.codigo} tiene finTemprano ${calc?.finTemprano} pero finPlan ${finPlanEsperado}`,
      );
    }
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
