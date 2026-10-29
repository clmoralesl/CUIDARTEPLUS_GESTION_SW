import { HttpException, HttpStatus } from '@nestjs/common';
import type { CodigoError } from '@cuidarte/core';

export class ExcepcionApi extends HttpException {
  constructor(
    estado: HttpStatus,
    readonly codigo: CodigoError,
    readonly mensaje: string,
    readonly detalles?: unknown,
  ) {
    super({ codigo, mensaje, detalles }, estado);
  }
}
