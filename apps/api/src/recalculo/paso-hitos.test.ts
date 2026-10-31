import { describe, expect, it, vi } from 'vitest';
import { crearCalendarioLaboral, fechaIsoADate } from '@autofix/core';
import type { Prisma, Proyecto, Tarea } from '@prisma/client';
import { Reloj } from '../comun/reloj/reloj';
import { PasoHitos } from './paso-hitos';
import type { ContextoRecalculo } from './recalculo.tipos';

describe('PasoHitos', () => {
  it('carga hitos de la transaccion y asigna lista evaluada al contexto sin alterar huboCambios', async () => {
    const reloj = { hoy: () => '2026-10-30' } as Reloj;
    const paso = new PasoHitos(reloj);

    const hitosMock = [
      {
        id: 1,
        proyectoId: 10,
        tareaId: null,
        nombre: 'Hito 1',
        criterio: null,
        responsable: null,
        fechaObjetivo: fechaIsoADate('2026-11-20'),
        fechaCumplimiento: null,
      },
    ];

    const findMany = vi.fn().mockResolvedValue(hitosMock);
    const tx = {
      hito: {
        findMany,
      },
    } as unknown as Prisma.TransactionClient;

    const contexto: ContextoRecalculo = {
      tx,
      proyecto: { id: 10 } as Proyecto,
      calendario: crearCalendarioLaboral({ diasLaborables: [1, 2, 3, 4, 5] }),
      tareas: [] as Tarea[],
      dependencias: [],
      tareasAfectadas: [],
      hitos: null,
      detalle: {},
      huboCambios: false,
    };

    await paso.ejecutar(contexto);

    expect(findMany).toHaveBeenCalledWith({ where: { proyectoId: 10 } });
    expect(contexto.hitos).not.toBeNull();
    expect(contexto.hitos?.proyectoId).toBe(10);
    expect(contexto.hitos?.fechaCalculo).toBe('2026-10-30');
    expect(contexto.hitos?.hitos).toHaveLength(1);
    expect(contexto.huboCambios).toBe(false);
  });
});
