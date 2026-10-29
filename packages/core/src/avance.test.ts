import { describe, expect, it } from 'vitest';
import { avancePonderado } from './avance';

describe('avance', () => {
  it('retorna 0 si la lista de elementos esta vacia', () => {
    expect(avancePonderado([])).toBe(0);
  });

  it('calcula promedio simple si la duracion total es cero', () => {
    expect(
      avancePonderado([
        { avance: 50, duracion: 0 },
        { avance: 100, duracion: 0 },
      ]),
    ).toBe(75);
  });

  it('calcula promedio ponderado por duracion redondeado a dos decimales', () => {
    expect(
      avancePonderado([
        { avance: 50, duracion: 10 },
        { avance: 100, duracion: 30 },
      ]),
    ).toBe(87.5);

    expect(
      avancePonderado([
        { avance: 33.33, duracion: 1 },
        { avance: 66.67, duracion: 2 },
      ]),
    ).toBe(55.56);
  });
});
