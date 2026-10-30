import { avancePonderado } from './avance';
import type { CalendarioLaboral } from './calendario';
import { duracionDelLapso } from './planificacion';

export interface DatosConsolidables {
  id: number;
  padreId: number | null;
  duracionDias: number;
  inicioPlan: string | null;
  finPlan: string | null;
  inicioReal: string | null;
  finReal: string | null;
  porcentajeAvance: number;
}

const minimo = (valores: (string | null)[]) =>
  valores.filter((v): v is string => v !== null).sort()[0] ?? null;

const maximo = (valores: (string | null)[]) =>
  valores
    .filter((v): v is string => v !== null)
    .sort()
    .at(-1) ?? null;

export function consolidarArbol<T extends DatosConsolidables>(
  tareas: readonly T[],
  calendario: CalendarioLaboral,
): T[] {
  const hijos = new Map<number | null, T[]>();
  for (const tarea of tareas) {
    const grupo = hijos.get(tarea.padreId) ?? [];
    grupo.push(tarea);
    hijos.set(tarea.padreId, grupo);
  }
  const resultado = new Map<number, T>();
  const consolidar = (tarea: T): T => {
    const propias = (hijos.get(tarea.id) ?? []).map(consolidar);
    if (propias.length === 0) {
      resultado.set(tarea.id, tarea);
      return tarea;
    }
    const inicioPlan = minimo(propias.map((h) => h.inicioPlan));
    const finPlan = maximo(propias.map((h) => h.finPlan));
    const consolidada: T = {
      ...tarea,
      inicioPlan,
      finPlan,
      duracionDias:
        inicioPlan && finPlan
          ? duracionDelLapso(inicioPlan, finPlan, calendario)
          : propias.reduce((suma, h) => suma + h.duracionDias, 0),
      inicioReal: minimo(propias.map((h) => h.inicioReal)),
      finReal:
        propias.length > 0 && propias.every((h) => h.finReal !== null)
          ? maximo(propias.map((h) => h.finReal))
          : null,
      porcentajeAvance: avancePonderado(
        propias.map((h) => ({ avance: h.porcentajeAvance, duracion: h.duracionDias })),
      ),
    };
    resultado.set(tarea.id, consolidada);
    return consolidada;
  };
  for (const raiz of hijos.get(null) ?? []) consolidar(raiz);
  return tareas.map((t) => resultado.get(t.id) ?? t);
}
