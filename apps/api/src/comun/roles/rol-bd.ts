import { RolUsuario } from '@prisma/client';
import type { Rol } from '@autofix/core';

export const ROL_BD = {
  JP: RolUsuario.JEFE_PROYECTO,
  CC: RolUsuario.COMITE_CAMBIOS,
} as const satisfies Record<Rol, RolUsuario>;
