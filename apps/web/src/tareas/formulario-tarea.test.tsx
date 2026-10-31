import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TareaArbol } from '@autofix/core';
import * as tareasApi from '../api/tareas';
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
      fechaFija: null,
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-11',
      inicioTardio: '2026-11-02',
      finTardio: '2026-11-11',
      holguraDias: 0,
      esCritica: true,
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

    expect(screen.queryByLabelText(/Duración \(días hábiles\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fecha fija \(no comenzar antes de\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Porcentaje de avance/i)).not.toBeInTheDocument();
  });

  it('muestra campos de duracion, fecha fija, fechas calculadas y avance cuando es tarea hoja', () => {
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
      fechaFija: '2026-11-02',
      inicioPlan: '2026-11-02',
      finPlan: '2026-11-04',
      inicioTardio: '2026-11-02',
      finTardio: '2026-11-04',
      holguraDias: 0,
      esCritica: true,
      inicioReal: null,
      finReal: null,
      porcentajeAvance: 0,
      tieneHijas: false,
    };

    renderFormulario(
      <FormularioTarea modo="editar" proyectoId={1} tarea={tareaHoja} alCerrar={() => {}} />,
    );

    expect(screen.getByLabelText(/Duración \(días hábiles\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha fija \(no comenzar antes de\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Inicio calculado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fin calculado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Porcentaje de avance/i)).toBeInTheDocument();
  });

  it('envia fechaFija y no inicioPlan al crear', () => {
    const mutateMock = vi.fn();
    vi.spyOn(tareasApi, 'useCrearTarea').mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof tareasApi.useCrearTarea>);

    renderFormulario(
      <FormularioTarea
        modo="crear"
        proyectoId={1}
        nivel="ACTIVIDAD"
        padreId={1}
        padreEsHoja={false}
        alCerrar={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Tarea Nueva' } });
    fireEvent.change(screen.getByLabelText(/Fecha fija \(no comenzar antes de\)/i), {
      target: { value: '2026-11-05' },
    });

    const botonGuardar = screen.getByRole('button', { name: /Crear tarea/i });
    fireEvent.click(botonGuardar);

    expect(mutateMock).toHaveBeenCalled();
    const datosEnviados = mutateMock.mock.calls[0]?.[0];
    expect(datosEnviados).toHaveProperty('fechaFija', '2026-11-05');
    expect(datosEnviados).not.toHaveProperty('inicioPlan');
  });
});
