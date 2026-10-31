import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CalendarioProyecto, RespuestaCalendario } from '@autofix/core';
import { configurarApp } from '../configurar-app';
import { CalendarioController } from './calendario.controller';
import { CalendarioService } from './calendario.service';

describe('CalendarioController', () => {
  let app: INestApplication;

  const calendarioMock: CalendarioProyecto = {
    proyectoId: 1,
    diasLaborables: [1, 2, 3, 4, 5],
    horasPorDia: 8,
    feriados: [
      {
        id: 4,
        fecha: '2026-12-08',
        descripcion: 'Inmaculada Concepción',
      },
    ],
  };

  const respuestaMock: RespuestaCalendario = {
    calendario: calendarioMock,
    tareasAfectadas: [],
  };

  const servicioMock = {
    obtener: vi.fn().mockResolvedValue(calendarioMock),
    actualizar: vi.fn().mockResolvedValue(respuestaMock),
    crearFeriado: vi.fn().mockResolvedValue(respuestaMock),
    eliminarFeriado: vi.fn().mockResolvedValue(respuestaMock),
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [CalendarioController],
      providers: [{ provide: CalendarioService, useValue: servicioMock }],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite GET /proyectos/:proyectoId/calendario a JP y CC', async () => {
    const resJP = await request(app.getHttpServer())
      .get('/proyectos/1/calendario')
      .set('X-Rol', 'JP');
    expect(resJP.status).toBe(200);
    expect(resJP.body).toEqual(calendarioMock);

    const resCC = await request(app.getHttpServer())
      .get('/proyectos/1/calendario')
      .set('X-Rol', 'CC');
    expect(resCC.status).toBe(200);
  });

  it('rechaza con 403 al rol CC en PATCH, POST y DELETE', async () => {
    const resPatch = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'CC')
      .send({ diasLaborables: [1, 2, 3, 4, 5, 6] });
    expect(resPatch.status).toBe(403);
    expect(resPatch.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/feriados')
      .set('X-Rol', 'CC')
      .send({ fecha: '2026-11-10', descripcion: 'Feriado de prueba' });
    expect(resPost.status).toBe(403);
    expect(resPost.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resDelete = await request(app.getHttpServer()).delete('/feriados/4').set('X-Rol', 'CC');
    expect(resDelete.status).toBe(403);
    expect(resDelete.body.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('permite escrituras al rol JP', async () => {
    const resPatch = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ diasLaborables: [1, 2, 3, 4, 5, 6] });
    expect(resPatch.status).toBe(200);
    expect(resPatch.body).toEqual(respuestaMock);

    const resPost = await request(app.getHttpServer())
      .post('/proyectos/1/feriados')
      .set('X-Rol', 'JP')
      .send({ fecha: '2026-11-10', descripcion: 'Feriado de prueba' });
    expect(resPost.status).toBe(201);
    expect(resPost.body).toEqual(respuestaMock);

    const resDelete = await request(app.getHttpServer()).delete('/feriados/4').set('X-Rol', 'JP');
    expect(resDelete.status).toBe(200);
    expect(resDelete.body).toEqual(respuestaMock);
  });

  it('rechaza id no numerico con 400', async () => {
    const resGet = await request(app.getHttpServer())
      .get('/proyectos/abc/calendario')
      .set('X-Rol', 'JP');
    expect(resGet.status).toBe(400);
    expect(resGet.body.codigo).toBe('VALIDACION_FALLIDA');

    const resDelete = await request(app.getHttpServer())
      .delete('/feriados/invalido')
      .set('X-Rol', 'JP');
    expect(resDelete.status).toBe(400);
    expect(resDelete.body.codigo).toBe('VALIDACION_FALLIDA');
  });

  it('rechaza cuerpos invalidos con 400 VALIDACION_FALLIDA', async () => {
    const vacio = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({});
    expect(vacio.status).toBe(400);
    expect(vacio.body.codigo).toBe('VALIDACION_FALLIDA');

    const diasVacios = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ diasLaborables: [] });
    expect(diasVacios.status).toBe(400);

    const diasRepetidos = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ diasLaborables: [1, 1] });
    expect(diasRepetidos.status).toBe(400);

    const horasCero = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ horasPorDia: 0 });
    expect(horasCero.status).toBe(400);

    const horasExcedidas = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ horasPorDia: 24.01 });
    expect(horasExcedidas.status).toBe(400);

    const horasDecimales = await request(app.getHttpServer())
      .patch('/proyectos/1/calendario')
      .set('X-Rol', 'JP')
      .send({ horasPorDia: 7.555 });
    expect(horasDecimales.status).toBe(400);

    const feriadoSinFecha = await request(app.getHttpServer())
      .post('/proyectos/1/feriados')
      .set('X-Rol', 'JP')
      .send({ descripcion: 'Sin fecha' });
    expect(feriadoSinFecha.status).toBe(400);
  });
});
