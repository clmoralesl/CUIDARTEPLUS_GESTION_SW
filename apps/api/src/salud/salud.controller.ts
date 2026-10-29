import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Publico } from '../comun/roles/roles.decorator';
import { EstadoBaseDatos, SaludService } from './salud.service';

export interface RespuestaSalud {
  estado: 'ok' | 'error';
  bd: EstadoBaseDatos;
}

interface RespuestaConEstado {
  status(estado: number): unknown;
}

@Publico()
@Controller('salud')
export class SaludController {
  constructor(private readonly saludService: SaludService) {}

  @Get()
  async obtener(
    @Res({ passthrough: true }) respuesta: RespuestaConEstado,
  ): Promise<RespuestaSalud> {
    const bd = await this.saludService.estadoBaseDatos();
    if (bd === 'caida') {
      respuesta.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { estado: 'error', bd };
    }
    return { estado: 'ok', bd };
  }
}
