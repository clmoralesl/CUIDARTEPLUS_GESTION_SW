import { Prisma } from '@prisma/client';
import type { PlanificacionTarea } from '@autofix/core';

const TAMANO_LOTE = 1000;

export async function escribirPlanificacion(
  tx: Prisma.TransactionClient,
  filas: readonly PlanificacionTarea[],
): Promise<void> {
  if (filas.length === 0) return;
  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    const valores = filas
      .slice(i, i + TAMANO_LOTE)
      .map(
        (f) =>
          Prisma.sql`(${f.id}::int, ${f.duracionDias}::int, ${f.inicioPlan}::date, ${f.finPlan}::date, ${f.inicioReal}::date, ${f.finReal}::date, ${f.fechaFija}::date, ${f.porcentajeAvance}::numeric(5,2), ${f.inicioTardio}::date, ${f.finTardio}::date, ${f.holguraDias}::int, ${f.esCritica}::boolean)`,
      );
    await tx.$executeRaw`
      UPDATE "tareas" AS t SET
        "duracion_dias" = v.duracion_dias,
        "inicio_plan" = v.inicio_plan,
        "fin_plan" = v.fin_plan,
        "inicio_real" = v.inicio_real,
        "fin_real" = v.fin_real,
        "fecha_fija" = v.fecha_fija,
        "porcentaje_avance" = v.porcentaje_avance,
        "inicio_tardio" = v.inicio_tardio,
        "fin_tardio" = v.fin_tardio,
        "holgura_dias" = v.holgura_dias,
        "es_critica" = v.es_critica,
        "actualizado_en" = now()
      FROM (VALUES ${Prisma.join(valores)})
        AS v(id, duracion_dias, inicio_plan, fin_plan, inicio_real, fin_real, fecha_fija, porcentaje_avance, inicio_tardio, fin_tardio, holgura_dias, es_critica)
      WHERE t."id" = v.id`;
  }
}
