import { Controller, Get } from '@nestjs/common';
import { APP_NOMBRE } from '@cuidarte/core';

@Controller('informacion')
export class AppController {
  @Get()
  obtener(): { aplicacion: string } {
    return { aplicacion: APP_NOMBRE };
  }
}
