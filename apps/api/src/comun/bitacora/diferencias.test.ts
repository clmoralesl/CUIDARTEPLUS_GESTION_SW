import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { diferencias, normalizarValor } from './diferencias';

describe('diferencias', () => {
  it('normaliza Date a fecha ISO y Decimal a number', () => {
    expect(normalizarValor(new Date('2026-11-02T00:00:00.000Z'))).toBe('2026-11-02');
    expect(normalizarValor(new Prisma.Decimal('100.00'))).toBe(100);
    expect(normalizarValor(null)).toBeNull();
    expect(normalizarValor(undefined)).toBeNull();
    expect(normalizarValor('texto')).toBe('texto');
    expect(normalizarValor(123)).toBe(123);
    expect(normalizarValor(true)).toBe(true);
  });

  it('no registra diferencias cuando un Decimal y un number representan el mismo valor (caso 19)', () => {
    const antes = { presupuesto: new Prisma.Decimal('100.00') };
    const despues = { presupuesto: 100 };
    const difs = diferencias(antes, despues, ['presupuesto']);
    expect(difs).toEqual([]);
  });

  it('no registra diferencias cuando fechas Date y string representan el mismo dia (caso 20)', () => {
    const antes = { fechaInicio: new Date('2026-11-02T00:00:00.000Z') };
    const despues = { fechaInicio: new Date('2026-11-02T12:00:00.000Z') };
    const difs = diferencias(antes, despues, ['fechaInicio']);
    expect(difs).toEqual([]);
  });

  it('detecta cambio de descripcion de null a texto (caso 21)', () => {
    const antes = { descripcion: null };
    const despues = { descripcion: 'Nueva descripcion' };
    const difs = diferencias(antes, despues, ['descripcion']);
    expect(difs).toEqual([
      {
        campo: 'descripcion',
        anterior: null,
        nuevo: 'Nueva descripcion',
      },
    ]);
  });
});
