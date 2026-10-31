import { NivelTarea, Prisma, type Tarea } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ArbolTareasService } from './arbol-tareas.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('ArbolTareasService', () => {
  it('numera el arbol en dos fases llamando codigos temporales antes de los definitivos', async () => {
    const tarea1: Tarea = {
      id: 1,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '1',
      orden: 1,
      nombre: 'Etapa 1',
      descripcion: null,
      responsable: null,
      duracionDias: 3,
      inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
      finPlan: new Date('2026-11-04T00:00:00.000Z'),
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

    const tarea2: Tarea = {
      id: 2,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '3',
      orden: 3,
      nombre: 'Etapa 2',
      descripcion: null,
      responsable: null,
      duracionDias: 2,
      inicioPlan: new Date('2026-11-05T00:00:00.000Z'),
      finPlan: new Date('2026-11-06T00:00:00.000Z'),
      inicioReal: null,
      finReal: null,
      fechaFija: null,
      porcentajeAvance: new Prisma.Decimal(100),
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      costoPlan: new Prisma.Decimal(0),
      costoReal: new Prisma.Decimal(0),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const ordenLlamadas: string[] = [];

    const txMock = {
      tarea: {
        findMany: vi.fn().mockResolvedValue([tarea1, tarea2]),
        update: vi.fn().mockImplementation(({ where, data }) => {
          if (data.codigo?.startsWith('~')) {
            ordenLlamadas.push(`fase1:${where.id}:${data.codigo}`);
          } else {
            ordenLlamadas.push(`fase2:${where.id}:${data.codigo}`);
          }
          return Promise.resolve();
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {} as PrismaService;
    const servicio = new ArbolTareasService(prismaMock);

    await servicio.numerar(txMock, 1);

    expect(ordenLlamadas).toEqual(['fase1:2:~2', 'fase2:2:2']);
    expect(txMock.tarea.update).toHaveBeenCalledTimes(2);
  });

  it('no escribe en base de datos si ninguna fila cambia en numeracion', async () => {
    const tarea1: Tarea = {
      id: 1,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '1',
      orden: 1,
      nombre: 'Etapa 1',
      descripcion: null,
      responsable: null,
      duracionDias: 3,
      inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
      finPlan: new Date('2026-11-04T00:00:00.000Z'),
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

    const txMock = {
      tarea: {
        findMany: vi.fn().mockResolvedValue([tarea1]),
        update: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {} as PrismaService;
    const servicio = new ArbolTareasService(prismaMock);

    await servicio.numerar(txMock, 1);

    expect(txMock.tarea.update).not.toHaveBeenCalled();
  });

  it('cargar devuelve arbol vacio si no hay tareas', async () => {
    const txMock = {
      tarea: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as unknown as Prisma.TransactionClient;

    const servicio = new ArbolTareasService({} as PrismaService);
    const resultado = await servicio.cargar(txMock, 1);

    expect(resultado).toEqual({
      proyectoId: 1,
      porcentajeAvanceProyecto: 0,
      tareas: [],
    });
  });

  it('cargar ordena en preorden y calcula avance ponderado', async () => {
    const etapa1: Tarea = {
      id: 1,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '1',
      orden: 1,
      nombre: 'Etapa 1',
      descripcion: null,
      responsable: null,
      duracionDias: 6,
      inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
      finPlan: new Date('2026-11-09T00:00:00.000Z'),
      inicioReal: null,
      finReal: null,
      fechaFija: null,
      porcentajeAvance: new Prisma.Decimal(50),
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      costoPlan: new Prisma.Decimal(0),
      costoReal: new Prisma.Decimal(0),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const etapa2: Tarea = {
      id: 2,
      proyectoId: 1,
      padreId: null,
      nivel: NivelTarea.ETAPA,
      codigo: '2',
      orden: 2,
      nombre: 'Etapa 2',
      descripcion: null,
      responsable: null,
      duracionDias: 4,
      inicioPlan: new Date('2026-11-10T00:00:00.000Z'),
      finPlan: new Date('2026-11-13T00:00:00.000Z'),
      inicioReal: null,
      finReal: null,
      fechaFija: null,
      porcentajeAvance: new Prisma.Decimal(100),
      inicioTardio: null,
      finTardio: null,
      holguraDias: null,
      esCritica: false,
      costoPlan: new Prisma.Decimal(0),
      costoReal: new Prisma.Decimal(0),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const txMock = {
      tarea: {
        findMany: vi.fn().mockResolvedValue([etapa2, etapa1]),
      },
    } as unknown as Prisma.TransactionClient;

    const servicio = new ArbolTareasService({} as PrismaService);
    const resultado = await servicio.cargar(txMock, 1);

    expect(resultado.proyectoId).toBe(1);
    expect(resultado.porcentajeAvanceProyecto).toBe(70);
    expect(resultado.tareas).toHaveLength(2);
    expect(resultado.tareas[0].codigo).toBe('1');
    expect(resultado.tareas[1].codigo).toBe('2');
  });
});
