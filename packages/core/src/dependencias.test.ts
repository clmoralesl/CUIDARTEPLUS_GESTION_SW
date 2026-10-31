import { describe, expect, it } from 'vitest';
import {
  describirDependencia,
  esquemaCrearDependencia,
  predecesorasDisponibles,
  sucesorasTransitivas,
} from './dependencias';
import { validar } from './validacion';

describe('esquemaCrearDependencia', () => {
  it('aplica FS y desfase 0 por defecto', () => {
    expect(validar(esquemaCrearDependencia, { predecesoraId: 1, sucesoraId: 2 })).toEqual({
      ok: true,
      datos: { predecesoraId: 1, sucesoraId: 2, tipo: 'FS', desfaseDias: 0 },
    });
  });

  it('rechaza autorreferencia, desfase fuera de rango, decimales y claves extra', () => {
    const campos = (valor: unknown) => {
      const r = validar(esquemaCrearDependencia, valor);
      return r.ok ? [] : r.detalles.map((d) => `${d.campo}: ${d.mensaje}`);
    };
    expect(campos({ predecesoraId: 3, sucesoraId: 3 })).toEqual([
      'predecesoraId: Una tarea no puede depender de sí misma.',
    ]);
    expect(campos({ predecesoraId: 1, sucesoraId: 2, desfaseDias: 366 })).toEqual([
      'desfaseDias: El desfase no puede superar 365 días hábiles.',
    ]);
    expect(campos({ predecesoraId: 1, sucesoraId: 2, desfaseDias: -366 })).toEqual([
      'desfaseDias: El desfase no puede ser menor a -365 días hábiles.',
    ]);
    expect(campos({ predecesoraId: 1, sucesoraId: 2, desfaseDias: 1.5 })).toEqual([
      'desfaseDias: El desfase debe ser un número entero.',
    ]);
    expect(campos({ predecesoraId: 1, sucesoraId: 2, tipo: 'XX' })).toEqual([
      'tipo: Seleccione un tipo válido: FS, SS, FF o SF.',
    ]);
    expect(campos({ predecesoraId: 1, sucesoraId: 2, proyectoId: 9 }).length).toBe(1);
  });
});

describe('selector de predecesoras', () => {
  const deps = [
    { predecesoraId: 3, sucesoraId: 4 },
    { predecesoraId: 4, sucesoraId: 6 },
    { predecesoraId: 6, sucesoraId: 7 },
    { predecesoraId: 4, sucesoraId: 7 },
    { predecesoraId: 6, sucesoraId: 10 },
  ];

  it('calcula las sucesoras directas e indirectas', () => {
    expect([...sucesorasTransitivas(deps, 4)].sort((a, b) => a - b)).toEqual([6, 7, 10]);
  });

  it('excluye la propia tarea, padres, predecesoras actuales y las que cerrarían un ciclo', () => {
    const tareas = [3, 4, 5, 6, 7, 10, 11].map((id) => ({ id, tieneHijas: id === 5 }));
    expect(predecesorasDisponibles(tareas, deps, 4).map((t) => t.id)).toEqual([11]);
    expect(predecesorasDisponibles(tareas, deps, 7).map((t) => t.id)).toEqual([3, 10, 11]);
  });

  it('describe la dependencia para la bitácora', () => {
    expect(describirDependencia('1.1', '1.2', 'SS', 2)).toBe('1.1 → 1.2 (SS +2)');
    expect(describirDependencia('1.1', '1.2', 'FS', 0)).toBe('1.1 → 1.2 (FS)');
    expect(describirDependencia('1.1', '1.2', 'FF', -1)).toBe('1.1 → 1.2 (FF -1)');
  });
});
