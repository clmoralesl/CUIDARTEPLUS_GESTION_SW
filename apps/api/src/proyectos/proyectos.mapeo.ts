import type { Proyecto } from '@prisma/client';
import {
  dateAFechaIso,
  type EstadoProyecto,
  type ProyectoDetalle,
  type ProyectoResumen,
} from '@autofix/core';

export function mapearProyectoResumen(
  proyecto: Proyecto,
  porcentajeAvance: number,
): ProyectoResumen {
  return {
    id: proyecto.id,
    nombre: proyecto.nombre,
    responsable: proyecto.responsable,
    presupuesto: Number(proyecto.presupuesto),
    fechaInicio: dateAFechaIso(proyecto.fechaInicio),
    fechaFin: proyecto.fechaFin ? dateAFechaIso(proyecto.fechaFin) : null,
    estado: proyecto.estado as EstadoProyecto,
    porcentajeAvance,
    creadoEn: proyecto.creadoEn.toISOString(),
    actualizadoEn: proyecto.actualizadoEn.toISOString(),
  };
}

export function mapearProyectoDetalle(
  proyecto: Proyecto,
  porcentajeAvance: number,
  numeroTareas: number,
): ProyectoDetalle {
  return {
    ...mapearProyectoResumen(proyecto, porcentajeAvance),
    descripcion: proyecto.descripcion,
    numeroTareas,
  };
}
