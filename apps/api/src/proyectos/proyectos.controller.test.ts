import { EstadoProyecto } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService, ResumenProyecto } from './proyectos.service';

describe('ProyectosController', () => {
  it('retorna la lista de proyectos provista por el servicio', async () => {
    const proyectosEjemplo: ResumenProyecto[] = [
      { id: 1, nombre: 'CuidartePlus · Implementación', estado: EstadoProyecto.EN_CURSO },
    ];
    const servicioMock = {
      listar: async () => proyectosEjemplo,
    } as unknown as ProyectosService;

    const controlador = new ProyectosController(servicioMock);
    const resultado = await controlador.listar();
    expect(resultado).toEqual(proyectosEjemplo);
  });
});
