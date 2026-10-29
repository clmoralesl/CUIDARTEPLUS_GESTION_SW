import { RolUsuario } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { ROL_BD } from './rol-bd';

describe('ROL_BD', () => {
  it('tiene correspondencia biyectiva con RolUsuario de Prisma', () => {
    const valoresMapeados = Object.values(ROL_BD).sort();
    const valoresPrisma = Object.values(RolUsuario).sort();
    expect(valoresMapeados).toEqual(valoresPrisma);
  });
});
