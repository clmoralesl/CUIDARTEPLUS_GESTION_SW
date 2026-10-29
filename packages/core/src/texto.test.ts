import { describe, expect, it } from 'vitest';
import { coincideBusqueda, normalizarTexto } from './texto';

describe('texto', () => {
  it('normaliza texto removiendo tildes, mayusculas y espacios extremos', () => {
    expect(normalizarTexto('  Implementación Ágil  ')).toBe('implementacion agil');
    expect(normalizarTexto('Ñandú')).toBe('nandu');
  });

  it('coincide busqueda insensible a tildes, mayusculas y vacios', () => {
    expect(coincideBusqueda('Implementación AutoFix', 'IMPLEMENTACION')).toBe(true);
    expect(coincideBusqueda('AutoFix · Implementación', 'auto')).toBe(true);
    expect(coincideBusqueda('AutoFix', '')).toBe(true);
    expect(coincideBusqueda('AutoFix', '   ')).toBe(true);
    expect(coincideBusqueda('AutoFix', 'neumatico')).toBe(false);
  });
});
