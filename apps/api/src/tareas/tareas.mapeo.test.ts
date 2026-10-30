import { NivelTarea, Prisma, type Tarea } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { aTareaArbol } from './tareas.mapeo';

describe('tareas.mapeo', () => {
  it('mapea entidad Prisma Tarea a TareaArbol con fechas ISO y tieneHijas', () => {
    const tarea: Tarea = {
      id: 10,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '1',
      orden: 1,
      nombre: 'Levantamiento',
      descripcion: 'Fase de analisis',
      responsable: 'Jefe Taller',
      duracionDias: 15,
      inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
      finPlan: new Date('2026-11-16T00:00:00.000Z'),
      inicioReal: new Date('2026-11-02T00:00:00.000Z'),
      finReal: null,
      fechaFija: null,
      porcentajeAvance: new Prisma.Decimal(35.5),
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      costoPlan: new Prisma.Decimal(0),
      costoReal: new Prisma.Decimal(0),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const mapeado = aTareaArbol(tarea, true);
    expect(mapeado).toEqual({
      id: 10,
      padreId: null,
      nivel: 'ETAPA',
      codigo: '1',
      orden: 1,
      nombre: 'Levantamiento',
      descripcion: 'Fase de analisis',
      responsable: 'Jefe Taller',
      duracionDias: 15,
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-16',
      inicioReal: '2026-11-02',
      finReal: null,
      porcentajeAvance: 35.5,
      tieneHijas: true,
    });
  });
});
