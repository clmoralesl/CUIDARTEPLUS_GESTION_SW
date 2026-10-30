import { describe, expect, it } from 'vitest';
import { FERIADOS_CHILE, feriadosChileDesde } from './feriados-chile';

describe('feriados chile', () => {
  it('contiene 83 feriados unicos, validos y ordenados de 2026 a 2030', () => {
    expect(FERIADOS_CHILE.length).toBe(83);

    const fechas = FERIADOS_CHILE.map((f) => f.fecha);
    const conjunto = new Set(fechas);
    expect(conjunto.size).toBe(83);

    const ordenadas = [...fechas].sort();
    expect(fechas).toEqual(ordenadas);

    for (const f of FERIADOS_CHILE) {
      expect(f.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.descripcion.trim().length).toBeGreaterThan(0);
    }
  });

  it('cuenta con la distribucion exacta por ano', () => {
    const porAno = (ano: string) => FERIADOS_CHILE.filter((f) => f.fecha.startsWith(ano)).length;
    expect(porAno('2026')).toBe(16);
    expect(porAno('2027')).toBe(17);
    expect(porAno('2028')).toBe(16);
    expect(porAno('2029')).toBe(17);
    expect(porAno('2030')).toBe(17);
  });

  it('filtra feriados desde una fecha dada', () => {
    const desdeNov2026 = feriadosChileDesde('2026-11-02');
    expect(desdeNov2026.length).toBe(69);
    expect(desdeNov2026[0]).toEqual({
      fecha: '2026-12-08',
      descripcion: 'Inmaculada Concepción',
    });

    const futuro = feriadosChileDesde('2031-01-01');
    expect(futuro).toEqual([]);
  });
});
