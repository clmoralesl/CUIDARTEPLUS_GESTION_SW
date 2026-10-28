import { describe, expect, it } from 'vitest';
import { redondear } from './numeros';

describe('redondear', () => {
  it('redondea a 2 decimales por defecto', () => {
    expect(redondear(1.005)).toBe(1.01);
    expect(redondear(2.344)).toBe(2.34);
  });

  it('acepta otra cantidad de decimales', () => {
    expect(redondear(3.14159, 3)).toBe(3.142);
    expect(redondear(7.5, 0)).toBe(8);
  });
});
