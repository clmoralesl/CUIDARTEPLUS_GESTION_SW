import { redondear } from './numeros';

export function redondearMonto(valor: number): number {
  return redondear(valor, 2);
}

export function sumarMontos(montos: readonly number[]): number {
  return redondearMonto(montos.reduce((suma, monto) => suma + monto, 0));
}
