import { HttpStatus, Injectable } from '@nestjs/common';
import { AccionBitacora, Prisma, type Tarea } from '@prisma/client';
import {
  CAMPOS_CALCULADOS,
  CAMPOS_EDITABLES,
  calcularInicioPlan,
  contarDescendientes,
  dateAFechaIso,
  esJerarquiaValida,
  fechaIsoADate,
  insertarEnArbol,
  moverEnArbol,
  type ActualizarTarea,
  type ArbolTareas,
  type CrearTarea,
  type MoverTarea,
  type Rol,
} from '@autofix/core';
import { BitacoraService } from '../comun/bitacora/bitacora.service';
import { diferencias } from '../comun/bitacora/diferencias';
import { ExcepcionApi } from '../comun/errores/excepcion-api';
import { PrismaService } from '../prisma/prisma.service';
import { errorProyectoNoEncontrado, obtenerProyectoAbierto } from '../proyectos/proyecto-abierto';
import { cargarCalendarioLaboral } from '../calendario/calendario-laboral';
import { ArbolTareasService } from './arbol-tareas.service';

export const errorTareaNoEncontrada = () =>
  new ExcepcionApi(HttpStatus.NOT_FOUND, 'REGISTRO_NO_ENCONTRADO', 'La tarea no existe.');

export const errorCampoCalculado = (campos: readonly string[]) =>
  new ExcepcionApi(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'CAMPO_CALCULADO',
    'Los campos calculados de una tarea con subtareas no se editan.',
    { campos },
  );

function validarFechasReales(tarea: Tarea, datos: ActualizarTarea): void {
  const inicioRealStr =
    'inicioReal' in datos
      ? datos.inicioReal
      : tarea.inicioReal
        ? dateAFechaIso(tarea.inicioReal)
        : null;
  const finRealStr =
    'finReal' in datos ? datos.finReal : tarea.finReal ? dateAFechaIso(tarea.finReal) : null;

  if (finRealStr && !inicioRealStr) {
    throw new ExcepcionApi(
      HttpStatus.BAD_REQUEST,
      'VALIDACION_FALLIDA',
      'No se puede ingresar fin real sin inicio real.',
      [
        {
          campo: 'finReal',
          mensaje: 'Debe registrar la fecha de inicio real antes o junto con la fecha de fin real.',
        },
      ],
    );
  }

  if (inicioRealStr && finRealStr && finRealStr < inicioRealStr) {
    throw new ExcepcionApi(
      HttpStatus.BAD_REQUEST,
      'VALIDACION_FALLIDA',
      'La fecha de fin real no puede ser anterior a la de inicio real.',
      [
        {
          campo: 'finReal',
          mensaje: 'La fecha de fin real no puede ser anterior a la de inicio real.',
        },
      ],
    );
  }
}

function aDatosPrisma(datos: ActualizarTarea): Prisma.TareaUpdateInput {
  const resultado: Prisma.TareaUpdateInput = {};
  if ('nombre' in datos && datos.nombre !== undefined) resultado.nombre = datos.nombre;
  if ('descripcion' in datos) resultado.descripcion = datos.descripcion;
  if ('responsable' in datos) resultado.responsable = datos.responsable;
  if ('duracionDias' in datos && datos.duracionDias !== undefined) {
    resultado.duracionDias = datos.duracionDias;
  }
  if ('inicioPlan' in datos) {
    resultado.inicioPlan = datos.inicioPlan ? fechaIsoADate(datos.inicioPlan) : null;
  }
  if ('inicioReal' in datos) {
    resultado.inicioReal = datos.inicioReal ? fechaIsoADate(datos.inicioReal) : null;
  }
  if ('finReal' in datos) {
    resultado.finReal = datos.finReal ? fechaIsoADate(datos.finReal) : null;
  }
  if ('porcentajeAvance' in datos && datos.porcentajeAvance !== undefined) {
    resultado.porcentajeAvance = new Prisma.Decimal(datos.porcentajeAvance);
  }
  return resultado;
}

