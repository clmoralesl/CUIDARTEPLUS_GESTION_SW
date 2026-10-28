import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const ENTIDADES_ESPERADAS = [
  'Proyecto',
  'Calendario',
  'Feriado',
  'Tarea',
  'Dependencia',
  'Profesional',
  'TipoRecurso',
  'Recurso',
  'Asignacion',
  'RegistroAvance',
  'Hito',
  'LineaBase',
  'LineaBaseTarea',
  'KpiDefinicion',
  'KpiUmbral',
  'KpiMedicion',
  'Alerta',
  'SolicitudCambio',
  'EtapaCambio',
  'AccionCorrectiva',
  'Evidencia',
  'ImpactoCambio',
  'Bitacora',
];

const modelos = Prisma.dmmf.datamodel.models;

function campo(modelo: string, nombre: string) {
  return modelos.find((m) => m.name === modelo)?.fields.find((f) => f.name === nombre);
}

describe('modelo de datos', () => {
  it('define todas las entidades del sistema', () => {
    expect(modelos.map((m) => m.name).sort()).toEqual([...ENTIDADES_ESPERADAS].sort());
  });

  it('modela la jerarquía de tareas y los 4 tipos de dependencia', () => {
    const niveles = Prisma.dmmf.datamodel.enums.find((e) => e.name === 'NivelTarea');
    const tipos = Prisma.dmmf.datamodel.enums.find((e) => e.name === 'TipoDependencia');
    expect(niveles?.values.map((v) => v.name)).toEqual(['ETAPA', 'ACTIVIDAD', 'SUBACTIVIDAD']);
    expect(tipos?.values.map((v) => v.name)).toEqual(['FS', 'SS', 'FF', 'SF']);
    expect(campo('Tarea', 'padre')?.relationOnDelete).toBe('Cascade');
  });

  it('impide borrar profesionales y recursos con asignaciones', () => {
    expect(campo('Asignacion', 'profesional')?.relationOnDelete).toBe('Restrict');
    expect(campo('Asignacion', 'recurso')?.relationOnDelete).toBe('Restrict');
  });

  it('conserva líneas base e impactos si se borra la tarea', () => {
    expect(campo('LineaBaseTarea', 'tarea')?.relationOnDelete).toBe('SetNull');
    expect(campo('ImpactoCambio', 'tarea')?.relationOnDelete).toBe('SetNull');
  });
});
