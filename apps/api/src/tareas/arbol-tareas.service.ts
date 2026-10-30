import { Injectable } from '@nestjs/common';
import { Prisma, type Tarea } from '@prisma/client';
import {
  avancePonderado,
  calcularFinPlan,
  consolidarArbol,
  dateAFechaIso,
  fechaIsoADate,
  numerarArbol,
  ordenarPreorden,
  type ArbolTareas,
  type DatosConsolidables,
} from '@autofix/core';
import { PrismaService } from '../prisma/prisma.service';
import { aTareaArbol } from './tareas.mapeo';

@Injectable()
export class ArbolTareasService {
  constructor(private readonly prisma: PrismaService) {}

  async cargar(
    tx: Prisma.TransactionClient = this.prisma,
    proyectoId: number,
  ): Promise<ArbolTareas> {
    const tareas = await tx.tarea.findMany({ where: { proyectoId } });
    if (tareas.length === 0) {
      return { proyectoId, porcentajeAvanceProyecto: 0, tareas: [] };
    }

    const ordenadas = ordenarPreorden(tareas);
    const padresConHijas = new Set(
      tareas.map((t) => t.padreId).filter((id): id is number => id !== null),
    );
    const etapas = tareas.filter((t) => t.padreId === null);
    const porcentajeAvanceProyecto = avancePonderado(
      etapas.map((e) => ({
        avance: Number(e.porcentajeAvance),
        duracion: e.duracionDias,
      })),
    );

    return {
      proyectoId,
      porcentajeAvanceProyecto,
      tareas: ordenadas.map((t) => aTareaArbol(t, padresConHijas.has(t.id))),
    };
  }

