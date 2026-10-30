import { NivelTarea, Prisma, type Tarea } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ArbolTareasService } from './arbol-tareas.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('ArbolTareasService', () => {
  it('reorganiza arbol en dos fases llamando codigos temporales antes de los definitivos', async () => {
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

    const resultado = await servicio.reorganizar(txMock, 1);

    expect(ordenLlamadas).toEqual(['fase1:2:~2', 'fase2:2:2']);
    expect(txMock.tarea.update).toHaveBeenCalledTimes(2);

    expect(resultado.proyectoId).toBe(1);
    expect(resultado.porcentajeAvanceProyecto).toBe(40);
    expect(resultado.tareas).toHaveLength(2);
    expect(resultado.tareas[0].codigo).toBe('1');
    expect(resultado.tareas[1].codigo).toBe('2');
  });

  it('no escribe en base de datos si ninguna fila cambia', async () => {
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

    const resultado = await servicio.reorganizar(txMock, 1);

    expect(txMock.tarea.update).not.toHaveBeenCalled();
    expect(resultado.tareas).toHaveLength(1);
  });

  it('asigna finPlan nulo a una hoja sin inicio y consolida al padre sin esa fecha', async () => {
    const etapa: Tarea = {
      id: 1,
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

    const hoja: Tarea = {
      id: 2,
      proyectoId: 1,
      padreId: 1,
      nivel: NivelTarea.ACTIVIDAD,
      codigo: '1.1',
      orden: 1,
      nombre: 'Actividad 1.1',
      descripcion: null,
      responsable: null,
      duracionDias: 5,
      inicioPlan: null,
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

    const updates: { id: number; data: Prisma.TareaUpdateInput }[] = [];

    const txMock = {
      tarea: {
        findMany: vi.fn().mockResolvedValue([etapa, hoja]),
        update: vi.fn().mockImplementation(({ where, data }) => {
          updates.push({ id: where.id, data });
          return Promise.resolve();
        }),
      },
    } as unknown as Prisma.TransactionClient;

    const prismaMock = {} as PrismaService;
    const servicio = new ArbolTareasService(prismaMock);

    const resultado = await servicio.reorganizar(txMock, 1);

    const updateHoja = updates.find((u) => u.id === 2);
    expect(updateHoja).toBeDefined();
    expect(updateHoja?.data.finPlan).toBeNull();

    const etapaResultado = resultado.tareas.find((t) => t.id === 1);
    const hojaResultado = resultado.tareas.find((t) => t.id === 2);

    expect(hojaResultado?.finPlan).toBeNull();
    expect(hojaResultado?.inicioPlan).toBeNull();
    expect(etapaResultado?.inicioPlan).toBeNull();
    expect(etapaResultado?.finPlan).toBeNull();
    expect(etapaResultado?.duracionDias).toBe(5);
  });
});
