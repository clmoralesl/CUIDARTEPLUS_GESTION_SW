import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { EstadoBaseDatos, SaludService } from './salud.service';

export interface RespuestaSalud {
  estado: 'ok' | 'error';
  bd: EstadoBaseDatos;
}

@Controller('salud')
export class SaludController {
  constructor(private readonly saludService: SaludService) {}

  @Get()
  async obtener(): Promise<RespuestaSalud> {
    const bd = await this.saludService.estadoBaseDatos();
    if (bd === 'caida') {
      throw new HttpException(
        { estado: 'error', bd } satisfies RespuestaSalud,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { estado: 'ok', bd };
  }
}
