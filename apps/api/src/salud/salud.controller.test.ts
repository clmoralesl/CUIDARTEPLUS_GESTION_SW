import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { SaludController } from './salud.controller';
import { EstadoBaseDatos, SaludService } from './salud.service';

function controladorCon(estado: EstadoBaseDatos): SaludController {
  const servicio = { estadoBaseDatos: async () => estado } as SaludService;
  return new SaludController(servicio);
}

describe('SaludController', () => {
  it('responde ok cuando la base de datos está operativa', async () => {
    await expect(controladorCon('operativa').obtener()).resolves.toEqual({
      estado: 'ok',
      bd: 'operativa',
    });
  });

  it('responde 503 cuando la base de datos está caída', async () => {
    const error = await controladorCon('caida')
      .obtener()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect((error as HttpException).getResponse()).toEqual({ estado: 'error', bd: 'caida' });
  });
});
