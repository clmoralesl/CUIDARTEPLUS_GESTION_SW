import { esquemaRol, type Rol } from '@autofix/core';

export const CLAVE_ROL = 'autofix:rol';
export const CLAVE_PROYECTO = 'autofix:proyecto-activo';
export const ROL_POR_DEFECTO: Rol = 'JP';

export function interpretarRol(valor: string | null | undefined): Rol {
  const resultado = esquemaRol.safeParse(valor);
  return resultado.success ? resultado.data : ROL_POR_DEFECTO;
}

export function interpretarProyecto(valor: string | null | undefined): number | null {
  const numero = Number(valor);
  return valor && Number.isInteger(numero) && numero > 0 ? numero : null;
}

export function leerRol(): Rol {
  try {
    return interpretarRol(localStorage.getItem(CLAVE_ROL));
  } catch {
    return ROL_POR_DEFECTO;
  }
}
