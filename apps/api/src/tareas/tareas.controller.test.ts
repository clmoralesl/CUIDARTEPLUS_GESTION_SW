import { describe, expect, it, vi } from 'vitest';
import { TareasController } from './tareas.controller';
import type { TareasService } from './tareas.service';

describe('TareasController', () => {
  const arbolMock = {
    proyectoId: 1,
    porcentajeAvanceProyecto: 0,
    tareas: [],
  };

  it('delega obtenerArbol al servicio', async () => {
    const servicioMock = {
      obtenerArbol: vi.fn().mockResolvedValue(arbolMock),
    } as unknown as TareasService;

    const controller = new TareasController(servicioMock);
    const resultado = await controller.obtenerArbol(1);

    expect(servicioMock.obtenerArbol).toHaveBeenCalledWith(1);
    expect(resultado).toBe(arbolMock);
  });

  it('delega crear al servicio con rol', async () => {
    const servicioMock = {
      crear: vi.fn().mockResolvedValue(arbolMock),
    } as unknown as TareasService;

    const controller = new TareasController(servicioMock);
    const datos = {
      nivel: 'ETAPA' as const,
      padreId: null,
      nombre: 'Etapa 1',
      duracionDias: 1,
    };
    const resultado = await controller.crear(1, datos, 'JP');

    expect(servicioMock.crear).toHaveBeenCalledWith(1, datos, 'JP');
    expect(resultado).toBe(arbolMock);
  });

  it('delega actualizar al servicio con rol', async () => {
    const servicioMock = {
      actualizar: vi.fn().mockResolvedValue(arbolMock),
    } as unknown as TareasService;

    const controller = new TareasController(servicioMock);
    const datos = { nombre: 'Nombre nuevo' };
    const resultado = await controller.actualizar(10, datos, 'JP');

    expect(servicioMock.actualizar).toHaveBeenCalledWith(10, datos, 'JP');
    expect(resultado).toBe(arbolMock);
  });

  it('delega mover al servicio con rol', async () => {
    const servicioMock = {
      mover: vi.fn().mockResolvedValue(arbolMock),
    } as unknown as TareasService;

    const controller = new TareasController(servicioMock);
    const datos = { padreId: 2, posicion: 1 };
    const resultado = await controller.mover(10, datos, 'JP');

    expect(servicioMock.mover).toHaveBeenCalledWith(10, datos, 'JP');
    expect(resultado).toBe(arbolMock);
  });

  it('delega eliminar al servicio con rol', async () => {
    const servicioMock = {
      eliminar: vi.fn().mockResolvedValue(arbolMock),
    } as unknown as TareasService;

    const controller = new TareasController(servicioMock);
    const resultado = await controller.eliminar(10, 'JP');

    expect(servicioMock.eliminar).toHaveBeenCalledWith(10, 'JP');
    expect(resultado).toBe(arbolMock);
  });
});
