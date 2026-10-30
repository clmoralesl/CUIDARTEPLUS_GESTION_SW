import { HttpStatus, Injectable } from '@nestjs/common';
import { AccionBitacora, Prisma } from '@prisma/client';
import {
  dateAFechaIso,
  fechaIsoADate,
  formatearFecha,
  type ActualizarCalendario,
  type CalendarioProyecto,
  type CrearFeriado,
  type RespuestaCalendario,
  type Rol,
} from '@autofix/core';
import { BitacoraService } from '../comun/bitacora/bitacora.service';
import { CambioCampo } from '../comun/bitacora/diferencias';
import { ExcepcionApi } from '../comun/errores/excepcion-api';
import { PrismaService } from '../prisma/prisma.service';
import { errorProyectoNoEncontrado, obtenerProyectoAbierto } from '../proyectos/proyecto-abierto';
import { ArbolTareasService } from '../tareas/arbol-tareas.service';
import { mapearCalendarioProyecto } from './calendario.mapeo';

@Injectable()
export class CalendarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arbol: ArbolTareasService,
    private readonly bitacora: BitacoraService,
  ) {}

  async obtener(proyectoId: number): Promise<CalendarioProyecto> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });
    if (!proyecto) throw errorProyectoNoEncontrado();

    const calendario = await this.prisma.calendario.findUnique({
      where: { proyectoId },
      include: {
        feriados: {
          orderBy: { fecha: 'asc' },
        },
      },
    });

    if (!calendario) {
      return {
        proyectoId,
        diasLaborables: [1, 2, 3, 4, 5],
        horasPorDia: 8,
        feriados: [],
      };
    }

    return mapearCalendarioProyecto(calendario);
  }

  async actualizar(
    proyectoId: number,
    datos: ActualizarCalendario,
    rol: Rol,
  ): Promise<RespuestaCalendario> {
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });

        const antes = await tx.calendario.upsert({
          where: { proyectoId },
          create: { proyectoId },
          update: {},
        });

        const dataActualizar: Prisma.CalendarioUpdateInput = {};
        if (datos.diasLaborables) {
          dataActualizar.diasLaborables = [...datos.diasLaborables].sort((a, b) => a - b);
        }
        if (datos.horasPorDia !== undefined) {
          dataActualizar.horasPorDia = new Prisma.Decimal(datos.horasPorDia);
        }

        const despues = await tx.calendario.update({
          where: { proyectoId },
          data: dataActualizar,
        });

        const cambios: CambioCampo[] = [];
        if (
          datos.diasLaborables &&
          antes.diasLaborables.join(',') !== despues.diasLaborables.join(',')
        ) {
          cambios.push({
            campo: 'diasLaborables',
            anterior: antes.diasLaborables.join(','),
            nuevo: despues.diasLaborables.join(','),
          });
        }
        if (
          datos.horasPorDia !== undefined &&
          Number(antes.horasPorDia) !== Number(despues.horasPorDia)
        ) {
          cambios.push({
            campo: 'horasPorDia',
            anterior: Number(antes.horasPorDia),
            nuevo: Number(despues.horasPorDia),
          });
        }
        if (cambios.length > 0) {
          await this.bitacora.registrarCambios(
            tx,
            {
              proyectoId,
              entidad: 'Calendario',
              entidadId: despues.id,
              rol,
            },
            AccionBitacora.ACTUALIZAR,
            cambios,
          );
        }

        const { tareasRecalculadas } = await this.arbol.reorganizarConResumen(tx, proyectoId);
        if (tareasRecalculadas > 0) {
          await this.bitacora.registrarRecalculo(
            tx,
            {
              proyectoId,
              entidad: 'Proyecto',
              entidadId: proyectoId,
              rol,
            },
            { tareasRecalculadas },
            'Calendario: días laborables u horas por día',
          );
        }

        const despuesConFeriados = await tx.calendario.findUniqueOrThrow({
          where: { proyectoId },
          include: { feriados: { orderBy: { fecha: 'asc' } } },
        });

        return {
          calendario: mapearCalendarioProyecto(despuesConFeriados),
          tareasRecalculadas,
        };
      },
      { timeout: 15_000 },
    );
  }

  async crearFeriado(
    proyectoId: number,
    datos: CrearFeriado,
    rol: Rol,
  ): Promise<RespuestaCalendario> {
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });

        const calendario = await tx.calendario.upsert({
          where: { proyectoId },
          create: { proyectoId },
          update: {},
        });

        const fechaDate = fechaIsoADate(datos.fecha);
        const existente = await tx.feriado.findUnique({
          where: {
            calendarioId_fecha: {
              calendarioId: calendario.id,
              fecha: fechaDate,
            },
          },
        });
        if (existente) {
          throw new ExcepcionApi(
            HttpStatus.CONFLICT,
            'REGISTRO_DUPLICADO',
            'Ya existe un feriado en esa fecha.',
            [{ campo: 'fecha', mensaje: 'Ya existe un feriado en esa fecha.' }],
          );
        }

        const nuevoFeriado = await tx.feriado.create({
          data: {
            calendarioId: calendario.id,
            fecha: fechaDate,
            descripcion: datos.descripcion,
          },
        });

        await this.bitacora.registrarCreacion(
          tx,
          {
            proyectoId,
            entidad: 'Feriado',
            entidadId: nuevoFeriado.id,
            rol,
          },
          {
            fecha: datos.fecha,
            descripcion: datos.descripcion,
          },
        );

        const { tareasRecalculadas } = await this.arbol.reorganizarConResumen(tx, proyectoId);
        if (tareasRecalculadas > 0) {
          await this.bitacora.registrarRecalculo(
            tx,
            {
              proyectoId,
              entidad: 'Proyecto',
              entidadId: proyectoId,
              rol,
            },
            { tareasRecalculadas },
            `Feriado agregado: ${formatearFecha(datos.fecha)}`,
          );
        }

        const calendarioActualizado = await tx.calendario.findUniqueOrThrow({
          where: { proyectoId },
          include: { feriados: { orderBy: { fecha: 'asc' } } },
        });

        return {
          calendario: mapearCalendarioProyecto(calendarioActualizado),
          tareasRecalculadas,
        };
      },
      { timeout: 15_000 },
    );
  }

  async eliminarFeriado(feriadoId: number, rol: Rol): Promise<RespuestaCalendario> {
    return this.prisma.$transaction(
      async (tx) => {
        const feriado = await tx.feriado.findUnique({
          where: { id: feriadoId },
          include: { calendario: { select: { proyectoId: true } } },
        });
        if (!feriado) {
          throw new ExcepcionApi(
            HttpStatus.NOT_FOUND,
            'REGISTRO_NO_ENCONTRADO',
            'El feriado no existe.',
          );
        }
        const proyectoId = feriado.calendario.proyectoId;

        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });

        const feriadoActual = await tx.feriado.findUnique({
          where: { id: feriadoId },
        });
        if (!feriadoActual) {
          throw new ExcepcionApi(
            HttpStatus.NOT_FOUND,
            'REGISTRO_NO_ENCONTRADO',
            'El feriado no existe.',
          );
        }

        await tx.feriado.delete({ where: { id: feriadoId } });

        const fechaIso = dateAFechaIso(feriadoActual.fecha);
        await this.bitacora.registrarEliminacion(
          tx,
          {
            proyectoId,
            entidad: 'Feriado',
            entidadId: feriadoId,
            rol,
          },
          {
            fecha: fechaIso,
            descripcion: feriadoActual.descripcion,
          },
        );

        const { tareasRecalculadas } = await this.arbol.reorganizarConResumen(tx, proyectoId);
        if (tareasRecalculadas > 0) {
          await this.bitacora.registrarRecalculo(
            tx,
            {
              proyectoId,
              entidad: 'Proyecto',
              entidadId: proyectoId,
              rol,
            },
            { tareasRecalculadas },
            `Feriado eliminado: ${formatearFecha(fechaIso)}`,
          );
        }

        const calendarioActualizado = await tx.calendario.findUniqueOrThrow({
          where: { proyectoId },
          include: { feriados: { orderBy: { fecha: 'asc' } } },
        });

        return {
          calendario: mapearCalendarioProyecto(calendarioActualizado),
          tareasRecalculadas,
        };
      },
      { timeout: 15_000 },
    );
  }
}
