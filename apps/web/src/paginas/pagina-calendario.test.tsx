import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CLAVE_ROL } from '../sesion/almacenamiento';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { PaginaCalendario } from './pagina-calendario';

const mockProyecto = {
  id: 1,
  nombre: 'AutoFix · Implementación',
  estado: 'EN_CURSO',
  responsable: 'Jefe de Proyecto',
};

const mockCalendario = {
  proyectoId: 1,
  diasLaborables: [1, 2, 3, 4, 5],
  horasPorDia: 8,
  feriados: [
    { id: 1, fecha: '2026-12-08', descripcion: 'Inmaculada Concepción' },
    { id: 2, fecha: '2026-12-25', descripcion: 'Navidad' },
  ],
};

vi.mock('../api/proyectos', () => ({
  useProyecto: () => ({
    data: mockProyecto,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../api/calendario', () => ({
  useCalendario: () => ({
    data: mockCalendario,
    isLoading: false,
  }),
  useActualizarCalendario: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCrearFeriado: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useEliminarFeriado: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function renderPaginaCalendario(rol = 'JP') {
  localStorage.setItem(CLAVE_ROL, rol);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const enrutador = createMemoryRouter(
    [
      {
        path: '/proyectos/:proyectoId/calendario',
        element: <PaginaCalendario />,
      },
    ],
    {
      initialEntries: ['/proyectos/1/calendario'],
    },
  );

  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ProveedorSesion>
          <RouterProvider router={enrutador} />
        </ProveedorSesion>
      </QueryClientProvider>
    </MantineProvider>,
  );
}

describe('PaginaCalendario', () => {
  it('muestra configuracion de calendario y feriados ordenados con rol JP', () => {
    renderPaginaCalendario('JP');

    expect(screen.getByText(/Calendario laboral: AutoFix · Implementación/i)).toBeInTheDocument();
    expect(screen.getByText(/Días laborables y jornada/i)).toBeInTheDocument();
    expect(screen.getByText(/Feriados del proyecto/i)).toBeInTheDocument();

    expect(screen.getByText('08-12-2026')).toBeInTheDocument();
    expect(screen.getByText('Inmaculada Concepción')).toBeInTheDocument();
    expect(screen.getByText('25-12-2026')).toBeInTheDocument();
    expect(screen.getByText('Navidad')).toBeInTheDocument();

    const botonGuardar = screen.getByRole('button', { name: /Guardar calendario/i });
    expect(botonGuardar).not.toHaveAttribute('aria-disabled');

    const botonAgregar = screen.getByRole('button', { name: /Agregar feriado/i });
    expect(botonAgregar).not.toHaveAttribute('aria-disabled');
  });

  it('deshabilita controles de mutacion con rol CC', () => {
    renderPaginaCalendario('CC');

    const casillaLunes = screen.getByRole('checkbox', { name: /Lunes/i });
    expect(casillaLunes).toBeDisabled();

    const campoHoras = screen.getByLabelText(/Horas por día/i);
    expect(campoHoras).toBeDisabled();

    const campoDescripcion = screen.getByLabelText(/Descripción/i);
    expect(campoDescripcion).toBeDisabled();

    const botonGuardar = screen.getByRole('button', { name: /Guardar calendario/i });
    expect(botonGuardar).toHaveAttribute('aria-disabled', 'true');
    expect(botonGuardar).toHaveAttribute('data-disabled', 'true');

    const botonAgregar = screen.getByRole('button', { name: /Agregar feriado/i });
    expect(botonAgregar).toHaveAttribute('aria-disabled', 'true');
    expect(botonAgregar).toHaveAttribute('data-disabled', 'true');

    const botonEliminar = screen.getByRole('button', {
      name: /Eliminar feriado del 08-12-2026/i,
    });
    expect(botonEliminar).toHaveAttribute('aria-disabled', 'true');
    expect(botonEliminar).toHaveAttribute('data-disabled', 'true');
  });
});
