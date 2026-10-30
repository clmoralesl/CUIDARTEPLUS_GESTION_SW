export const APP_NOMBRE = 'AutoFix Gestión';

export const TIPOS_DEPENDENCIA = ['FS', 'SS', 'FF', 'SF'] as const;
export type TipoDependencia = (typeof TIPOS_DEPENDENCIA)[number];

export { redondear } from './numeros';
export * from './validacion';
export * from './roles';
export * from './errores';
export * from './formato';
export * from './fechas';
export * from './montos';
export * from './avance';
export * from './texto';
export * from './proyectos';
export * from './planificacion';
export * from './arbol';
export * from './consolidacion';
export * from './tareas';
