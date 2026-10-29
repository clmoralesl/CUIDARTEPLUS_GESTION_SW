import { esquemaFechaIso } from './fechas';
import { redondearMonto } from './montos';
import { z } from './validacion';

export const ESTADOS_PROYECTO = ['PLANIFICADO', 'EN_CURSO', 'CERRADO'] as const;
export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];

export const NOMBRES_ESTADO_PROYECTO: Record<EstadoProyecto, string> = {
  PLANIFICADO: 'Planificado',
  EN_CURSO: 'En curso',
  CERRADO: 'Cerrado',
};

export const TRANSICIONES_PROYECTO: Record<EstadoProyecto, readonly EstadoProyecto[]> = {
  PLANIFICADO: ['EN_CURSO'],
  EN_CURSO: ['CERRADO'],
  CERRADO: [],
};

export function puedeTransicionar(desde: EstadoProyecto, hacia: EstadoProyecto): boolean {
  return TRANSICIONES_PROYECTO[desde].includes(hacia);
}

export const PRESUPUESTO_MAXIMO = 999_999_999_999.99;

const textoObligatorio = (campo: string) =>
  z
    .string({ error: `Ingrese ${campo}.` })
    .trim()
    .min(1, `Ingrese ${campo}.`)
    .max(120, `Use como máximo 120 caracteres.`);

const camposProyecto = {
  nombre: textoObligatorio('el nombre'),
  descripcion: z
    .string()
    .trim()
    .max(2000, 'Use como máximo 2000 caracteres.')
    .transform((texto) => (texto === '' ? null : texto))
    .nullable()
    .optional(),
  responsable: textoObligatorio('el responsable'),
  presupuesto: z
    .number({ error: 'Ingrese el presupuesto.' })
    .min(0, 'El presupuesto no puede ser negativo.')
    .max(PRESUPUESTO_MAXIMO, 'El presupuesto supera el máximo permitido.')
    .refine((valor) => redondearMonto(valor) === valor, 'Use como máximo 2 decimales.'),
  fechaInicio: esquemaFechaIso,
  fechaFin: esquemaFechaIso.nullable().optional(),
};

export function fechasEnOrden(fechaInicio: string, fechaFin: string | null | undefined): boolean {
  return fechaFin === null || fechaFin === undefined || fechaFin >= fechaInicio;
}

const MENSAJE_FECHAS = 'La fecha de fin no puede ser anterior a la de inicio.';

export const esquemaCrearProyecto = z
  .strictObject(camposProyecto)
  .refine((datos) => fechasEnOrden(datos.fechaInicio, datos.fechaFin), {
    message: MENSAJE_FECHAS,
    path: ['fechaFin'],
  });

export const esquemaActualizarProyecto = z
  .strictObject(camposProyecto)
  .partial()
  .refine(
    (datos) => Object.keys(datos).length > 0,
    'Debe enviar al menos un campo para actualizar.',
  )
  .refine(
    (datos) => datos.fechaInicio === undefined || fechasEnOrden(datos.fechaInicio, datos.fechaFin),
    { message: MENSAJE_FECHAS, path: ['fechaFin'] },
  );

export type CrearProyecto = z.infer<typeof esquemaCrearProyecto>;
export type ActualizarProyecto = z.infer<typeof esquemaActualizarProyecto>;

export interface ProyectoResumen {
  id: number;
  nombre: string;
  responsable: string;
  presupuesto: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoProyecto;
  porcentajeAvance: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ProyectoDetalle extends ProyectoResumen {
  descripcion: string | null;
  numeroTareas: number;
}

export { MENSAJE_FECHAS };
