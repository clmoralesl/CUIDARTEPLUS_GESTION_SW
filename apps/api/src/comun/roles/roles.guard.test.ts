import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { ExcepcionApi } from '../errores/excepcion-api';
import { METADATO_PUBLICO, METADATO_ROLES } from './roles.decorator';
import { GuardRoles, SolicitudConRol } from './roles.guard';

describe('GuardRoles', () => {
  function crearContexto(
    headers: Record<string, string | undefined>,
    publico = false,
    rolesPermitidos?: string[],
  ) {
    const solicitud: SolicitudConRol = { headers };
    const reflector = {
      getAllAndOverride: (metadato: string) => {
        if (metadato === METADATO_PUBLICO) return publico;
        if (metadato === METADATO_ROLES) return rolesPermitidos;
        return undefined;
      },
    } as unknown as Reflector;

    const contexto = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => solicitud,
      }),
    } as unknown as ExecutionContext;

    return { guard: new GuardRoles(reflector), contexto, solicitud };
  }

  it('permite acceso si la ruta es publica sin requerir X-Rol', () => {
    const { guard, contexto } = crearContexto({}, true);
    expect(guard.canActivate(contexto)).toBe(true);
  });

  it('lanza 400 ROL_REQUERIDO si falta la cabecera X-Rol', () => {
    const { guard, contexto } = crearContexto({});
    expect(() => guard.canActivate(contexto)).toThrowError(ExcepcionApi);
    try {
      guard.canActivate(contexto);
    } catch (error) {
      const apiError = error as ExcepcionApi;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(apiError.codigo).toBe('ROL_REQUERIDO');
    }
  });

  it('lanza 400 ROL_INVALIDO si el valor de X-Rol no es JP ni CC', () => {
    const { guard, contexto } = crearContexto({ 'x-rol': 'ADMIN' });
    expect(() => guard.canActivate(contexto)).toThrowError(ExcepcionApi);
    try {
      guard.canActivate(contexto);
    } catch (error) {
      const apiError = error as ExcepcionApi;
      expect(apiError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(apiError.codigo).toBe('ROL_INVALIDO');
    }
  });

  it('asigna el rol a la solicitud y permite si no hay roles restringidos', () => {
    const { guard, contexto, solicitud } = crearContexto({ 'x-rol': 'JP' });
    expect(guard.canActivate(contexto)).toBe(true);
    expect(solicitud.rol).toBe('JP');
  });

  it('lanza 403 ROL_NO_PERMITIDO si el rol no esta en los roles permitidos', () => {
    const { guard, contexto } = crearContexto({ 'x-rol': 'CC' }, false, ['JP']);
    expect(() => guard.canActivate(contexto)).toThrowError(ExcepcionApi);
    try {
      guard.canActivate(contexto);
    } catch (error) {
      const apiError = error as ExcepcionApi;
      expect(apiError.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(apiError.codigo).toBe('ROL_NO_PERMITIDO');
    }
  });

  it('permite acceso si el rol coincide con los roles permitidos', () => {
    const { guard, contexto } = crearContexto({ 'x-rol': 'JP' }, false, ['JP']);
    expect(guard.canActivate(contexto)).toBe(true);
  });
});
