import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Rol } from '@cuidarte/core';
import type { SolicitudConRol } from './roles.guard';

export const RolActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): Rol | undefined =>
    contexto.switchToHttp().getRequest<SolicitudConRol>().rol,
);
