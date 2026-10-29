import { describe, expect, it, vi } from 'vitest';
import { esquemaCrearProyecto } from '@autofix/core';
import { cargarErroresServidor, validadorFormulario } from './validador-formulario';

describe('validadorFormulario', () => {
  const validador = validadorFormulario(esquemaCrearProyecto);

  it('retorna objeto vacio cuando los valores son validos', () => {
    const errores = validador({
      nombre: 'Proyecto Valido',
      descripcion: null,
      responsable: 'Jefe de Proyecto',
      presupuesto: 1000000,
      fechaInicio: '2026-11-02',
    });
    expect(errores).toEqual({});
  });

  it('retorna mapa de errores conservando el primer error de cada campo', () => {
    const errores = validador({
      nombre: '',
      responsable: '',
      presupuesto: -10,
      fechaInicio: 'invalida',
    });
    expect(errores.nombre).toBe('Ingrese el nombre.');
    expect(errores.responsable).toBe('Ingrese el responsable.');
    expect(errores.presupuesto).toBe('El presupuesto no puede ser negativo.');
    expect(errores.fechaInicio).toBe('Ingrese una fecha válida con el formato AAAA-MM-DD.');
  });

  it('carga errores estructurados del servidor en el formulario', () => {
    const formMock = { setErrors: vi.fn() };
    const errorServidor = {
      cuerpo: {
        detalles: [
          { campo: 'nombre', mensaje: 'Nombre duplicado' },
          { campo: 'fechaFin', mensaje: 'Fecha no valida' },
        ],
      },
    };

    cargarErroresServidor(formMock, errorServidor);
    expect(formMock.setErrors).toHaveBeenCalledWith({
      nombre: 'Nombre duplicado',
      fechaFin: 'Fecha no valida',
    });
  });
});
