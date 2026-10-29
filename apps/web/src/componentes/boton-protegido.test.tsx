import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CLAVE_ROL } from '../sesion/almacenamiento';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { BotonProtegido } from './boton-protegido';

function renderConSesion(ui: React.ReactElement, rol: string) {
  localStorage.setItem(CLAVE_ROL, rol);
  return render(
    <MantineProvider>
      <ProveedorSesion>{ui}</ProveedorSesion>
    </MantineProvider>,
  );
}

describe('BotonProtegido', () => {
  it('ejecuta onClick cuando el rol tiene permiso (JP)', () => {
    const alHacerClic = vi.fn();
    renderConSesion(
      <BotonProtegido permiso="editarPlanificacion" onClick={alHacerClic}>
        Crear
      </BotonProtegido>,
      'JP',
    );

    const boton = screen.getByRole('button', { name: 'Crear' });
    expect(boton).not.toHaveAttribute('aria-disabled');
    fireEvent.click(boton);
    expect(alHacerClic).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta onClick y posee aria-disabled cuando el rol no tiene permiso (CC)', () => {
    const alHacerClic = vi.fn();
    renderConSesion(
      <BotonProtegido permiso="editarPlanificacion" onClick={alHacerClic}>
        Crear
      </BotonProtegido>,
      'CC',
    );

    const boton = screen.getByRole('button', { name: 'Crear' });
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(boton).toHaveAttribute('data-disabled', 'true');
    fireEvent.click(boton);
    expect(alHacerClic).not.toHaveBeenCalled();
  });

  it('muestra el tooltip "Solo Jefe de Proyecto" al pasar el mouse con rol CC', async () => {
    renderConSesion(
      <BotonProtegido permiso="editarPlanificacion" onClick={vi.fn()}>
        Crear
      </BotonProtegido>,
      'CC',
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Crear' }));
    expect(await screen.findByText('Solo Jefe de Proyecto')).toBeInTheDocument();
  });
});
