import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DependenciaTarea, TareaArbol } from '@autofix/core';
import * as dependenciasApi from '../api/dependencias';
import { CLAVE_ROL } from '../sesion/almacenamiento';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { DetalleTarea } from './detalle-tarea';

describe('DetalleTarea', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderConRol = (ui: React.ReactElement, rol: string = 'JP') => {
    localStorage.setItem(CLAVE_ROL, rol);
    return render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ProveedorSesion>{ui}</ProveedorSesion>
        </MantineProvider>
      </QueryClientProvider>,
    );
  };

  const tareaA: TareaArbol = {
    id: 1,
    padreId: null,
    nivel: 'ACTIVIDAD',
    codigo: '1.1',
    orden: 1,
    nombre: 'Tarea A',
    descripcion: null,
    responsable: null,
    duracionDias: 3,
    fechaFija: null,
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

  const tareaB: TareaArbol = {
    id: 2,
    padreId: null,
    nivel: 'ACTIVIDAD',
    codigo: '1.2',
    orden: 2,
    nombre: 'Tarea B',
    descripcion: null,
    responsable: null,
    duracionDias: 2,
    fechaFija: null,
    inicioPlan: '2026-11-05',
    finPlan: '2026-11-06',
    inicioTardio: '2026-11-05',
    finTardio: '2026-11-06',
    holguraDias: 0,
    esCritica: true,
    inicioReal: null,
    finReal: null,
    porcentajeAvance: 0,
    tieneHijas: false,
  };

  const tareaPadre: TareaArbol = {
    id: 3,
    padreId: null,
    nivel: 'ETAPA',
    codigo: '1',
    orden: 0,
    nombre: 'Etapa Madre',
    descripcion: null,
    responsable: null,
    duracionDias: 5,
    fechaFija: null,
    inicioPlan: '2026-11-02',
    finPlan: '2026-11-06',
    inicioTardio: '2026-11-02',
    finTardio: '2026-11-06',
    holguraDias: 0,
    esCritica: true,
    inicioReal: null,
    finReal: null,
    porcentajeAvance: 0,
    tieneHijas: true,
  };

  const todas = [tareaA, tareaB, tareaPadre];

  const depAB: DependenciaTarea = {
    id: 10,
    predecesoraId: 1,
    sucesoraId: 2,
    tipo: 'FS',
    desfaseDias: 0,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lista predecesoras cuando se consulta la sucesora', () => {
    vi.spyOn(dependenciasApi, 'useDependencias').mockReturnValue({
      data: [depAB],
      isLoading: false,
    } as unknown as ReturnType<typeof dependenciasApi.useDependencias>);

    renderConRol(
      <DetalleTarea
        tarea={tareaB}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'JP',
    );

    expect(screen.getByText('Predecesoras')).toBeInTheDocument();
    expect(screen.getByText('1.1 · Tarea A')).toBeInTheDocument();
    expect(screen.getByText('FS (Fin a inicio)')).toBeInTheDocument();
  });

  it('lista sucesoras cuando se consulta la predecesora', () => {
    vi.spyOn(dependenciasApi, 'useDependencias').mockReturnValue({
      data: [depAB],
      isLoading: false,
    } as unknown as ReturnType<typeof dependenciasApi.useDependencias>);

    renderConRol(
      <DetalleTarea
        tarea={tareaA}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'JP',
    );

    expect(screen.getByText('Sucesoras')).toBeInTheDocument();
    expect(screen.getByText('1.2 · Tarea B')).toBeInTheDocument();
  });

  it('muestra aviso cuando la tarea tiene subtareas', () => {
    vi.spyOn(dependenciasApi, 'useDependencias').mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof dependenciasApi.useDependencias>);

    renderConRol(
      <DetalleTarea
        tarea={tareaPadre}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'JP',
    );

    expect(
      screen.getByText('Las dependencias se definen entre tareas sin subtareas.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Predecesoras')).not.toBeInTheDocument();
  });

  it('muestra el ciclo si la mutacion falla con CICLO_DETECTADO', () => {
    vi.spyOn(dependenciasApi, 'useDependencias').mockReturnValue({
      data: [depAB],
      isLoading: false,
    } as unknown as ReturnType<typeof dependenciasApi.useDependencias>);

    vi.spyOn(dependenciasApi, 'useCrearDependencia').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: {
        estado: 422,
        name: 'ErrorSolicitud',
        message: 'Ciclo detectado: 1.1 → 1.2 → 1.1',
        cuerpo: {
          codigo: 'CICLO_DETECTADO',
          error: 'Unprocessable Entity',
          mensaje: 'Ciclo detectado: 1.1 → 1.2 → 1.1',
        },
      },
      reset: vi.fn(),
    } as unknown as ReturnType<typeof dependenciasApi.useCrearDependencia>);

    renderConRol(
      <DetalleTarea
        tarea={tareaA}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'JP',
    );

    expect(screen.getByText('Ciclo detectado: 1.1 → 1.2 → 1.1')).toBeInTheDocument();
  });

  it('deshabilita controles con rol CC', () => {
    vi.spyOn(dependenciasApi, 'useDependencias').mockReturnValue({
      data: [depAB],
      isLoading: false,
    } as unknown as ReturnType<typeof dependenciasApi.useDependencias>);

    renderConRol(
      <DetalleTarea
        tarea={tareaB}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'CC',
    );

    expect(screen.getByPlaceholderText('Seleccione una tarea')).toBeDisabled();
    expect(screen.getByLabelText(/Desfase \(días hábiles\)/i)).toBeDisabled();

    const botonAgregar = screen.getByRole('button', { name: /Agregar predecesora/i });
    expect(botonAgregar).toHaveAttribute('aria-disabled', 'true');
  });

  it('abre el panel sin bucle infinito usando los hooks reales de dependencias', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      }),
    );

    const { rerender } = renderConRol(
      <DetalleTarea
        tarea={tareaA}
        todasLasTareas={todas}
        proyectoId={1}
        abierto={true}
        alCerrar={() => {}}
      />,
      'JP',
    );

    expect(await screen.findByText('Predecesoras')).toBeInTheDocument();
    const selector = await screen.findByPlaceholderText('Seleccione una tarea');
    expect(selector).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: '1.2 · Tarea B' } });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ProveedorSesion>
            <DetalleTarea
              tarea={tareaA}
              todasLasTareas={todas}
              proyectoId={1}
              abierto={true}
              alCerrar={() => {}}
            />
          </ProveedorSesion>
        </MantineProvider>
      </QueryClientProvider>,
    );

    expect(selector).toBeInTheDocument();
  });
});
