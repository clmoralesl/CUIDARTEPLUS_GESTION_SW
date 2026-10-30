import { describe, expect, it } from 'vitest';
import {
  contarDescendientes,
  eliminarDeArbol,
  esJerarquiaValida,
  insertarEnArbol,
  moverEnArbol,
  numerarArbol,
  ordenarPreorden,
  type NodoArbol,
} from './arbol';
import { NIVELES_TAREA, type NivelTarea } from './tareas';

describe('arbol', () => {
  it('valida las 12 combinaciones de jerarquia entre niveles y padres', () => {
    const padresPosibles: (NivelTarea | null)[] = [null, 'ETAPA', 'ACTIVIDAD', 'SUBACTIVIDAD'];

    for (const nivel of NIVELES_TAREA) {
      for (const padre of padresPosibles) {
        const esperado =
          (nivel === 'ETAPA' && padre === null) ||
          (nivel === 'ACTIVIDAD' && padre === 'ETAPA') ||
          (nivel === 'SUBACTIVIDAD' && padre === 'ACTIVIDAD');

        expect(esJerarquiaValida(nivel, padre)).toBe(esperado);
      }
    }
  });

  it('numera arbol jerarquico en formato 1, 1.1, 1.1.1 y soporta mas de 9 hermanas', () => {
    const nodos: NodoArbol[] = [
      { id: 1, padreId: null, orden: 1 },
      { id: 2, padreId: null, orden: 2 },
      { id: 10, padreId: 1, orden: 1 },
      { id: 11, padreId: 1, orden: 2 },
      { id: 101, padreId: 10, orden: 1 },
    ];

    const numeracion = numerarArbol(nodos);
    expect(numeracion.get(1)).toEqual({ codigo: '1', orden: 1 });
    expect(numeracion.get(2)).toEqual({ codigo: '2', orden: 2 });
    expect(numeracion.get(10)).toEqual({ codigo: '1.1', orden: 1 });
    expect(numeracion.get(11)).toEqual({ codigo: '1.2', orden: 2 });
    expect(numeracion.get(101)).toEqual({ codigo: '1.1.1', orden: 1 });

    const diezHermanas: NodoArbol[] = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      padreId: null,
      orden: i + 1,
    }));
    const numDiez = numerarArbol(diezHermanas);
    expect(numDiez.get(10)?.codigo).toBe('10');
    expect(numDiez.get(11)?.codigo).toBe('11');
  });

  it('ordena nodos en preorden respetando jerarquia y orden entre hermanas', () => {
    const nodos: NodoArbol[] = [
      { id: 2, padreId: null, orden: 2 },
      { id: 1, padreId: null, orden: 1 },
      { id: 12, padreId: 1, orden: 2 },
      { id: 11, padreId: 1, orden: 1 },
      { id: 111, padreId: 11, orden: 1 },
    ];

    const ordenados = ordenarPreorden(nodos);
    expect(ordenados.map((n) => n.id)).toEqual([1, 11, 111, 12, 2]);
  });

  it('cuenta descendientes de manera recursiva', () => {
    const nodos: NodoArbol[] = [
      { id: 1, padreId: null, orden: 1 },
      { id: 11, padreId: 1, orden: 1 },
      { id: 12, padreId: 1, orden: 2 },
      { id: 111, padreId: 11, orden: 1 },
      { id: 112, padreId: 11, orden: 2 },
      { id: 2, padreId: null, orden: 2 },
    ];

    expect(contarDescendientes(nodos, 1)).toBe(4);
    expect(contarDescendientes(nodos, 11)).toBe(2);
    expect(contarDescendientes(nodos, 12)).toBe(0);
    expect(contarDescendientes(nodos, 2)).toBe(0);
  });

  it('inserta un nuevo nodo al final o en una posicion intermedia acotada', () => {
    const nodos: NodoArbol[] = [
      { id: 1, padreId: null, orden: 1 },
      { id: 2, padreId: null, orden: 2 },
    ];

    const alFinal = insertarEnArbol(nodos, { id: 3, padreId: null, orden: 0 });
    expect(alFinal.find((n) => n.id === 3)?.orden).toBe(3);

    const alInicio = insertarEnArbol(nodos, { id: 4, padreId: null, orden: 0 }, 1);
    expect(alInicio.find((n) => n.id === 4)?.orden).toBe(1);
    expect(alInicio.find((n) => n.id === 1)?.orden).toBe(2);
    expect(alInicio.find((n) => n.id === 2)?.orden).toBe(3);
  });

  it('mueve una tarea entre hermanas y a otro padre renumerando orden', () => {
    const nodos: NodoArbol[] = [
      { id: 1, padreId: null, orden: 1 },
      { id: 2, padreId: null, orden: 2 },
      { id: 11, padreId: 1, orden: 1 },
      { id: 12, padreId: 1, orden: 2 },
      { id: 13, padreId: 1, orden: 3 },
    ];

    const subida = moverEnArbol(nodos, 13, 1, 1);
    expect(subida.find((n) => n.id === 13)?.orden).toBe(1);
    expect(subida.find((n) => n.id === 11)?.orden).toBe(2);
    expect(subida.find((n) => n.id === 12)?.orden).toBe(3);

    const cambioPadre = moverEnArbol(nodos, 12, 2, 1);
    expect(cambioPadre.find((n) => n.id === 12)?.padreId).toBe(2);
    expect(cambioPadre.find((n) => n.id === 12)?.orden).toBe(1);
    expect(cambioPadre.find((n) => n.id === 11)?.orden).toBe(1);
    expect(cambioPadre.find((n) => n.id === 13)?.orden).toBe(2);
  });

  it('elimina tarea y todos sus descendientes compactando el orden de hermanas', () => {
    const nodos: NodoArbol[] = [
      { id: 1, padreId: null, orden: 1 },
      { id: 11, padreId: 1, orden: 1 },
      { id: 12, padreId: 1, orden: 2 },
      { id: 121, padreId: 12, orden: 1 },
      { id: 122, padreId: 12, orden: 2 },
      { id: 13, padreId: 1, orden: 3 },
    ];

    const trasBorrado = eliminarDeArbol(nodos, 12);
    expect(trasBorrado.map((n) => n.id)).toEqual([1, 11, 13]);
    expect(trasBorrado.find((n) => n.id === 11)?.orden).toBe(1);
    expect(trasBorrado.find((n) => n.id === 13)?.orden).toBe(2);
  });
});
