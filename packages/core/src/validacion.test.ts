import { describe, expect, it } from 'vitest';
import { validar, z } from './validacion';

describe('validacion', () => {
  const esquemaPrueba = z.object({
    nombre: z.string().min(1),
    edad: z.number().int().positive(),
  });

  it('valida datos correctos exitosamente', () => {
    const entrada = { nombre: 'Proyecto Test', edad: 25 };
    const resultado = validar(esquemaPrueba, entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos).toEqual(entrada);
    }
  });

  it('retorna detalles con campo y mensaje en espanol ante errores', () => {
    const entrada = { nombre: '', edad: -5 };
    const resultado = validar(esquemaPrueba, entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.detalles.length).toBeGreaterThan(0);
      expect(resultado.detalles.some((d) => d.campo === 'nombre')).toBe(true);
      expect(resultado.detalles.some((d) => d.campo === 'edad')).toBe(true);
    }
  });

  it('asigna (raíz) al campo cuando el error ocurre en la raíz', () => {
    const esquemaRaiz = z.string();
    const resultado = validar(esquemaRaiz, 123);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.detalles[0].campo).toBe('(raíz)');
      expect(resultado.detalles[0].mensaje).toBeTruthy();
    }
  });
});
