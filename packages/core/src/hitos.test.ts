import { describe, expect, it } from 'vitest';
import { crearCalendarioLaboral } from './calendario';
import { feriadosChileDesde } from './feriados-chile';
import {
  evaluarHito,
  esquemaActualizarHito,
  esquemaCrearHito,
  type DatosEstadoHito,
  type EstadoHito,
  type TareaVinculadaHito,
} from './hitos';
import { validar } from './validacion';

describe('evaluarHito', () => {
  const calendario = crearCalendarioLaboral({
    diasLaborables: [1, 2, 3, 4, 5],
    feriados: feriadosChileDesde('2026-11-02').map((f) => f.fecha),
  });

  const casos: Array<
    [
      nombre: string,
      fechaObjetivo: string,
      fechaCumplimiento: string | null,
      tarea: TareaVinculadaHito | null,
      hoy: string,
      estadoEsperado: EstadoHito,
      aTiempoEsperado: boolean | null,
      diasHabilesEsperados: number,
    ]
  > = [
    ['cumplido a tiempo', '2026-11-20', '2026-11-19', null, '2026-11-25', 'CUMPLIDO', true, -3],
    ['cumplido el mismo día', '2026-11-20', '2026-11-20', null, '2026-11-25', 'CUMPLIDO', true, -3],
    ['cumplido tarde', '2026-11-20', '2026-11-23', null, '2026-11-25', 'CUMPLIDO', false, -3],
    [
      'cumplido gana a tarea tardía',
      '2026-11-20',
      '2026-11-20',
      { finPlan: '2026-12-01', porcentajeAvance: 10 },
      '2026-11-10',
      'CUMPLIDO',
      true,
      8,
    ],
    ['objetivo hoy sin tarea', '2026-11-20', null, null, '2026-11-20', 'EN_RIESGO', null, 0],
    ['objetivo ayer', '2026-11-19', null, null, '2026-11-20', 'ATRASADO', false, -1],
    [
      'objetivo viernes, hoy sábado',
      '2026-11-20',
      null,
      { finPlan: '2026-11-20', porcentajeAvance: 100 },
      '2026-11-21',
      'ATRASADO',
      false,
      0,
    ],
    [
      'objetivo sábado, hoy viernes',
      '2026-11-21',
      null,
      { finPlan: '2026-11-20', porcentajeAvance: 50 },
      '2026-11-20',
      'EN_RIESGO',
      null,
      0,
    ],
    [
      'exactamente 5 hábiles',
      '2026-11-23',
      null,
      { finPlan: '2026-11-23', porcentajeAvance: 50 },
      '2026-11-16',
      'EN_RIESGO',
      null,
      5,
    ],
    [
      '6 hábiles',
      '2026-11-24',
      null,
      { finPlan: '2026-11-23', porcentajeAvance: 50 },
      '2026-11-16',
      'PENDIENTE',
      null,
      6,
    ],
    [
      '5 hábiles con feriado 08-12',
      '2026-12-10',
      null,
      { finPlan: '2026-12-10', porcentajeAvance: 0 },
      '2026-12-02',
      'EN_RIESGO',
      null,
      5,
    ],
    [
      'avance 80 justo',
      '2026-11-23',
      null,
      { finPlan: '2026-11-23', porcentajeAvance: 80 },
      '2026-11-18',
      'PENDIENTE',
      null,
      3,
    ],
    [
      'avance 79,99',
      '2026-11-23',
      null,
      { finPlan: '2026-11-23', porcentajeAvance: 79.99 },
      '2026-11-18',
      'EN_RIESGO',
      null,
      3,
    ],
    [
      'fin tarea igual objetivo',
      '2026-12-10',
      null,
      { finPlan: '2026-12-10', porcentajeAvance: 0 },
      '2026-10-30',
      'PENDIENTE',
      null,
      28,
    ],
    [
      'fin tarea un día después',
      '2026-12-10',
      null,
      { finPlan: '2026-12-11', porcentajeAvance: 0 },
      '2026-10-30',
      'ATRASADO',
      false,
      28,
    ],
    [
      'tarea sin finPlan',
      '2026-12-10',
      null,
      { finPlan: null, porcentajeAvance: 0 },
      '2026-10-30',
      'PENDIENTE',
      null,
      28,
    ],
    [
      'padre 1.1 consolidado',
      '2026-11-06',
      null,
      { finPlan: '2026-11-10', porcentajeAvance: 71.43 },
      '2026-10-30',
      'ATRASADO',
      false,
      5,
    ],
    ['lejos y sin tarea', '2027-03-31', null, null, '2026-10-30', 'PENDIENTE', null, 104],
  ];

  it.each(casos)(
    '%s',
    (
      _nombre,
      fechaObjetivo,
      fechaCumplimiento,
      tarea,
      hoy,
      estadoEsperado,
      aTiempoEsperado,
      diasHabilesEsperados,
    ) => {
      const hito: DatosEstadoHito = {
        fechaObjetivo,
        fechaCumplimiento,
        tarea,
      };
      const resultado = evaluarHito(hito, calendario, hoy);
      expect(resultado.estado).toBe(estadoEsperado);
      expect(resultado.aTiempo).toBe(aTiempoEsperado);
      expect(resultado.diasHabilesRestantes).toBe(diasHabilesEsperados);
    },
  );
});

