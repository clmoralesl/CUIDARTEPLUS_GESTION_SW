import { PERMISOS, tienePermiso, textoRestriccion, type Permiso } from '@cuidarte/core';
import { useSesion } from './proveedor-sesion';

export function usePermisos() {
  const { rol } = useSesion();
  return {
    rol,
    puede: (permiso: Permiso) => tienePermiso(rol, permiso),
    motivo: (permiso: Permiso) => textoRestriccion(PERMISOS[permiso]),
  };
}
