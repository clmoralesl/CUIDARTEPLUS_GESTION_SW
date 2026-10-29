import {
  PERMISOS,
  textoRestriccion,
  tienePermiso,
  type EstadoProyecto,
  type Permiso,
} from '@autofix/core';
import { useSesion } from './proveedor-sesion';

export function usePermisos() {
  const { rol } = useSesion();

  const puede = (permiso: Permiso, estadoProyecto?: EstadoProyecto): boolean => {
    if (!tienePermiso(rol, permiso)) return false;
    if (estadoProyecto === 'CERRADO') return false;
    return true;
  };

  const motivoBloqueo = (permiso: Permiso, estadoProyecto?: EstadoProyecto): string | null => {
    if (!tienePermiso(rol, permiso)) {
      return textoRestriccion(PERMISOS[permiso]);
    }
    if (estadoProyecto === 'CERRADO') {
      return 'El proyecto está cerrado';
    }
    return null;
  };

  return {
    rol,
    puede,
    motivo: (permiso: Permiso) => textoRestriccion(PERMISOS[permiso]),
    motivoBloqueo,
  };
}
