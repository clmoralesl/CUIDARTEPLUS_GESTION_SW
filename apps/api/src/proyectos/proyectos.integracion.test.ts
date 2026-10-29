import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProyectoDetalle, ProyectoResumen } from '@autofix/core';
import { configurarApp } from '../configurar-app';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';

describe('Proyectos Integración HTTP', () => {
  let app: INestApplication;

  const detalleMock: ProyectoDetalle = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    descripcion: 'Implementación del sistema',
    responsable: 'Jefe de Proyecto',
    presupuesto: 45000000,
    fechaInicio: '2026-11-02',
    fechaFin: '2027-03-31',
    estado: 'EN_CURSO',
    porcentajeAvance: 0,
    numeroTareas: 0,
    creadoEn: '2026-10-29T21:00:00.000Z',
    actualizadoEn: '2026-10-29T21:00:00.000Z',
  };

  const resumenMock: ProyectoResumen = {
    id: 1,
    nombre: 'AutoFix · Implementación',
    responsable: 'Jefe de Proyecto',
    presupuesto: 45000000,
    fechaInicio: '2026-11-02',
    fechaFin: '2027-03-31',
    estado: 'EN_CURSO',
    porcentajeAvance: 0,
    creadoEn: '2026-10-29T21:00:00.000Z',
    actualizadoEn: '2026-10-29T21:00:00.000Z',
  };

  const servicioMock = {
    listar: vi.fn().mockResolvedValue([resumenMock]),
    obtener: vi.fn().mockResolvedValue(detalleMock),
    crear: vi.fn().mockResolvedValue(detalleMock),
    actualizar: vi.fn().mockResolvedValue(detalleMock),
    cambiarEstado: vi.fn().mockResolvedValue(detalleMock),
  };

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ProyectosController],
      providers: [{ provide: ProyectosService, useValue: servicioMock }],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 403 con rol CC en las cuatro operaciones de escritura', async () => {
    const resPost = await request(app.getHttpServer()).post('/proyectos').set('X-Rol', 'CC').send({
      nombre: 'Nuevo',
      responsable: 'Resp',
      presupuesto: 1000,
      fechaInicio: '2026-11-02',
    });
    expect(resPost.status).toBe(403);
    expect(resPost.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resPatch = await request(app.getHttpServer())
      .patch('/proyectos/1')
      .set('X-Rol', 'CC')
      .send({ nombre: 'Modificado' });
    expect(resPatch.status).toBe(403);
    expect(resPatch.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resIniciar = await request(app.getHttpServer())
      .post('/proyectos/1/iniciar')
      .set('X-Rol', 'CC');
    expect(resIniciar.status).toBe(403);
    expect(resIniciar.body.codigo).toBe('ROL_NO_PERMITIDO');

    const resCerrar = await request(app.getHttpServer())
      .post('/proyectos/1/cerrar')
      .set('X-Rol', 'CC');
    expect(resCerrar.status).toBe(403);
    expect(resCerrar.body.codigo).toBe('ROL_NO_PERMITIDO');
  });

  it('responde 201 al crear proyecto con rol JP y datos validos', async () => {
    const res = await request(app.getHttpServer()).post('/proyectos').set('X-Rol', 'JP').send({
      nombre: 'AutoFix · Implementación',
      responsable: 'Jefe de Proyecto',
      presupuesto: 45000000,
      fechaInicio: '2026-11-02',
    });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(detalleMock);
  });

  it('responde 200 en iniciar y cerrar con rol JP', async () => {
    const resIniciar = await request(app.getHttpServer())
      .post('/proyectos/1/iniciar')
      .set('X-Rol', 'JP');
    expect(resIniciar.status).toBe(200);

    const resCerrar = await request(app.getHttpServer())
      .post('/proyectos/1/cerrar')
      .set('X-Rol', 'JP');
    expect(resCerrar.status).toBe(200);
  });

  it('responde 400 al hacer PATCH con cuerpo vacio o con campos no permitidos', async () => {
    const resVacio = await request(app.getHttpServer())
      .patch('/proyectos/1')
      .set('X-Rol', 'JP')
      .send({});
    expect(resVacio.status).toBe(400);
    expect(resVacio.body.codigo).toBe('VALIDACION_FALLIDA');

    const resEstado = await request(app.getHttpServer())
      .patch('/proyectos/1')
      .set('X-Rol', 'JP')
      .send({ estado: 'CERRADO' });
    expect(resEstado.status).toBe(400);
    expect(resEstado.body.codigo).toBe('VALIDACION_FALLIDA');
  });

  it('responde 400 ante :proyectoId no numerico o fuera de rango', async () => {
    const res = await request(app.getHttpServer()).get('/proyectos/abc').set('X-Rol', 'JP');
    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDACION_FALLIDA');
    expect(res.body.detalles[0].campo).toBe('proyectoId');
  });

  it('responde 200 en listar y obtener con rol JP o CC', async () => {
    const resListar = await request(app.getHttpServer()).get('/proyectos').set('X-Rol', 'CC');
    expect(resListar.status).toBe(200);
    expect(resListar.body).toEqual([resumenMock]);

    const resObtener = await request(app.getHttpServer()).get('/proyectos/1').set('X-Rol', 'CC');
    expect(resObtener.status).toBe(200);
    expect(resObtener.body).toEqual(detalleMock);
  });
});
