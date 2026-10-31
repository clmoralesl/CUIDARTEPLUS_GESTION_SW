import { TIPOS_DEPENDENCIA, type TipoDependencia } from './cronograma';
import { z } from './validacion';

export const DESFASE_MAXIMO_DIAS = 365;

export const NOMBRES_TIPO_DEPENDENCIA: Record<TipoDependencia, string> = {
  FS: 'Fin a inicio',
  SS: 'Inicio a inicio',
  FF: 'Fin a fin',
  SF: 'Inicio a fin',
};

export interface DependenciaTarea {
  id: number;
  predecesoraId: number;
  sucesoraId: number;
  tipo: TipoDependencia;
  desfaseDias: number;
}

const idTarea = (campo: string) =>
  z
    .number({ error: `El identificador de la ${campo} debe ser numérico.` })
    .int(`El identificador de la ${campo} debe ser un número entero.`)
    .positive(`El identificador de la ${campo} debe ser positivo.`);

export const esquemaCrearDependencia = z
  .object({
    predecesoraId: idTarea('predecesora'),
    sucesoraId: idTarea('sucesora'),
    tipo: z
      .enum(TIPOS_DEPENDENCIA, { error: 'Seleccione un tipo válido: FS, SS, FF o SF.' })
      .default('FS'),
    desfaseDias: z
      .number({ error: 'Ingrese el desfase en días hábiles.' })
      .int('El desfase debe ser un número entero.')
      .min(
        -DESFASE_MAXIMO_DIAS,
        `El desfase no puede ser menor a -${DESFASE_MAXIMO_DIAS} días hábiles.`,
      )
      .max(DESFASE_MAXIMO_DIAS, `El desfase no puede superar ${DESFASE_MAXIMO_DIAS} días hábiles.`)
      .default(0),
  })
  .strict()
  .refine((datos) => datos.predecesoraId !== datos.sucesoraId, {
    message: 'Una tarea no puede depender de sí misma.',
    path: ['predecesoraId'],
    when: (carga) => carga.issues.length === 0,
  });

export type CrearDependencia = z.infer<typeof esquemaCrearDependencia>;

export function formatearDesfase(desfaseDias: number): string {
  if (desfaseDias === 0) return '';
  return desfaseDias > 0 ? ` +${desfaseDias}` : ` ${desfaseDias}`;
}

export function describirDependencia(
  predecesora: string,
  sucesora: string,
  tipo: TipoDependencia,
  desfaseDias: number,
): string {
  return `${predecesora} → ${sucesora} (${tipo}${formatearDesfase(desfaseDias)})`;
}

export function sucesorasTransitivas(
  dependencias: readonly Pick<DependenciaTarea, 'predecesoraId' | 'sucesoraId'>[],
  tareaId: number,
): Set<number> {
  const salientes = new Map<number, number[]>();
  for (const d of dependencias) {
    salientes.set(d.predecesoraId, [...(salientes.get(d.predecesoraId) ?? []), d.sucesoraId]);
  }
  const visitadas = new Set<number>();
  const pendientes = [tareaId];
  for (let actual = pendientes.pop(); actual !== undefined; actual = pendientes.pop()) {
    for (const sucesora of salientes.get(actual) ?? []) {
      if (visitadas.has(sucesora)) continue;
      visitadas.add(sucesora);
      pendientes.push(sucesora);
    }
  }
  return visitadas;
}

export function predecesorasDisponibles<T extends { id: number; tieneHijas: boolean }>(
  tareas: readonly T[],
  dependencias: readonly Pick<DependenciaTarea, 'predecesoraId' | 'sucesoraId'>[],
  tareaId: number,
): T[] {
  const excluidas = sucesorasTransitivas(dependencias, tareaId);
  excluidas.add(tareaId);
  for (const d of dependencias) {
    if (d.sucesoraId === tareaId) excluidas.add(d.predecesoraId);
  }
  return tareas.filter((t) => !t.tieneHijas && !excluidas.has(t.id));
}
