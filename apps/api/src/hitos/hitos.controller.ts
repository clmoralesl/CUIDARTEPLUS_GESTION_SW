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
  esquemaActualizarHito,
  esquemaCrearHito,
  PERMISOS,
  type ActualizarHito,
  type CrearHito,
  type ListaHitos,
  type Rol,
} from '@autofix/core';
import { RolActual } from '../comun/roles/rol-actual.decorator';
import { Roles } from '../comun/roles/roles.decorator';
import { PipeIdRuta } from '../comun/validacion/id-ruta.pipe';
import { PipeValidacionZod } from '../comun/validacion/validacion-zod.pipe';
import { HitosService } from './hitos.service';

@Controller()
export class HitosController {
  constructor(private readonly hitos: HitosService) {}

  @Get('proyectos/:proyectoId/hitos')
  listar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
  ): Promise<ListaHitos> {
    return this.hitos.listar(proyectoId);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.CREATED)
  @Post('proyectos/:proyectoId/hitos')
  crear(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
    @Body(new PipeValidacionZod(esquemaCrearHito)) datos: CrearHito,
    @RolActual() rol: Rol,
  ): Promise<ListaHitos> {
    return this.hitos.crear(proyectoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Patch('hitos/:hitoId')
  actualizar(
    @Param('hitoId', new PipeIdRuta('hitoId')) hitoId: number,
    @Body(new PipeValidacionZod(esquemaActualizarHito)) datos: ActualizarHito,
    @RolActual() rol: Rol,
  ): Promise<ListaHitos> {
    return this.hitos.actualizar(hitoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.OK)
  @Delete('hitos/:hitoId')
  eliminar(
    @Param('hitoId', new PipeIdRuta('hitoId')) hitoId: number,
    @RolActual() rol: Rol,
  ): Promise<ListaHitos> {
    return this.hitos.eliminar(hitoId, rol);
  }
}
