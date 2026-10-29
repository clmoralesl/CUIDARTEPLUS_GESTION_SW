export const APP_NOMBRE = 'AutoFix Gestión';

export const NIVELES_TAREA = ['ETAPA', 'ACTIVIDAD', 'SUBACTIVIDAD'] as const;
export type NivelTarea = (typeof NIVELES_TAREA)[number];

export const TIPOS_DEPENDENCIA = ['FS', 'SS', 'FF', 'SF'] as const;
export type TipoDependencia = (typeof TIPOS_DEPENDENCIA)[number];

export { redondear } from './numeros';
export * from './validacion';
export * from './roles';
export * from './errores';
export * from './formato';
