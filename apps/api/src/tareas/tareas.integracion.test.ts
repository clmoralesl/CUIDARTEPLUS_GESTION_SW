import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ArbolTareas, ResultadoRecalculo } from '@autofix/core';
import { configurarApp } from '../configurar-app';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

describe('Tareas Integración HTTP', () => {
  let app: INestApplication;

  const arbolMock: ArbolTareas = {
    proyectoId: 1,
    porcentajeAvanceProyecto: 25,
    tareas: [
      {
        id: 10,
        padreId: null,
        nivel: 'ETAPA',
        codigo: '1',
        orden: 1,
        nombre: 'Etapa 1',
        descripcion: null,
        responsable: 'JP',
        duracionDias: 10,
        fechaFija: null,
        inicioPlan: '2026-11-02',
        finPlan: '2026-11-11',
        inicioTardio: null,
        finTardio: null,
        holguraDias: null,
        esCritica: false,
        inicioReal: '2026-11-02',
        finReal: null,
        porcentajeAvance: 25,
        tieneHijas: false,
      },
    ],
  };

  const resultadoRecalculoMock: ResultadoRecalculo = {
    arbol: arbolMock,
    tareasAfectadas: [],
  };

  const servicioMock = {
    obtenerArbol: vi.fn().mockResolvedValue(arbolMock),
    crear: vi.fn().mockResolvedValue(resultadoRecalculoMock),
    actualizar: vi.fn().mockResolvedValue(resultadoRecalculoMock),
    mover: vi.fn().mockResolvedValue(resultadoRecalculoMock),
    eliminar: vi.fn().mockResolvedValue(resultadoRecalculoMock),
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [TareasController],
      providers: [{ provide: TareasService, useValue: servicioMock }],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite GET /proyectos/:proyectoId/tareas con rol JP y con rol CC', async () => {
    const resJp = await request(app.getHttpServer()).get('/proyectos/1/tareas').set('X-Rol', 'JP');
    expect(resJp.status).toBe(200);
    expect(resJp.body.proyectoId).toBe(1);

    const resCc = await request(app.getHttpServer()).get('/proyectos/1/tareas').set('X-Rol', 'CC');
    expect(resCc.status).toBe(200);
    expect(resCc.body.proyectoId).toBe(1);
  });

  it('responde 403 con rol CC en las cuatro operaciones de escritura', async () => {
    const resCrear = await request(app.getHttpServer())
      .post('/proyectos/1/tareas')
      .set('X-Rol', 'CC')
      .send({
        nivel: 'ETAPA',
        padreId: null,
        nombre: 'Intento con CC',
      });
    expect(resCrear.status).toBe(403);
    expect(resCrear.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resActualizar = await request(app.getHttpServer())
      .patch('/tareas/10')
      .set('X-Rol', 'CC')
      .send({ nombre: 'Intento con CC' });
    expect(resActualizar.status).toBe(403);
    expect(resActualizar.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resMover = await request(app.getHttpServer())
      .post('/tareas/10/mover')
      .set('X-Rol', 'CC')
      .send({ padreId: null, posicion: 2 });
    expect(resMover.status).toBe(403);
    expect(resMover.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resEliminar = await request(app.getHttpServer()).delete('/tareas/10').set('X-Rol', 'CC');
    expect(resEliminar.status).toBe(403);
    expect(resEliminar.body.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('responde 201 al crear tarea con rol JP', async () => {
    const res = await request(app.getHttpServer())
      .post('/proyectos/1/tareas')
      .set('X-Rol', 'JP')
      .send({
        nivel: 'ETAPA',
        padreId: null,
        nombre: 'Nueva etapa taller',
      });
    expect(res.status).toBe(201);
    expect(res.body.arbol.proyectoId).toBe(1);
  });

  it('responde 200 en actualizar, mover y eliminar con rol JP', async () => {
    const resPatch = await request(app.getHttpServer())
      .patch('/tareas/10')
      .set('X-Rol', 'JP')
      .send({ nombre: 'Etapa renombrada' });
    expect(resPatch.status).toBe(200);

    const resMover = await request(app.getHttpServer())
      .post('/tareas/10/mover')
      .set('X-Rol', 'JP')
      .send({ padreId: null, posicion: 1 });
    expect(resMover.status).toBe(200);

    const resDelete = await request(app.getHttpServer()).delete('/tareas/10').set('X-Rol', 'JP');
    expect(resDelete.status).toBe(200);
  });

  it('responde 400 VALIDACION_FALLIDA ante identificador de ruta invalido', async () => {
    const res = await request(app.getHttpServer()).get('/proyectos/abc/tareas').set('X-Rol', 'JP');
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
    expect(res.body.detalles[0].campo).toBe('proyectoId');
  });

  it('responde 400 VALIDACION_FALLIDA ante cuerpo invalido en creacion', async () => {
    const res = await request(app.getHttpServer())
      .post('/proyectos/1/tareas')
      .set('X-Rol', 'JP')
      .send({
        nivel: 'NIVEL_INEXISTENTE',
        nombre: '',
      });
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
  });
});
