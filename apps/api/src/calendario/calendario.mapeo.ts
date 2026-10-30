import type { Calendario, Feriado } from '@prisma/client';
import { dateAFechaIso, type CalendarioProyecto, type FeriadoCalendario } from '@autofix/core';

export function mapearFeriado(feriado: Feriado): FeriadoCalendario {
  return {
    id: feriado.id,
    fecha: dateAFechaIso(feriado.fecha),
    descripcion: feriado.descripcion,
  };
}

export function mapearCalendarioProyecto(
  calendario: Calendario & { feriados: Feriado[] },
): CalendarioProyecto {
  return {
    proyectoId: calendario.proyectoId,
    diasLaborables: [...calendario.diasLaborables].sort((a, b) => a - b),
    horasPorDia: Number(calendario.horasPorDia),
    feriados: [...calendario.feriados]
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .map(mapearFeriado),
  };
}
