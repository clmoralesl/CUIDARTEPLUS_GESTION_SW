import { describe, expect, it } from 'vitest';
import {
  crearCalendarioLaboral,
  DIAS_LABORABLES_POR_DEFECTO,
  diasHabilesEntre,
} from './calendario';
import { consolidarArbol } from './consolidacion';
import type { DependenciaCronograma, TipoDependencia } from './cronograma';
import { feriadosChileDesde } from './feriados-chile';
import {
  compararFechas,
  planificarProyecto,
  resumirTareasAfectadas,
  type PlanificacionTarea,
  type TareaPlanificacion,
} from './recalculo';

const calendario = crearCalendarioLaboral({
  diasLaborables: DIAS_LABORABLES_POR_DEFECTO,
  feriados: feriadosChileDesde('2026-01-01').map((f) => f.fecha),
});

const tarea = (
  id: number,
  codigo: string,
  padreId: number | null,
  duracionDias: number,
  extra: Partial<TareaPlanificacion> = {},
): TareaPlanificacion => ({
  id,
  codigo,
  padreId,
  duracionDias,
  fechaFija: null,
  inicioReal: null,
  finReal: null,
  porcentajeAvance: 0,
  ...extra,
});

const dep = (
  predecesoraId: number,
  sucesoraId: number,
  tipo: TipoDependencia,
  desfaseDias: number,
): DependenciaCronograma => ({ predecesoraId, sucesoraId, tipo, desfaseDias });

const SEED: TareaPlanificacion[] = [
  tarea(1, '1', null, 1),
  tarea(2, '1.1', 1, 1),
  tarea(3, '1.1.1', 2, 3, {
    inicioReal: '2026-11-02',
    finReal: '2026-11-04',
    porcentajeAvance: 100,
  }),
  tarea(4, '1.1.2', 2, 4, { inicioReal: '2026-11-05', porcentajeAvance: 50 }),
  tarea(5, '1.2', 1, 1),
  tarea(6, '1.2.1', 5, 5),
  tarea(7, '1.2.2', 5, 4),
  tarea(8, '2', null, 1),
  tarea(9, '2.1', 8, 1),
  tarea(10, '2.1.1', 9, 6),
  tarea(11, '2.1.2', 9, 8),
  tarea(12, '2.2', 8, 1),
  tarea(13, '2.2.1', 12, 5),
  tarea(14, '2.2.2', 12, 2, { fechaFija: '2026-11-23' }),
];

const DEPENDENCIAS_SEED = [
  dep(3, 4, 'FS', 0),
  dep(4, 6, 'SS', 2),
  dep(6, 7, 'SS', 3),
  dep(4, 7, 'FF', 5),
  dep(6, 10, 'FS', 0),
  dep(10, 11, 'FS', 0),
  dep(11, 13, 'SS', 7),
];

const fechas = (plan: { tareas: PlanificacionTarea[] }) =>
  plan.tareas.map((t) => ({
    id: t.id,
    codigo: t.codigo,
    tieneHijas: plan.tareas.some((h) => h.padreId === t.id),
    inicioPlan: t.inicioPlan,
    finPlan: t.finPlan,
  }));

