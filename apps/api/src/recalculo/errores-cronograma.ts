import { HttpStatus } from '@nestjs/common';
import { CicloDetectadoError, DependenciaInvalidaError } from '@autofix/core';
import { ExcepcionApi } from '../comun/errores/excepcion-api';

export function traducirErrorCronograma(error: unknown): never {
  if (error instanceof CicloDetectadoError) {
    throw new ExcepcionApi(HttpStatus.UNPROCESSABLE_ENTITY, 'CICLO_DETECTADO', error.message, {
      ciclo: error.ciclo,
    });
  }
  if (error instanceof DependenciaInvalidaError) {
    throw new ExcepcionApi(HttpStatus.UNPROCESSABLE_ENTITY, 'DEPENDENCIA_INVALIDA', error.message);
  }
  throw error;
}
