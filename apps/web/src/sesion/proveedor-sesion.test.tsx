import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { clienteConsultas } from '../api/cliente-consultas';
import { CLAVE_ROL } from './almacenamiento';
import { ProveedorSesion, useSesion } from './proveedor-sesion';

describe('ProveedorSesion', () => {
  it('escribe en localStorage antes de invalidar consultas al cambiar de rol', async () => {
    localStorage.clear();
    const ordenLlamadas: string[] = [];

    const espiaStorage = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((clave, valor) => {
        if (clave === CLAVE_ROL && valor === 'CC') {
          ordenLlamadas.push('localStorage');
        }
      });

    const espiaInvalidate = vi
      .spyOn(clienteConsultas, 'invalidateQueries')
      .mockImplementation(() => {
        ordenLlamadas.push('invalidateQueries');
        return Promise.resolve();
      });

    const { result } = renderHook(() => useSesion(), {
      wrapper: ({ children }) => <ProveedorSesion>{children}</ProveedorSesion>,
    });

    await act(async () => {
      result.current.cambiarRol('CC');
    });

    expect(ordenLlamadas[0]).toBe('localStorage');
    expect(ordenLlamadas[ordenLlamadas.length - 1]).toBe('invalidateQueries');

    espiaStorage.mockRestore();
    espiaInvalidate.mockRestore();
  });
});
