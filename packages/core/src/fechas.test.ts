process.env.TZ = 'America/Santiago';

import { describe, expect, it } from 'vitest';
import {
  dateAFechaIso,
  esFechaIsoValida,
  esquemaFechaIso,
  fechaIsoADate,
  fechaLocalIso,
} from './fechas';
import { validar } from './validacion';

describe('fechas', () => {
  it('valida fechas en formato ISO AAAA-MM-DD incluyendo anio bisiesto', () => {
    expect(esFechaIsoValida('2026-11-02')).toBe(true);
    expect(esFechaIsoValida('2028-02-29')).toBe(true);
    expect(esFechaIsoValida('2026-02-29')).toBe(false);
    expect(esFechaIsoValida('2026-02-30')).toBe(false);
    expect(esFechaIsoValida('2026-13-01')).toBe(false);
    expect(esFechaIsoValida('30-02-2026')).toBe(false);
    expect(esFechaIsoValida('2026-1-1')).toBe(false);
    expect(esFechaIsoValida('')).toBe(false);
  });

  it('valida con esquemaFechaIso', () => {
    const ok = validar(esquemaFechaIso, '2026-11-02');
    expect(ok.ok).toBe(true);

    const errorFormato = validar(esquemaFechaIso, '2026-02-30');
    expect(errorFormato.ok).toBe(false);
    if (!errorFormato.ok) {
      expect(errorFormato.detalles[0].mensaje).toBe(
        'Ingrese una fecha válida con el formato AAAA-MM-DD.',
      );
    }
  });

  it('convierte entre fecha ISO y Date en UTC', () => {
    const fecha = fechaIsoADate('2026-11-02');
    expect(fecha.toISOString()).toBe('2026-11-02T00:00:00.000Z');
    expect(dateAFechaIso(fecha)).toBe('2026-11-02');
  });

  it('obtiene fecha local sin verse afectada por desfase UTC', () => {
    const fechaNoche = new Date(2026, 9, 29, 22, 0, 0);
    expect(fechaLocalIso(fechaNoche)).toBe('2026-10-29');
    expect(fechaNoche.toISOString().startsWith('2026-10-30')).toBe(true);
  });
});
