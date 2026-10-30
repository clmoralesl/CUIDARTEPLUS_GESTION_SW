import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TareaArbol } from '@autofix/core';
import { FormularioTarea } from './formulario-tarea';

describe('FormularioTarea', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderFormulario = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{ui}</MantineProvider>
      </QueryClientProvider>,
    );
  };

  it('no muestra los campos calculados cuando la tarea tiene hijas', () => {
    const tareaConHijas: TareaArbol = {
      id: 1,
      padreId: null,
      nivel: 'ETAPA',
      codigo: '1',
      orden: 1,
      nombre: 'Etapa con subtareas',
      descripcion: 'Detalle',
      responsable: 'Jefe',
      duracionDias: 10,
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-11',
      inicioReal: '2026-11-02',
      finReal: null,
      porcentajeAvance: 60,
      tieneHijas: true,
    };

    renderFormulario(
      <FormularioTarea modo="editar" proyectoId={1} tarea={tareaConHijas} alCerrar={() => {}} />,
    );

    expect(
      screen.getByText(/Esta tarea se calcula a partir de sus subtareas/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Responsable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/Duración \(días\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fecha de inicio plan/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Porcentaje de avance/i)).not.toBeInTheDocument();
  });

  it('muestra campos de duracion, fechas y avance cuando es tarea hoja', () => {
    const tareaHoja: TareaArbol = {
      id: 2,
      padreId: 1,
      nivel: 'SUBACTIVIDAD',
      codigo: '1.1.1',
      orden: 1,
      nombre: 'Subactividad hoja',
      descripcion: null,
      responsable: null,
      duracionDias: 3,
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-04',
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 0,
      tieneHijas: false,
    };

    renderFormulario(
      <FormularioTarea modo="editar" proyectoId={1} tarea={tareaHoja} alCerrar={() => {}} />,
    );

    expect(screen.getByLabelText(/Duración \(días\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de inicio plan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Porcentaje de avance/i)).toBeInTheDocument();
  });
});
