import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, type Hito } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { fechaIsoADate } from '@autofix/core';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { Reloj } from '../comun/reloj/reloj';
import type { PrismaService } from '../prisma/prisma.service';
import { HitosService } from './hitos.service';

describe('HitosService', () => {
  const proyectoMock = {
    id: 1,
    nombre: 'AutoFix',
    estado: EstadoProyecto.EN_CURSO,
  };

  const relojMock = {
    hoy: () => '2026-10-30',
  } as Reloj;

  const bitacoraMock = {
    registrarCreacion: vi.fn().mockResolvedValue(undefined),
    registrarCambios: vi.fn().mockResolvedValue(undefined),
    registrarEliminacion: vi.fn().mockResolvedValue(undefined),
  } as unknown as BitacoraService;

  it('listar lanza 404 si el proyecto no existe', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    await expect(servicio.listar(999)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('crear lanza 422 si la tarea vinculada no pertenece al proyecto', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: { findFirst: vi.fn().mockResolvedValue(null) },
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    await expect(
      servicio.crear(1, { nombre: 'Hito 1', fechaObjetivo: '2026-11-20', tareaId: 99 }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'VALIDACION_FALLIDA',
    });
  });

  it('crear lanza 422 si fechaCumplimiento es posterior a hoy', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: { findFirst: vi.fn().mockResolvedValue(null) },
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    await expect(
      servicio.crear(
        1,
        { nombre: 'Hito 1', fechaObjetivo: '2026-11-20', fechaCumplimiento: '2026-10-31' },
        'JP',
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'VALIDACION_FALLIDA',
    });
  });

  it('crear persiste el hito y registra en bitacora', async () => {
    const hitoCreado: Hito = {
      id: 5,
      proyectoId: 1,
      tareaId: null,
      nombre: 'Hito Creado',
      criterio: null,
      responsable: null,
      fechaObjetivo: fechaIsoADate('2026-11-20'),
      fechaCumplimiento: null,
    };

    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      hito: {
        create: vi.fn().mockResolvedValue(hitoCreado),
        findMany: vi.fn().mockResolvedValue([hitoCreado]),
      },
      tarea: { findMany: vi.fn().mockResolvedValue([]) },
      calendario: {
        findUnique: vi.fn().mockResolvedValue({
          diasLaborables: [1, 2, 3, 4, 5],
          feriados: [],
        }),
      },
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    const resultado = await servicio.crear(
      1,
      { nombre: 'Hito Creado', fechaObjetivo: '2026-11-20' },
      'JP',
    );

    expect(txMock.hito.create).toHaveBeenCalled();
    expect(bitacoraMock.registrarCreacion).toHaveBeenCalled();
    expect(resultado.hitos).toHaveLength(1);
    expect(resultado.hitos[0].nombre).toBe('Hito Creado');
  });

  it('actualizar lanza 404 si el hito no existe', async () => {
    const txMock = {
      hito: { findUnique: vi.fn().mockResolvedValue(null) },
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    await expect(servicio.actualizar(999, { nombre: 'Nuevo' }, 'JP')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('eliminar lanza 404 si el hito no existe', async () => {
    const txMock = {
      hito: { findUnique: vi.fn().mockResolvedValue(null) },
    };

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new HitosService(prismaMock, bitacoraMock, relojMock);

    await expect(servicio.eliminar(999, 'JP')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });
});
