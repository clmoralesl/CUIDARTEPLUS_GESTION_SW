import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { avancePonderado, numerarArbol, ordenarPreorden, type ArbolTareas } from '@autofix/core';
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

  async numerar(tx: Prisma.TransactionClient, proyectoId: number): Promise<void> {
    const tareas = await tx.tarea.findMany({ where: { proyectoId } });
    if (tareas.length === 0) return;

    const numeracion = numerarArbol(tareas);
    const filasCambioCodigo: { id: number }[] = [];
    const filasQueCambian: { id: number; codigo: string; orden: number }[] = [];

    for (const t of tareas) {
      const num = numeracion.get(t.id);
      if (!num) continue;
      const cambioCodigo = num.codigo !== t.codigo;
      const cambioOrden = num.orden !== t.orden;
      if (cambioCodigo) {
        filasCambioCodigo.push({ id: t.id });
      }
      if (cambioCodigo || cambioOrden) {
        filasQueCambian.push({ id: t.id, codigo: num.codigo, orden: num.orden });
      }
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
        data: { codigo: fila.codigo, orden: fila.orden },
      });
    }
  }
}
