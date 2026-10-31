import { describe, expect, it } from 'vitest';
import { esquemaActualizarTarea, esquemaCrearTarea, esquemaMoverTarea } from './tareas';
import { validar } from './validacion';

describe('tareas esquemas', () => {
  it('valida creacion de tareas con duracion por defecto y limites correctos', () => {
    const etapaOk = validar(esquemaCrearTarea, {
      nivel: 'ETAPA',
      padreId: null,
      nombre: 'Levantamiento inicial',
    });
    expect(etapaOk.ok).toBe(true);
    if (etapaOk.ok) {
      expect(etapaOk.datos.duracionDias).toBe(1);
    }

    const actividadOk = validar(esquemaCrearTarea, {
      nivel: 'ACTIVIDAD',
      padreId: 10,
      nombre: 'Diseño de modelos',
      duracionDias: 5,
      fechaFija: '2026-11-02',
      posicion: 2,
    });
    expect(actividadOk.ok).toBe(true);

    const nombreLargo = validar(esquemaCrearTarea, {
      nivel: 'ETAPA',
      padreId: null,
      nombre: 'A'.repeat(201),
    });
    expect(nombreLargo.ok).toBe(false);

    const duracionInvalida = validar(esquemaCrearTarea, {
      nivel: 'ETAPA',
      padreId: null,
      nombre: 'Etapa prueba',
      duracionDias: -1,
    });
    expect(duracionInvalida.ok).toBe(false);
  });

  it('valida actualizacion parcial y rechaza cuerpo vacio', () => {
    const parcialOk = validar(esquemaActualizarTarea, {
      nombre: 'Nuevo nombre de actividad',
      porcentajeAvance: 45.5,
    });
    expect(parcialOk.ok).toBe(true);

    const vacio = validar(esquemaActualizarTarea, {});
    expect(vacio.ok).toBe(false);
    if (!vacio.ok) {
      expect(vacio.detalles[0].mensaje).toBe('Debe enviar al menos un campo para actualizar.');
    }
  });

  it('rechaza llaves no permitidas con un solo mensaje sin agregar cuerpo vacio', () => {
    const conLlaveDesconocida = validar(esquemaActualizarTarea, {
      codigo: '1.2',
    });
    expect(conLlaveDesconocida.ok).toBe(false);
    if (!conLlaveDesconocida.ok) {
      expect(conLlaveDesconocida.detalles.length).toBe(1);
      expect(conLlaveDesconocida.detalles[0].mensaje).toContain('codigo');
    }
  });

  it('valida coherencia de fechas reales y rechaza fin anterior a inicio', () => {
    const fechasOk = validar(esquemaActualizarTarea, {
      inicioReal: '2026-11-02',
      finReal: '2026-11-05',
    });
    expect(fechasOk.ok).toBe(true);

    const fechasInvertidas = validar(esquemaActualizarTarea, {
      inicioReal: '2026-11-06',
      finReal: '2026-11-02',
    });
    expect(fechasInvertidas.ok).toBe(false);
    if (!fechasInvertidas.ok) {
      expect(fechasInvertidas.detalles[0].campo).toBe('finReal');
      expect(fechasInvertidas.detalles[0].mensaje).toBe(
        'La fecha de fin real no puede ser anterior a la de inicio real.',
      );
    }
  });

  it('valida decimales y limites en porcentajeAvance', () => {
    const avanceOk = validar(esquemaActualizarTarea, { porcentajeAvance: 33.33 });
    expect(avanceOk.ok).toBe(true);

    const avanceTresDecimales = validar(esquemaActualizarTarea, { porcentajeAvance: 33.333 });
    expect(avanceTresDecimales.ok).toBe(false);

    const avanceNegativo = validar(esquemaActualizarTarea, { porcentajeAvance: -5 });
    expect(avanceNegativo.ok).toBe(false);

    const avanceExcedido = validar(esquemaActualizarTarea, { porcentajeAvance: 105 });
    expect(avanceExcedido.ok).toBe(false);
  });

  it('valida esquema de mover tarea', () => {
    const moverOk = validar(esquemaMoverTarea, { padreId: 2, posicion: 1 });
    expect(moverOk.ok).toBe(true);

    const moverRaiz = validar(esquemaMoverTarea, { padreId: null });
    expect(moverRaiz.ok).toBe(true);

    const moverInvalido = validar(esquemaMoverTarea, { padreId: -1 });
    expect(moverInvalido.ok).toBe(false);
  });
});
