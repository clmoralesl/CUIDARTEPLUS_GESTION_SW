import { EstadoProyecto, Prisma, type Tarea } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CicloDetectadoError } from '@autofix/core';
import type { BitacoraService } from '../comun/bitacora/bitacora.service';
import type { ArbolTareasService } from '../tareas/arbol-tareas.service';
import { describirOrigen, RecalculoService } from './recalculo.service';
import type { ContextoRecalculo, PasoRecalculo } from './recalculo.tipos';

describe('RecalculoService', () => {
  const proyectoMock = {
    id: 1,
    nombre: 'AutoFix',
    estado: EstadoProyecto.EN_CURSO,
  };

  const tareasMock: Tarea[] = [
    {
      id: 10,
      proyectoId: 1,
      padreId: null,
      nivel: 'ETAPA',
      codigo: '1',
      orden: 1,
      nombre: 'Etapa 1',
      descripcion: null,
      responsable: null,
      duracionDias: 5,
      fechaFija: null,
      inicioPlan: new Date('2026-11-02T00:00:00.000Z'),
      finPlan: new Date('2026-11-06T00:00:00.000Z'),
      inicioReal: null,
      finReal: null,
      porcentajeAvance: new Prisma.Decimal(0),
      inicioTardio: new Date('2026-11-02T00:00:00.000Z'),
      finTardio: new Date('2026-11-06T00:00:00.000Z'),
      holguraDias: 0,
      esCritica: true,
      costoPlan: new Prisma.Decimal(0),
      costoReal: new Prisma.Decimal(0),
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ];

  it('describirOrigen concatena codigo de tarea y recorta a 200 caracteres', () => {
    expect(
      describirOrigen({ rol: 'JP', descripcion: 'Cambio de duración en', tareaId: 10 }, [
        { id: 10, codigo: '2.1.3' },
      ]),
    ).toBe('Cambio de duración en 2.1.3');

    const largo = 'A'.repeat(250);
    expect(describirOrigen({ rol: 'JP', descripcion: largo }, [])).toHaveLength(200);
  });

  it('ejecuta los pasos en orden y registra bitacora solo si hubo cambios', async () => {
    const ordenPasos: string[] = [];

    const paso1: PasoRecalculo = {
      nombre: 'paso1',
      ejecutar: vi.fn().mockImplementation(async (ctx: ContextoRecalculo) => {
        ordenPasos.push('paso1');
        ctx.huboCambios = true;
        ctx.tareasAfectadas = [
          {
            id: 10,
            codigo: '1',
            inicioAnterior: '2026-11-02',
            inicioNuevo: '2026-11-02',
            finAnterior: '2026-11-06',
            finNuevo: '2026-11-09',
          },
        ];
      }),
    };

    const paso2: PasoRecalculo = {
      nombre: 'paso2',
      ejecutar: vi.fn().mockImplementation(async () => {
        ordenPasos.push('paso2');
      }),
    };

    const arbolMock = {
      numerar: vi.fn().mockResolvedValue(undefined),
      cargar: vi.fn().mockResolvedValue({
        proyectoId: 1,
        porcentajeAvanceProyecto: 0,
        tareas: [],
      }),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarRecalculo: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      calendario: { findUnique: vi.fn().mockResolvedValue(null) },
      tarea: { findMany: vi.fn().mockResolvedValue(tareasMock) },
      dependencia: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as Prisma.TransactionClient;

    const servicio = new RecalculoService(arbolMock, bitacoraMock, [paso1, paso2]);

    const res = await servicio.ejecutar(1, txMock, {
      rol: 'JP',
      descripcion: 'Prueba origen',
      tareaId: 10,
    });

    expect(ordenPasos).toEqual(['paso1', 'paso2']);
    expect(bitacoraMock.registrarRecalculo).toHaveBeenCalledOnce();
    expect(res.tareasAfectadas).toHaveLength(1);
  });

  it('no registra bitacora RECALCULAR si no hubo cambios', async () => {
    const paso: PasoRecalculo = {
      nombre: 'fechas',
      ejecutar: vi.fn().mockResolvedValue(undefined),
    };

    const arbolMock = {
      numerar: vi.fn().mockResolvedValue(undefined),
      cargar: vi.fn().mockResolvedValue({
        proyectoId: 1,
        porcentajeAvanceProyecto: 0,
        tareas: [],
      }),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarRecalculo: vi.fn().mockResolvedValue(undefined),
    } as unknown as BitacoraService;

    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      calendario: { findUnique: vi.fn().mockResolvedValue(null) },
      tarea: { findMany: vi.fn().mockResolvedValue(tareasMock) },
      dependencia: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as Prisma.TransactionClient;

    const servicio = new RecalculoService(arbolMock, bitacoraMock, [paso]);

    await servicio.ejecutar(1, txMock, {
      rol: 'JP',
      descripcion: 'Sin cambios',
    });

    expect(bitacoraMock.registrarRecalculo).not.toHaveBeenCalled();
  });

  it('traduce CicloDetectadoError a 422 CICLO_DETECTADO', async () => {
    const pasoConCiclo: PasoRecalculo = {
      nombre: 'fechas',
      ejecutar: vi.fn().mockImplementation(async () => {
        throw new CicloDetectadoError(['1.1', '1.2', '1.1']);
      }),
    };

    const arbolMock = {
      numerar: vi.fn().mockResolvedValue(undefined),
      cargar: vi.fn(),
    } as unknown as ArbolTareasService;

    const bitacoraMock = {
      registrarRecalculo: vi.fn(),
    } as unknown as BitacoraService;

    const txMock = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      proyecto: { findUnique: vi.fn().mockResolvedValue(proyectoMock) },
      calendario: { findUnique: vi.fn().mockResolvedValue(null) },
      tarea: { findMany: vi.fn().mockResolvedValue(tareasMock) },
      dependencia: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as Prisma.TransactionClient;

    const servicio = new RecalculoService(arbolMock, bitacoraMock, [pasoConCiclo]);

    await expect(
      servicio.ejecutar(1, txMock, { rol: 'JP', descripcion: 'Ciclo' }),
    ).rejects.toThrow();
  });
});
