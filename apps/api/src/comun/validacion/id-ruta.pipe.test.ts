import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ExcepcionApi } from '../errores/excepcion-api';
import { PipeIdRuta } from './id-ruta.pipe';

describe('PipeIdRuta', () => {
  const pipe = new PipeIdRuta('proyectoId');

  it('transforma valores enteros positivos validos a number', () => {
    expect(pipe.transform('1')).toBe(1);
    expect(pipe.transform('42')).toBe(42);
    expect(pipe.transform('2147483647')).toBe(2147483647);
  });

  it('lanza ExcepcionApi 400 ante valores invalidos o fuera de rango', () => {
    const casosInvalidos = ['0', '-5', 'abc', '1.5', '2147483648', '', '   '];

    for (const caso of casosInvalidos) {
      try {
        pipe.transform(caso);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ExcepcionApi);
        const exc = error as ExcepcionApi;
        expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(exc.codigo).toBe('VALIDACION_FALLIDA');
        expect(exc.detalles).toEqual([
          { campo: 'proyectoId', mensaje: 'Debe ser un número entero positivo.' },
        ]);
      }
    }
  });
});
