import type { Hito, Tarea } from '@prisma/client';
import {
  dateAFechaIso,
  evaluarHito,
  type CalendarioLaboral,
  type HitoConEstado,
  type ListaHitos,
  type TareaDeHito,
} from '@autofix/core';

export function construirListaHitos(
  proyectoId: number,
  hitos: readonly Hito[],
  tareas: ReadonlyMap<
    number,
    Pick<Tarea, 'id' | 'codigo' | 'nombre' | 'finPlan' | 'porcentajeAvance'>
  >,
  calendario: CalendarioLaboral,
  hoy: string,
): ListaHitos {
  const hitosOrdenados = [...hitos].sort((a, b) => {
    const diff = a.fechaObjetivo.getTime() - b.fechaObjetivo.getTime();
    if (diff !== 0) return diff;
    return a.id - b.id;
  });

  const hitosConEstado: HitoConEstado[] = hitosOrdenados.map((hito) => {
    const fechaObjetivoIso = dateAFechaIso(hito.fechaObjetivo);
    const fechaCumplimientoIso = hito.fechaCumplimiento
      ? dateAFechaIso(hito.fechaCumplimiento)
      : null;

    let tareaVinculada: TareaDeHito | null = null;
    if (hito.tareaId !== null) {
      const tarea = tareas.get(hito.tareaId);
      if (tarea) {
        tareaVinculada = {
          id: tarea.id,
          codigo: tarea.codigo,
          nombre: tarea.nombre,
          finPlan: tarea.finPlan ? dateAFechaIso(tarea.finPlan) : null,
          porcentajeAvance: Number(tarea.porcentajeAvance),
        };
      }
    }

    const evaluacion = evaluarHito(
      {
        fechaObjetivo: fechaObjetivoIso,
        fechaCumplimiento: fechaCumplimientoIso,
        tarea: tareaVinculada,
      },
      calendario,
      hoy,
    );

    return {
      id: hito.id,
      proyectoId: hito.proyectoId,
      nombre: hito.nombre,
      criterio: hito.criterio,
      responsable: hito.responsable,
      fechaObjetivo: fechaObjetivoIso,
      fechaCumplimiento: fechaCumplimientoIso,
      tarea: tareaVinculada,
      estado: evaluacion.estado,
      aTiempo: evaluacion.aTiempo,
      diasHabilesRestantes: evaluacion.diasHabilesRestantes,
    };
  });

  return {
    proyectoId,
    fechaCalculo: hoy,
    hitos: hitosConEstado,
  };
}
