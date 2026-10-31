import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  crearCalendarioLaboral,
  dateAFechaIso,
  DIAS_LABORABLES_POR_DEFECTO,
  diasHabilesEntre,
  feriadosChileDesde,
  type TareaArbol,
} from '@autofix/core';
import { AppModule } from '../app.module';
import { configurarApp } from '../configurar-app';

describe('Recálculo BD integración PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const calendario = crearCalendarioLaboral({
    diasLaborables: DIAS_LABORABLES_POR_DEFECTO,
    feriados: feriadosChileDesde('2026-01-01').map((f) => f.fecha),
  });

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('ejecuta el ciclo completo de recalculo, dependencias, ciclo con rollback y control de acceso', async () => {
    const resProyecto = await request(app.getHttpServer())
      .post('/proyectos')
      .set('X-Rol', 'JP')
      .send({
        nombre: 'Proyecto AutoFix Prueba Recálculo',
        descripcion: 'Integración PostgreSQL',
        responsable: 'Jefe Taller',
        presupuesto: 50000000,
        fechaInicio: '2026-12-01',
      });
    expect(resProyecto.status).toBe(201);
    const proyectoId = resProyecto.body.id as number;

    const resEtapa = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/tareas`)
      .set('X-Rol', 'JP')
      .send({
        nivel: 'ETAPA',
        padreId: null,
        nombre: 'Etapa Principal',
        duracionDias: 1,
      });
    expect(resEtapa.status).toBe(201);
    const etapaId = resEtapa.body.arbol.tareas[0].id as number;

    const resTareaA = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/tareas`)
      .set('X-Rol', 'JP')
      .send({
        nivel: 'ACTIVIDAD',
        padreId: etapaId,
        nombre: 'Tarea A',
        duracionDias: 3,
      });
    expect(resTareaA.status).toBe(201);
    const tareaA = resTareaA.body.arbol.tareas.find((t: TareaArbol) => t.nombre === 'Tarea A');

    const resTareaB = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/tareas`)
      .set('X-Rol', 'JP')
      .send({
        nivel: 'ACTIVIDAD',
        padreId: etapaId,
        nombre: 'Tarea B',
        duracionDias: 2,
      });
    expect(resTareaB.status).toBe(201);
    const tareaB = resTareaB.body.arbol.tareas.find((t: TareaArbol) => t.nombre === 'Tarea B');

    const resTareaC = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/tareas`)
      .set('X-Rol', 'JP')
      .send({
        nivel: 'ACTIVIDAD',
        padreId: etapaId,
        nombre: 'Tarea C',
        duracionDias: 2,
      });
    expect(resTareaC.status).toBe(201);
    const tareaC = resTareaC.body.arbol.tareas.find((t: TareaArbol) => t.nombre === 'Tarea C');

    const resDepAB = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/dependencias`)
      .set('X-Rol', 'JP')
      .send({
        predecesoraId: tareaA.id,
        sucesoraId: tareaB.id,
        tipo: 'FS',
        desfaseDias: 0,
      });
    expect(resDepAB.status).toBe(201);

    const resDepBC = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/dependencias`)
      .set('X-Rol', 'JP')
      .send({
        predecesoraId: tareaB.id,
        sucesoraId: tareaC.id,
        tipo: 'FS',
        desfaseDias: 0,
      });
    expect(resDepBC.status).toBe(201);

    const tareasIniciales = resDepBC.body.arbol.tareas;
    const iniA = tareasIniciales.find((t: TareaArbol) => t.id === tareaA.id);
    const iniB = tareasIniciales.find((t: TareaArbol) => t.id === tareaB.id);
    const iniC = tareasIniciales.find((t: TareaArbol) => t.id === tareaC.id);

    expect(iniA.inicioPlan).toBe('2026-12-01');
    expect(iniA.finPlan).toBe('2026-12-03');

    expect(iniB.inicioPlan).toBe('2026-12-04');
    expect(iniB.finPlan).toBe('2026-12-07');

    expect(iniC.inicioPlan).toBe('2026-12-09');
    expect(iniC.finPlan).toBe('2026-12-10');

    const resPatchA = await request(app.getHttpServer())
      .patch(`/tareas/${tareaA.id}`)
      .set('X-Rol', 'JP')
      .send({ duracionDias: 5 });
    expect(resPatchA.status).toBe(200);

    expect(resPatchA.body.tareasAfectadas).toEqual([
      {
        id: tareaA.id,
        codigo: '1.1',
        inicioAnterior: '2026-12-01',
        inicioNuevo: '2026-12-01',
        finAnterior: '2026-12-03',
        finNuevo: '2026-12-07',
      },
      {
        id: tareaB.id,
        codigo: '1.2',
        inicioAnterior: '2026-12-04',
        inicioNuevo: '2026-12-09',
        finAnterior: '2026-12-07',
        finNuevo: '2026-12-10',
      },
      {
        id: tareaC.id,
        codigo: '1.3',
        inicioAnterior: '2026-12-09',
        inicioNuevo: '2026-12-11',
        finAnterior: '2026-12-10',
        finNuevo: '2026-12-14',
      },
    ]);

    expect(diasHabilesEntre('2026-12-04', '2026-12-09', calendario)).toBe(2);
    expect(diasHabilesEntre('2026-12-09', '2026-12-11', calendario)).toBe(2);

    const tareasDb = await prisma.tarea.findMany({
      where: { id: { in: [tareaA.id, tareaB.id, tareaC.id] } },
      orderBy: { id: 'asc' },
    });
    for (const t of tareasDb) {
      expect(t.holguraDias).toBe(0);
      expect(t.esCritica).toBe(true);
    }
    const tDbA = tareasDb.find((t) => t.id === tareaA.id)!;
    const tDbB = tareasDb.find((t) => t.id === tareaB.id)!;
    const tDbC = tareasDb.find((t) => t.id === tareaC.id)!;
    expect(dateAFechaIso(tDbA.finPlan!)).toBe('2026-12-07');
    expect(dateAFechaIso(tDbB.inicioPlan!)).toBe('2026-12-09');
    expect(dateAFechaIso(tDbC.finPlan!)).toBe('2026-12-14');

    const bitacoraRecalculo = await prisma.bitacora.findFirst({
      where: { proyectoId, accion: 'RECALCULAR' },
      orderBy: { id: 'desc' },
    });
    expect(bitacoraRecalculo).not.toBeNull();
    expect(bitacoraRecalculo?.origen).toBe('Cambio de duración en 1.1');

    const resCiclo = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/dependencias`)
      .set('X-Rol', 'JP')
      .send({
        predecesoraId: tareaC.id,
        sucesoraId: tareaA.id,
        tipo: 'FS',
        desfaseDias: 0,
      });
    expect(resCiclo.status).toBe(422);
    expect(resCiclo.body.codigo).toBe('CICLO_DETECTADO');
    expect(resCiclo.body.mensaje).toBe('Ciclo detectado: 1.1 → 1.2 → 1.3 → 1.1');
    expect(resCiclo.body.detalles?.ciclo).toEqual(['1.1', '1.2', '1.3', '1.1']);

    const totalDeps = await prisma.dependencia.count({ where: { proyectoId } });
    expect(totalDeps).toBe(2);

    const bitacoraCrearCA = await prisma.bitacora.findFirst({
      where: {
        proyectoId,
        entidad: 'Dependencia',
        accion: 'CREAR',
        valorNuevo: { path: ['sucesora'], equals: '1.1' },
      },
    });
    expect(bitacoraCrearCA).toBeNull();

    const resDuplicado = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/dependencias`)
      .set('X-Rol', 'JP')
      .send({
        predecesoraId: tareaA.id,
        sucesoraId: tareaB.id,
        tipo: 'SS',
        desfaseDias: 0,
      });
    expect(resDuplicado.status).toBe(409);
    expect(resDuplicado.body.codigo).toBe('REGISTRO_DUPLICADO');

    const resCC = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/dependencias`)
      .set('X-Rol', 'CC')
      .send({
        predecesoraId: tareaA.id,
        sucesoraId: tareaC.id,
        tipo: 'FS',
        desfaseDias: 0,
      });
    expect(resCC.status).toBe(403);
    expect(resCC.body.codigo).toBe('ROL_NO_PERMITIDO');
  });
});
