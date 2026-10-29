import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
  esquemaActualizarProyecto,
  esquemaCrearProyecto,
  PERMISOS,
  type ActualizarProyecto,
  type CrearProyecto,
  type ProyectoDetalle,
  type ProyectoResumen,
  type Rol,
} from '@autofix/core';
import { RolActual } from '../comun/roles/rol-actual.decorator';
import { Roles } from '../comun/roles/roles.decorator';
import { PipeIdRuta } from '../comun/validacion/id-ruta.pipe';
import { PipeValidacionZod } from '../comun/validacion/validacion-zod.pipe';
import { ProyectosService } from './proyectos.service';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectos: ProyectosService) {}

  @Get()
  listar(): Promise<ProyectoResumen[]> {
    return this.proyectos.listar();
  }

  @Get(':proyectoId')
  obtener(@Param('proyectoId', new PipeIdRuta('proyectoId')) id: number): Promise<ProyectoDetalle> {
    return this.proyectos.obtener(id);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Post()
  crear(
    @Body(new PipeValidacionZod(esquemaCrearProyecto)) datos: CrearProyecto,
    @RolActual() rol: Rol,
  ): Promise<ProyectoDetalle> {
    return this.proyectos.crear(datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Patch(':proyectoId')
  actualizar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) id: number,
    @Body(new PipeValidacionZod(esquemaActualizarProyecto))
    datos: ActualizarProyecto,
    @RolActual() rol: Rol,
  ): Promise<ProyectoDetalle> {
    return this.proyectos.actualizar(id, datos, rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Post(':proyectoId/iniciar')
  @HttpCode(HttpStatus.OK)
  iniciar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) id: number,
    @RolActual() rol: Rol,
  ): Promise<ProyectoDetalle> {
    return this.proyectos.cambiarEstado(id, 'EN_CURSO', rol);
  }

  @Roles(...PERMISOS.editarPlanificacion)
  @Post(':proyectoId/cerrar')
  @HttpCode(HttpStatus.OK)
  cerrar(
    @Param('proyectoId', new PipeIdRuta('proyectoId')) id: number,
    @RolActual() rol: Rol,
  ): Promise<ProyectoDetalle> {
    return this.proyectos.cambiarEstado(id, 'CERRADO', rol);
  }
}
