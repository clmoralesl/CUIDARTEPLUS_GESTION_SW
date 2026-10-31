import { describe, expect, it } from 'vitest';
import { crearCalendarioLaboral, fechaIsoADate } from '@autofix/core';
import type { Hito, Tarea } from '@prisma/client';
import { construirListaHitos } from './hitos.mapeo';

describe('construirListaHitos', () => {
  const calendario = crearCalendarioLaboral({
    diasLaborables: [1, 2, 3, 4, 5],
  });

  const hitos: Hito[] = [
    {
      id: 2,
      proyectoId: 1,
      tareaId: 10,
      nombre: 'Segundo hito',
      criterio: null,
      responsable: 'JP',
      fechaObjetivo: fechaIsoADate('2026-11-20'),
      fechaCumplimiento: null,
    },
    {
      id: 1,
      proyectoId: 1,
      tareaId: null,
      nombre: 'Primer hito',
      criterio: 'Aprobado',
      responsable: null,
      fechaObjetivo: fechaIsoADate('2026-11-10'),
      fechaCumplimiento: fechaIsoADate('2026-11-09'),
    },
  ];

  const tareas = new Map<
    number,
    Pick<Tarea, 'id' | 'codigo' | 'nombre' | 'finPlan' | 'porcentajeAvance'>
  >([
    [
      10,
      {
        id: 10,
        codigo: '1.1',
        nombre: 'Tarea diez',
        finPlan: fechaIsoADate('2026-11-18'),
        porcentajeAvance: 50 as unknown as Tarea['porcentajeAvance'],
      },
    ],
  ]);

  it('ordena por fechaObjetivo y evalua estados', () => {
    const lista = construirListaHitos(1, hitos, tareas, calendario, '2026-11-15');
    expect(lista.proyectoId).toBe(1);
    expect(lista.fechaCalculo).toBe('2026-11-15');
    expect(lista.hitos).toHaveLength(2);

    expect(lista.hitos[0].id).toBe(1);
    expect(lista.hitos[0].estado).toBe('CUMPLIDO');
    expect(lista.hitos[0].aTiempo).toBe(true);
    expect(lista.hitos[0].tarea).toBeNull();

    expect(lista.hitos[1].id).toBe(2);
    expect(lista.hitos[1].estado).toBe('EN_RIESGO');
    expect(lista.hitos[1].tarea).toEqual({
      id: 10,
      codigo: '1.1',
      nombre: 'Tarea diez',
      finPlan: '2026-11-18',
      porcentajeAvance: 50,
    });
  });
});
