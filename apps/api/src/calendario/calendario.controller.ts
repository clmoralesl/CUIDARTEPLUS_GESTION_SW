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
  esquemaActualizarCalendario,
  esquemaCrearFeriado,
  PERMISOS,
  type ActualizarCalendario,
  type CalendarioProyecto,
  type CrearFeriado,
  type RespuestaCalendario,
  type Rol,
} from '@autofix/core';
import { RolActual } from '../comun/roles/rol-actual.decorator';
import { Roles } from '../comun/roles/roles.decorator';
import { PipeIdRuta } from '../comun/validacion/id-ruta.pipe';
import { PipeValidacionZod } from '../comun/validacion/validacion-zod.pipe';
import { CalendarioService } from './calendario.service';

@Controller()
export class CalendarioController {
  constructor(private readonly calendario: CalendarioService) {}

  @Get('proyectos/:proyectoId/calendario')
  obtener(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
  ): Promise<CalendarioProyecto> {
    return this.calendario.obtener(proyectoId);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Patch('proyectos/:proyectoId/calendario')
  actualizar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
    @Body(new PipeValidacionZod(esquemaActualizarCalendario)) datos: ActualizarCalendario,
    @RolActual() rol: Rol,
  ): Promise<RespuestaCalendario> {
    return this.calendario.actualizar(proyectoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.CREATED)
  @Post('proyectos/:proyectoId/feriados')
  crearFeriado(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) proyectoId: number,
    @Body(new PipeValidacionZod(esquemaCrearFeriado)) datos: CrearFeriado,
    @RolActual() rol: Rol,
  ): Promise<RespuestaCalendario> {
    return this.calendario.crearFeriado(proyectoId, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @HttpCode(HttpStatus.OK)
  @Delete('feriados/:feriadoId')
  eliminarFeriado(
    @Param('feriadoId', new PipeIdRuta('feriadoId')) feriadoId: number,
    @RolActual() rol: Rol,
  ): Promise<RespuestaCalendario> {
    return this.calendario.eliminarFeriado(feriadoId, rol);
  }
}
