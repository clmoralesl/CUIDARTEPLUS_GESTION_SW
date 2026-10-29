import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES, Rol, esquemaRol, mensajeRolNoPermitido } from '@autofix/core';
import { ExcepcionApi } from '../errores/excepcion-api';
import { METADATO_PUBLICO, METADATO_ROLES } from './roles.decorator';

export interface SolicitudConRol {
  headers: Record<string, string | string[] | undefined>;
  rol?: Rol;
}

const PERMITIDOS = ROLES.join(', ');

@Injectable()
export class GuardRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const objetivos = [contexto.getHandler(), contexto.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(METADATO_PUBLICO, objetivos)) return true;

    const solicitud = contexto.switchToHttp().getRequest<SolicitudConRol>();
    const cabecera = solicitud.headers['x-rol'];
    if (cabecera === undefined) {
      throw new ExcepcionApi(
        HttpStatus.BAD_REQUEST,
        'ROL_REQUERIDO',
        `Falta la cabecera X-Rol. Valores permitidos: ${PERMITIDOS}.`,
      );
    }
    const rol = esquemaRol.safeParse(cabecera);
    if (!rol.success) {
      throw new ExcepcionApi(
        HttpStatus.BAD_REQUEST,
        'ROL_INVALIDO',
        `El valor de la cabecera X-Rol no es válido. Valores permitidos: ${PERMITIDOS}.`,
      );
    }
    solicitud.rol = rol.data;

    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(
      METADATO_ROLES,
      objetivos,
    );
    if (permitidos && !permitidos.includes(rol.data)) {
      throw new ExcepcionApi(
        HttpStatus.FORBIDDEN,
        'ROL_NO_PERMITIDO',
        mensajeRolNoPermitido(permitidos),
      );
    }
    return true;
  }
}