describe('planificarProyecto', () => {
  const plan = planificarProyecto(SEED, DEPENDENCIAS_SEED, calendario, '2026-11-02');
  const por = (codigo: string) => plan.tareas.find((t) => t.codigo === codigo);

  it('reproduce la tabla del seed de docs/motor-cronograma.md', () => {
    expect(plan.finProyecto).toBe('2026-12-10');
    expect(por('1.2.2')).toMatchObject({
      inicioPlan: '2026-11-12',
      finPlan: '2026-11-17',
      inicioTardio: '2026-12-04',
      finTardio: '2026-12-10',
      holguraDias: 16,
      esCritica: false,
    });
    expect(por('2.2.2')).toMatchObject({
      inicioPlan: '2026-11-23',
      finPlan: '2026-11-24',
      holguraDias: 11,
      esCritica: false,
    });
    const criticas = plan.tareas
      .filter((t) => t.esCritica && !plan.tareas.some((h) => h.padreId === t.id))
      .map((t) => t.codigo);
    expect(criticas).toEqual(['1.1.1', '1.1.2', '1.2.1', '2.1.1', '2.1.2', '2.2.1']);
  });

  it('consolida los padres igual que consolidarArbol y conserva el avance', () => {
    expect(por('1')).toMatchObject({
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-17',
      duracionDias: 12,
      porcentajeAvance: 35.72,
    });
    expect(por('2.2')).toMatchObject({
      inicioPlan: '2026-11-23',
      finPlan: '2026-12-10',
      duracionDias: 13,
    });
    const consolidadas = consolidarArbol(
      plan.tareas.map((t) => ({ ...t })),
      calendario,
    );
    for (const c of consolidadas) {
      const p = plan.tareas.find((t) => t.id === c.id);
      expect([c.inicioPlan, c.finPlan, c.duracionDias]).toEqual([
        p?.inicioPlan,
        p?.finPlan,
        p?.duracionDias,
      ]);
    }
  });

  it('descarta la fecha fija de las tareas con subtareas', () => {
    const conPadreFijo = SEED.map((t) => (t.id === 12 ? { ...t, fechaFija: '2027-01-04' } : t));
    const otro = planificarProyecto(conPadreFijo, DEPENDENCIAS_SEED, calendario, '2026-11-02');
    expect(otro.tareas.find((t) => t.id === 12)?.fechaFija).toBeNull();
    expect(otro.finProyecto).toBe('2026-12-10');
  });

  it('alargar 2.1.1 de 6 a 8 días reprograma 2.1.1, 2.1.2 y 2.2.1', () => {
    const cambiado = SEED.map((t) => (t.id === 10 ? { ...t, duracionDias: 8 } : t));
    const nuevo = planificarProyecto(cambiado, DEPENDENCIAS_SEED, calendario, '2026-11-02');
    expect(compararFechas(fechas(plan), fechas(nuevo))).toEqual([
      {
        id: 10,
        codigo: '2.1.1',
        inicioAnterior: '2026-11-16',
        inicioNuevo: '2026-11-16',
        finAnterior: '2026-11-23',
        finNuevo: '2026-11-25',
      },
      {
        id: 11,
        codigo: '2.1.2',
        inicioAnterior: '2026-11-24',
        inicioNuevo: '2026-11-26',
        finAnterior: '2026-12-03',
        finNuevo: '2026-12-07',
      },
      {
        id: 13,
        codigo: '2.2.1',
        inicioAnterior: '2026-12-03',
        inicioNuevo: '2026-12-07',
        finAnterior: '2026-12-10',
        finNuevo: '2026-12-14',
      },
    ]);
    expect(nuevo.finProyecto).toBe('2026-12-14');
    expect(nuevo.tareas.find((t) => t.id === 7)?.holguraDias).toBe(18);
  });

  it('cadena A→B→C (FS) cruzando fin de semana y feriado: B y C se mueven 2 días hábiles', () => {
    const cadena = (duracionA: number) =>
      planificarProyecto(
        [
          tarea(1, '1', null, 1),
          tarea(2, '1.1', 1, duracionA),
          tarea(3, '1.2', 1, 2),
          tarea(4, '1.3', 1, 2),
        ],
        [dep(2, 3, 'FS', 0), dep(3, 4, 'FS', 0)],
        calendario,
        '2026-12-01',
      );
    const antes = cadena(3);
    const despues = cadena(5);
    const afectadas = compararFechas(fechas(antes), fechas(despues));
    expect(afectadas.map((t) => [t.codigo, t.inicioNuevo, t.finNuevo])).toEqual([
      ['1.1', '2026-12-01', '2026-12-07'],
      ['1.2', '2026-12-09', '2026-12-10'],
      ['1.3', '2026-12-11', '2026-12-14'],
    ]);
    for (const t of afectadas.slice(1)) {
      expect(diasHabilesEntre(t.inicioAnterior, t.inicioNuevo, calendario)).toBe(2);
    }
  });
});

describe('compararFechas y resumen', () => {
  it('omite padres, tareas nuevas, eliminadas y sin cambios', () => {
    const antes = [
      { id: 1, codigo: '1', tieneHijas: true, inicioPlan: '2026-11-02', finPlan: '2026-11-03' },
      { id: 2, codigo: '1.1', tieneHijas: false, inicioPlan: '2026-11-02', finPlan: '2026-11-03' },
      { id: 3, codigo: '1.2', tieneHijas: false, inicioPlan: '2026-11-02', finPlan: '2026-11-02' },
      { id: 9, codigo: '1.9', tieneHijas: false, inicioPlan: '2026-11-02', finPlan: '2026-11-02' },
    ];
    const despues = [
      { id: 1, codigo: '1', tieneHijas: true, inicioPlan: '2026-11-02', finPlan: '2026-11-04' },
      { id: 2, codigo: '1.1', tieneHijas: false, inicioPlan: '2026-11-02', finPlan: '2026-11-03' },
      { id: 3, codigo: '1.2', tieneHijas: false, inicioPlan: '2026-11-04', finPlan: '2026-11-04' },
      { id: 4, codigo: '1.3', tieneHijas: false, inicioPlan: '2026-11-02', finPlan: '2026-11-02' },
    ];
    expect(compararFechas(antes, despues).map((t) => t.codigo)).toEqual(['1.2']);
  });

  it('resume en singular y plural', () => {
    const una = {
      id: 1,
      codigo: '1',
      inicioAnterior: 'a',
      inicioNuevo: 'b',
      finAnterior: 'a',
      finNuevo: 'b',
    };
    expect(resumirTareasAfectadas([])).toBe('Sin cambios en el cronograma.');
    expect(resumirTareasAfectadas([una])).toBe('1 tarea reprogramada');
    expect(resumirTareasAfectadas([una, una, una, una, una])).toBe('5 tareas reprogramadas');
  });
});
