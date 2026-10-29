import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAVE_ROL } from '../sesion/almacenamiento';
import { ErrorSolicitud, solicitar } from './cliente-api';

describe('cliente-api', () => {
  const fetchOriginal = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    vi.restoreAllMocks();
  });

  it('envia X-Rol: CC cuando localStorage contiene CC', async () => {
    localStorage.setItem(CLAVE_ROL, 'CC');
    let cabeceraRol: string | null = null;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opciones: RequestInit) => {
      const headers = new Headers(opciones.headers);
      cabeceraRol = headers.get('X-Rol');
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    await solicitar('/test');
    expect(cabeceraRol).toBe('CC');
  });

  it('envia X-Rol: JP por defecto cuando localStorage esta vacio', async () => {
    let cabeceraRol: string | null = null;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opciones: RequestInit) => {
      const headers = new Headers(opciones.headers);
      cabeceraRol = headers.get('X-Rol');
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    await solicitar('/test');
    expect(cabeceraRol).toBe('JP');
  });

  it('envia X-Rol: JP cuando localStorage contiene un valor desconocido', async () => {
    localStorage.setItem(CLAVE_ROL, 'ADMIN');
    let cabeceraRol: string | null = null;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opciones: RequestInit) => {
      const headers = new Headers(opciones.headers);
      cabeceraRol = headers.get('X-Rol');
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    await solicitar('/test');
    expect(cabeceraRol).toBe('JP');
  });

  it('lanza ErrorSolicitud con cuerpo estructurado cuando la API responde 403', async () => {
    const cuerpoError = {
      codigo: 'ROL_NO_PERMITIDO',
      error: 'Acceso denegado',
      mensaje: 'Acción permitida solo para Jefe de Proyecto.',
    };
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(cuerpoError), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(solicitar('/protegido')).rejects.toThrow(ErrorSolicitud);
    try {
      await solicitar('/protegido');
    } catch (e) {
      const err = e as ErrorSolicitud;
      expect(err.estado).toBe(403);
      expect(err.cuerpo.codigo).toBe('ROL_NO_PERMITIDO');
      expect(err.cuerpo.mensaje).toBe('Acción permitida solo para Jefe de Proyecto.');
    }
  });

  it('produce error SIN_CONEXION si fetch es rechazado por fallo de red', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(solicitar('/salud')).rejects.toThrow(ErrorSolicitud);
    try {
      await solicitar('/salud');
    } catch (e) {
      const err = e as ErrorSolicitud;
      expect(err.estado).toBe(0);
      expect(err.cuerpo.codigo).toBe('SIN_CONEXION');
    }
  });

  it('propaga AbortError tal cual cuando la peticion es cancelada', async () => {
    const errorAbort = new DOMException('The user aborted a request.', 'AbortError');
    globalThis.fetch = vi.fn().mockRejectedValue(errorAbort);

    await expect(solicitar('/cancelable')).rejects.toBe(errorAbort);
  });

  it('produce RESPUESTA_INESPERADA si la API responde 500 con HTML', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('<html>Error</html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(solicitar('/error')).rejects.toThrow(ErrorSolicitud);
    try {
      await solicitar('/error');
    } catch (e) {
      const err = e as ErrorSolicitud;
      expect(err.estado).toBe(500);
      expect(err.cuerpo.codigo).toBe('RESPUESTA_INESPERADA');
    }
  });
});
