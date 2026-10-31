import { HttpStatus, Injectable } from '@nestjs/common';
import { AccionBitacora, Prisma } from '@prisma/client';
import {
  dateAFechaIso,
  fechaIsoADate,
  type ActualizarHito,
  type CrearHito,
  type ListaHitos,
  type Rol,
} from '@autofix/core';
import { BitacoraService } from '../comun/bitacora/bitacora.service';
import { diferencias } from '../comun/bitacora/diferencias';
import { ExcepcionApi } from '../comun/errores/excepcion-api';
import { Reloj } from '../comun/reloj/reloj';
import { PrismaService } from '../prisma/prisma.service';
import { errorProyectoNoEncontrado, obtenerProyectoAbierto } from '../proyectos/proyecto-abierto';
import { cargarCalendarioLaboral } from '../calendario/calendario-laboral';
import { construirListaHitos } from './hitos.mapeo';

export const errorHitoNoEncontrado = () =>
  new ExcepcionApi(HttpStatus.NOT_FOUND, 'REGISTRO_NO_ENCONTRADO', 'El hito no existe.');

const CAMPOS_EDITABLES_HITO = [
  'nombre',
  'fechaObjetivo',
  'tareaId',
  'criterio',
  'responsable',
  'fechaCumplimiento',
] as const;

