import { describe, expect, it } from 'vitest';
import type { TareaArbol } from '@autofix/core';
import { filasVisibles } from './filas-visibles';

describe('filasVisibles', () => {
  const tareas: TareaArbol[] = [
    {
      id: 1,
      padreId: null,
      nivel: 'ETAPA',
      codigo: '1',
      orden: 1,
      nombre: 'Etapa 1',
      descripcion: null,
      responsable: null,
      duracionDias: 10,
      fechaFija: null,
      inicioPlan: null,
      finPlan: null,
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 50,
      tieneHijas: true,
    },
    {
      id: 11,
      padreId: 1,
      nivel: 'ACTIVIDAD',
      codigo: '1.1',
      orden: 1,
      nombre: 'Actividad 1.1',
      descripcion: null,
      responsable: null,
      duracionDias: 5,
      fechaFija: null,
      inicioPlan: null,
      finPlan: null,
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 50,
      tieneHijas: true,
    },
    {
      id: 111,
      padreId: 11,
      nivel: 'SUBACTIVIDAD',
      codigo: '1.1.1',
      orden: 1,
      nombre: 'Subactividad 1.1.1',
      descripcion: null,
      responsable: null,
      duracionDias: 5,
      fechaFija: null,
      inicioPlan: null,
      finPlan: null,
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 50,
      tieneHijas: false,
    },
    {
      id: 2,
      padreId: null,
      nivel: 'ETAPA',
      codigo: '2',
      orden: 2,
      nombre: 'Etapa 2',
      descripcion: null,
      responsable: null,
      duracionDias: 5,
      fechaFija: null,
      inicioPlan: null,
      finPlan: null,
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 0,
      tieneHijas: false,
    },
  ];

  it('muestra todas las tareas cuando ninguna esta colapsada', () => {
    const visibles = filasVisibles(tareas, new Set());
    expect(visibles.map((t) => t.id)).toEqual([1, 11, 111, 2]);
  });

  it('oculta las descendientes de una tarea colapsada', () => {
    const visibles = filasVisibles(tareas, new Set([1]));
    expect(visibles.map((t) => t.id)).toEqual([1, 2]);
  });

  it('oculta las subactividades si solo la actividad esta colapsada', () => {
    const visibles = filasVisibles(tareas, new Set([11]));
    expect(visibles.map((t) => t.id)).toEqual([1, 11, 2]);
  });
});
