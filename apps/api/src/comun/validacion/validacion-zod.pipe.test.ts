import { HttpStatus } from '@nestjs/common';
import { z } from '@cuidarte/core';
import { describe, expect, it } from 'vitest';
import { ExcepcionApi } from '../errores/excepcion-api';
import { PipeValidacionZod } from './validacion-zod.pipe';

describe('PipeValidacionZod', () => {
  const esquema = z.object({
    codigo: z.string().min(2),
  });
  const pipe = new PipeValidacionZod(esquema);

  it('retorna los datos transformados si son validos', () => {
    const valor = { codigo: 'PRJ-1' };
    expect(pipe.transform(valor)).toEqual(valor);
  });

  it('lanza ExcepcionApi con VALIDACION_FALLIDA y detalles ante datos invalidos', () => {
    const valor = { codigo: 'A' };
    expect(() => pipe.transform(valor)).toThrowError(ExcepcionApi);
    try {
      pipe.transform(valor);
    } catch (error) {
      const apiError = error as ExcepcionApi;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(apiError.codigo).toBe('VALIDACION_FALLIDA');
      expect(Array.isArray(apiError.detalles)).toBe(true);
    }
  });
});
