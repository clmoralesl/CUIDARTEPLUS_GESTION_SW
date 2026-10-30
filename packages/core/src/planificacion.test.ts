import { describe, expect, it } from 'vitest';
import { CALENDARIO_POR_DEFECTO, crearCalendarioLaboral } from './calendario';
import { calcularFinPlan, calcularInicioPlan, duracionDelLapso } from './planificacion';

describe('planificacion', () => {
  const calendarioConFeriado = crearCalendarioLaboral({
    diasLaborables: [1, 2, 3, 4, 5],
    feriados: ['2026-12-08'],
  });

  it('calcula fecha de fin plan para duracion 0, 1 y n en dias habiles', () => {
    expect(calcularFinPlan('2026-11-02', 0, CALENDARIO_POR_DEFECTO)).toBe('2026-11-02');
    expect(calcularFinPlan('2026-11-02', 1, CALENDARIO_POR_DEFECTO)).toBe('2026-11-02');
    expect(calcularFinPlan('2026-11-02', 5, CALENDARIO_POR_DEFECTO)).toBe('2026-11-06');
    expect(calcularFinPlan('2026-11-05', 4, CALENDARIO_POR_DEFECTO)).toBe('2026-11-10');
    expect(calcularFinPlan('2026-11-22', 8, CALENDARIO_POR_DEFECTO)).toBe('2026-12-02');
    expect(calcularFinPlan('2026-11-07', 0, CALENDARIO_POR_DEFECTO)).toBe('2026-11-09');
    expect(calcularFinPlan('2026-11-28', 4, CALENDARIO_POR_DEFECTO)).toBe('2026-12-03');
  });

  it('calcula inicio normalizado de la tarea', () => {
    expect(calcularInicioPlan('2026-11-02', CALENDARIO_POR_DEFECTO)).toBe('2026-11-02');
    expect(calcularInicioPlan('2026-11-07', CALENDARIO_POR_DEFECTO)).toBe('2026-11-09');
    expect(calcularInicioPlan('2026-12-08', calendarioConFeriado)).toBe('2026-12-09');
  });

  it('calcula duracion inclusiva del lapso en dias habiles', () => {
    expect(duracionDelLapso('2026-11-02', '2026-11-02', CALENDARIO_POR_DEFECTO)).toBe(1);
    expect(duracionDelLapso('2026-11-02', '2026-11-06', CALENDARIO_POR_DEFECTO)).toBe(5);
    expect(duracionDelLapso('2026-11-02', '2026-11-17', CALENDARIO_POR_DEFECTO)).toBe(12);
    expect(duracionDelLapso('2026-11-28', '2026-12-03', CALENDARIO_POR_DEFECTO)).toBe(4);
    expect(duracionDelLapso('2026-12-07', '2026-12-09', calendarioConFeriado)).toBe(2);
  });
});
