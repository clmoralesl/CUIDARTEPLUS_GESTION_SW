import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ListaHitos } from '@autofix/core';
import { configurarApp } from '../configurar-app';
import { HitosController } from './hitos.controller';
import { HitosService } from './hitos.service';

describe('HitosController', () => {
  let app: INestApplication;

  const listaMock: ListaHitos = {
    proyectoId: 1,
    fechaCalculo: '2026-10-30',
    hitos: [
      {
        id: 1,
        proyectoId: 1,
        nombre: 'Hito de prueba',
        criterio: null,
        responsable: null,
        fechaObjetivo: '2026-11-20',
        fechaCumplimiento: null,
        tarea: null,
        estado: 'PENDIENTE',
        aTiempo: null,
        diasHabilesRestantes: 15,
      },
    ],
  };

  const servicioMock = {
    listar: vi.fn().mockResolvedValue(listaMock),
    crear: vi.fn().mockResolvedValue(listaMock),
    actualizar: vi.fn().mockResolvedValue(listaMock),
    eliminar: vi.fn().mockResolvedValue(listaMock),
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [HitosController],
      providers: [{ provide: HitosService, useValue: servicioMock }],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite GET /proyectos/:proyectoId/hitos a rol JP y CC', async () => {
    const resJp = await request(app.getHttpServer()).get('/proyectos/1/hitos').set('X-Rol', 'JP');
    expect(resJp.status).toBe(200);
    expect(resJp.body).toEqual(listaMock);

    const resCc = await request(app.getHttpServer()).get('/proyectos/1/hitos').set('X-Rol', 'CC');
    expect(resCc.status).toBe(200);
    expect(resCc.body).toEqual(listaMock);
  });

  it('rechaza con 403 al rol CC en POST, PATCH y DELETE', async () => {
    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/hitos')
      .set('X-Rol', 'CC')
      .send({ nombre: 'Nuevo hito', fechaObjetivo: '2026-11-20' });
    expect(resPost.status).toBe(403);
    expect(resPost.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resPatch = await request(app.getHttpServer())
      .patch('/hitos/1')
      .set('X-Rol', 'CC')
      .send({ nombre: 'Modificado' });
    expect(resPatch.status).toBe(403);
    expect(resPatch.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resDelete = await request(app.getHttpServer()).delete('/hitos/1').set('X-Rol', 'CC');
    expect(resDelete.status).toBe(403);
    expect(resDelete.body.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('permite POST, PATCH y DELETE al rol JP', async () => {
    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/hitos')
      .set('X-Rol', 'JP')
      .send({ nombre: 'Nuevo hito', fechaObjetivo: '2026-11-20' });
    expect(resPost.status).toBe(201);
    expect(resPost.body).toEqual(listaMock);

    const resPatch = await request(app.getHttpServer())
      .patch('/hitos/1')
      .set('X-Rol', 'JP')
      .send({ nombre: 'Modificado' });
    expect(resPatch.status).toBe(200);
    expect(resPatch.body).toEqual(listaMock);

    const resDelete = await request(app.getHttpServer()).delete('/hitos/1').set('X-Rol', 'JP');
    expect(resDelete.status).toBe(200);
    expect(resDelete.body).toEqual(listaMock);
  });

  it('rechaza identificadores de ruta invalidos con 400 VALIDACION_FALLIDA', async () => {
    const res = await request(app.getHttpServer()).get('/proyectos/xyz/hitos').set('X-Rol', 'JP');
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
  });

  it('rechaza cuerpo con estado en POST con 400 VALIDACION_FALLIDA', async () => {
    const res = await request(app.getHttpServer())
      .post('/proyectos/1/hitos')
      .set('X-Rol', 'JP')
      .send({ nombre: 'Hito', fechaObjetivo: '2026-11-20', estado: 'CUMPLIDO' });
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
  });
});
