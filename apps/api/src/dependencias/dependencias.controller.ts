import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  esquemaCrearDependencia,
  PERMISOS,
  type CrearDependencia,
  type DependenciaTarea,
  type ResultadoRecalculo,
  type Rol,
} from '@autofix/core';
import { RolActual } from '../comun/roles/rol-actual.decorator';
import { Roles } from '../comun/roles/roles.decorator';
import { PipeIdRuta } from '../comun/validacion/id-ruta.pipe';
import { PipeValidacionZod } from '../comun/validacion/validacion-zod.pipe';
import { DependenciasService } from './dependencias.service';

@Controller()
export class DependenciasController {
  constructor(private readonly dependencias: DependenciasService) {}

  @Get('proyectos/:proyectoId/dependencias')
  listar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
  ): Promise<DependenciaTarea[]> {
    return this.dependencias.listar(proyectoId);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.CREATED)
  @Post('proyectos/:proyectoId/dependencias')
  crear(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
    @Body(new PipeValidacionZod(esquemaCrearDependencia)) datos: CrearDependencia,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.dependencias.crear(proyectoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.OK)
  @Delete('dependencias/:dependenciaId')
  eliminar(
    @Param('dependenciaId', new PipeIdRuta('dependenciaId')) dependenciaId: number,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.dependencias.eliminar(dependenciaId, rol);
  }
}
