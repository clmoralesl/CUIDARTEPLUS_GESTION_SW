import { EstadoProyecto } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { ESTADOS_PROYECTO } from '@autofix/core';

describe('EstadoProyecto en BD vs Core', () => {
  it('el enum de Prisma coincide exactamente con los estados de Core', () => {
    const valoresPrisma = Object.values(EstadoProyecto).sort();
    const valoresCore = [...ESTADOS_PROYECTO].sort();
    expect(valoresCore).toEqual(valoresPrisma);
  });
});
