import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SaludController } from './salud.controller';
import { EstadoBaseDatos, SaludService } from './salud.service';

function controladorCon(estado: EstadoBaseDatos): SaludController {
  const servicio = { estadoBaseDatos: async () => estado } as SaludService;
  return new SaludController(servicio);
}

describe('SaludController', () => {
  it('responde ok cuando la base de datos está operativa', async () => {
    const respuestaMock = { status: vi.fn() };
    const resultado = await controladorCon('operativa').obtener(respuestaMock);
    expect(resultado).toEqual({
      estado: 'ok',
      bd: 'operativa',
    });
    expect(respuestaMock.status).not.toHaveBeenCalled();
  });

  it('responde 503 cuando la base de datos está caída', async () => {
    const respuestaMock = { status: vi.fn() };
    const resultado = await controladorCon('caida').obtener(respuestaMock);
    expect(respuestaMock.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(resultado).toEqual({
      estado: 'error',
      bd: 'caida',
    });
  });
});
