import { validar, type Esquema } from '@autofix/core';

export function validadorFormulario<T>(esquema: Esquema<T>) {
  return (valores: unknown): Record<string, string> => {
    const resultado = validar(esquema, valores);
    if (resultado.ok) return {};
    const errores: Record<string, string> = {};
    for (const { campo, mensaje } of resultado.detalles) errores[campo] ??= mensaje;
    return errores;
  };
}

export function cargarErroresServidor(
  form: { setErrors: (errores: Record<string, string>) => void },
  error: unknown,
): void {
  if (
    error &&
    typeof error === 'object' &&
    'cuerpo' in error &&
    error.cuerpo &&
    typeof error.cuerpo === 'object' &&
    'detalles' in error.cuerpo &&
    Array.isArray(error.cuerpo.detalles)
  ) {
    const errores: Record<string, string> = {};
    for (const det of error.cuerpo.detalles as Array<{ campo: string; mensaje: string }>) {
      errores[det.campo] = det.mensaje;
    }
    form.setErrors(errores);
  }
}