@Injectable()
export class HitosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
    private readonly reloj: Reloj,
  ) {}

  async listar(proyectoId: number): Promise<ListaHitos> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true },
    });
    if (!proyecto) throw errorProyectoNoEncontrado();

    const hitos = await this.prisma.hito.findMany({ where: { proyectoId } });
    const tareas = await this.prisma.tarea.findMany({ where: { proyectoId } });
    const calendario = await cargarCalendarioLaboral(this.prisma, proyectoId);

    return construirListaHitos(
      proyectoId,
      hitos,
      new Map(tareas.map((t) => [t.id, t])),
      calendario,
      this.reloj.hoy(),
    );
  }

  async crear(proyectoId: number, datos: CrearHito, rol: Rol): Promise<ListaHitos> {
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });

        if (datos.tareaId !== undefined && datos.tareaId !== null) {
          const tarea = await tx.tarea.findFirst({
            where: { id: datos.tareaId, proyectoId },
          });
          if (!tarea) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'VALIDACION_FALLIDA',
              'La tarea no existe en este proyecto.',
              [{ campo: 'tareaId', mensaje: 'La tarea no existe en este proyecto.' }],
            );
          }
        }

        if (datos.fechaCumplimiento !== undefined && datos.fechaCumplimiento !== null) {
          if (datos.fechaCumplimiento > this.reloj.hoy()) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'VALIDACION_FALLIDA',
              'La fecha de cumplimiento no puede ser posterior a hoy.',
              [
                {
                  campo: 'fechaCumplimiento',
                  mensaje: 'La fecha de cumplimiento no puede ser posterior a hoy.',
                },
              ],
            );
          }
        }

        const creado = await tx.hito.create({
          data: {
            proyectoId,
            nombre: datos.nombre,
            fechaObjetivo: fechaIsoADate(datos.fechaObjetivo),
            tareaId: datos.tareaId ?? null,
            criterio: datos.criterio ?? null,
            responsable: datos.responsable ?? null,
            fechaCumplimiento: datos.fechaCumplimiento
              ? fechaIsoADate(datos.fechaCumplimiento)
              : null,
          },
        });

        await this.bitacora.registrarCreacion(
          tx,
          {
            proyectoId,
            entidad: 'Hito',
            entidadId: creado.id,
            rol,
          },
          {
            nombre: creado.nombre,
            fechaObjetivo: dateAFechaIso(creado.fechaObjetivo),
            tareaId: creado.tareaId,
            criterio: creado.criterio,
            responsable: creado.responsable,
            fechaCumplimiento: creado.fechaCumplimiento
              ? dateAFechaIso(creado.fechaCumplimiento)
              : null,
          },
        );

        return this.construirLista(tx, proyectoId);
      },
      { timeout: 15_000 },
    );
  }

  async actualizar(hitoId: number, datos: ActualizarHito, rol: Rol): Promise<ListaHitos> {
    return this.prisma.$transaction(
      async (tx) => {
        const referencia = await tx.hito.findUnique({
          where: { id: hitoId },
          select: { proyectoId: true },
        });
        if (!referencia) throw errorHitoNoEncontrado();
        await obtenerProyectoAbierto(tx, referencia.proyectoId, { bloquear: true });
        const hito = await tx.hito.findUnique({ where: { id: hitoId } });
        if (!hito) throw errorHitoNoEncontrado();

        if (datos.tareaId !== undefined && datos.tareaId !== null) {
          const tarea = await tx.tarea.findFirst({
            where: { id: datos.tareaId, proyectoId: hito.proyectoId },
          });
          if (!tarea) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'VALIDACION_FALLIDA',
              'La tarea no existe en este proyecto.',
              [{ campo: 'tareaId', mensaje: 'La tarea no existe en este proyecto.' }],
            );
          }
        }

        if (datos.fechaCumplimiento !== undefined && datos.fechaCumplimiento !== null) {
          if (datos.fechaCumplimiento > this.reloj.hoy()) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'VALIDACION_FALLIDA',
              'La fecha de cumplimiento no puede ser posterior a hoy.',
              [
                {
                  campo: 'fechaCumplimiento',
                  mensaje: 'La fecha de cumplimiento no puede ser posterior a hoy.',
                },
              ],
            );
          }
        }

        const datosActualizar: Prisma.HitoUncheckedUpdateInput = {};
        if (datos.nombre !== undefined) datosActualizar.nombre = datos.nombre;
        if (datos.fechaObjetivo !== undefined)
          datosActualizar.fechaObjetivo = fechaIsoADate(datos.fechaObjetivo);
        if (datos.tareaId !== undefined) datosActualizar.tareaId = datos.tareaId;
        if (datos.criterio !== undefined) datosActualizar.criterio = datos.criterio;
        if (datos.responsable !== undefined) datosActualizar.responsable = datos.responsable;
        if (datos.fechaCumplimiento !== undefined) {
          datosActualizar.fechaCumplimiento = datos.fechaCumplimiento
            ? fechaIsoADate(datos.fechaCumplimiento)
            : null;
        }

        const antes = hito;
        const despues = await tx.hito.update({
          where: { id: hitoId },
          data: datosActualizar,
        });

        const cambios = diferencias(
          antes,
          despues,
          CAMPOS_EDITABLES_HITO.filter((c) => c in datos),
        );
        if (cambios.length > 0) {
          await this.bitacora.registrarCambios(
            tx,
            {
              proyectoId: hito.proyectoId,
              entidad: 'Hito',
              entidadId: hitoId,
              rol,
            },
            AccionBitacora.ACTUALIZAR,
            cambios,
          );
        }

        return this.construirLista(tx, hito.proyectoId);
      },
      { timeout: 15_000 },
    );
  }

  async eliminar(hitoId: number, rol: Rol): Promise<ListaHitos> {
    return this.prisma.$transaction(
      async (tx) => {
        const referencia = await tx.hito.findUnique({
          where: { id: hitoId },
          select: { proyectoId: true },
        });
        if (!referencia) throw errorHitoNoEncontrado();
        await obtenerProyectoAbierto(tx, referencia.proyectoId, { bloquear: true });
        const hito = await tx.hito.findUnique({ where: { id: hitoId } });
        if (!hito) throw errorHitoNoEncontrado();

        await tx.hito.delete({ where: { id: hitoId } });

        await this.bitacora.registrarEliminacion(
          tx,
          {
            proyectoId: hito.proyectoId,
            entidad: 'Hito',
            entidadId: hitoId,
            rol,
          },
          {
            nombre: hito.nombre,
            fechaObjetivo: dateAFechaIso(hito.fechaObjetivo),
            tareaId: hito.tareaId,
            criterio: hito.criterio,
            responsable: hito.responsable,
            fechaCumplimiento: hito.fechaCumplimiento
              ? dateAFechaIso(hito.fechaCumplimiento)
              : null,
          },
        );

        return this.construirLista(tx, hito.proyectoId);
      },
      { timeout: 15_000 },
    );
  }

  private async construirLista(
    tx: Prisma.TransactionClient,
    proyectoId: number,
  ): Promise<ListaHitos> {
    const hitos = await tx.hito.findMany({ where: { proyectoId } });
    const tareas = await tx.tarea.findMany({ where: { proyectoId } });
    const calendario = await cargarCalendarioLaboral(tx, proyectoId);
    return construirListaHitos(
      proyectoId,
      hitos,
      new Map(tareas.map((t) => [t.id, t])),
      calendario,
      this.reloj.hoy(),
    );
  }
}
