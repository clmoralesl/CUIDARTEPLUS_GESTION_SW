import { HttpStatus, Injectable } from '@nestjs/common';
import {
  describirDependencia,
  type CrearDependencia,
  type DependenciaTarea,
  type ResultadoRecalculo,
  type Rol,
} from '@autofix/core';
import { BitacoraService } from '../comun/bitacora/bitacora.service';
import { ExcepcionApi } from '../comun/errores/excepcion-api';
import { PrismaService } from '../prisma/prisma.service';
import { obtenerProyectoAbierto } from '../proyectos/proyecto-abierto';
import { RecalculoService } from '../recalculo/recalculo.service';

@Injectable()
export class DependenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recalculo: RecalculoService,
    private readonly bitacora: BitacoraService,
  ) {}

  async listar(proyectoId: number): Promise<DependenciaTarea[]> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true },
    });
    if (!proyecto) {
      throw new ExcepcionApi(
        HttpStatus.NOT_FOUND,
        'REGISTRO_NO_ENCONTRADO',
        'El proyecto no existe.',
      );
    }
    const deps = await this.prisma.dependencia.findMany({
      where: { proyectoId },
      orderBy: { id: 'asc' },
    });
    return deps.map((d) => ({
      id: d.id,
      predecesoraId: d.predecesoraId,
      sucesoraId: d.sucesoraId,
      tipo: d.tipo,
      desfaseDias: d.desfaseDias,
    }));
  }

  async crear(proyectoId: number, datos: CrearDependencia, rol: Rol): Promise<ResultadoRecalculo> {
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, proyectoId, { bloquear: true });
        const tareas = await tx.tarea.findMany({
          where: { id: { in: [datos.predecesoraId, datos.sucesoraId] }, proyectoId },
          include: { _count: { select: { hijas: true } } },
        });
        if (tareas.length !== 2) {
          throw new ExcepcionApi(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'DEPENDENCIA_INVALIDA',
            'Las tareas de la dependencia deben existir y pertenecer al proyecto.',
          );
        }
        const tPre = tareas.find((t) => t.id === datos.predecesoraId)!;
        const tSuc = tareas.find((t) => t.id === datos.sucesoraId)!;
        if (tPre._count.hijas > 0 || tSuc._count.hijas > 0) {
          throw new ExcepcionApi(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'DEPENDENCIA_INVALIDA',
            'Las dependencias solo se admiten entre tareas sin subtareas.',
          );
        }
        const existe = await tx.dependencia.findUnique({
          where: {
            predecesoraId_sucesoraId: {
              predecesoraId: datos.predecesoraId,
              sucesoraId: datos.sucesoraId,
            },
          },
        });
        if (existe) {
          throw new ExcepcionApi(
            HttpStatus.CONFLICT,
            'REGISTRO_DUPLICADO',
            `Ya existe una dependencia de ${tPre.codigo} a ${tSuc.codigo}.`,
          );
        }
        const nueva = await tx.dependencia.create({
          data: {
            proyectoId,
            predecesoraId: datos.predecesoraId,
            sucesoraId: datos.sucesoraId,
            tipo: datos.tipo,
            desfaseDias: datos.desfaseDias,
          },
        });
        await this.bitacora.registrarCreacion(
          tx,
          { proyectoId, entidad: 'Dependencia', entidadId: nueva.id, rol },
          {
            predecesora: tPre.codigo,
            sucesora: tSuc.codigo,
            tipo: datos.tipo,
            desfaseDias: datos.desfaseDias,
          },
        );
        return this.recalculo.ejecutar(proyectoId, tx, {
          rol,
          descripcion: `Dependencia agregada: ${describirDependencia(
            tPre.codigo,
            tSuc.codigo,
            datos.tipo,
            datos.desfaseDias,
          )}`,
        });
      },
      { timeout: 15_000 },
    );
  }

  async eliminar(dependenciaId: number, rol: Rol): Promise<ResultadoRecalculo> {
    const dep = await this.prisma.dependencia.findUnique({
      where: { id: dependenciaId },
      include: {
        predecesora: { select: { codigo: true } },
        sucesora: { select: { codigo: true } },
      },
    });
    if (!dep) {
      throw new ExcepcionApi(
        HttpStatus.NOT_FOUND,
        'REGISTRO_NO_ENCONTRADO',
        'La dependencia no existe.',
      );
    }
    return this.prisma.$transaction(
      async (tx) => {
        await obtenerProyectoAbierto(tx, dep.proyectoId, { bloquear: true });
        const depActual = await tx.dependencia.findUnique({
          where: { id: dependenciaId },
          include: {
            predecesora: { select: { codigo: true } },
            sucesora: { select: { codigo: true } },
          },
        });
        if (!depActual) {
          throw new ExcepcionApi(
            HttpStatus.NOT_FOUND,
            'REGISTRO_NO_ENCONTRADO',
            'La dependencia no existe.',
          );
        }
        await tx.dependencia.delete({ where: { id: dependenciaId } });
        await this.bitacora.registrarEliminacion(
          tx,
          { proyectoId: dep.proyectoId, entidad: 'Dependencia', entidadId: dependenciaId, rol },
          {
            predecesora: depActual.predecesora.codigo,
            sucesora: depActual.sucesora.codigo,
            tipo: depActual.tipo,
            desfaseDias: depActual.desfaseDias,
          },
        );
        return this.recalculo.ejecutar(dep.proyectoId, tx, {
          rol,
          descripcion: `Dependencia eliminada: ${describirDependencia(
            depActual.predecesora.codigo,
            depActual.sucesora.codigo,
            depActual.tipo,
            depActual.desfaseDias,
          )}`,
        });
      },
      { timeout: 15_000 },
    );
  }
}
