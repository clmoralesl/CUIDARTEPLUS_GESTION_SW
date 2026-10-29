import { redondear } from './numeros';

export interface ElementoAvance {
  avance: number;
  duracion: number;
}

export function avancePonderado(elementos: readonly ElementoAvance[]): number {
  if (elementos.length === 0) return 0;
  const duracionTotal = elementos.reduce((suma, e) => suma + e.duracion, 0);
  const resultado =
    duracionTotal === 0
      ? elementos.reduce((suma, e) => suma + e.avance, 0) / elementos.length
      : elementos.reduce((suma, e) => suma + e.avance * e.duracion, 0) / duracionTotal;
  return redondear(resultado, 2);
}
