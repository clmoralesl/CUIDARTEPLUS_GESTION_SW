import { diasHabilesEntre, type CalendarioLaboral } from './calendario';
import { esquemaFechaIso } from './fechas';
import { z } from './validacion';

export const ESTADOS_HITO = ['CUMPLIDO', 'ATRASADO', 'EN_RIESGO', 'PENDIENTE'] as const;
export type EstadoHito = (typeof ESTADOS_HITO)[number];

export const NOMBRES_ESTADO_HITO: Record<EstadoHito, string> = {
  CUMPLIDO: 'Cumplido',
  ATRASADO: 'Atrasado',
  EN_RIESGO: 'En riesgo',
  PENDIENTE: 'Pendiente',
};

export const UMBRAL_DIAS_RIESGO = 5;
export const UMBRAL_AVANCE_RIESGO = 80;

export interface TareaVinculadaHito {
  finPlan: string | null;
  porcentajeAvance: number;
}

export interface DatosEstadoHito {
  fechaObjetivo: string;
  fechaCumplimiento: string | null;
  tarea: TareaVinculadaHito | null;
}

export interface EvaluacionHito {
  estado: EstadoHito;
  aTiempo: boolean | null;
  diasHabilesRestantes: number;
}

export function evaluarHito(
  hito: DatosEstadoHito,
  calendario: CalendarioLaboral,
  hoy: string,
): EvaluacionHito {
  const diasHabilesRestantes = diasHabilesEntre(hoy, hito.fechaObjetivo, calendario);
  if (hito.fechaCumplimiento !== null) {
    return {
      estado: 'CUMPLIDO',
      aTiempo: hito.fechaCumplimiento <= hito.fechaObjetivo,
      diasHabilesRestantes,
    };
  }
  const finTarea = hito.tarea?.finPlan ?? null;
  const vencido = hoy > hito.fechaObjetivo;
  const tareaTardia = finTarea !== null && finTarea > hito.fechaObjetivo;
  if (vencido || tareaTardia) return { estado: 'ATRASADO', aTiempo: false, diasHabilesRestantes };
  const avance = hito.tarea?.porcentajeAvance ?? 0;
  if (diasHabilesRestantes <= UMBRAL_DIAS_RIESGO && avance < UMBRAL_AVANCE_RIESGO) {
    return { estado: 'EN_RIESGO', aTiempo: null, diasHabilesRestantes };
  }
  return { estado: 'PENDIENTE', aTiempo: null, diasHabilesRestantes };
}

export interface TareaDeHito extends TareaVinculadaHito {
  id: number;
  codigo: string;
  nombre: string;
}

export interface HitoConEstado extends EvaluacionHito {
  id: number;
  proyectoId: number;
  nombre: string;
  criterio: string | null;
  responsable: string | null;
  fechaObjetivo: string;
  fechaCumplimiento: string | null;
  tarea: TareaDeHito | null;
}

export interface ListaHitos {
  proyectoId: number;
  fechaCalculo: string;
  hitos: HitoConEstado[];
}

const textoObligatorio = (campo: string, maximo: number) =>
  z
    .string({ error: `Ingrese ${campo}.` })
    .trim()
    .min(1, `Ingrese ${campo}.`)
    .max(maximo, `Use como máximo ${maximo} caracteres.`);

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Use como máximo ${maximo} caracteres.`)
    .transform((texto) => (texto === '' ? null : texto))
    .nullable()
    .optional();

const esquemaFechaHito = esquemaFechaIso.refine(
  (fecha) => fecha >= '2000-01-01' && fecha <= '2100-12-31',
  'Ingrese una fecha entre los años 2000 y 2100.',
);

const esquemaIdTarea = z
  .number({ error: 'El identificador de la tarea debe ser numérico.' })
  .int('El identificador de la tarea debe ser un número entero.')
  .positive('El identificador de la tarea debe ser positivo.');

const camposHito = {
  nombre: textoObligatorio('el nombre', 160),
  fechaObjetivo: esquemaFechaHito,
  tareaId: esquemaIdTarea.nullable(),
  criterio: textoOpcional(2000),
  responsable: textoOpcional(120),
  fechaCumplimiento: esquemaFechaHito.nullable(),
};

export const esquemaCrearHito = z
  .object({
    ...camposHito,
    tareaId: camposHito.tareaId.optional(),
    fechaCumplimiento: camposHito.fechaCumplimiento.optional(),
  })
  .strict();

export type CrearHito = z.infer<typeof esquemaCrearHito>;

export const esquemaActualizarHito = z
  .object(camposHito)
  .strict()
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
    when: (carga) => carga.issues.length === 0,
  });

export type ActualizarHito = z.infer<typeof esquemaActualizarHito>;
