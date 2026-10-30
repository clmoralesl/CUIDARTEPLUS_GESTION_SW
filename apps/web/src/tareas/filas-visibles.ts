import type { TareaArbol } from '@autofix/core';

export function filasVisibles(
  tareas: readonly TareaArbol[],
  colapsadas: ReadonlySet<number>,
): TareaArbol[] {
  const ocultas = new Set<number>();
  return tareas.filter((tarea) => {
    const oculta =
      tarea.padreId !== null && (ocultas.has(tarea.padreId) || colapsadas.has(tarea.padreId));
    if (oculta) ocultas.add(tarea.id);
    return !oculta;
  });
}
