import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, type Dependencia } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RecalculoService } from '../recalculo/recalculo.service';
import { DependenciasService } from './dependencias.service';

describe('DependenciasService', () => {
  const proyectoMock = {
    id: 1,
    nombre: 'AutoFix',
    estado: EstadoProyecto.EN_CURSO,
  };

  const dependenciasMock: Dependencia[] = [
    {
      id: 1,
      proyectoId: 1,
      predecesoraId: 10,
      sucesoraId: 20,
      tipo: 'FS',
      desfaseDias: 0,
      creadoEn: new Date(),
    },
  ];

  it('listar lanza 404 si el proyecto no existe', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    await expect(servicio.listar(999)).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('listar retorna dependencias mapeadas', async () => {
    const prismaMock = {
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      dependencia: { findMany: vi.fn().mockResolvedValue(dependenciasMock) },
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    const resultado = await servicio.listar(1);
    expect(resultado).toEqual([
      {
        id: 1,
        predecesoraId: 10,
        sucesoraId: 20,
        tipo: 'FS',
        desfaseDias: 0,
      },
    ]);
  });

  it('crear lanza 422 si las tareas no existen o no son 2', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: {
        findMany: vi.fn().mockResolvedValue([{ id: 10, _count: { hijas: 0 } }]),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    await expect(
      servicio.crear(1, { predecesoraId: 10, sucesoraId: 20, tipo: 'FS', desfaseDias: 0 }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'DEPENDENCIA_INVALIDA',
    });
  });

  it('crear lanza 422 si alguna tarea tiene subtareas', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: {
        findMany: vi.fn().mockResolvedValue([
          { id: 10, codigo: '1.1', _count: { hijas: 1 } },
          { id: 20, codigo: '1.2', _count: { hijas: 0 } },
        ]),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    await expect(
      servicio.crear(1, { predecesoraId: 10, sucesoraId: 20, tipo: 'FS', desfaseDias: 0 }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'DEPENDENCIA_INVALIDA',
    });
  });

  it('crear lanza 409 si el par de tareas ya tiene dependencia', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: {
        findMany: vi.fn().mockResolvedValue([
          { id: 10, codigo: '1.1', _count: { hijas: 0 } },
          { id: 20, codigo: '1.2', _count: { hijas: 0 } },
        ]),
      },
      dependencia: {
        findUnique: vi.fn().mockResolvedValue(dependenciasMock[0]),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    await expect(
      servicio.crear(1, { predecesoraId: 10, sucesoraId: 20, tipo: 'SS', desfaseDias: 2 }, 'JP'),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
      codigo: 'REGISTRO_DUPLICADO',
    });
  });

  it('crear inserta dependencia, registra bitacora y ejecuta recalculo', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      tarea: {
        findMany: vi.fn().mockResolvedValue([
          { id: 10, codigo: '1.1', _count: { hijas: 0 } },
          { id: 20, codigo: '1.2', _count: { hijas: 0 } },
        ]),
      },
      dependencia: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(dependenciasMock[0]),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const bitacoraMock = {
      registrarCreacion: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const recalculoMock = {
      ejecutar: vi.fn().mockResolvedValue({
        arbol: { proyectoId: 1, porcentajeAvanceProyecto: 0, tareas: [] },
        tareasAfectadas: [],
      }),
    } as unknown as RecalculoService;

    const servicio = new DependenciasService(prismaMock, recalculoMock, bitacoraMock);

    const resultado = await servicio.crear(
      1,
      { predecesoraId: 10, sucesoraId: 20, tipo: 'FS', desfaseDias: 0 },
      'JP',
    );

    expect(txMock.dependencia.create).toHaveBeenCalled();
    expect(bitacoraMock.registrarCreacion).toHaveBeenCalled();
    expect(recalculoMock.ejecutar).toHaveBeenCalled();
    expect(resultado.arbol.proyectoId).toBe(1);
  });

  it('eliminar lanza 404 si la dependencia no existe', async () => {
    const prismaMock = {
      dependencia: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const servicio = new DependenciasService(
      prismaMock,
      {} as RecalculoService,
      {} as BitacoraService,
    );

    await expect(servicio.eliminar(999, 'JP')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      codigo: 'REGISTRO_NO_ENCONTRADO',
    });
  });

  it('eliminar borra dependencia, registra bitacora y ejecuta recalculo', async () => {
    const depConTareas = {
      ...dependenciasMock[0],
      predecesora: { codigo: '1.1' },
      sucesora: { codigo: '1.2' },
    };

    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      dependencia: {
        findUnique: vi.fn().mockResolvedValue(depConTareas),
        delete: vi.fn().mockResolvedValue(dependenciasMock[0]),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      dependencia: { findUnique: vi.fn().mockResolvedValue(depConTareas) },
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const bitacoraMock = {
      registrarEliminacion: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const recalculoMock = {
      ejecutar: vi.fn().mockResolvedValue({
        arbol: { proyectoId: 1, porcentajeAvanceProyecto: 0, tareas: [] },
        tareasAfectadas: [],
      }),
    } as unknown as RecalculoService;

    const servicio = new DependenciasService(prismaMock, recalculoMock, bitacoraMock);

    await servicio.eliminar(1, 'JP');

    expect(txMock.dependencia.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(bitacoraMock.registrarEliminacion).toHaveBeenCalled();
    expect(recalculoMock.ejecutar).toHaveBeenCalled();
  });
});
