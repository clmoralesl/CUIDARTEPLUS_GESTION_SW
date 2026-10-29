import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FiltroErrores } from './comun/errores/filtro-errores.filter';
import { GuardRoles } from './comun/roles/roles.guard';

export function configurarApp(app: INestApplication): void {
  app.enableCors({ allowedHeaders: ['Content-Type', 'X-Rol'] });
  app.useGlobalGuards(new GuardRoles(app.get(Reflector)));
  app.useGlobalFilters(new FiltroErrores());
}
