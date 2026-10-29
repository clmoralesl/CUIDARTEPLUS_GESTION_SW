import { describe, expect, it } from 'vitest';
import { redondearMonto, sumarMontos } from './montos';

describe('montos', () => {
  it('redondea montos a dos decimales y corrige imprecisiones de punto flotante', () => {
    expect(redondearMonto(1250000.555)).toBe(1250000.56);
    expect(redondearMonto(1250000.5)).toBe(1250000.5);
    expect(redondearMonto(1.15)).toBe(1.15);
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(redondearMonto(0.1 + 0.2)).toBe(0.3);
  });

  it('suma montos redondeando el resultado final a dos decimales', () => {
    expect(sumarMontos([0.1, 0.2])).toBe(0.3);
    expect(sumarMontos([100.5, 200.25, 0.25])).toBe(301);
    expect(sumarMontos([])).toBe(0);
  });
});