describe('esquemas zod de hitos', () => {
  it('valida creación válida con campos mínimos', () => {
    const res = validar(esquemaCrearHito, {
      nombre: 'Hito base',
      fechaObjetivo: '2026-11-20',
    });
    expect(res.ok).toBe(true);
  });

  it('valida creación válida con todos los campos', () => {
    const res = validar(esquemaCrearHito, {
      nombre: 'Hito completo',
      fechaObjetivo: '2026-11-20',
      tareaId: 5,
      criterio: 'Aprobación formal',
      responsable: 'Jefe de Proyecto',
      fechaCumplimiento: '2026-11-19',
    });
    expect(res.ok).toBe(true);
  });

  it('rechaza creación con campo desconocido estado', () => {
    const res = validar(esquemaCrearHito, {
      nombre: 'Hito con estado',
      fechaObjetivo: '2026-11-20',
      estado: 'CUMPLIDO',
    });
    expect(res.ok).toBe(false);
  });

  it('rechaza creación con nombre vacío o solo espacios', () => {
    const res = validar(esquemaCrearHito, {
      nombre: '   ',
      fechaObjetivo: '2026-11-20',
    });
    expect(res.ok).toBe(false);
  });

  it('rechaza creación con fecha fuera de rango 2000-2100', () => {
    const res = validar(esquemaCrearHito, {
      nombre: 'Hito año 1999',
      fechaObjetivo: '1999-12-31',
    });
    expect(res.ok).toBe(false);
  });

  it('rechaza creación con tareaId no entero positivo', () => {
    const res = validar(esquemaCrearHito, {
      nombre: 'Hito tarea inválida',
      fechaObjetivo: '2026-11-20',
      tareaId: -2,
    });
    expect(res.ok).toBe(false);
  });

  it('valida actualización parcial con nombre', () => {
    const res = validar(esquemaActualizarHito, {
      nombre: 'Nombre actualizado',
    });
    expect(res.ok).toBe(true);
  });

  it('valida actualización con tareaId nulo para desvincular', () => {
    const res = validar(esquemaActualizarHito, {
      tareaId: null,
    });
    expect(res.ok).toBe(true);
  });

  it('valida actualización con fechaCumplimiento nula', () => {
    const res = validar(esquemaActualizarHito, {
      fechaCumplimiento: null,
    });
    expect(res.ok).toBe(true);
  });

  it('rechaza actualización con objeto vacío', () => {
    const res = validar(esquemaActualizarHito, {});
    expect(res.ok).toBe(false);
  });

  it('rechaza actualización con campo desconocido', () => {
    const res = validar(esquemaActualizarHito, {
      estado: 'ATRASADO',
    });
    expect(res.ok).toBe(false);
  });
});
