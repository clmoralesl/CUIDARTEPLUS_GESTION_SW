import { type NivelTarea } from './tareas';

export const NIVEL_PADRE: Record<NivelTarea, NivelTarea | null> = {
  ETAPA: null,
  ACTIVIDAD: 'ETAPA',
  SUBACTIVIDAD: 'ACTIVIDAD',
};

export function esJerarquiaValida(nivel: NivelTarea, nivelPadre: NivelTarea | null): boolean {
  return NIVEL_PADRE[nivel] === nivelPadre;
}

export interface NodoArbol {
  id: number;
  padreId: number | null;
  orden: number;
}

export interface Numeracion {
  codigo: string;
  orden: number;
}

function hijosPorPadre<T extends NodoArbol>(nodos: readonly T[]): Map<number | null, T[]> {
  const grupos = new Map<number | null, T[]>();
  for (const nodo of nodos) {
    const grupo = grupos.get(nodo.padreId) ?? [];
    grupo.push(nodo);
    grupos.set(nodo.padreId, grupo);
  }
  for (const grupo of grupos.values()) {
    grupo.sort((a, b) => a.orden - b.orden || a.id - b.id);
  }
  return grupos;
}

export function numerarArbol(nodos: readonly NodoArbol[]): Map<number, Numeracion> {
  const grupos = hijosPorPadre(nodos);
  const resultado = new Map<number, Numeracion>();
  const recorrer = (padreId: number | null, prefijo: string) => {
    (grupos.get(padreId) ?? []).forEach((nodo, indice) => {
      const orden = indice + 1;
      const codigo = prefijo === '' ? String(orden) : `${prefijo}.${orden}`;
      resultado.set(nodo.id, { codigo, orden });
      recorrer(nodo.id, codigo);
    });
  };
  recorrer(null, '');
  return resultado;
}

export function ordenarPreorden<T extends NodoArbol>(nodos: readonly T[]): T[] {
  const grupos = hijosPorPadre(nodos);
  const resultado: T[] = [];
  const recorrer = (padreId: number | null) => {
    for (const nodo of grupos.get(padreId) ?? []) {
      resultado.push(nodo);
      recorrer(nodo.id);
    }
  };
  recorrer(null);
  return resultado;
}

export function contarDescendientes(nodos: readonly NodoArbol[], id: number): number {
  const grupos = hijosPorPadre(nodos);
  const contar = (padreId: number): number =>
    (grupos.get(padreId) ?? []).reduce((suma, hijo) => suma + 1 + contar(hijo.id), 0);
  return contar(id);
}

export function insertarEnArbol<T extends NodoArbol>(
  nodos: readonly T[],
  nuevo: T,
  posicion?: number,
): T[] {
  const resultado = nodos.map((nodo) => ({ ...nodo }));
  const hermanas = resultado
    .filter((n) => n.padreId === nuevo.padreId)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);

  const nodoNuevo = { ...nuevo };
  const indice =
    posicion === undefined ? hermanas.length : Math.max(0, Math.min(posicion - 1, hermanas.length));

  hermanas.splice(indice, 0, nodoNuevo);
  hermanas.forEach((hermana, i) => {
    hermana.orden = i + 1;
  });

  return [...resultado, nodoNuevo];
}

export function moverEnArbol<T extends NodoArbol>(
  nodos: readonly T[],
  id: number,
  nuevoPadreId: number | null,
  posicion?: number,
): T[] {
  const resultado = nodos.map((nodo) => ({ ...nodo }));
  const objetivo = resultado.find((n) => n.id === id);
  if (!objetivo) return resultado;

  const padreAnteriorId = objetivo.padreId;
  objetivo.padreId = nuevoPadreId;

  if (padreAnteriorId === nuevoPadreId) {
    const hermanas = resultado
      .filter((n) => n.padreId === nuevoPadreId && n.id !== id)
      .sort((a, b) => a.orden - b.orden || a.id - b.id);

    const indice =
      posicion === undefined
        ? hermanas.length
        : Math.max(0, Math.min(posicion - 1, hermanas.length));

    hermanas.splice(indice, 0, objetivo);
    hermanas.forEach((hermana, i) => {
      hermana.orden = i + 1;
    });
  } else {
    const hermanasAnteriores = resultado
      .filter((n) => n.padreId === padreAnteriorId && n.id !== id)
      .sort((a, b) => a.orden - b.orden || a.id - b.id);

    hermanasAnteriores.forEach((hermana, i) => {
      hermana.orden = i + 1;
    });

    const nuevasHermanas = resultado
      .filter((n) => n.padreId === nuevoPadreId && n.id !== id)
      .sort((a, b) => a.orden - b.orden || a.id - b.id);

    const indice =
      posicion === undefined
        ? nuevasHermanas.length
        : Math.max(0, Math.min(posicion - 1, nuevasHermanas.length));

    nuevasHermanas.splice(indice, 0, objetivo);
    nuevasHermanas.forEach((hermana, i) => {
      hermana.orden = i + 1;
    });
  }

  return resultado;
}

export function eliminarDeArbol<T extends NodoArbol>(nodos: readonly T[], id: number): T[] {
  const grupos = hijosPorPadre(nodos);
  const aEliminar = new Set<number>();

  const recolectar = (padreId: number) => {
    aEliminar.add(padreId);
    for (const hijo of grupos.get(padreId) ?? []) {
      recolectar(hijo.id);
    }
  };
  recolectar(id);

  const eliminado = nodos.find((n) => n.id === id);
  const padreId = eliminado ? eliminado.padreId : null;

  const restantes = nodos.filter((n) => !aEliminar.has(n.id)).map((nodo) => ({ ...nodo }));

  const hermanas = restantes
    .filter((n) => n.padreId === padreId)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);

  hermanas.forEach((hermana, i) => {
    hermana.orden = i + 1;
  });

  return restantes;
}
