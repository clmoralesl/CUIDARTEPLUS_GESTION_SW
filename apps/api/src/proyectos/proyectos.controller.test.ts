import { describe, expect, it, vi } from 'vitest';
import type { ProyectoDetalle, ProyectoResumen } from '@autofix/core';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';

describe('ProyectosController', () => {
  const detalleEjemplo: ProyectoDetalle = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    descripcion: 'Implementacion del sistema',
    responsable: 'Jefe de Proyecto',
    presupuesto: 45000000,
    fechaInicio: '2026-11-02',
    fechaFin: '2027-03-31',
    estado: 'EN_CURSO',
    porcentajeAvance: 0,
    numeroTareas: 0,
    creadoEn: '2026-10-29T21:00:00.000Z',
    actualizadoEn: '2026-10-29T21:00:00.000Z',
  };

  const resumenEjemplo: ProyectoResumen = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    responsable: 'Jefe de Proyecto',
    presupuesto: 45000000,
    fechaInicio: '2026-11-02',
    fechaFin: '2027-03-31',
    estado: 'EN_CURSO',
    porcentajeAvance: 0,
    creadoEn: '2026-10-29T21:00:00.000Z',
    actualizadoEn: '2026-10-29T21:00:00.000Z',
  };

  it('delega listar al servicio', async () => {
    const servicioMock = {
      listar: vi.fn().mockResolvedValue([resumenEjemplo]),
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    const resultado = await controlador.listar();
    expect(resultado).toEqual([resumenEjemplo]);
    expect(servicioMock.listar).toHaveBeenCalledOnce();
  });

  it('delega obtener al servicio', async () => {
    const servicioMock = {
      obtener: vi.fn().mockResolvedValue(detalleEjemplo),
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    const resultado = await controlador.obtener(1);
    expect(resultado).toEqual(detalleEjemplo);
    expect(servicioMock.obtener).toHaveBeenCalledWith(1);
  });

  it('delega crear al servicio con rol', async () => {
    const servicioMock = {
      crear: vi.fn().mockResolvedValue(detalleEjemplo),
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    const resultado = await controlador.crear(
      {
        nombre: 'AutoFix · Implementación',
        responsable: 'Jefe de Proyecto',
        presupuesto: 45000000,
        fechaInicio: '2026-11-02',
      },
      'JP',
    );
    expect(resultado).toEqual(detalleEjemplo);
    expect(servicioMock.crear).toHaveBeenCalled();
  });

  it('delega actualizar al servicio con rol', async () => {
    const servicioMock = {
      actualizar: vi.fn().mockResolvedValue(detalleEjemplo),
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    const resultado = await controlador.actualizar(1, { nombre: 'Nuevo' }, 'JP');
    expect(resultado).toEqual(detalleEjemplo);
    expect(servicioMock.actualizar).toHaveBeenCalledWith(1, { nombre: 'Nuevo' }, 'JP');
  });

  it('delega iniciar y cerrar al servicio', async () => {
    const servicioMock = {
      cambiarEstado: vi.fn().mockResolvedValue(detalleEjemplo),
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    await controlador.iniciar(1, 'JP');
    expect(servicioMock.cambiarEstado).toHaveBeenCalledWith(1, 'EN_CURSO', 'JP');

    await controlador.cerrar(1, 'JP');
    expect(servicioMock.cambiarEstado).toHaveBeenCalledWith(1, 'CERRADO', 'JP');
  });
});
