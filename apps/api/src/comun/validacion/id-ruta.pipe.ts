import { HttpStatus, PipeTransform } from '@nestjs/common';
import { ExcepcionApi } from '../errores/excepcion-api';

const PATRON_ID = /^[1-9]\d{0,9}$/;
const ID_MAXIMO = 2_147_483_647;

export class PipeIdRuta implements PipeTransform<string, number> {
  constructor(private readonly campo: string) {}

  transform(valor: string): number {
    const numero = PATRON_ID.test(valor) ? Number(valor) : Number.NaN;
    if (numero >= 1 && numero <= ID_MAXIMO) return numero;
    throw new ExcepcionApi(
      HttpStatus.BAD_REQUEST,
      'VALIDACION_FALLIDA',
      'El identificador no es válido.',
      [{ campo: this.campo, mensaje: 'Debe ser un número entero positivo.' }],
    );
  }
}
