import { Controller, Get } from '@nestjs/common';
import { APP_NOMBRE } from '@autofix/core';
import { Publico } from './comun/roles/roles.decorator';

@Publico()
@Controller('informacion')
export class AppController {
  @Get()
  obtener(): { aplicacion: string } {
    return { aplicacion: APP_NOMBRE };
  }
}
