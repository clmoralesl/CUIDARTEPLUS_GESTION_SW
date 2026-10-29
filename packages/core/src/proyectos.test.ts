import { describe, expect, it } from 'vitest';
import {
  esquemaActualizarProyecto,
  esquemaCrearProyecto,
  MENSAJE_FECHAS,
  puedeTransicionar,
} from './proyectos';
import { validar } from './validacion';

describe('proyectos', () => {
  describe('puedeTransicionar', () => {
    it('valida las 9 combinaciones posibles de transicion de estado', () => {
      expect(puedeTransicionar('PLANIFICADO', 'EN_CURSO')).toBe(true);
      expect(puedeTransicionar('PLANIFICADO', 'CERRADO')).toBe(false);
      expect(puedeTransicionar('PLANIFICADO', 'PLANIFICADO')).toBe(false);

      expect(puedeTransicionar('EN_CURSO', 'CERRADO')).toBe(true);
      expect(puedeTransicionar('EN_CURSO', 'PLANIFICADO')).toBe(false);
      expect(puedeTransicionar('EN_CURSO', 'EN_CURSO')).toBe(false);

      expect(puedeTransicionar('CERRADO', 'PLANIFICADO')).toBe(false);
      expect(puedeTransicionar('CERRADO', 'EN_CURSO')).toBe(false);
      expect(puedeTransicionar('CERRADO', 'CERRADO')).toBe(false);
    });
  });

  describe('esquemaCrearProyecto', () => {
    const proyectoBase = {
      nombre: 'AutoFix · Implementación',
      descripcion: 'Descripción del proyecto',
      responsable: 'Jefe de Proyecto',
      presupuesto: 45000000,
      fechaInicio: '2026-11-02',
      fechaFin: '2027-03-31',
    };

    it('valida datos correctos', () => {
      const res = validar(esquemaCrearProyecto, proyectoBase);
      expect(res.ok).toBe(true);
    });

    it('recorta nombre y responsable, rechazando cadenas solo de espacios o vacias', () => {
      const conEspacios = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        nombre: '   AutoFix   ',
      });
      expect(conEspacios.ok).toBe(true);
      if (conEspacios.ok) {
        expect(conEspacios.datos.nombre).toBe('AutoFix');
      }

      const soloEspacios = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        nombre: '   ',
      });
      expect(soloEspacios.ok).toBe(false);
      if (!soloEspacios.ok) {
        expect(soloEspacios.detalles[0].mensaje).toBe('Ingrese el nombre.');
      }

      const nombre120 = 'A'.repeat(120);
      expect(validar(esquemaCrearProyecto, { ...proyectoBase, nombre: nombre120 }).ok).toBe(true);

      const nombre121 = 'A'.repeat(121);
      const res121 = validar(esquemaCrearProyecto, { ...proyectoBase, nombre: nombre121 });
      expect(res121.ok).toBe(false);
      if (!res121.ok) {
        expect(res121.detalles[0].mensaje).toBe('Use como máximo 120 caracteres.');
      }
    });

    it('transforma descripcion vacia a null y limita a 2000 caracteres', () => {
      const descVacia = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        descripcion: '   ',
      });
      expect(descVacia.ok).toBe(true);
      if (descVacia.ok) {
        expect(descVacia.datos.descripcion).toBeNull();
      }

      const desc2001 = 'A'.repeat(2001);
      const res2001 = validar(esquemaCrearProyecto, { ...proyectoBase, descripcion: desc2001 });
      expect(res2001.ok).toBe(false);
    });

    it('valida presupuesto admitiendo hasta 2 decimales y rechazando negativos o texto', () => {
      expect(validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: 0 }).ok).toBe(true);
      expect(validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: 1250000.5 }).ok).toBe(
        true,
      );
      expect(validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: 1.15 }).ok).toBe(true);
      expect(
        validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: 999999999999.99 }).ok,
      ).toBe(true);

      const neg = validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: -1 });
      expect(neg.ok).toBe(false);

      const tresDecimales = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        presupuesto: 1250000.555,
      });
      expect(tresDecimales.ok).toBe(false);
      if (!tresDecimales.ok) {
        expect(tresDecimales.detalles[0].mensaje).toBe('Use como máximo 2 decimales.');
      }

      const texto = validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: '1000' });
      expect(texto.ok).toBe(false);

      const muyGrande = validar(esquemaCrearProyecto, { ...proyectoBase, presupuesto: 1e15 });
      expect(muyGrande.ok).toBe(false);
    });

    it('valida fechas y asegura que fechaFin no sea anterior a fechaInicio', () => {
      expect(
        validar(esquemaCrearProyecto, {
          ...proyectoBase,
          fechaInicio: '2026-11-02',
          fechaFin: '2026-11-02',
        }).ok,
      ).toBe(true);

      expect(
        validar(esquemaCrearProyecto, {
          ...proyectoBase,
          fechaInicio: '2026-11-02',
          fechaFin: null,
        }).ok,
      ).toBe(true);

      const finAnterior = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        fechaInicio: '2026-11-02',
        fechaFin: '2026-11-01',
      });
      expect(finAnterior.ok).toBe(false);
      if (!finAnterior.ok) {
        expect(finAnterior.detalles[0].campo).toBe('fechaFin');
        expect(finAnterior.detalles[0].mensaje).toBe(MENSAJE_FECHAS);
      }
    });

    it('rechaza campos desconocidos por ser strictObject', () => {
      const conExtra = validar(esquemaCrearProyecto, {
        ...proyectoBase,
        estado: 'CERRADO',
      });
      expect(conExtra.ok).toBe(false);
    });
  });

  describe('esquemaActualizarProyecto', () => {
    it('permite actualizar un subconjunto de campos', () => {
      const res = validar(esquemaActualizarProyecto, { nombre: 'Nuevo Nombre' });
      expect(res.ok).toBe(true);
    });

    it('rechaza objeto vacio', () => {
      const vacio = validar(esquemaActualizarProyecto, {});
      expect(vacio.ok).toBe(false);
      if (!vacio.ok) {
        expect(vacio.detalles[0].mensaje).toBe('Debe enviar al menos un campo para actualizar.');
      }
    });

    it('rechaza campos desconocidos como estado o id', () => {
      const desconocido = validar(esquemaActualizarProyecto, {
        nombre: 'Nombre',
        estado: 'EN_CURSO',
      });
      expect(desconocido.ok).toBe(false);
    });

    it('valida coherencia de fechas cuando se envian ambas', () => {
      const fechasInvertidas = validar(esquemaActualizarProyecto, {
        fechaInicio: '2027-01-01',
        fechaFin: '2026-01-01',
      });
      expect(fechasInvertidas.ok).toBe(false);
      if (!fechasInvertidas.ok) {
        expect(fechasInvertidas.detalles[0].campo).toBe('fechaFin');
      }
    });
  });
});
