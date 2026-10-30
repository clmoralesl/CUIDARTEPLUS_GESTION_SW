import { describe, expect, it } from 'vitest';
import {
  CalendarioSinDiasHabilesError,
  anteriorHabil,
  crearCalendarioLaboral,
  diasHabilesEntre,
  esHabil,
  esquemaActualizarCalendario,
  esquemaCrearFeriado,
  esquemaDiasLaborables,
  formatearDuracion,
  siguienteHabil,
  sumarDiasHabiles,
} from './calendario';
import { FERIADOS_CHILE } from './feriados-chile';
import { validar } from './validacion';

describe('calendario laboral', () => {
  const calendarioChile = crearCalendarioLaboral({
    diasLaborables: [1, 2, 3, 4, 5],
    feriados: FERIADOS_CHILE.map((f) => f.fecha),
  });

  it('suma dias habiles cruzando fin de semana', () => {
    expect(sumarDiasHabiles('2026-11-06', 1, calendarioChile)).toBe('2026-11-09');
  });

  it('suma dias habiles cruzando un feriado', () => {
    expect(sumarDiasHabiles('2026-12-07', 1, calendarioChile)).toBe('2026-12-09');
  });

  it('suma 0 dias partiendo de un dia no habil y de un dia habil', () => {
    expect(sumarDiasHabiles('2026-11-07', 0, calendarioChile)).toBe('2026-11-09');
    expect(sumarDiasHabiles('2026-11-02', 0, calendarioChile)).toBe('2026-11-02');
  });

  it('suma dias negativos hacia atras cruzando fin de semana y feriado', () => {
    expect(sumarDiasHabiles('2026-11-09', -1, calendarioChile)).toBe('2026-11-06');
    expect(sumarDiasHabiles('2026-12-09', -1, calendarioChile)).toBe('2026-12-07');
  });

  it('calcula dias habiles entre fechas con signo y antisimetria', () => {
    expect(diasHabilesEntre('2026-11-02', '2026-11-06', calendarioChile)).toBe(4);
    expect(diasHabilesEntre('2026-11-06', '2026-11-02', calendarioChile)).toBe(-4);
    expect(diasHabilesEntre('2026-11-02', '2026-11-02', calendarioChile)).toBe(0);
  });

  it('maneja extremos no habiles manteniendo antisimetria', () => {
    expect(diasHabilesEntre('2026-11-07', '2026-11-09', calendarioChile)).toBe(1);
    expect(diasHabilesEntre('2026-11-09', '2026-11-07', calendarioChile)).toBe(-1);
  });

  it('evalua feriado en sabado sin duplicar descarte', () => {
    expect(esHabil('2027-03-27', calendarioChile)).toBe(false);
  });

  it('soporta calendario configurado con sabado laborable', () => {
    const conSabado = crearCalendarioLaboral({
      diasLaborables: [1, 2, 3, 4, 5, 6],
      feriados: [],
    });
    expect(sumarDiasHabiles('2026-11-06', 1, conSabado)).toBe('2026-11-07');
  });

  it('termina sin bucle infinito con un solo dia laborable y multiples feriados', () => {
    const feriadosLunes = [
      '2026-01-05',
      '2026-01-12',
      '2026-01-19',
      '2026-01-26',
      '2026-02-02',
      '2026-02-09',
      '2026-02-16',
      '2026-02-23',
      '2026-03-02',
      '2026-03-09',
      '2026-03-16',
      '2026-03-23',
      '2026-03-30',
      '2026-04-06',
      '2026-04-13',
      '2026-04-20',
      '2026-04-27',
      '2026-05-04',
      '2026-05-11',
      '2026-05-18',
      '2026-05-25',
      '2026-06-01',
      '2026-06-08',
      '2026-06-15',
      '2026-06-22',
      '2026-06-29',
      '2026-07-06',
      '2026-07-13',
      '2026-07-20',
      '2026-07-27',
      '2026-08-03',
      '2026-08-10',
      '2026-08-17',
      '2026-08-24',
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07',
      '2026-12-14',
      '2026-12-21',
      '2026-12-28',
    ];
    const soloLunes = crearCalendarioLaboral({
      diasLaborables: [1],
      feriados: feriadosLunes,
    });
    expect(sumarDiasHabiles('2026-01-01', 1, soloLunes)).toBe('2027-01-04');
  });

  it('lanza CalendarioSinDiasHabilesError si diasLaborables es vacio', () => {
    expect(() => crearCalendarioLaboral({ diasLaborables: [] })).toThrow(
      CalendarioSinDiasHabilesError,
    );
  });

  it('lanza RangeError si n no es un numero entero', () => {
    expect(() => sumarDiasHabiles('2026-11-02', 1.5, calendarioChile)).toThrow(RangeError);
  });

  it('cumple propiedad inversa entre sumar y contar dias habiles en recorrido', () => {
    const diasHabiles: string[] = [];
    const inicioEpoca = Math.round(Date.parse('2026-11-01T00:00:00.000Z') / 86_400_000);
    const finEpoca = Math.round(Date.parse('2027-01-31T00:00:00.000Z') / 86_400_000);

    for (let dia = inicioEpoca; dia <= finEpoca; dia += 1) {
      const iso = new Date(dia * 86_400_000).toISOString().slice(0, 10);
      if (esHabil(iso, calendarioChile)) {
        diasHabiles.push(iso);
      }
    }

    const muestra = diasHabiles.filter((_, idx) => idx % 4 === 0);
    for (const a of muestra) {
      for (const b of muestra) {
        const distancia = diasHabilesEntre(a, b, calendarioChile);
        expect(sumarDiasHabiles(a, distancia, calendarioChile)).toBe(b);
      }
    }
  });

  it('ejecuta 10000 llamadas a sumarDiasHabiles en menos de 200 ms', () => {
    const inicio = performance.now();
    for (let i = 0; i < 10_000; i += 1) {
      sumarDiasHabiles('2026-11-02', 60, calendarioChile);
    }
    const duracion = performance.now() - inicio;
    expect(duracion).toBeLessThan(200);
  });

  it('formatea duraciones en singular y plural', () => {
    expect(formatearDuracion(1)).toBe('1 día hábil');
    expect(formatearDuracion(0)).toBe('0 días hábiles');
    expect(formatearDuracion(7)).toBe('7 días hábiles');
  });

  it('normaliza dia siguiente habil', () => {
    expect(siguienteHabil('2026-11-06', calendarioChile)).toBe('2026-11-06');
    expect(siguienteHabil('2026-11-07', calendarioChile)).toBe('2026-11-09');
    expect(siguienteHabil('2026-12-08', calendarioChile)).toBe('2026-12-09');
  });

  it('normaliza dia anterior habil', () => {
    expect(anteriorHabil('2026-11-06', calendarioChile)).toBe('2026-11-06');
    expect(anteriorHabil('2026-11-07', calendarioChile)).toBe('2026-11-06');
    expect(anteriorHabil('2026-11-09', calendarioChile)).toBe('2026-11-09');
    expect(anteriorHabil('2026-12-08', calendarioChile)).toBe('2026-12-07');
  });

  it('evita cero negativo en diasHabilesEntre con fechas invertidas', () => {
    expect(Object.is(diasHabilesEntre('2026-11-07', '2026-11-06', calendarioChile), 0)).toBe(true);
  });

  it('valida esquemas zod de dias laborables, calendario y feriado', () => {
    const diasOk = validar(esquemaDiasLaborables, [1, 2, 3, 4, 5]);
    expect(diasOk.ok).toBe(true);

    const diasRepetidos = validar(esquemaDiasLaborables, [1, 1, 2]);
    expect(diasRepetidos.ok).toBe(false);

    const diasFuera = validar(esquemaDiasLaborables, [7]);
    expect(diasFuera.ok).toBe(false);

    const calOk = validar(esquemaActualizarCalendario, {
      diasLaborables: [1, 2, 3, 4, 5, 6],
      horasPorDia: 8.5,
    });
    expect(calOk.ok).toBe(true);

    const calVacio = validar(esquemaActualizarCalendario, {});
    expect(calVacio.ok).toBe(false);

    const feriadoOk = validar(esquemaCrearFeriado, {
      fecha: '2026-11-10',
      descripcion: 'Feriado de prueba',
    });
    expect(feriadoOk.ok).toBe(true);

    const feriadoFueraRango = validar(esquemaCrearFeriado, {
      fecha: '1999-12-31',
      descripcion: 'Feriado antiguo',
    });
    expect(feriadoFueraRango.ok).toBe(false);
  });
});
