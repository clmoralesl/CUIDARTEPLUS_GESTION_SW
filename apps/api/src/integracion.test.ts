import { Body, Controller, Get, INestApplication, NotFoundException, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from '@cuidarte/core';
import { configurarApp } from './configurar-app';
import { Publico, Roles } from './comun/roles/roles.decorator';
import { PipeValidacionZod } from './comun/validacion/validacion-zod.pipe';

const esquemaCuerpo = z.object({
  titulo: z.string().min(3),
});
type CuerpoPrueba = z.infer<typeof esquemaCuerpo>;

@Controller('prueba')
class ControladorPrueba {
  @Publico()
  @Get('publica')
  publica(): { ok: boolean } {
    return { ok: true };
  }

  @Get('lectura')
  lectura(): { ok: boolean } {
    return { ok: true };
  }

  @Roles('JP')
  @Post('restringida')
  restringida(@Body(new PipeValidacionZod(esquemaCuerpo)) datos: CuerpoPrueba): {
    datos: CuerpoPrueba;
  } {
    return { datos };
  }

  @Get('no-encontrado')
  noEncontrado(): never {
    throw new NotFoundException('Not found internally');
  }

  @Get('error-interno')
  errorInterno(): never {
    throw new Error('Fallo no esperado');
  }
}

describe('Pipeline HTTP Integración', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [ControladorPrueba],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite acceso sin cabecera X-Rol en ruta publica', async () => {
    const respuesta = await request(app.getHttpServer()).get('/prueba/publica');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ ok: true });
  });

  it('responde 400 ROL_REQUERIDO si falta la cabecera X-Rol en ruta protegida', async () => {
    const respuesta = await request(app.getHttpServer()).get('/prueba/lectura');
    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      codigo: 'ROL_REQUERIDO',
      error: 'Solicitud inválida',
      mensaje: 'Falta la cabecera X-Rol. Valores permitidos: JP, CC.',
    });
  });

  it('responde 400 ROL_INVALIDO si X-Rol no es un valor valido', async () => {
    const respuesta = await request(app.getHttpServer()).get('/prueba/lectura').set('X-Rol', 'jp');
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('ROL_INVALIDO');
    expect(respuesta.body.error).toBe('Solicitud inválida');
  });

  it('responde 400 ROL_INVALIDO si la cabecera esta duplicada', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/prueba/lectura')
      .set('X-Rol', ['JP', 'CC']);
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('ROL_INVALIDO');
  });

  it('responde 200 en lectura cuando se envia rol valido JP o CC', async () => {
    const resJP = await request(app.getHttpServer()).get('/prueba/lectura').set('X-Rol', 'JP');
    expect(resJP.status).toBe(200);

    const resCC = await request(app.getHttpServer()).get('/prueba/lectura').set('X-Rol', 'CC');
    expect(resCC.status).toBe(200);
  });

  it('prioriza 400 sobre 403 si falta X-Rol en ruta con Roles(JP)', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/prueba/restringida')
      .send({ titulo: 'Proyecto' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('ROL_REQUERIDO');
  });

  it('responde 403 ROL_NO_PERMITIDO si el rol no esta autorizado', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/prueba/restringida')
      .set('X-Rol', 'CC')
      .send({ titulo: 'Proyecto' });
    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toEqual({
      codigo: 'ROL_NO_PERMITIDO',
      error: 'Acceso denegado',
      mensaje: 'Acción permitida solo para Jefe de Proyecto.',
    });
  });

  it('responde 400 VALIDACION_FALLIDA con detalles si el cuerpo no cumple el esquema', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/prueba/restringida')
      .set('X-Rol', 'JP')
      .send({ titulo: 'ab' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION_FALLIDA');
    expect(Array.isArray(respuesta.body.detalles)).toBe(true);
    expect(respuesta.body.detalles[0].campo).toBe('titulo');
  });

  it('permite ejecucion exitosa en ruta con Roles(JP) y datos validos', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/prueba/restringida')
      .set('X-Rol', 'JP')
      .send({ titulo: 'Proyecto Aceptado' });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toEqual({
      datos: { titulo: 'Proyecto Aceptado' },
    });
  });

  it('responde 404 RECURSO_NO_ENCONTRADO en ruta inexistente incluso sin cabecera X-Rol', async () => {
    const respuesta = await request(app.getHttpServer()).get('/ruta-inexistente');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('RECURSO_NO_ENCONTRADO');
    expect(respuesta.body.error).toBe('No encontrado');
    expect(respuesta.body.mensaje).toBe('El recurso solicitado no existe.');
  });

  it('responde 204 en OPTIONS sin requerir X-Rol e incluye cabecera en allowed headers', async () => {
    const respuesta = await request(app.getHttpServer())
      .options('/prueba/lectura')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Headers', 'x-rol');
    expect(respuesta.status).toBe(204);
    const cabecerasPermitidas = String(
      respuesta.headers['access-control-allow-headers'],
    ).toLowerCase();
    expect(cabecerasPermitidas).toContain('x-rol');
  });

  it('traduce excepciones NotFoundException internas al formato comun en espanol', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/prueba/no-encontrado')
      .set('X-Rol', 'JP');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('RECURSO_NO_ENCONTRADO');
    expect(respuesta.body.error).toBe('No encontrado');
    expect(respuesta.body.mensaje).toBe('El recurso solicitado no existe.');
  });

  it('traduce JSON malformado a 400 SOLICITUD_INVALIDA con formato comun', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/prueba/restringida')
      .set('X-Rol', 'JP')
      .set('Content-Type', 'application/json')
      .send('{"titulo": malformado');
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('SOLICITUD_INVALIDA');
    expect(respuesta.body.error).toBe('Solicitud inválida');
  });

  it('traduce errores internos 500 ocultando detalles tecnicos al cliente', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/prueba/error-interno')
      .set('X-Rol', 'JP');
    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({
      codigo: 'ERROR_INTERNO',
      error: 'Error interno',
      mensaje: 'Ocurrió un error inesperado. Intente nuevamente.',
    });
  });
});
