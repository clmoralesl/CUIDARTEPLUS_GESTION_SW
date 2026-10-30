import { diasCorridosEntre, sumarDiasCorridos } from './fechas';

export function calcularFinPlan(inicioIso: string, duracionDias: number): string {
  return sumarDiasCorridos(inicioIso, Math.max(duracionDias - 1, 0));
}

export function duracionDelLapso(inicioIso: string, finIso: string): number {
  return diasCorridosEntre(inicioIso, finIso) + 1;
}
