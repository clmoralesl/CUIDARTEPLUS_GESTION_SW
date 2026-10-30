import { Prisma } from '@prisma/client';
import {
  CALENDARIO_POR_DEFECTO,
  crearCalendarioLaboral,
  dateAFechaIso,
  type CalendarioLaboral,
} from '@autofix/core';

export async function cargarCalendarioLaboral(
  tx: Prisma.TransactionClient,
  proyectoId: number,
): Promise<CalendarioLaboral> {
  const calendario = await tx.calendario.findUnique({
    where: { proyectoId },
    include: { feriados: { select: { fecha: true } } },
  });
  if (!calendario) return CALENDARIO_POR_DEFECTO;
  return crearCalendarioLaboral({
    diasLaborables: calendario.diasLaborables,
    feriados: calendario.feriados.map((f) => dateAFechaIso(f.fecha)),
  });
}
