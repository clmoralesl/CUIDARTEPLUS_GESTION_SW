import { Controller, Get } from '@nestjs/common';
import { ProyectosService, ResumenProyecto } from './proyectos.service';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  async listar(): Promise<ResumenProyecto[]> {
    return this.proyectosService.listar();
  }
}