@Injectable()
export class TareasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arbol: ArbolTareasService,
    private readonly bitacora: BitacoraService,
  ) {}

  async obtenerArbol(proyectoId: number): Promise<ArbolTareas> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
    });
    if (!proyecto) throw errorProyectoNoEncontrado();
    return this.arbol.cargar(this.prisma, proyectoId);
  }

  async crear(proyectoId: number, datos: CrearTarea, rol: Rol): Promise<ArbolTareas> {
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });
        const calendario = await cargarCalendarioLaboral(tx, proyectoId);

        if (datos.padreId !== null) {
          const padre = await tx.tarea.findFirst({
            where: { id: datos.padreId, proyectoId },
          });
          if (!padre || !esJerarquiaValida(datos.nivel, padre.nivel)) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'JERARQUIA_INVALIDA',
              'La jerarquía entre el nivel de la tarea y su padre no es válida.',
            );
          }
        } else if (!esJerarquiaValida(datos.nivel, null)) {
          throw new ExcepcionApi(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'JERARQUIA_INVALIDA',
            'Una etapa no puede tener padre.',
          );
        }

        const tareasExistentes = await tx.tarea.findMany({
          where: { proyectoId },
        });
        const nodoNuevoVirtual = {
          id: 0,
          padreId: datos.padreId,
          orden: 0,
        };
        const arbolConNuevo = insertarEnArbol(tareasExistentes, nodoNuevoVirtual, datos.posicion);
        const ordenCalculado = arbolConNuevo.find((n) => n.id === 0)?.orden ?? 1;

        for (const nodo of arbolConNuevo) {
          if (nodo.id !== 0) {
            const original = tareasExistentes.find((t) => t.id === nodo.id);
            if (original && original.orden !== nodo.orden) {
              await tx.tarea.update({
                where: { id: nodo.id },
                data: { orden: nodo.orden },
              });
            }
          }
        }

        const duracion = datos.duracionDias ?? 1;
        const inicioNormalizado = datos.inicioPlan
          ? calcularInicioPlan(datos.inicioPlan, calendario)
          : null;
        const inicioPlanDate = inicioNormalizado ? fechaIsoADate(inicioNormalizado) : null;

        const creada = await tx.tarea.create({
          data: {
            proyectoId,
            padreId: datos.padreId,
            nivel: datos.nivel,
            codigo: `~nueva-${Date.now()}`,
            orden: ordenCalculado,
            nombre: datos.nombre,
            descripcion: datos.descripcion,
            responsable: datos.responsable,
            duracionDias: duracion,
            inicioPlan: inicioPlanDate,
            finPlan: null,
            porcentajeAvance: new Prisma.Decimal(0),
          },
        });

        const arbolActualizado = await this.arbol.reorganizar(tx, proyectoId, calendario);
        const tareaReorganizada = arbolActualizado.tareas.find((t) => t.id === creada.id);

        await this.bitacora.registrarCreacion(
          tx,
          {
            proyectoId,
            entidad: 'Tarea',
            entidadId: creada.id,
            rol,
          },
          {
            codigo: tareaReorganizada?.codigo ?? creada.codigo,
            nombre: creada.nombre,
            nivel: creada.nivel,
            padreId: creada.padreId,
            duracionDias: creada.duracionDias,
            inicioPlan: inicioNormalizado,
          },
        );

        return arbolActualizado;
      },
      { timeout: 15_000 },
    );
  }

  async actualizar(tareaId: number, datos: ActualizarTarea, rol: Rol): Promise<ArbolTareas> {
    return this.prisma.$transaction(
      async (tx) => {
        const referencia = await tx.tarea.findUnique({
          where: { id: tareaId },
          select: { proyectoId: true },
        });
        if (!referencia) throw errorTareaNoEncontrada();
        await obtenerProyectoAbierto(tx, referencia.proyectoId, { bloquear: true });
        const tarea = await tx.tarea.findUnique({ where: { id: tareaId } });
        if (!tarea) throw errorTareaNoEncontrada();

        const calendario = await cargarCalendarioLaboral(tx, tarea.proyectoId);

        const tieneHijas = (await tx.tarea.count({ where: { padreId: tareaId } })) > 0;
        const calculados = CAMPOS_CALCULADOS.filter((campo) => campo in datos);
        if (tieneHijas && calculados.length > 0) {
          throw errorCampoCalculado(calculados);
        }

        const datosNormalizados: ActualizarTarea = { ...datos };
        if (
          'inicioPlan' in datosNormalizados &&
          datosNormalizados.inicioPlan !== null &&
          datosNormalizados.inicioPlan !== undefined
        ) {
          datosNormalizados.inicioPlan = calcularInicioPlan(
            datosNormalizados.inicioPlan,
            calendario,
          );
        }

        validarFechasReales(tarea, datosNormalizados);

        const antes = tarea;
        await tx.tarea.update({
          where: { id: tareaId },
          data: aDatosPrisma(datosNormalizados),
        });
        const despues = await tx.tarea.findUniqueOrThrow({
          where: { id: tareaId },
        });

        await this.bitacora.registrarCambios(
          tx,
          {
            proyectoId: tarea.proyectoId,
            entidad: 'Tarea',
            entidadId: tareaId,
            rol,
          },
          AccionBitacora.ACTUALIZAR,
          diferencias(
            antes,
            despues,
            CAMPOS_EDITABLES.filter((c) => c in datosNormalizados),
          ),
        );

        return this.arbol.reorganizar(tx, tarea.proyectoId, calendario);
      },
      { timeout: 15_000 },
    );
  }

  async mover(tareaId: number, datos: MoverTarea, rol: Rol): Promise<ArbolTareas> {
    return this.prisma.$transaction(
      async (tx) => {
        const referencia = await tx.tarea.findUnique({
          where: { id: tareaId },
          select: { proyectoId: true },
        });
        if (!referencia) throw errorTareaNoEncontrada();
        await obtenerProyectoAbierto(tx, referencia.proyectoId, { bloquear: true });
        const tarea = await tx.tarea.findUnique({ where: { id: tareaId } });
        if (!tarea) throw errorTareaNoEncontrada();

        if (datos.padreId !== null) {
          const padre = await tx.tarea.findFirst({
            where: { id: datos.padreId, proyectoId: tarea.proyectoId },
          });
          if (!padre || !esJerarquiaValida(tarea.nivel, padre.nivel)) {
            throw new ExcepcionApi(
              HttpStatus.UNPROCESSABLE_ENTITY,
              'JERARQUIA_INVALIDA',
              'La jerarquía entre el nivel de la tarea y su nuevo padre no es válida.',
            );
          }
        } else if (!esJerarquiaValida(tarea.nivel, null)) {
          throw new ExcepcionApi(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'JERARQUIA_INVALIDA',
            'Solo una etapa puede estar en la raíz.',
          );
        }

        const tareasExistentes = await tx.tarea.findMany({
          where: { proyectoId: tarea.proyectoId },
        });
        const arbolMovido = moverEnArbol(tareasExistentes, tareaId, datos.padreId, datos.posicion);

        const nodoMovido = arbolMovido.find((n) => n.id === tareaId);
        if (!nodoMovido) return this.arbol.cargar(tx, tarea.proyectoId);

        const noHuboCambio =
          nodoMovido.padreId === tarea.padreId && nodoMovido.orden === tarea.orden;
        if (noHuboCambio) {
          return this.arbol.cargar(tx, tarea.proyectoId);
        }

        for (const nodo of arbolMovido) {
          const original = tareasExistentes.find((t) => t.id === nodo.id);
          if (original && (original.orden !== nodo.orden || original.padreId !== nodo.padreId)) {
            await tx.tarea.update({
              where: { id: nodo.id },
              data: {
                padreId: nodo.padreId,
                orden: nodo.orden,
              },
            });
          }
        }

        const arbolReorganizado = await this.arbol.reorganizar(tx, tarea.proyectoId);
        const tareaFinal = arbolReorganizado.tareas.find((t) => t.id === tareaId);

        await this.bitacora.registrarCambios(
          tx,
          {
            proyectoId: tarea.proyectoId,
            entidad: 'Tarea',
            entidadId: tareaId,
            rol,
          },
          AccionBitacora.ACTUALIZAR,
          [
            {
              campo: 'ubicacion',
              anterior: {
                codigo: tarea.codigo,
                padreId: tarea.padreId,
                orden: tarea.orden,
              },
              nuevo: {
                codigo: tareaFinal?.codigo ?? tarea.codigo,
                padreId: datos.padreId,
                orden: tareaFinal?.orden ?? nodoMovido.orden,
              },
            },
          ],
        );

        return arbolReorganizado;
      },
      { timeout: 15_000 },
    );
  }

  async eliminar(tareaId: number, rol: Rol): Promise<ArbolTareas> {
    return this.prisma.$transaction(
      async (tx) => {
        const referencia = await tx.tarea.findUnique({
          where: { id: tareaId },
          select: { proyectoId: true },
        });
        if (!referencia) throw errorTareaNoEncontrada();
        await obtenerProyectoAbierto(tx, referencia.proyectoId, { bloquear: true });
        const tarea = await tx.tarea.findUnique({ where: { id: tareaId } });
        if (!tarea) throw errorTareaNoEncontrada();

        const tareasExistentes = await tx.tarea.findMany({
          where: { proyectoId: tarea.proyectoId },
        });
        const descendientes = contarDescendientes(tareasExistentes, tareaId);

        await tx.tarea.delete({ where: { id: tareaId } });

        const arbolReorganizado = await this.arbol.reorganizar(tx, tarea.proyectoId);

        await this.bitacora.registrarEliminacion(
          tx,
          {
            proyectoId: tarea.proyectoId,
            entidad: 'Tarea',
            entidadId: tareaId,
            rol,
          },
          {
            codigo: tarea.codigo,
            nombre: tarea.nombre,
            nivel: tarea.nivel,
            descendientes,
          },
        );

        return arbolReorganizado;
      },
      { timeout: 15_000 },
    );
  }
}
