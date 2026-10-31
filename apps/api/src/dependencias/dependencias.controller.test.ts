import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { DependenciaTarea, ResultadoRecalculo } from '@autofix/core';
import { configurarApp } from '../configurar-app';
import { DependenciasController } from './dependencias.controller';
import { DependenciasService } from './dependencias.service';

describe('DependenciasController', () => {
  let app: INestApplication;

  const dependenciasMock: DependenciaTarea[] = [
    {
      id: 1,
      predecesoraId: 10,
      sucesoraId: 20,
      tipo: 'FS',
      desfaseDias: 0,
    },
  ];

  const resultadoMock: ResultadoRecalculo = {
    arbol: {
      proyectoId: 1,
      porcentajeAvanceProyecto: 0,
      tareas: [],
    },
    tareasAfectadas: [],
  };

  const servicioMock = {
    listar: vi.fn().mockResolvedValue(dependenciasMock),
    crear: vi.fn().mockResolvedValue(resultadoMock),
    eliminar: vi.fn().mockResolvedValue(resultadoMock),
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [DependenciasController],
      providers: [{ provide: DependenciasService, useValue: servicioMock }],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite GET /proyectos/:proyectoId/dependencias a rol JP y CC', async () => {
    const resJp = await request(app.getHttpServer())
      .get('/proyectos/1/dependencias')
      .set('X-Rol', 'JP');
    expect(resJp.status).toBe(200);
    expect(resJp.body).toEqual(dependenciasMock);

    const resCc = await request(app.getHttpServer())
      .get('/proyectos/1/dependencias')
      .set('X-Rol', 'CC');
    expect(resCc.status).toBe(200);
    expect(resCc.body).toEqual(dependenciasMock);
  });

  it('rechaza con 403 al rol CC en POST y DELETE', async () => {
    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/dependencias')
      .set('X-Rol', 'CC')
      .send({ predecesoraId: 10, sucesoraId: 20 });
    expect(resPost.status).toBe(403);
    expect(resPost.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resDelete = await request(app.getHttpServer())
      .delete('/dependencias/1')
      .set('X-Rol', 'CC');
    expect(resDelete.status).toBe(403);
    expect(resDelete.body.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('permite POST y DELETE al rol JP', async () => {
    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/dependencias')
      .set('X-Rol', 'JP')
      .send({ predecesoraId: 10, sucesoraId: 20, tipo: 'FS', desfaseDias: 0 });
    expect(resPost.status).toBe(201);

    const resDelete = await request(app.getHttpServer())
      .delete('/dependencias/1')
      .set('X-Rol', 'JP');
    expect(resDelete.status).toBe(200);
  });

  it('rechaza identificadores de ruta invalidos con 400 VALIDACION_FALLIDA', async () => {
    const res = await request(app.getHttpServer())
      .get('/proyectos/abc/dependencias')
      .set('X-Rol', 'JP');
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
  });

  it('rechaza cuerpo invalido en POST con 400 VALIDACION_FALLIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/proyectos/1/dependencias')
      .set('X-Rol', 'JP')
      .send({ predecesoraId: 10, sucesoraId: 10 });
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
  });
});
