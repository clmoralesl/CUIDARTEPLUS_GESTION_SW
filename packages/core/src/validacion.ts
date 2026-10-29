import { z } from 'zod';

z.config(z.locales.es());

export { z };

export type Esquema<T> = z.ZodType<T>;

export interface DetalleCampo {
  campo: string;
  mensaje: string;
}

export type ResultadoValidacion<T> =
  { ok: true; datos: T } | { ok: false; detalles: DetalleCampo[] };

export function validar<T>(esquema: Esquema<T>, valor: unknown): ResultadoValidacion<T> {
  const resultado = esquema.safeParse(valor);
  if (resultado.success) return { ok: true, datos: resultado.data };
  return {
    ok: false,
    detalles: resultado.error.issues.map((problema) => ({
      campo: problema.path.map(String).join('.') || '(raíz)',
      mensaje: problema.message,
    })),
  };
}
