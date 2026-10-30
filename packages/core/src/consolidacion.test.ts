import { describe, expect, it } from 'vitest';
import { consolidarArbol, type DatosConsolidables } from './consolidacion';

describe('consolidacion', () => {
  it('consolida arbol de 3 niveles ponderando avance por duracion', () => {
    const tareas: DatosConsolidables[] = [
      {
        id: 1,
        padreId: null,
        duracionDias: 0,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 0,
      },
      {
        id: 11,
        padreId: 1,
        duracionDias: 0,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 0,
      },
      {
        id: 111,
        padreId: 11,
        duracionDias: 3,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-04',
        inicioReal: '2026-11-02',
        finReal: '2026-11-04',
        porcentajeAvance: 100,
      },
      {
        id: 112,
        padreId: 11,
        duracionDias: 1,
        inicioPlan: '2026-11-05',
        finPlan: '2026-11-05',
        inicioReal: '2026-11-05',
        finReal: null,
        porcentajeAvance: 0,
      },
    ];

    const consolidadas = consolidarArbol(tareas);
    const act = consolidadas.find((t) => t.id === 11);
    const etapa = consolidadas.find((t) => t.id === 1);

    expect(act?.inicioPlan).toBe('2026-11-02');
    expect(act?.finPlan).toBe('2026-11-05');
    expect(act?.duracionDias).toBe(4);
    expect(act?.porcentajeAvance).toBe(75);
    expect(act?.inicioReal).toBe('2026-11-02');
    expect(act?.finReal).toBeNull();

    expect(etapa?.inicioPlan).toBe('2026-11-02');
    expect(etapa?.finPlan).toBe('2026-11-05');
    expect(etapa?.duracionDias).toBe(4);
    expect(etapa?.porcentajeAvance).toBe(75);
    expect(etapa?.inicioReal).toBe('2026-11-02');
    expect(etapa?.finReal).toBeNull();
  });

  it('consolida finReal solo cuando todas las hijas terminaron', () => {
    const tareas: DatosConsolidables[] = [
      {
        id: 1,
        padreId: null,
        duracionDias: 0,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 0,
      },
      {
        id: 11,
        padreId: 1,
        duracionDias: 2,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-03',
        inicioReal: '2026-11-02',
        finReal: '2026-11-03',
        porcentajeAvance: 100,
      },
      {
        id: 12,
        padreId: 1,
        duracionDias: 3,
        inicioPlan: '2026-11-04',
        finPlan: '2026-11-06',
        inicioReal: '2026-11-04',
        finReal: '2026-11-07',
        porcentajeAvance: 100,
      },
    ];

    const consolidadas = consolidarArbol(tareas);
    const etapa = consolidadas.find((t) => t.id === 1);
    expect(etapa?.inicioReal).toBe('2026-11-02');
    expect(etapa?.finReal).toBe('2026-11-07');
    expect(etapa?.porcentajeAvance).toBe(100);
  });

  it('maneja hijas sin fechas usando suma de duraciones y fechas nulas', () => {
    const tareas: DatosConsolidables[] = [
      {
        id: 1,
        padreId: null,
        duracionDias: 0,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 0,
      },
      {
        id: 11,
        padreId: 1,
        duracionDias: 3,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 20,
      },
      {
        id: 12,
        padreId: 1,
        duracionDias: 5,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 40,
      },
    ];

    const consolidadas = consolidarArbol(tareas);
    const etapa = consolidadas.find((t) => t.id === 1);
    expect(etapa?.inicioPlan).toBeNull();
    expect(etapa?.finPlan).toBeNull();
    expect(etapa?.duracionDias).toBe(8);
    expect(etapa?.porcentajeAvance).toBe(32.5);
  });

  it('maneja hijas con duraciones cero (hitos) mediante promedio simple', () => {
    const tareas: DatosConsolidables[] = [
      {
        id: 1,
        padreId: null,
        duracionDias: 0,
        inicioPlan: null,
        finPlan: null,
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 0,
      },
      {
        id: 11,
        padreId: 1,
        duracionDias: 0,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-02',
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 100,
      },
      {
        id: 12,
        padreId: 1,
        duracionDias: 0,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-02',
        inicioReal: null,
        finReal: null,
        porcentajeAvance: 50,
      },
    ];

    const consolidadas = consolidarArbol(tareas);
    const etapa = consolidadas.find((t) => t.id === 1);
    expect(etapa?.porcentajeAvance).toBe(75);
    expect(etapa?.duracionDias).toBe(1);
  });

  it('deja intacta una tarea sin hijas', () => {
    const tareas: DatosConsolidables[] = [
      {
        id: 1,
        padreId: null,
        duracionDias: 5,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-06',
        inicioReal: '2026-11-02',
        finReal: null,
        porcentajeAvance: 40,
      },
    ];

    const consolidadas = consolidarArbol(tareas);
    expect(consolidadas[0]).toEqual(tareas[0]);
  });
});