  async reorganizar(tx: Prisma.TransactionClient, proyectoId: number): Promise<ArbolTareas> {
    const tareas = await tx.tarea.findMany({ where: { proyectoId } });
    if (tareas.length === 0) {
      return { proyectoId, porcentajeAvanceProyecto: 0, tareas: [] };
    }

    const padresConHijas = new Set(
      tareas.map((t) => t.padreId).filter((id): id is number => id !== null),
    );
    const numeracion = numerarArbol(tareas);

    const datosParaConsolidar: DatosConsolidables[] = tareas.map((t) => {
      const tieneHijas = padresConHijas.has(t.id);
      const inicioIso = t.inicioPlan ? dateAFechaIso(t.inicioPlan) : null;
      const finGuardado = t.finPlan ? dateAFechaIso(t.finPlan) : null;
      const finIso = tieneHijas
        ? finGuardado
        : inicioIso
          ? calcularFinPlan(inicioIso, t.duracionDias)
          : null;
      return {
        id: t.id,
        padreId: t.padreId,
        duracionDias: t.duracionDias,
        inicioPlan: inicioIso,
        finPlan: finIso,
        inicioReal: t.inicioReal ? dateAFechaIso(t.inicioReal) : null,
        finReal: t.finReal ? dateAFechaIso(t.finReal) : null,
        porcentajeAvance: Number(t.porcentajeAvance),
      };
    });

    const consolidadas = consolidarArbol(datosParaConsolidar);
    const mapaConsolidadas = new Map(consolidadas.map((c) => [c.id, c]));

    const filasQueCambian: { id: number; datos: Prisma.TareaUpdateInput }[] = [];
    const filasCambioCodigo: { id: number }[] = [];

    const tareasActualizadasEnMemoria: Tarea[] = [];

    for (const t of tareas) {
      const num = numeracion.get(t.id);
      const nuevoCodigo = num ? num.codigo : t.codigo;
      const nuevoOrden = num ? num.orden : t.orden;
      const cons = mapaConsolidadas.get(t.id);

      const nuevaDuracion = cons ? cons.duracionDias : t.duracionDias;
      const nuevoInicioPlanIso = cons ? cons.inicioPlan : null;
      const nuevoFinPlanIso = cons ? cons.finPlan : null;
      const nuevoInicioRealIso = cons ? cons.inicioReal : null;
      const nuevoFinRealIso = cons ? cons.finReal : null;
      const nuevoAvance = cons ? cons.porcentajeAvance : Number(t.porcentajeAvance);

      const actualInicioPlanIso = t.inicioPlan ? dateAFechaIso(t.inicioPlan) : null;
      const actualFinPlanIso = t.finPlan ? dateAFechaIso(t.finPlan) : null;
      const actualInicioRealIso = t.inicioReal ? dateAFechaIso(t.inicioReal) : null;
      const actualFinRealIso = t.finReal ? dateAFechaIso(t.finReal) : null;
      const actualAvance = Number(t.porcentajeAvance);

      const cambioCodigo = nuevoCodigo !== t.codigo;
      const cambioOrden = nuevoOrden !== t.orden;
      const cambioDuracion = nuevaDuracion !== t.duracionDias;
      const cambioInicioPlan = nuevoInicioPlanIso !== actualInicioPlanIso;
      const cambioFinPlan = nuevoFinPlanIso !== actualFinPlanIso;
      const cambioInicioReal = nuevoInicioRealIso !== actualInicioRealIso;
      const cambioFinReal = nuevoFinRealIso !== actualFinRealIso;
      const cambioAvance = nuevoAvance !== actualAvance;

      const cambio =
        cambioCodigo ||
        cambioOrden ||
        cambioDuracion ||
        cambioInicioPlan ||
        cambioFinPlan ||
        cambioInicioReal ||
        cambioFinReal ||
        cambioAvance;

      const nuevoInicioPlanDate = nuevoInicioPlanIso ? fechaIsoADate(nuevoInicioPlanIso) : null;
      const nuevoFinPlanDate = nuevoFinPlanIso ? fechaIsoADate(nuevoFinPlanIso) : null;
      const nuevoInicioRealDate = nuevoInicioRealIso ? fechaIsoADate(nuevoInicioRealIso) : null;
      const nuevoFinRealDate = nuevoFinRealIso ? fechaIsoADate(nuevoFinRealIso) : null;

      if (cambioCodigo) {
        filasCambioCodigo.push({ id: t.id });
      }

      if (cambio) {
        filasQueCambian.push({
          id: t.id,
          datos: {
            codigo: nuevoCodigo,
            orden: nuevoOrden,
            duracionDias: nuevaDuracion,
            inicioPlan: nuevoInicioPlanDate,
            finPlan: nuevoFinPlanDate,
            inicioReal: nuevoInicioRealDate,
            finReal: nuevoFinRealDate,
            porcentajeAvance: new Prisma.Decimal(nuevoAvance),
          },
        });
      }

      tareasActualizadasEnMemoria.push({
        ...t,
        codigo: nuevoCodigo,
        orden: nuevoOrden,
        duracionDias: nuevaDuracion,
        inicioPlan: nuevoInicioPlanDate,
        finPlan: nuevoFinPlanDate,
        inicioReal: nuevoInicioRealDate,
        finReal: nuevoFinRealDate,
        porcentajeAvance: new Prisma.Decimal(nuevoAvance),
      });
    }

    for (const fila of filasCambioCodigo) {
      await tx.tarea.update({
        where: { id: fila.id },
        data: { codigo: `~${fila.id}` },
      });
    }

    for (const fila of filasQueCambian) {
      await tx.tarea.update({
        where: { id: fila.id },
        data: fila.datos,
      });
    }

    const ordenadas = ordenarPreorden(tareasActualizadasEnMemoria);
    const etapas = consolidadas.filter((c) => c.padreId === null);
    const porcentajeAvanceProyecto = avancePonderado(
      etapas.map((e) => ({
        avance: e.porcentajeAvance,
        duracion: e.duracionDias,
      })),
    );

    return {
      proyectoId,
      porcentajeAvanceProyecto,
      tareas: ordenadas.map((t) => aTareaArbol(t, padresConHijas.has(t.id))),
    };
  }
}
