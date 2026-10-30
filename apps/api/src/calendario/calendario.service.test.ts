import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ArbolTareasService } from '../tareas/arbol-tareas.service';
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

  it('obtener lanza 404 si el proyecto no existe', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new CalendarioService(
      prismaMock,
      {} as ArbolTareasService,
      {} as BitacoraService,
    );

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

    const servicio = new CalendarioService(
      prismaMock,
      {} as ArbolTareasService,
      {} as BitacoraService,
    );
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

    const servicio = new CalendarioService(
      prismaMock,
      {} as ArbolTareasService,
      {} as BitacoraService,
    );

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
        upsert: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5],
        }),
        update: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5],
        }),
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

    const arbolMock = {
      reorganizarConResumen: vi.fn().mockResolvedValue({ tareasRecalculadas: 0 }),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarCambios: vi.fn(),
      registrarRecalculo: vi.fn(),
    } as unknown as BitacoraService;

    const servicio = new CalendarioService(prismaMock, arbolMock, bitacoraMock);
    const resultado = await servicio.actualizar(1, { diasLaborables: [5, 4, 3, 2, 1] }, 'JP');

    expect(resultado.tareasRecalculadas).toBe(0);
    expect(bitacoraMock.registrarCambios).not.toHaveBeenCalled();
    expect(bitacoraMock.registrarRecalculo).not.toHaveBeenCalled();
  });

  it('actualizar registra bitacora y recalculo si hay tareas recalculadas', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: {
        upsert: vi.fn().mockResolvedValue({
          ...filaCalendarioBase,
          diasLaborables: [1, 2, 3, 4, 5],
        }),
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

    const arbolMock = {
      reorganizarConResumen: vi.fn().mockResolvedValue({ tareasRecalculadas: 3 }),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarCambios: vi.fn().mockResolvedValue(undefined),
      registrarRecalculo: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const servicio = new CalendarioService(prismaMock, arbolMock, bitacoraMock);
    const resultado = await servicio.actualizar(1, { diasLaborables: [1, 2, 3, 4, 5, 6] }, 'JP');

    expect(resultado.tareasRecalculadas).toBe(3);
    expect(bitacoraMock.registrarCambios).toHaveBeenCalledOnce();
    expect(bitacoraMock.registrarRecalculo).toHaveBeenCalledWith(
      txMock,
      {
        proyectoId: 1,
        entidad: 'Proyecto',
        entidadId: 1,
        rol: 'JP',
      },
      { tareasRecalculadas: 3 },
      'Calendario: días laborables u horas por día',
    );
  });

  it('crearFeriado lanza 409 si ya existe un feriado en esa fecha', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoAbierto) },
      calendario: {
        upsert: vi.fn().mockResolvedValue(filaCalendarioBase),
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

    const servicio = new CalendarioService(
      prismaMock,
      {} as ArbolTareasService,
      {} as BitacoraService,
    );

    await expect(
      servicio.crearFeriado(1, { fecha: '2026-12-08', descripcion: 'Inmaculada Concepción' }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      codigo: 'REGISTRO_DUPLICADO',
    });
  });

  it('eliminarFeriado lanza 404 si el feriado no existe', async () => {
    const txMock = {
      feriado: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new CalendarioService(
      prismaMock,
      {} as ArbolTareasService,
      {} as BitacoraService,
    );

    await expect(servicio.eliminarFeriado(999, 'JP')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });
});
