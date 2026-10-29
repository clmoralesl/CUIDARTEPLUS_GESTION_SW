import { esquemaCuerpoError, type CuerpoError } from '@autofix/core';
import { leerRol } from '../sesion/almacenamiento';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ErrorSolicitud extends Error {
  constructor(
    readonly estado: number,
    readonly cuerpo: CuerpoError,
  ) {
    super(cuerpo.mensaje);
    this.name = 'ErrorSolicitud';
  }
}

export async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const cabeceras = new Headers(opciones.headers);
  cabeceras.set('X-Rol', leerRol());
  if (typeof opciones.body === 'string') cabeceras.set('Content-Type', 'application/json');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras });
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw error;
    }
    throw new ErrorSolicitud(0, {
      codigo: 'SIN_CONEXION',
      error: 'Sin conexión',
      mensaje: `No se pudo conectar con la API (${API_URL}).`,
    });
  }

  if (respuesta.status === 204) return undefined as T;
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (respuesta.ok) return cuerpo as T;

  const error = esquemaCuerpoError.safeParse(cuerpo);
  throw new ErrorSolicitud(
    respuesta.status,
    error.success
      ? error.data
      : {
          codigo: 'RESPUESTA_INESPERADA',
          error: 'Error',
          mensaje: `La API respondió ${respuesta.status} sin un error reconocible.`,
        },
  );
}
