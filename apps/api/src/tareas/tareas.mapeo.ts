import type { Tarea } from '@prisma/client';
import { dateAFechaIso, type TareaArbol } from '@autofix/core';

export function aTareaArbol(tarea: Tarea, tieneHijas: boolean): TareaArbol {
  return {
    id: tarea.id,
    padreId: tarea.padreId,
    nivel: tarea.nivel,
    codigo: tarea.codigo,
    orden: tarea.orden,
    nombre: tarea.nombre,
    descripcion: tarea.descripcion,
    responsable: tarea.responsable,
    duracionDias: tarea.duracionDias,
    inicioPlan: tarea.inicioPlan ? dateAFechaIso(tarea.inicioPlan) : null,
    finPlan: tarea.finPlan ? dateAFechaIso(tarea.finPlan) : null,
    inicioReal: tarea.inicioReal ? dateAFechaIso(tarea.inicioReal) : null,
    finReal: tarea.finReal ? dateAFechaIso(tarea.finReal) : null,
    porcentajeAvance: Number(tarea.porcentajeAvance),
    tieneHijas,
  };
}
