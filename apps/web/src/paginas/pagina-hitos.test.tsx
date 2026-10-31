import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListaHitos } from '@autofix/core';
import { CLAVE_PROYECTO, CLAVE_ROL } from '../sesion/almacenamiento';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { PaginaHitos } from './pagina-hitos';

describe('PaginaHitos', () => {
  const listaMock: ListaHitos = {
    proyectoId: 1,
    fechaCalculo: '2026-10-30',
    hitos: [
      {
        id: 1,
        proyectoId: 1,
        nombre: 'Acta de inicio aprobada',
        criterio: 'Firmada por el cliente',
        responsable: 'Jefe de Proyecto',
        fechaObjetivo: '2026-10-30',
        fechaCumplimiento: '2026-10-29',
        tarea: null,
        estado: 'CUMPLIDO',
        aTiempo: true,
        diasHabilesRestantes: 0,
      },
      {
        id: 2,
        proyectoId: 1,
        nombre: 'Módulo de órdenes operativo',
        criterio: null,
        responsable: 'Desarrollador Senior',
        fechaObjetivo: '2026-12-04',
        fechaCumplimiento: null,
        tarea: {
          id: 10,
          codigo: '2.1',
          nombre: 'Módulo de órdenes',
          finPlan: '2026-12-03',
          porcentajeAvance: 0,
        },
        estado: 'PENDIENTE',
        aTiempo: null,
        diasHabilesRestantes: 25,
      },
      {
        id: 3,
        proyectoId: 1,
        nombre: 'Revisión con el dueño',
        criterio: null,
        responsable: 'Jefe de Proyecto',
        fechaObjetivo: '2026-11-04',
        fechaCumplimiento: null,
        tarea: null,
        estado: 'EN_RIESGO',
        aTiempo: null,
        diasHabilesRestantes: 3,
      },
      {
        id: 4,
        proyectoId: 1,
        nombre: 'Procesos del taller levantados',
        criterio: null,
        responsable: 'Jefe de Taller',
        fechaObjetivo: '2026-11-06',
        fechaCumplimiento: null,
        tarea: {
          id: 5,
          codigo: '1.1',
          nombre: 'Levantamiento de procesos',
          finPlan: '2026-11-10',
          porcentajeAvance: 71.43,
        },
        estado: 'ATRASADO',
        aTiempo: false,
        diasHabilesRestantes: 5,
      },
    ],
  };

  beforeEach(() => {
    localStorage.setItem(CLAVE_PROYECTO, '1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/proyectos/1/hitos')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(listaMock),
          });
        }
        if (url.includes('/proyectos/1/tareas')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ proyectoId: 1, tareas: [] }),
          });
        }
        if (url.includes('/proyectos/1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                id: 1,
                nombre: 'AutoFix · Implementación',
                estado: 'EN_CURSO',
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        });
      }),
    );
  });

  const renderConRol = (rol: string = 'JP') => {
    localStorage.setItem(CLAVE_ROL, rol);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ProveedorSesion>
            <PaginaHitos />
          </ProveedorSesion>
        </MantineProvider>
      </QueryClientProvider>,
    );
  };

  it('renderiza la lista de hitos con sus 4 estados y permite filtrar', async () => {
    renderConRol('JP');

    expect(await screen.findByText('Hitos: AutoFix · Implementación')).toBeInTheDocument();
    expect(screen.getByText('Estados calculados al 30-10-2026')).toBeInTheDocument();

    expect(screen.getByText('Acta de inicio aprobada')).toBeInTheDocument();
    expect(screen.getByText('Módulo de órdenes operativo')).toBeInTheDocument();
    expect(screen.getByText('Revisión con el dueño')).toBeInTheDocument();
    expect(screen.getByText('Procesos del taller levantados')).toBeInTheDocument();

    expect(screen.getByText('Cumplido')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('En riesgo')).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument();

    const filtroCumplido = screen.getByText(/Cumplido \(1\)/i);
    fireEvent.click(filtroCumplido);

    expect(screen.getByText('Acta de inicio aprobada')).toBeInTheDocument();
    expect(screen.queryByText('Módulo de órdenes operativo')).not.toBeInTheDocument();
  });

  it('deshabilita controles de creacion y eliminacion con rol CC', async () => {
    renderConRol('CC');

    expect(await screen.findByText('Hitos: AutoFix · Implementación')).toBeInTheDocument();

    const botonNuevo = screen.getByRole('button', { name: /Nuevo hito/i });
    expect(botonNuevo).toHaveAttribute('aria-disabled', 'true');
    expect(botonNuevo).toHaveAttribute('data-disabled', 'true');

    const botonesEliminar = screen.getAllByLabelText(/Eliminar hito/i);
    for (const b of botonesEliminar) {
      expect(b).toHaveAttribute('aria-disabled', 'true');
      expect(b).toHaveAttribute('data-disabled', 'true');
    }
  });

  it('permite abrir el modal de nuevo hito con rol JP', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    renderConRol('JP');

    expect(await screen.findByText('Hitos: AutoFix · Implementación')).toBeInTheDocument();

    const botonNuevo = screen.getByRole('button', { name: /Nuevo hito/i });
    fireEvent.click(botonNuevo);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const campoNombre = screen.getByLabelText(/Nombre del hito/i);
    expect(campoNombre).toBeInTheDocument();
    expect(campoNombre).toHaveValue('');
    expect(campoNombre).not.toBeDisabled();

    for (const call of errorSpy.mock.calls) {
      expect(call.join(' ')).not.toMatch(/Maximum update depth/i);
    }
  });

  it('permite editar hitos distintos mostrando sus valores respectivos con rol JP', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    renderConRol('JP');

    expect(await screen.findByText('Hitos: AutoFix · Implementación')).toBeInTheDocument();

    const botonEditar1 = screen.getByLabelText(/Editar hito Acta de inicio aprobada/i);
    fireEvent.click(botonEditar1);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const campoNombre = screen.getByLabelText(/Nombre del hito/i);
    expect(campoNombre).toHaveValue('Acta de inicio aprobada');

    const botonCancelar = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(botonCancelar);

    const botonEditar2 = screen.getByLabelText(/Editar hito Revisión con el dueño/i);
    fireEvent.click(botonEditar2);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del hito/i)).toHaveValue('Revisión con el dueño');

    for (const call of errorSpy.mock.calls) {
      expect(call.join(' ')).not.toMatch(/Maximum update depth/i);
    }
  });

  it('permite ver detalle del hito en modo solo lectura con rol CC', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    renderConRol('CC');

    expect(await screen.findByText('Hitos: AutoFix · Implementación')).toBeInTheDocument();

    const botonVer = screen.getByLabelText(/Ver hito Acta de inicio aprobada/i);
    fireEvent.click(botonVer);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const campoNombre = screen.getByLabelText(/Nombre del hito/i);
    expect(campoNombre).toHaveValue('Acta de inicio aprobada');
    expect(campoNombre).toBeDisabled();

    expect(screen.queryByRole('button', { name: /Guardar cambios/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();

    for (const call of errorSpy.mock.calls) {
      expect(call.join(' ')).not.toMatch(/Maximum update depth/i);
    }
  });
});
