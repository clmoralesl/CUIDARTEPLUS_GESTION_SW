import { HttpStatus, PipeTransform } from '@nestjs/common';
import { Esquema, validar } from '@autofix/core';
import { ExcepcionApi } from '../errores/excepcion-api';

export class PipeValidacionZod<T> implements PipeTransform<unknown, T> {
  constructor(private readonly esquema: Esquema<T>) {}

  transform(valor: unknown): T {
    const resultado = validar(this.esquema, valor);
    if (resultado.ok) return resultado.datos;
    throw new ExcepcionApi(
      HttpStatus.BAD_REQUEST,
      'VALIDACION_FALLIDA',
      'Los datos enviados no son válidos.',
      resultado.detalles,
    );
  }
}
