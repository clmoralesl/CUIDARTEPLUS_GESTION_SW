import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  esquemaActualizarTarea,
  esquemaCrearTarea,
  esquemaMoverTarea,
  PERMISOS,
  type ActualizarTarea,
  type ArbolTareas,
  type CrearTarea,
  type MoverTarea,
  type ResultadoRecalculo,
  type Rol,
} from '@autofix/core';
import { RolActual } from '../comun/roles/rol-actual.decorator';
import { Roles } from '../comun/roles/roles.decorator';
import { PipeIdRuta } from '../comun/validacion/id-ruta.pipe';
import { PipeValidacionZod } from '../comun/validacion/validacion-zod.pipe';
import { TareasService } from './tareas.service';

@Controller()
export class TareasController {
  constructor(private readonly tareas: TareasService) {}

  @Get('proyectos/:proyectoId/tareas')
  obtenerArbol(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
  ): Promise<ArbolTareas> {
    return this.tareas.obtenerArbol(proyectoId);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.CREATED)
  @Post('proyectos/:proyectoId/tareas')
  crear(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
    @Body(new PipeValidacionZod(esquemaCrearTarea)) datos: CrearTarea,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.tareas.crear(proyectoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Patch('tareas/:tareaId')
  actualizar(
    @Param('tareaId', new PipeIdRuta('tareaId')) tareaId: number,
    @Body(new PipeValidacionZod(esquemaActualizarTarea)) datos: ActualizarTarea,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.tareas.actualizar(tareaId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.OK)
  @Post('tareas/:tareaId/mover')
  mover(
    @Param('tareaId', new PipeIdRuta('tareaId')) tareaId: number,
    @Body(new PipeValidacionZod(esquemaMoverTarea)) datos: MoverTarea,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.tareas.mover(tareaId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Delete('tareas/:tareaId')
  eliminar(
    @Param('tareaId', new PipeIdRuta('tareaId')) tareaId: number,
    @RolActual() rol: Rol,
  ): Promise<ResultadoRecalculo> {
    return this.tareas.eliminar(tareaId, rol);
  }
}
