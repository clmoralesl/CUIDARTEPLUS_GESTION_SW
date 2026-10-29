process.env.TZ = 'America/Santiago';

import { describe, expect, it } from 'vitest';
import { formatearFecha, formatearFechaHora, formatearMonto, SIN_DATO } from './formato';

describe('formato', () => {
  it('formatea fechas sin verse afectada por zona horaria local', () => {
    expect(formatearFecha('2026-10-29')).toBe('29-10-2026');
    expect(formatearFecha('2026-10-29T00:00:00.000Z')).toBe('29-10-2026');
    expect(formatearFecha(new Date('2026-10-29T00:00:00.000Z'))).toBe('29-10-2026');
    expect(formatearFecha(null)).toBe(SIN_DATO);
    expect(formatearFecha('')).toBe(SIN_DATO);
    expect(formatearFecha(undefined)).toBe(SIN_DATO);
    expect(formatearFecha('fecha-invalida')).toBe(SIN_DATO);
  });

  it('formatea fecha y hora con zona America/Santiago', () => {
    expect(formatearFechaHora('2026-10-29T15:30:00.000Z')).toBe('29-10-2026 12:30');
    expect(formatearFechaHora(new Date('2026-10-29T15:30:00.000Z'))).toBe('29-10-2026 12:30');
    expect(formatearFechaHora(null)).toBe(SIN_DATO);
    expect(formatearFechaHora('')).toBe(SIN_DATO);
    expect(formatearFechaHora('invalido')).toBe(SIN_DATO);
  });

  it('formatea montos en CLP con separadores de miles y sin decimales', () => {
    expect(formatearMonto(1250000)).toBe('$1.250.000');
    expect(formatearMonto('1250000.00')).toBe('$1.250.000');
    expect(formatearMonto(0)).toBe('$0');
    expect(formatearMonto(-0.4)).toBe('$0');
    expect(formatearMonto(-1250000)).toBe('$-1.250.000');
    expect(formatearMonto(null)).toBe(SIN_DATO);
    expect(formatearMonto(undefined)).toBe(SIN_DATO);
    expect(formatearMonto('')).toBe(SIN_DATO);
    expect(formatearMonto('abc')).toBe(SIN_DATO);
  });
});
