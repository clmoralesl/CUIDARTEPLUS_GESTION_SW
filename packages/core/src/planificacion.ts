import {
  diasHabilesEntre,
  esHabil,
  siguienteHabil,
  sumarDiasHabiles,
  type CalendarioLaboral,
} from './calendario';

export function calcularInicioPlan(inicioIso: string, calendario: CalendarioLaboral): string {
  return siguienteHabil(inicioIso, calendario);
}

export function calcularFinPlan(
  inicioIso: string,
  duracionDias: number,
  calendario: CalendarioLaboral,
): string {
  return sumarDiasHabiles(
    siguienteHabil(inicioIso, calendario),
    Math.max(duracionDias - 1, 0),
    calendario,
  );
}

export function duracionDelLapso(
  inicioIso: string,
  finIso: string,
  calendario: CalendarioLaboral,
): number {
  return (esHabil(inicioIso, calendario) ? 1 : 0) + diasHabilesEntre(inicioIso, finIso, calendario);
}
