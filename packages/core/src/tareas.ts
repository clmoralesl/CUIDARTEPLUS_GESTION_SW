import { esquemaFechaIso } from './fechas';
import { tieneMaximoDecimales, z } from './validacion';

export const NIVELES_TAREA = ['ETAPA', 'ACTIVIDAD', 'SUBACTIVIDAD'] as const;
export type NivelTarea = (typeof NIVELES_TAREA)[number];

export const NOMBRES_NIVEL: Record<NivelTarea, string> = {
  ETAPA: 'Etapa',
  ACTIVIDAD: 'Actividad',
  SUBACTIVIDAD: 'Subactividad',
};

export const CAMPOS_CALCULADOS = [
  'duracionDias',
  'fechaFija',
  'inicioReal',
  'finReal',
  'porcentajeAvance',
] as const;

export const CAMPOS_EDITABLES = [
  'nombre',
  'descripcion',
  'responsable',
  'duracionDias',
  'fechaFija',
  'inicioReal',
  'finReal',
  'porcentajeAvance',
] as const;

export interface TareaArbol {
  id: number;
  padreId: number | null;
  nivel: NivelTarea;
  codigo: string;
  orden: number;
  nombre: string;
  descripcion: string | null;
  responsable: string | null;
  duracionDias: number;
  fechaFija: string | null;
  inicioPlan: string | null;
  finPlan: string | null;
  inicioTardio: string | null;
  finTardio: string | null;
  holguraDias: number | null;
  esCritica: boolean;
  inicioReal: string | null;
  finReal: string | null;
  porcentajeAvance: number;
  tieneHijas: boolean;
}

export interface ArbolTareas {
  proyectoId: number;
  porcentajeAvanceProyecto: number;
  tareas: TareaArbol[];
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

export const esquemaCrearTarea = z
  .object({
    nivel: z.enum(NIVELES_TAREA, { error: 'Seleccione un nivel válido.' }),
    padreId: z
      .number({ error: 'El identificador del padre debe ser numérico.' })
      .int('El identificador del padre debe ser un número entero.')
      .positive('El identificador del padre debe ser positivo.')
      .nullable(),
    nombre: textoObligatorio('el nombre', 200),
    descripcion: textoOpcional(2000),
    responsable: textoOpcional(120),
    duracionDias: z
      .number({ error: 'Ingrese la duración en días hábiles.' })
      .int('La duración debe ser un número entero.')
      .min(0, 'La duración no puede ser negativa.')
      .max(3650, 'La duración no puede superar 3650 días hábiles.')
      .default(1),
    fechaFija: esquemaFechaIso.nullable().optional(),
    posicion: z
      .number({ error: 'La posición debe ser numérica.' })
      .int('La posición debe ser un número entero.')
      .positive('La posición debe ser un número positivo.')
      .optional(),
  })
  .strict();

export type CrearTarea = z.infer<typeof esquemaCrearTarea>;

export const esquemaActualizarTarea = z
  .object({
    nombre: textoObligatorio('el nombre', 200),
    descripcion: textoOpcional(2000),
    responsable: textoOpcional(120),
    duracionDias: z
      .number({ error: 'Ingrese la duración en días hábiles.' })
      .int('La duración debe ser un número entero.')
      .min(0, 'La duración no puede ser negativa.')
      .max(3650, 'La duración no puede superar 3650 días hábiles.'),
    fechaFija: esquemaFechaIso.nullable(),
    inicioReal: esquemaFechaIso.nullable(),
    finReal: esquemaFechaIso.nullable(),
    porcentajeAvance: z
      .number({ error: 'Ingrese el porcentaje de avance.' })
      .min(0, 'El avance no puede ser menor a 0.')
      .max(100, 'El avance no puede ser mayor a 100.')
      .refine((v) => tieneMaximoDecimales(v, 2), 'Use como máximo 2 decimales.'),
  })
  .strict()
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar.',
    when: (carga) => carga.issues.length === 0,
  })
  .refine(
    (datos) => {
      if (datos.inicioReal && datos.finReal) {
        return datos.inicioReal <= datos.finReal;
      }
      return true;
    },
    {
      message: 'La fecha de fin real no puede ser anterior a la de inicio real.',
      path: ['finReal'],
    },
  );

export type ActualizarTarea = z.infer<typeof esquemaActualizarTarea>;

export const esquemaMoverTarea = z
  .object({
    padreId: z
      .number({ error: 'El identificador del padre debe ser numérico.' })
      .int('El identificador del padre debe ser un número entero.')
      .positive('El identificador del padre debe ser positivo.')
      .nullable(),
    posicion: z
      .number({ error: 'La posición debe ser numérica.' })
      .int('La posición debe ser un número entero.')
      .positive('La posición debe ser un número positivo.')
      .optional(),
  })
  .strict();

export type MoverTarea = z.infer<typeof esquemaMoverTarea>;
