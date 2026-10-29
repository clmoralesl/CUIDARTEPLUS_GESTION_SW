import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useParams } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { SelectorProyecto } from './selector-proyecto';

vi.mock('../api/proyectos', () => ({
  useProyectos: () => ({
    data: [
      {
        id: 4,
        nombre: 'AutoFix · Implementación',
        responsable: 'Jefe de Proyecto',
        presupuesto: 45000000,
        fechaInicio: '2026-11-02',
        fechaFin: '2027-03-31',
        estado: 'EN_CURSO',
        porcentajeAvance: 0,
        creadoEn: '2026-10-29T21:00:00.000Z',
        actualizadoEn: '2026-10-29T21:00:00.000Z',
      },
      {
        id: 6,
        nombre: 'Piloto de agenda · 2026',
        responsable: 'Jefe de Proyecto',
        presupuesto: 8000000,
        fechaInicio: '2026-03-02',
        fechaFin: '2026-06-30',
        estado: 'CERRADO',
        porcentajeAvance: 0,
        creadoEn: '2026-10-29T21:00:00.000Z',
        actualizadoEn: '2026-10-29T21:00:00.000Z',
      },
    ],
    isLoading: false,
  }),
}));

function ComponenteDetalle() {
  const { proyectoId } = useParams();
  return (
    <div>
      <SelectorProyecto />
      <span data-testid="id-actual">detalle-{proyectoId}</span>
    </div>
  );
}

describe('SelectorProyecto', () => {
  it('navega al proyecto seleccionado cuando el usuario se encuentra en la pagina de detalle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const enrutador = createMemoryRouter(
      [
        {
          path: '/proyectos/:proyectoId',
          element: <ComponenteDetalle />,
        },
      ],
      {
        initialEntries: ['/proyectos/4'],
      },
    );

    render(
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <ProveedorSesion>
            <RouterProvider router={enrutador} />
          </ProveedorSesion>
        </QueryClientProvider>
      </MantineProvider>,
    );

    expect(screen.getByTestId('id-actual')).toHaveTextContent('detalle-4');

    const entradaSelect = screen.getByPlaceholderText('Seleccionar proyecto');
    fireEvent.click(entradaSelect);

    const opcionCerrada = await screen.findByRole('option', {
      name: 'Piloto de agenda · 2026 (Cerrado)',
    });
    fireEvent.click(opcionCerrada);

    expect(screen.getByTestId('id-actual')).toHaveTextContent('detalle-6');
  });
});
