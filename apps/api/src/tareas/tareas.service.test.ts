import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, NivelTarea, Prisma, type Tarea } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ArbolTareasService } from './arbol-tareas.service';
import { TareasService } from './tareas.service';

describe('TareasService', () => {
  const tareaMock: Tarea = {
    id: 10,
    proyectoId: 1,
    padreId: null,
    nivel: NivelTarea.ETAPA,
    codigo: '1',
    orden: 1,
    nombre: 'Etapa 1',
    descripcion: null,
    responsable: null,
    duracionDias: 5,
    inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
    finPlan: new Date('2026-11-06T00:00:00.000Z'),
    inicioReal: null,
    finReal: null,
    fechaFija: null,
    porcentajeAvance: new Prisma.Decimal(0),
    inicioTardio: null,
    finTardio: null,
    holguraDias: null,
    esCritica: false,
    costoPlan: new Prisma.Decimal(0),
    costoReal: new Prisma.Decimal(0),
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  const proyectoMock = {
    id: 1,
    nombre: 'Proyecto AutoFix',
    estado: EstadoProyecto.EN_CURSO,
  };

  it('lanza 422 JERARQUIA_INVALIDA si se intenta crear una actividad sin padre o con padre de nivel incorrecto', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {} as ArbolTareasService;
    const bitacoraMock = {} as BitacoraService;
    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await expect(
      servicio.crear(
        1,
        {
          nivel: 'ACTIVIDAD',
          padreId: 999,
          nombre: 'Actividad sin padre valido',
          duracionDias: 1,
        },
        'JP',
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'JERARQUIA_INVALIDA',
    });
  });

  it('lanza 422 JERARQUIA_INVALIDA si una etapa se intenta crear con padreId', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findFirst: vi.fn().mockResolvedValue(tareaMock),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {} as ArbolTareasService;
    const bitacoraMock = {} as BitacoraService;
    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await expect(
      servicio.crear(
        1,
        {
          nivel: 'ETAPA',
          padreId: 10,
          nombre: 'Etapa con padre invalido',
          duracionDias: 1,
        },
        'JP',
      ),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'JERARQUIA_INVALIDA',
    });
  });

  it('lanza 422 CAMPO_CALCULADO al intentar editar campos calculados en una tarea con hijas', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findUnique: vi.fn().mockResolvedValue(tareaMock),
        count: vi.fn().mockResolvedValue(2),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {} as ArbolTareasService;
    const bitacoraMock = {} as BitacoraService;
    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await expect(servicio.actualizar(10, { duracionDias: 10 }, 'JP')).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'CAMPO_CALCULADO',
    });
  });

  it('lanza 400 VALIDACION_FALLIDA al ingresar finReal sin inicioReal', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findUnique: vi.fn().mockResolvedValue(tareaMock),
        count: vi.fn().mockResolvedValue(0),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {} as ArbolTareasService;
    const bitacoraMock = {} as BitacoraService;
    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await expect(servicio.actualizar(10, { finReal: '2026-11-05' }, 'JP')).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      codigo: 'VALIDACION_FALLIDA',
    });
  });

  it('retorna el arbol sin escribir en base de datos si se mueve a la misma ubicacion', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findUnique: vi.fn().mockResolvedValue(tareaMock),
        findMany: vi.fn().mockResolvedValue([tareaMock]),
        update: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {
      cargar: vi.fn().mockResolvedValue({
        proyectoId: 1,
        porcentajeAvanceProyecto: 0,
        tareas: [],
      }),
      reorganizar: vi.fn(),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarCambios: vi.fn(),
    } as unknown as BitacoraService;

    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    const resultado = await servicio.mover(10, { padreId: null, posicion: 1 }, 'JP');

    expect(txMock.tarea.update).not.toHaveBeenCalled();
    expect(bitacoraMock.registrarCambios).not.toHaveBeenCalled();
    expect(arbolMock.cargar).toHaveBeenCalledTimes(1);
    expect(resultado.proyectoId).toBe(1);
  });

  it('lanza 422 JERARQUIA_INVALIDA si se intenta mover una etapa bajo una actividad', async () => {
    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: {
        findUnique: vi.fn().mockResolvedValue(proyectoMock),
      },
      tarea: {
        findUnique: vi.fn().mockResolvedValue(tareaMock),
        findFirst: vi.fn().mockResolvedValue({
          id: 20,
          nivel: NivelTarea.ACTIVIDAD,
          proyectoId: 1,
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {} as ArbolTareasService;
    const bitacoraMock = {} as BitacoraService;
    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await expect(servicio.mover(10, { padreId: 20 }, 'JP')).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      codigo: 'JERARQUIA_INVALIDA',
    });
  });

  it('ejecuta bloqueo FOR UPDATE al inicio de cualquier mutacion', async () => {
    const ordenEjecucion: string[] = [];

    const txMock = {
      $queryRaw: vi.fn().mockImplementation(() => {
        ordenEjecucion.push('bloqueo');
        return Promise.resolve([]);
      }),
      proyecto: {
        findUnique: vi.fn().mockImplementation(() => {
          ordenEjecucion.push('verificarProyecto');
          return Promise.resolve(proyectoMock);
        }),
      },
      tarea: {
        findUnique: vi.fn().mockImplementation(() => {
          ordenEjecucion.push('buscarTarea');
          return Promise.resolve(tareaMock);
        }),
        findMany: vi.fn().mockResolvedValue([tareaMock]),
        delete: vi.fn().mockImplementation(() => {
          ordenEjecucion.push('borrarTarea');
          return Promise.resolve(tareaMock);
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {
      $transaction: vi.fn().mockImplementation((cb) => cb(txMock)),
    } as unknown as PrismaService;

    const arbolMock = {
      reorganizar: vi.fn().mockResolvedValue({
        proyectoId: 1,
        porcentajeAvanceProyecto: 0,
        tareas: [],
      }),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarEliminacion: vi.fn(),
    } as unknown as BitacoraService;

    const servicio = new TareasService(prismaMock, arbolMock, bitacoraMock);

    await servicio.eliminar(10, 'JP');

    expect(ordenEjecucion).toEqual(['buscarTarea', 'bloqueo', 'verificarProyecto', 'borrarTarea']);
  });
});
