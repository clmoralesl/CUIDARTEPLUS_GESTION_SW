import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoProyecto, NivelTarea, PrismaClient, TipoDependencia } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fechaIsoADate, feriadosChileDesde } from '@autofix/core';
import { AppModule } from '../app.module';
import { configurarApp } from '../configurar-app';
import { Reloj } from '../comun/reloj/reloj';

describe('Hitos BD integración PostgreSQL', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Reloj)
      .useValue({ hoy: () => '2026-10-30' })
      .compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('actualiza el estado del hito en la misma respuesta al mover una tarea y audita desvinculacion al borrar tarea', async () => {
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre: 'AutoFix · Test Hitos BD',
        descripcion: 'Test integración hitos',
        responsable: 'Jefe de Proyecto',
        presupuesto: 45000000,
        fechaInicio: new Date('2026-11-02T00:00:00.000Z'),
        fechaFin: new Date('2027-03-31T00:00:00.000Z'),
        estado: EstadoProyecto.EN_CURSO,
        calendario: { create: {} },
      },
      include: { calendario: true },
    });
    const proyectoId = proyecto.id;
    const calendarioId = proyecto.calendario!.id;

    await prisma.feriado.createMany({
      data: feriadosChileDesde('2026-11-02').map((f) => ({
        calendarioId,
        fecha: fechaIsoADate(f.fecha),
        descripcion: f.descripcion,
      })),
      skipDuplicates: true,
    });

    const etapa1 = await prisma.tarea.create({
      data: {
        proyectoId,
        nivel: NivelTarea.ETAPA,
        codigo: '1',
        orden: 1,
        nombre: 'Levantamiento y diseño',
        duracionDias: 1,
      },
    });

    const act11 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: etapa1.id,
        nivel: NivelTarea.ACTIVIDAD,
        codigo: '1.1',
        orden: 1,
        nombre: 'Levantamiento de procesos',
        duracionDias: 1,
      },
    });

    const sub111 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act11.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '1.1.1',
        orden: 1,
        nombre: 'Entrevistas',
        duracionDias: 3,
        inicioReal: fechaIsoADate('2026-11-02'),
        finReal: fechaIsoADate('2026-11-04'),
        porcentajeAvance: 100,
      },
    });

    const sub112 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act11.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '1.1.2',
        orden: 2,
        nombre: 'Mapeo flujo',
        duracionDias: 4,
        inicioReal: fechaIsoADate('2026-11-05'),
        porcentajeAvance: 50,
      },
    });

    const act12 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: etapa1.id,
        nivel: NivelTarea.ACTIVIDAD,
        codigo: '1.2',
        orden: 2,
        nombre: 'Diseño solución',
        duracionDias: 1,
      },
    });

    const sub121 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act12.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '1.2.1',
        orden: 1,
        nombre: 'Modelo y endpoints',
        duracionDias: 5,
      },
    });

    const sub122 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act12.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '1.2.2',
        orden: 2,
        nombre: 'Prototipo UI',
        duracionDias: 3,
      },
    });

    const etapa2 = await prisma.tarea.create({
      data: {
        proyectoId,
        nivel: NivelTarea.ETAPA,
        codigo: '2',
        orden: 2,
        nombre: 'Construcción y despliegue',
        duracionDias: 1,
      },
    });

    const act21 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: etapa2.id,
        nivel: NivelTarea.ACTIVIDAD,
        codigo: '2.1',
        orden: 1,
        nombre: 'Módulo de órdenes',
        duracionDias: 1,
      },
    });

    const sub211 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act21.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '2.1.1',
        orden: 1,
        nombre: 'Registro de vehículos',
        duracionDias: 6,
      },
    });

    const sub212 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act21.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '2.1.2',
        orden: 2,
        nombre: 'Seguimiento de órdenes',
        duracionDias: 8,
      },
    });

    const act22 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: etapa2.id,
        nivel: NivelTarea.ACTIVIDAD,
        codigo: '2.2',
        orden: 2,
        nombre: 'Módulo agenda',
        duracionDias: 1,
      },
    });

    const sub221 = await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act22.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '2.2.1',
        orden: 1,
        nombre: 'Turnos mecánico',
        duracionDias: 5,
      },
    });

    await prisma.tarea.create({
      data: {
        proyectoId,
        padreId: act22.id,
        nivel: NivelTarea.SUBACTIVIDAD,
        codigo: '2.2.2',
        orden: 2,
        nombre: 'Impresoras',
        duracionDias: 2,
        fechaFija: fechaIsoADate('2026-11-23'),
      },
    });

    const deps = [
      { predecesoraId: sub111.id, sucesoraId: sub112.id, tipo: TipoDependencia.FS, desfaseDias: 0 },
      { predecesoraId: sub112.id, sucesoraId: sub121.id, tipo: TipoDependencia.SS, desfaseDias: 2 },
      { predecesoraId: sub121.id, sucesoraId: sub122.id, tipo: TipoDependencia.SS, desfaseDias: 3 },
      { predecesoraId: sub112.id, sucesoraId: sub122.id, tipo: TipoDependencia.FF, desfaseDias: 5 },
      { predecesoraId: sub121.id, sucesoraId: sub211.id, tipo: TipoDependencia.FS, desfaseDias: 0 },
      { predecesoraId: sub211.id, sucesoraId: sub212.id, tipo: TipoDependencia.FS, desfaseDias: 0 },
      { predecesoraId: sub212.id, sucesoraId: sub221.id, tipo: TipoDependencia.SS, desfaseDias: 7 },
    ];

    for (const d of deps) {
      await prisma.dependencia.create({
        data: {
          proyectoId,
          ...d,
        },
      });
    }

    const resRecalculoInicial = await request(app.getHttpServer())
      .patch(`/tareas/${sub121.id}`)
      .set('X-Rol', 'JP')
      .send({ duracionDias: 5 });
    expect(resRecalculoInicial.status).toBe(200);

    const resHitoInicial = await request(app.getHttpServer())
      .post(`/proyectos/${proyectoId}/hitos`)
      .set('X-Rol', 'JP')
      .send({
        nombre: 'Módulo de órdenes operativo',
        tareaId: act21.id,
        fechaObjetivo: '2026-12-04',
        criterio: 'Registro y seguimiento de órdenes probado en el taller',
        responsable: 'Desarrollador Senior',
      });
    expect(resHitoInicial.status).toBe(201);

    const resGetPrevio = await request(app.getHttpServer())
      .get(`/proyectos/${proyectoId}/hitos`)
      .set('X-Rol', 'JP');
    expect(resGetPrevio.status).toBe(200);
    const hitoPrevio = resGetPrevio.body.hitos.find(
      (h: { nombre: string }) => h.nombre === 'Módulo de órdenes operativo',
    );
    expect(hitoPrevio).toBeDefined();
    expect(hitoPrevio.estado).toBe('PENDIENTE');
    expect(hitoPrevio.tarea.finPlan).toBe('2026-12-03');

    const resPatch = await request(app.getHttpServer())
      .patch(`/tareas/${sub121.id}`)
      .set('X-Rol', 'JP')
      .send({ duracionDias: 7 });
    expect(resPatch.status).toBe(200);
    expect(resPatch.body.hitos).toBeDefined();

    const hitoActualizado = resPatch.body.hitos.hitos.find(
      (h: { nombre: string }) => h.nombre === 'Módulo de órdenes operativo',
    );
    expect(hitoActualizado).toBeDefined();
    expect(hitoActualizado.estado).toBe('ATRASADO');
    expect(hitoActualizado.tarea.finPlan).toBe('2026-12-07');

    const resDeleteTarea = await request(app.getHttpServer())
      .delete(`/tareas/${act21.id}`)
      .set('X-Rol', 'JP');
    expect(resDeleteTarea.status).toBe(200);

    const hitoDesvinculado = resDeleteTarea.body.hitos.hitos.find(
      (h: { nombre: string }) => h.nombre === 'Módulo de órdenes operativo',
    );
    expect(hitoDesvinculado).toBeDefined();
    expect(hitoDesvinculado.tarea).toBeNull();

    const registroBitacora = await prisma.bitacora.findFirst({
      where: {
        proyectoId,
        entidad: 'Hito',
        entidadId: hitoPrevio.id,
        campo: 'tareaId',
      },
    });
    expect(registroBitacora).not.toBeNull();
    expect(registroBitacora?.origen).toBe('Tarea eliminada: 2.1');
    expect(registroBitacora?.valorNuevo).toBeNull();
  });
});
