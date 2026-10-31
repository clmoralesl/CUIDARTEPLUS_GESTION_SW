import { notifications } from '@mantine/notifications';
import { describe, expect, it, vi } from 'vitest';
import type { TareaAfectada } from '@autofix/core';
import {
  formatearDetalleTareaAfectada,
  formatearTextoAviso,
  mostrarAvisoRecalculo,
} from './aviso-recalculo';

describe('aviso-recalculo', () => {
  it('formatea detalle segun si cambio inicio o fin', () => {
    const cambioInicio: TareaAfectada = {
      id: 2,
      codigo: '2.1.2',
      inicioAnterior: '2026-11-24',
      inicioNuevo: '2026-11-26',
      finAnterior: '2026-12-03',
      finNuevo: '2026-12-07',
    };
    expect(formatearDetalleTareaAfectada(cambioInicio)).toBe('2.1.2: 24-11-2026 → 26-11-2026');

    const cambioFin: TareaAfectada = {
      id: 1,
      codigo: '2.1.1',
      inicioAnterior: '2026-11-16',
      inicioNuevo: '2026-11-16',
      finAnterior: '2026-11-23',
      finNuevo: '2026-11-25',
    };
    expect(formatearDetalleTareaAfectada(cambioFin)).toBe('2.1.1: 23-11-2026 → 25-11-2026');
  });

  it('devuelve mensaje sin cambios si arreglo vacio', () => {
    expect(formatearTextoAviso([])).toBe('Sin cambios en el cronograma.');
  });

  it('muestra hasta 5 tareas y resume el exceso con y N mas', () => {
    const tareas: TareaAfectada[] = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      codigo: `1.${i + 1}`,
      inicioAnterior: '2026-11-02',
      inicioNuevo: '2026-11-03',
      finAnterior: '2026-11-05',
      finNuevo: '2026-11-06',
    }));

    const texto = formatearTextoAviso(tareas);
    const lineas = texto.split('\n');

    expect(lineas[0]).toBe('8 tareas reprogramadas');
    expect(lineas).toHaveLength(7);
    expect(lineas[6]).toBe('y 3 más');
  });

  it('envia notificacion con whiteSpace pre-line en styles', () => {
    const spy = vi.spyOn(notifications, 'show').mockImplementation(() => '');
    mostrarAvisoRecalculo('Prueba', []);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prueba',
        styles: { description: { whiteSpace: 'pre-line' } },
      }),
    );
  });
});
