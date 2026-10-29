import { SetMetadata } from '@nestjs/common';
import type { Rol } from '@autofix/core';

export const METADATO_PUBLICO = 'publico';
export const METADATO_ROLES = 'roles';

export const Publico = () => SetMetadata(METADATO_PUBLICO, true);

export function Roles(...roles: Rol[]) {
  if (roles.length === 0) throw new Error('@Roles requiere al menos un rol');
  return SetMetadata(METADATO_ROLES, roles);
}
