import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RecalculoService } from '../recalculo/recalculo.service';
import { CalendarioService } from './calendario.service';

describe('CalendarioService', () => {
  const proyectoAbierto = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    estado: EstadoProyecto.EN_CURSO,
  };

  const proyectoCerrado = {
    id: 2,
    nombre: 'Piloto cerrado',
    estado: EstadoProyecto.CERRADO,
  };

  const filaCalendarioBase = {
    id: 10,
    proyectoId: 1,
    diasLaborables: [1, 2, 3, 4, 5],
    horasPorDia: new Prisma.Decimal(8),
    feriados: [],
  };

  const recalculoMockBase = {
    ejecutar: vi.fn().mockResolvedValue({
      arbol: { proyectoId: 1, porcentajeAvanceProyecto: 0, tareas: [] },
      tareasAfectadas: [],
    }),
  } as unknown as RecalculoService;

  it('obtener lanza 404 si el proyecto no existe', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new CalendarioService(prismaMock, recalculoMockBase, {} as BitacoraService);

    await expect(servicio.obtener(999)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('obtener devuelve valores por defecto si no existe fila de calendario', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new CalendarioService(prismaMock, recalculoMockBase, {} as BitacoraService);
    const resultado = await servicio.obtener(1);

    expect(resultado).toEqual({
      proyectoId: 1,
      diasLaborables: [1, 2, 3, 4, 5],
      horasPorDia: 8,
      feriados: [],
    });
  });

  it('actualizar lanza 409 si el proyecto esta cerrado', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoCerrado) },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new CalendarioService(prismaMock, recalculoMockBase, {} as BitacoraService);

    await expect(
      servicio.actualizar(2, { diasLaborables: [1, 2, 3, 4, 5, 6] }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      codigo: 'PROYECTO_CERRADO',
    });
  });

  it('actualizar no registra bitacora falsa si diasLaborables no cambio por valor', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: {
        upsert: vi.fn().mockResolvedValue(filaCalendarioBase),
        findUnique: vi.fn().mockResolvedValue(filaCalendarioBase),
        update: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ ...filaCalendarioBase, ...data })),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5],
          feriados: [],
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const bitacoraMock = {
      registrarCambios: vi.fn(),
      registrarRecalculo: vi.fn(),
    } as unknown as BitacoraService;

    const recalculoMock = {
      ejecutar: vi.fn().mockResolvedValue({
        arbol: { proyectoId: 1, porcentajeAvanceProyecto: 0, tareas: [] },
        tareasAfectadas: [],
      }),
    } as unknown as RecalculoService;

    const servicio = new CalendarioService(prismaMock, recalculoMock, bitacoraMock);
    const resultado = await servicio.actualizar(1, { diasLaborables: [5, 4, 3, 2, 1] }, 'JP');

    expect(resultado.tareasAfectadas).toHaveLength(0);
    expect(txMock.calendario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ diasLaborables: [1, 2, 3, 4, 5] }),
      }),
    );
    expect(bitacoraMock.registrarCambios).not.toHaveBeenCalled();
    expect(recalculoMock.ejecutar).toHaveBeenCalledWith(1, txMock, {
      rol: 'JP',
      descripcion: 'Calendario: días laborables u horas por día',
    });
  });

  it('actualizar registra bitacora si hay cambios en diasLaborables', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: {
        upsert: vi.fn().mockResolvedValue(filaCalendarioBase),
        findUnique: vi.fn().mockResolvedValue(filaCalendarioBase),
        update: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5, 6],
        }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5, 6],
          feriados: [],
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const bitacoraMock = {
      registrarCambios: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const tareaAfectada = {
      id: 1,
      codigo: '1.1',
      inicioAnterior: '2026-11-02',
      inicioNuevo: '2026-11-02',
      finAnterior: '2026-11-06',
      finNuevo: '2026-11-05',
    };

    const recalculoMock = {
      ejecutar: vi.fn().mockResolvedValue({
        arbol: { proyectoId: 1, porcentajeAvanceProyecto: 0, tareas: [] },
        tareasAfectadas: [tareaAfectada],
      }),
    } as unknown as RecalculoService;

    const servicio = new CalendarioService(prismaMock, recalculoMock, bitacoraMock);
    const resultado = await servicio.actualizar(1, { diasLaborables: [1, 2, 3, 4, 5, 6] }, 'JP');

    expect(resultado.tareasAfectadas).toEqual([tareaAfectada]);
    expect(bitacoraMock.registrarCambios).toHaveBeenCalledOnce();
    expect(recalculoMock.ejecutar).toHaveBeenCalledWith(1, txMock, {
      rol: 'JP',
      descripcion: 'Calendario: días laborables u horas por día',
    });
  });

  it('crearFeriado lanza 409 si ya existe un feriado en esa fecha', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: {
        upsert: vi.fn().mockResolvedValue(filaCalendarioBase),
        findUnique: vi.fn().mockResolvedValue(filaCalendarioBase),
      },
      feriado: {
        findUnique: vi.fn().mockResolvedValue({
          id: 5,
          calendarioId: 10,
          fecha: new Date('2026-12-08T00:00:00.000Z'),
          descripcion: 'Inmaculada',
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new CalendarioService(prismaMock, recalculoMockBase, {} as BitacoraService);

    await expect(
      servicio.crearFeriado(1, { fecha: '2026-12-08', descripcion: 'Inmaculada Concepción' }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      codigo: 'REGISTRO_DUPLICADO',
      detalles: [{ campo: 'fecha', mensaje: 'Ya existe un feriado en esa fecha.' }],
    });
  });

  it('eliminarFeriado lanza 404 si el feriado no existe', async () => {
    const txMock = {
      feriado: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new CalendarioService(prismaMock, recalculoMockBase, {} as BitacoraService);

    await expect(servicio.eliminarFeriado(999, 'JP')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });
});
