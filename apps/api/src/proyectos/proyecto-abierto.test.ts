import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, Prisma, Proyecto } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { obtenerProyectoAbierto } from './proyecto-abierto';

describe('obtenerProyectoAbierto', () => {
  it('retorna el proyecto si existe y no esta cerrado', async () => {
    const proyectoMock: Proyecto = {
      id: 1,
      nombre: 'Proyecto Test',
      descripcion: null,
      responsable: 'JP',
      presupuesto: new Prisma.Decimal(100),
      fechaInicio: new Date('2026-11-02T00:00:00.000Z'),
      fechaFin: null,
      estado: EstadoProyecto.EN_CURSO,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const txMock = {
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
    } as unknown as Prisma.TransactionClient;

    const res = await obtenerProyectoAbierto(txMock, 1);
    expect(res).toBe(proyectoMock);
  });

  it('lanza 404 REGISTRO_NO_ENCONTRADO si el proyecto no existe', async () => {
    const txMock = {
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as Prisma.TransactionClient;

    await expect(obtenerProyectoAbierto(txMock, 999)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('lanza 409 PROYECTO_CERRADO si el proyecto esta cerrado', async () => {
    const proyectoMock: Proyecto = {
      id: 2,
      nombre: 'Proyecto Cerrado',
      descripcion: null,
      responsable: 'JP',
      presupuesto: new Prisma.Decimal(100),
      fechaInicio: new Date('2026-11-02T00:00:00.000Z'),
      fechaFin: null,
      estado: EstadoProyecto.CERRADO,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const txMock = {
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
    } as unknown as Prisma.TransactionClient;

    await expect(obtenerProyectoAbierto(txMock, 2)).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      codigo: 'PROYECTO_CERRADO',
    });
  });
});
