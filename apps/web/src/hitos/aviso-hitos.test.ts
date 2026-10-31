import { describe, expect, it } from 'vitest';
import type { ListaHitos } from '@autofix/core';
import { resumirCambiosHitos } from './aviso-hitos';

describe('resumirCambiosHitos', () => {
  const hito1 = {
    id: 1,
    proyectoId: 1,
    nombre: 'Módulo de órdenes',
    criterio: null,
    responsable: null,
    fechaObjetivo: '2026-12-04',
    fechaCumplimiento: null,
    tarea: {
      id: 10,
      codigo: '2.1',
      nombre: 'Órdenes',
      finPlan: '2026-12-03',
      porcentajeAvance: 0,
    },
    estado: 'PENDIENTE' as const,
    aTiempo: null,
    diasHabilesRestantes: 25,
  };

  const hito2 = {
    id: 2,
    proyectoId: 1,
    nombre: 'Entrega final',
    criterio: null,
    responsable: null,
    fechaObjetivo: '2026-12-20',
    fechaCumplimiento: null,
    tarea: null,
    estado: 'PENDIENTE' as const,
    aTiempo: null,
    diasHabilesRestantes: 35,
  };

  const listaBase: ListaHitos = {
    proyectoId: 1,
    fechaCalculo: '2026-10-30',
    hitos: [hito1, hito2],
  };

  it('retorna arreglo vacio si no hay estado previo o no hubo cambios', () => {
    expect(resumirCambiosHitos(undefined, listaBase)).toEqual([]);
    expect(resumirCambiosHitos(listaBase, listaBase)).toEqual([]);
  });

  it('detecta cambio de estado cuando una tarea retrasa el hito', () => {
    const listaActualizada: ListaHitos = {
      ...listaBase,
      hitos: [
        {
          ...hito1,
          estado: 'ATRASADO',
          tarea: {
            ...hito1.tarea,
            finPlan: '2026-12-07',
          },
        },
        hito2,
      ],
    };

    const cambios = resumirCambiosHitos(listaBase, listaActualizada);
    expect(cambios).toEqual([
      {
        mensaje: 'Módulo de órdenes: Pendiente → Atrasado',
        estadoNuevo: 'ATRASADO',
        cambioEstado: true,
      },
    ]);
  });

  it('detecta recuperacion de hito (Atrasado a Pendiente)', () => {
    const listaAtrasada: ListaHitos = {
      ...listaBase,
      hitos: [
        {
          ...hito1,
          estado: 'ATRASADO',
        },
        hito2,
      ],
    };

    const cambios = resumirCambiosHitos(listaAtrasada, listaBase);
    expect(cambios).toEqual([
      {
        mensaje: 'Módulo de órdenes: Atrasado → Pendiente',
        estadoNuevo: 'PENDIENTE',
        cambioEstado: true,
      },
    ]);
  });

  it('detecta cuando un hito pierde su tarea vinculada', () => {
    const listaSinTarea: ListaHitos = {
      ...listaBase,
      hitos: [
        {
          ...hito1,
          tarea: null,
        },
        hito2,
      ],
    };

    const cambios = resumirCambiosHitos(listaBase, listaSinTarea);
    expect(cambios).toEqual([
      {
        mensaje: 'Módulo de órdenes: quedó sin tarea vinculada',
        estadoNuevo: 'PENDIENTE',
        cambioEstado: false,
      },
    ]);
  });
});
