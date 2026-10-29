import { EstadoProyecto, Prisma, Proyecto } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { mapearProyectoDetalle, mapearProyectoResumen } from './proyectos.mapeo';

describe('proyectos.mapeo', () => {
  const entidad: Proyecto = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    descripcion: 'Descripción detallada',
    responsable: 'Jefe de Proyecto',
    presupuesto: new Prisma.Decimal('45000000.00'),
    fechaInicio: new Date('2026-11-02T00:00:00.000Z'),
    fechaFin: new Date('2027-03-31T00:00:00.000Z'),
    estado: EstadoProyecto.EN_CURSO,
    creadoEn: new Date('2026-10-29T21:00:00.000Z'),
    actualizadoEn: new Date('2026-10-29T21:00:00.000Z'),
  };

  it('mapea entidad de Prisma a ProyectoResumen convirtiendo Decimal y Date', () => {
    const resumen = mapearProyectoResumen(entidad, 0);
    expect(resumen).toEqual({
      id: 1,
      nombre: 'AutoFix · Implementación',
      responsable: 'Jefe de Proyecto',
      presupuesto: 45000000,
      fechaInicio: '2026-11-02',
      fechaFin: '2027-03-31',
      estado: 'EN_CURSO',
      porcentajeAvance: 0,
      creadoEn: '2026-10-29T21:00:00.000Z',
      actualizadoEn: '2026-10-29T21:00:00.000Z',
    });
    expect((resumen as unknown as Record<string, unknown>).descripcion).toBeUndefined();
  });

  it('mapea entidad de Prisma a ProyectoDetalle incluyendo descripcion y numeroTareas', () => {
    const detalle = mapearProyectoDetalle(entidad, 25.5, 8);
    expect(detalle).toEqual({
      id: 1,
      nombre: 'AutoFix · Implementación',
      descripcion: 'Descripción detallada',
      responsable: 'Jefe de Proyecto',
      presupuesto: 45000000,
      fechaInicio: '2026-11-02',
      fechaFin: '2027-03-31',
      estado: 'EN_CURSO',
      porcentajeAvance: 25.5,
      numeroTareas: 8,
      creadoEn: '2026-10-29T21:00:00.000Z',
      actualizadoEn: '2026-10-29T21:00:00.000Z',
    });
  });

  it('maneja fechaFin y descripcion nulos correctamente', () => {
    const entidadNulos: Proyecto = {
      ...entidad,
      descripcion: null,
      fechaFin: null,
    };
    const detalle = mapearProyectoDetalle(entidadNulos, 0, 0);
    expect(detalle.descripcion).toBeNull();
    expect(detalle.fechaFin).toBeNull();
  });
});
