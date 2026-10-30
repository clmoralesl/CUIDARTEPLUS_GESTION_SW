import { describe, expect, it } from 'vitest';
import { calcularFinPlan, duracionDelLapso } from './planificacion';

describe('planificacion', () => {
  it('calcula fecha de fin plan para duracion 0, 1 y n', () => {
    expect(calcularFinPlan('2026-11-02', 0)).toBe('2026-11-02');
    expect(calcularFinPlan('2026-11-02', 1)).toBe('2026-11-02');
    expect(calcularFinPlan('2026-11-02', 5)).toBe('2026-11-06');
    expect(calcularFinPlan('2026-11-28', 4)).toBe('2026-12-01');
  });

  it('calcula duracion inclusiva del lapso entre dos fechas', () => {
    expect(duracionDelLapso('2026-11-02', '2026-11-02')).toBe(1);
    expect(duracionDelLapso('2026-11-02', '2026-11-06')).toBe(5);
    expect(duracionDelLapso('2026-11-28', '2026-12-01')).toBe(4);
  });
});
